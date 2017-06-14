// 连通域bean
class Run {
    constructor(list) {
        this.list = list; // 连通域像素list
        this.start = null; // 矩形域左上角Point
        this.end = null; // 矩形域右下角Point
        this.size = null; // 像素数量
        this.center = null; // 矩形域中心Point
        this.aspectRatio = null; // 矩形域y/x向量比值
        this.area = null; // 矩形域面积
        this.areaRatio = null; // 矩形域面积/图片面积比值
        this.effectiveRatio = null; // 像素数量/薯片像素数量比值
    }
}

export default Run;
