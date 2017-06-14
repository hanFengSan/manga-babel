import Point from 'src/bean/Point'
import Color from 'src/bean/Color'
import TextArea from 'src/bean/TextArea'

class TextAreaProcessor {
    selectTextArea(imageInfo, filterRuns) {
        let graph = new Map();
        let offset = 0.05;
        let length = imageInfo.width * offset;
        filterRuns.forEach((runA) => {
            filterRuns.forEach((runB) => {
                // let pointA = runA.center;
                // let pointB = runB.center;
                // if (pointA !== pointB && pointB.isIn(new Point(pointA.x - length, pointA.y - length),
                //         new Point(pointA.x + length, pointA.y + length))) {
                //     if (!graph.has(runB) || !graph.get(runB).includes(runA)) {
                //         if (graph.has(runA)) {
                //             graph.get(runA).push(runB);
                //         } else {
                //             graph.set(runA, [runB]);
                //         }
                //     }
                // }
                let startA = new Point(runA.center.x - length, runA.center.y - length);
                let endA = new Point(runA.center.x + length, runA.center.y + length);
                if (runA !== runB && (
                        runB.start.isIn(startA, endA) ||
                        runB.end.isIn(startA, endA) ||
                        startA.isIn(runB.start, runB.end) ||
                        endA.isIn(runB.start, runB.end))) {
                    if (!graph.has(runB) || !graph.get(runB).includes(runA)) {
                        if (graph.has(runA)) {
                            graph.get(runA).push(runB);
                        } else {
                            graph.set(runA, [runB]);
                        }
                    }
                }
            });
        });
        let areas = [];
        let getChildren = (node, arr) => {
            if (graph.has(node)) {
                let children = graph.get(node);
                children.forEach((i) => {
                    if (!arr.includes(i)) {
                        arr.push(i);
                        if (graph.has(i)) {
                            getChildren(i, arr);
                        }
                    }
                });
            }
            return arr;
        };
        let usedRuns = new Set();
        filterRuns.forEach((run) => {
            if (!usedRuns.has(run) && graph.has(run)) {
                let list = [run].concat(getChildren(run, []));
                areas.push(new TextArea(list));
                list.forEach(i => usedRuns.add(i));
            }
        });
        console.log(areas);
        areas.forEach((textArea) => {
            let start = new Point(textArea.list.map(run => run.start.x).sort((a, b) => a - b)[0],
                textArea.list.map(run => run.start.y).sort((a, b) => a - b)[0]);
            let end = new Point(textArea.list.map(run => run.end.x).sort((a, b) => b - a)[0],
                textArea.list.map(run => run.end.y).sort((a, b) => b - a)[0]);
            imageInfo.selectArea(start, end, new Color(255, 0, 0));
        });
    }
}

let instance = new TextAreaProcessor();
export default instance;
