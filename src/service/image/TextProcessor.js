import Point from 'src/bean/Point'
import Color from 'src/bean/Color'

class TextProcessor {
    findText(imageInfo) {
        console.time('time findText');
        let labels = new Set();
        imageInfo.getPixels().forEach(i => labels.add(i));
        let runs = new Map();
        imageInfo.getPixels().forEach((i) => {
            if (i.label === 0) {
                return;
            }
            if (runs.has(i.label)) {
                runs.get(i.label).list.push(i);
            } else {
                runs.set(i.label, { list: [i] });
            }
        });
        this._initRunParam(runs, imageInfo);
        let filter = this._getTextRunsByCCLFeature(runs, imageInfo);
        let secFilter = this._getTextRunsByProjection(filter, imageInfo);
        console.timeEnd('time findText');
    }

    _initRunParam(runs, imageInfo) {
        runs.forEach((val, key, map) => {
            let x = [];
            let y = [];
            val.list.forEach((pixel) => {
                x.push(pixel.x);
                y.push(pixel.y);
            });
            x = [...new Set(x)].sort((a, b) => a - b);
            y = [...new Set(y)].sort((a, b) => a - b);
            val.start = new Point(x[0], y[0]);
            val.end = new Point(x[x.length - 1], y[y.length - 1]);
            val.size = val.list.length;
            val.center = new Point((val.start.x + val.end.x) / 2, (val.start.y + val.end.y) / 2);
            if (val.start.x !== val.end.x && val.start.y !== val.end.y) {
                val.aspectRatio = ((val.end.y - val.start.y) / (val.end.x - val.start.x)).toFixed(2) * 1;
                val.area = (val.end.y - val.start.y) * (val.end.x - val.start.x);
                val.areaRatio = val.area / (imageInfo.width * imageInfo.height);
                val.effectiveRatio = val.list.length / val.area;
            } else {
                val.aspectRatio = 0;
                val.area = 0;
                val.areaRatio = 0;
                val.effectiveRatio = 0;
            }
        });
    }

    // 根据字符高宽比, 大小相对于图片的范围, 邻域的字符数量等来筛选字符出字符连通域
    _getTextRunsByCCLFeature(runs, imageInfo) {
        let firstFilter = [];
        runs.forEach((run, key, map) => {
            if (run.aspectRatio > 0.6 &&
                run.aspectRatio < 3.5 &&
                run.areaRatio < 0.01 &&
                run.areaRatio > 0.00005 &&
                run.size > 20 &&
                run.effectiveRatio > 0.2) {
                firstFilter.push(run);
            }
        });
        let secondFilter = [];
        let t = imageInfo.width / 40;
        let neighborsNum = 2;
        let hasNeighbor = (run) => {
            let center = run.center;
            let rowLeftTop = new Point(center.x - 2.5 * t, center.y - 0.5 * t);
            let rowRightBottom = new Point(center.x + 2.5 * t, center.y + 0.5 * t);

            let colTopLeft = new Point(center.x - 0.5 * t, center.y - 2.5 * t);
            let colBottomRight = new Point(center.x + 0.5 * t, center.y + 2.5 * t);

            let neighbors = [];
            firstFilter.forEach((val) => {
                let p = val.center;
                if (p.x !== center.x || p.y !== center.y) {
                    if (p.isIn(rowLeftTop, rowRightBottom) || p.isIn(colTopLeft, colBottomRight)) {
                        neighbors.push(val);
                    }
                }
            });
            if (neighbors.length >= neighborsNum) {
                return true;
            } else {
                return false;
            }
        };
        firstFilter.forEach((run) => {
            if (hasNeighbor(run)) {
                secondFilter.push(run);
            }
        });
        secondFilter.forEach((run) => {
            run.list.forEach((pixel) => {
                pixel.r = 255;
                pixel.g = 0;
                pixel.b = 0;
            });
        });
        return secondFilter;
    }

    _getTextRunsByProjection(filter, imageInfo) {
        let xProjection = new Array(imageInfo.width).fill(0);
        let yProjection = new Array(imageInfo.height).fill(0);
        filter.forEach((run) => {
            run.list.forEach((pixel) => {
                xProjection[pixel.x]++;
                yProjection[pixel.y]++;
            })
        });
        for (let i = 0; i < yProjection.length; i++) {
            if (yProjection[i] > 0) {
                imageInfo._lineTo(new Point(0, i), new Point(yProjection[i], i), new Color(255, 0, 0));
            }
        }
        for (let i = 0; i < xProjection.length; i++) {
            if (xProjection[i] > 0) {
                imageInfo._lineTo(new Point(i, imageInfo.height - xProjection[i]), new Point(i, imageInfo.height), new Color(255, 0, 0));
            }
        }

        let xSections = [];
        let xTmp = [0, 0];
        for (let i = 0; i < xProjection.length; i++) {
            if (xProjection[i] > 0) {
                if (xTmp[0] === 0) {
                    xTmp[0] = i;
                }
                xTmp[1] = i;
            } else {
                if (xTmp[0] > 0) {
                    xSections.push([xTmp[0], xTmp[1]]);
                    xTmp = [0, 0];
                }
            }
        }

        let ySections = [];
        let yTmp = [0, 0];
        for (let i = 0; i < yProjection.length; i++) {
            if (yProjection[i] > 0) {
                if (yTmp[0] === 0) {
                    yTmp[0] = i;
                }
                yTmp[1] = i;
            } else {
                if (yTmp[0] > 0) {
                    ySections.push([yTmp[0], yTmp[1]]);
                    yTmp = [0, 0];
                }
            }
        }

        xSections.forEach((x) => {
            ySections.forEach((y) => {
                filter.forEach((run) => {
                    let isContained = false;
                    if (!isContained && run.center.isIn(new Point(x[0], y[0]), new Point(x[1], y[1]))) {
                        imageInfo.selectArea(new Point(x[0], y[0]), new Point(x[1], y[1]), new Color(255, 0, 0));
                        isContained = true;
                    }
                })
            })
        })
    }

}

let instance = new TextProcessor();
export default instance;
