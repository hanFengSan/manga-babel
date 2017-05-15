class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    isIn(leftTop, rightBottom) {
        return this.x >= leftTop.x && this.y >= leftTop.y && this.x <= rightBottom.x && this.y <= rightBottom.y;
    }
}

export default Point;
