class Pixel {
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    initPos(x, y) {
        this.x = x;
        this.y = y;
    }

    initLabel(label) {
        this.label = label;
    }
}

export default Pixel;
