import Point from 'src/bean/Point'
import Color from 'src/bean/Color'
import Run from 'src/bean/Run'
import TextAreaProcessor from './TextAreaProcessor'

class TextProcessor {
    findText(imageInfo) {
        console.time('time findText');
        // 初始化连通域list
        let runs = new Map();
        imageInfo.getPixels().forEach((i) => {
            if (i.label === 0) {
                return;
            }
            if (runs.has(i.label)) {
                runs.get(i.label).list.push(i);
            } else {
                runs.set(i.label, new Run([i]));
            }
        });
        this._initRunParam(runs, imageInfo);
        // 过滤run
        // let filter = this._getTextRunsByCCLFeature(runs, imageInfo);
        // TextAreaProcessor.selectTextArea(imageInfo, filter);
        let areas = this._getTextRunsByProjection(runs, imageInfo);
        console.timeEnd('time findText');
        return areas;
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
        let secondFilter = [];
        runs.forEach((run, key, map) => {
            if (run.aspectRatio > 0.3 &&
                run.aspectRatio < 3.5 &&
                run.areaRatio < 0.01 &&
                run.areaRatio > 0.000035 &&
                run.size > 20 &&
                run.effectiveRatio > 0.2) {
                firstFilter.push(run);
            }
        });
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
            return neighbors.length >= neighborsNum;
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

    _getTextArea(filter, imageInfo) {
        let areaList = [];
        let offset = imageInfo.width / 20;
        filter.forEach((run) => {

        });
    }

    // 计算连通域的投影, 并圈起来
    _getTextRunsByProjection(runs, imageInfo) {
        let lines = this._getLinesByProjection(runs, imageInfo.clone());
        let charImageInfos = lines.reduce((sum, i) => {
            let tmpCanvas = document.getElementById('tmpCanvas');
            let lineImageInfo = imageInfo.getClipInstance(new Point(i[0] + 1, 0), new Point(i[1] + 1, imageInfo.height));
            tmpCanvas.width = lineImageInfo.width;
            tmpCanvas.height = lineImageInfo.height;
            sum = sum.concat(sum, this._getCharsByLineProjection(
                [...runs.values()].filter(run => run.center.isIn(new Point(i[0] + 1, 0), new Point(i[1] + 1, imageInfo.height))),
                i,
                lineImageInfo
            ));
            tmpCanvas.getContext('2d').putImageData(lineImageInfo.toImageData(), 0, 0);
            return sum;
        }, []);
        console.log('charImageInfos');
        console.log(charImageInfos);
        return charImageInfos; 
        // let xProjection = new Array(imageInfo.width).fill(0);
        // let yProjection = new Array(imageInfo.height).fill(0);
        // // 计算投影
        // filter.forEach((run) => {
        //     run.list.forEach((pixel) => {
        //         xProjection[pixel.x]++;
        //         yProjection[pixel.y]++;
        //     })
        // });
        // // 绘制柱状图
        // for (let i = 0; i < yProjection.length; i++) {
        //     if (yProjection[i] > 0) {
        //         imageInfo._lineTo(new Point(0, i), new Point(yProjection[i], i), new Color(255, 0, 0));
        //     }
        // }
        // for (let i = 0; i < xProjection.length; i++) {
        //     if (xProjection[i] > 0) {
        //         imageInfo._lineTo(new Point(i, imageInfo.height - xProjection[i]), new Point(i, imageInfo.height), new Color(255, 0, 0));
        //     }
        // }

        // // x轴连续投影区域计算
        // let xSections = [];
        // let xTmp = [0, 0];
        // for (let i = 0; i < xProjection.length; i++) {
        //     if (xProjection[i] > 0) {
        //         if (xTmp[0] === 0) {
        //             xTmp[0] = i;
        //         }
        //         xTmp[1] = i;
        //     } else {
        //         if (xTmp[0] > 0) {
        //             xSections.push([xTmp[0], xTmp[1]]);
        //             xTmp = [0, 0];
        //         }
        //     }
        // }

        // // x轴连续投影区域计算
        // let ySections = [];
        // let yTmp = [0, 0];
        // for (let i = 0; i < yProjection.length; i++) {
        //     if (yProjection[i] > 0) {
        //         if (yTmp[0] === 0) {
        //             yTmp[0] = i;
        //         }
        //         yTmp[1] = i;
        //     } else {
        //         if (yTmp[0] > 0) {
        //             ySections.push([yTmp[0], yTmp[1]]);
        //             yTmp = [0, 0];
        //         }
        //     }
        // }

        // let areas = [];

        // // 判断x/y轴投影交汇区域是否存在元素, 是则判断为内容区域, 并返回
        // xSections.forEach((x) => {
        //     ySections.forEach((y) => {
        //         let isContained = false;
        //         filter.forEach((run) => {
        //             if (!isContained && run.center.isIn(new Point(x[0], y[0]), new Point(x[1], y[1]))) {
        //                 let area = [new Point(x[0], y[0]), new Point(x[1], y[1])];
        //                 imageInfo.selectArea(area[0], area[1], new Color(255, 0, 0));
        //                 areas.push(area);
        //                 isContained = true;
        //             }
        //         })
        //     })
        // });
        // return areas;
    }

    // 获取到文本区域内有多少行
    _getLinesByProjection(runs, imageInfo) {
        let xProjection = new Array(imageInfo.width).fill(0);
        // 计算投影
        runs.forEach((run) => {
            run.list.forEach((pixel) => {
                xProjection[pixel.x]++;
            });
        });
        for (let i = 0; i < xProjection.length; i++) {
            if (xProjection[i] > 0) {
                imageInfo._lineTo(new Point(i, imageInfo.height - xProjection[i]), new Point(i, imageInfo.height), new Color(255, 0, 0));
            }
        }
        // x轴连续投影区域计算
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

        // 根据行宽的平均数还缝合
        if (xSections.length > 2) {
            let widths = xSections.reduce((sum, i) => {
                sum.push(i[1] - i[0]);
                return sum;
            }, []);
            let sortedWidths = widths.concat().sort((a, b) => a - b);
            // let middleWidth = sortedWidths[Math.ceil(sortedWidths.length / 2) - 1];
            let middleWidth = sortedWidths.reduce((sum, i) => sum + i, 0) / sortedWidths.length;
            let copiedXSenctions = xSections.concat();
            xSections = [];
            let factor = 0.85;
            // 缝合
            while (copiedXSenctions.length > 0) {
                let i1 = copiedXSenctions.pop();
                if (i1[1] - i1[0] < middleWidth * factor && copiedXSenctions.length > 0) {
                    let i2 = copiedXSenctions.pop();
                    if (i2[1] - i2[0] < middleWidth * factor) {
                        if (copiedXSenctions.length > 0) {
                            let i3 = copiedXSenctions.pop();
                            if (i3[1] - i3[0] < middleWidth * factor) {
                                imageInfo._lineTo(new Point(i3[0], imageInfo.height - 1), new Point(i1[1], imageInfo.height - 1), new Color(0, 255, 0));
                                xSections.push([i3[0], i1[1]]);
                            } else {
                                copiedXSenctions.push(i3);
                                imageInfo._lineTo(new Point(i2[0], imageInfo.height - 1), new Point(i1[1], imageInfo.height - 1), new Color(0, 255, 0));
                                xSections.push([i2[0], i1[1]]);
                            }
                        } else {
                            imageInfo._lineTo(new Point(i2[0], imageInfo.height - 1), new Point(i1[1], imageInfo.height - 1), new Color(0, 255, 0));
                            xSections.push([i2[0], i1[1]]);
                        }
                    } else {
                        copiedXSenctions.push(i2);
                        xSections.push(i1);
                    }
                } else {
                    xSections.push(i1);
                }
            }
            xSections.reverse();
        }
        return xSections.reverse();
    }

    _getCharsByLineProjection(runs, line, imageInfo) {
        let clonedImageInfo = imageInfo.clone();
        let yProjection = new Array(imageInfo.height).fill(0);
        // 计算投影
        runs.forEach((run) => {
            run.list.forEach((pixel) => {
                yProjection[pixel.y]++;
            })
        });
        // 绘制柱状图
        for (let i = 0; i < yProjection.length; i++) {
            if (yProjection[i] > 0) {
                imageInfo._lineTo(new Point(0, i), new Point(yProjection[i], i), new Color(255, 0, 0));
            }
        }
        // y轴连续投影区域计算
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

        // 缝合
        let heightFactor = 0.85; // 高度因子, 只要高度小于行宽 * heightFactor, 即判断为需要缝合.
        let gapFactor = 0.2; // 间隙因子, 只要间隔超过行宽 * gapFactor, 即判断为无关.
        let closeFactor = 0.1; // 接近因子, 只要间隔小于行宽 * closeFactor, 即判断为需要缝合.
        let whiteList = [];
        while (true) {
            let smallPiece = ySections.find(i => (i[1] - i[0]) < imageInfo.width * heightFactor);
            if (smallPiece && !whiteList.includes(smallPiece)) {
                let index = ySections.indexOf(smallPiece);
                let next = null;
                let prev = null;
                if (index < ySections.length - 1) {
                    next = ySections[index + 1];
                }
                if (index > 0) {
                    prev = ySections[index - 1];
                }
                // 通过间隙因子判断是否相关
                if (prev && smallPiece[0] - prev[1] >= imageInfo.width * gapFactor) {
                    prev = null;
                }
                if (next && next[0] - smallPiece[1] >= imageInfo.width * gapFactor) {
                    next = null;
                }
                if (!prev && !next) {
                    whiteList.push(smallPiece);
                    continue;
                }
                // 通过接近因子来判断是否需要缝合
                if (prev && smallPiece[0] - prev[1] <= imageInfo * closeFactor) {
                    ySections.splice(index - 1, 2);
                    ySections.splice(index - 1, 0, [prev[0], smallPiece[1]]);
                    imageInfo._lineTo(new Point(0, prev[0]), new Point(0, smallPiece[1]), new Color(0, 255, 0));
                    continue;
                }
                if (next && next[0] - smallPiece[1] <= imageInfo * closeFactor) {
                    ySections.splice(index, 2);
                    ySections.splice(index, 0, [smallPiece[0], next[1]]);
                    imageInfo._lineTo(new Point(0, smallPiece[0]), new Point(0, next[1]), new Color(0, 255, 0));
                    continue;
                }
                // 通过判断next符合高度因子, 来判断需要缝合
                if (next && next[1] - next[0] <= imageInfo.width * heightFactor) {
                    ySections.splice(index, 2);
                    ySections.splice(index, 0, [smallPiece[0], next[1]]);
                    imageInfo._lineTo(new Point(0, smallPiece[0]), new Point(0, next[1]), new Color(0, 255, 0));
                    continue;
                }
                whiteList.push(smallPiece);
            } else {
                break;
            }
        }
        console.log(ySections);
        // console.log('line');
        // console.log(line);
        // return [clonedImageInfo];
        // return [clonedImageInfo.getClipInstance(new Point(0, 0), new Point(20, 30))];
        return ySections.map(i => clonedImageInfo.getClipInstance(new Point(0, i[0]), new Point(clonedImageInfo.width, i[1] + 1)));
    }

}

let instance = new TextProcessor();
export default instance;
