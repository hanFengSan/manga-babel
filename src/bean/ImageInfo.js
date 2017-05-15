import Pixel from './Pixel'
import Point from './Point'
import Color from './Color'

class ImageInfo {
    constructor(imageData) {
        this.imageData = imageData;
        this.width = imageData.width;
        this.height = imageData.height;
        this._initPixels();
        this._initDataMatrix();
    }

    getPixels() {
        let result = [];
        this.dataMatrix.forEach(row => row.forEach(pixel => result.push(pixel)));
        return result;
    }

    toImageData() {
        let data = [];
        this.dataMatrix.forEach((row) => {
            row.forEach((pixel) => {
                data.push(pixel.r);
                data.push(pixel.g);
                data.push(pixel.b);
                data.push(pixel.a);
            });
        });
        let result = new window.ImageData(this.width, this.height);
        for (let i = 0; i < result.data.length; i++) {
            result.data[i] = data[i];
        }
        console.log(result);
        return result;
    }

    selectArea(pointX, pointY, color) {
        color = color || new Color(255, 0, 0);
        this._lineTo(pointX, new Point(pointX.x, pointY.y), color);
        this._lineTo(new Point(pointX.x, pointY.y), pointY, color);
        this._lineTo(new Point(pointY.x, pointX.y), pointY, color);
        this._lineTo(pointX, new Point(pointY.x, pointX.y), color);
    }

    setCCL(labels) {
        for (let row = 0; row < this.dataMatrix.length; row++) {
            for (let col = 0; col < this.dataMatrix[row].length; col++) {
                this.dataMatrix[row][col].initLabel(labels[row][col]);
            }
        }
    }

    _initPixels() {
        this.pixels = [];
        for (let i = 0; i < this.imageData.data.length; i = i + 4) {
            this.pixels.push(new Pixel(this.imageData.data[i],
                this.imageData.data[i + 1],
                this.imageData.data[i + 2],
                this.imageData.data[i + 3]));
        }
    }

    _initDataMatrix() {
        this.dataMatrix = [];
        for (let t = 0; t < this.height; t++) {
            let row = [];
            for (let j = 0; j < this.width; j++) {
                this.pixels[t * this.width + j].initPos(j, t);
                row.push(this.pixels[t * this.width + j]);
            }
            this.dataMatrix.push(row);
        }
    }

    _lineTo(pointX, pointY, color) {
        if (pointX.y === pointY.y) {
            this.dataMatrix[pointX.y].filter(pixel => pixel.x >= pointX.x && pixel.x <= pointY.x).forEach((pixel) => {
                pixel.r = color.r;
                pixel.g = color.g;
                pixel.b = color.b;
            });
        }
        if (pointX.x === pointY.x) {
            this.dataMatrix.map(row => {
                return row[pointX.x];
            }).filter(pixel => pixel.y >= pointX.y && pixel.y <= pointY.y).forEach((pixel) => {
                pixel.r = color.r;
                pixel.g = color.g;
                pixel.b = color.b;
            });
        }
    }
}

export default ImageInfo;
