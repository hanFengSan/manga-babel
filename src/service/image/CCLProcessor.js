// Connected Component Labeling Processor
class CCLProcessor {
    label(imageInfo) {
        console.time('time CLL');
        let labels = [];
        let maxLabel = 0;
        let linked = new Map();
        for (let row = 0; row < imageInfo.dataMatrix.length; row++) {
            labels[row] = [];
            for (let col = 0; col < imageInfo.dataMatrix[row].length; col++) {
                let pixel = imageInfo.dataMatrix[row][col];
                labels[row][col] = 0;
                if (this._isNotBackground(pixel)) {
                    // get neighbors
                    let left = (col === 0 || !this._isNotBackground(imageInfo.dataMatrix[row][col - 1])) ? 0 : labels[row][col - 1];
                    let leftTop = (col === 0 || row === 0 || !this._isNotBackground(imageInfo.dataMatrix[row - 1][col - 1])) ? 0 : labels[row - 1][col - 1];
                    let top = (row === 0 || !this._isNotBackground(imageInfo.dataMatrix[row - 1][col])) ? 0 : labels[row - 1][col];
                    let rightTop = (row === 0 || col === imageInfo.dataMatrix[row].length - 1 || !this._isNotBackground(imageInfo.dataMatrix[row - 1][col + 1])) ? 0 : labels[row - 1][col + 1];
                    // new label
                    if (left === 0 && leftTop === 0 && top === 0 && rightTop === 0) {
                        labels[row][col] = maxLabel + 1;
                        maxLabel++;
                    } else {
                        let list = [left, leftTop, top, rightTop].filter(i => i !== 0).sort((a, b) => a - b);
                        if (new Set(list).size === 1) {
                            labels[row][col] = list[0];
                        } else {
                            labels[row][col] = list[0];
                            let unique = [...new Set(list)];
                            if (linked.has(unique[0])) {
                                let mapArr = linked.get(unique[0]);
                                if (!mapArr.includes(unique[1])) {
                                    mapArr.push(unique[1]);
                                }
                            } else {
                                linked.set(unique[0], [unique[1]]);
                            }
                        }
                    }
                }
            }
        }
        let equivalentMap = this._linkEquivalent(labels, linked, maxLabel);
        for (let row = 0; row < imageInfo.dataMatrix.length; row++) {
            for (let col = 0; col < imageInfo.dataMatrix[row].length; col++) {
                let label = labels[row][col];
                if (equivalentMap.has(label)) {
                    labels[row][col] = equivalentMap.get(label);
                }
            }
        }
        // console.log(labels);
        console.timeEnd('time CLL');
        imageInfo.setCCL(labels);
    }

    _isNotBackground(pixel) {
        return pixel.r === 0;
    }

    _linkEquivalent(labels, linked, maxLabel) {
        let equivalentMap = new Map();
        let getChildren = (node, arr) => {
            if (linked.has(node)) {
                let children = linked.get(node);
                children.forEach((i) => {
                    arr.push(i);
                    if (linked.has(i)) {
                        getChildren(i, arr);
                    }
                });
            }
            return arr;
        };
        for (let i = 1; i < maxLabel; i++) {
            if (linked.has(i) && !equivalentMap.has(i)) {
                getChildren(i, []).forEach((node) => {
                    equivalentMap.set(node, i);
                });
            }
        }
        return equivalentMap;
    }

    _addToLinkedList(linked, arr) {
        arr.forEach((i) => linked.forEach((set) => {
            if (set.includes(i)) {}
        }));
    }
}

let instance = new CCLProcessor();
export default instance;
