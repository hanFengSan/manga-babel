<template>
    <div class="hello">
        <canvas ref="imageCanvas" @mousedown="handleMouseDown"></canvas>
        <div class="container">
            <canvas ref="selectionCanvas"></canvas>
            <canvas class="ocr-canvas" ref="OCRcanvas"></canvas>
            <canvas class="ocr-canvas" id="tmpCanvas"></canvas>
            <div class="result-images-container">
                <canvas v-for="(i, index) in resultImages" :key="index" ref="results"></canvas>
            </div>
        </div>
    </div>
</template>

<script>
import ImageInfo from '../bean/ImageInfo'
import ImageProcessor from 'src/service/image/ImageProcessor'
import CCLProcessor from 'src/service/image/CCLProcessor'
import TextProcessor from 'src/service/image/TextProcessor'
import Point from '../bean/Point'
import KerasJS from 'keras-js'
import { setTimeout } from 'timers';

export default {
    name: 'hello',

    data() {
        return {
            resultImages: 0
        };
    },

    mounted() {
        this.getAndSetImageData('./static/jp_2.jpg');
        // this.initKeras();
    },

    methods: {
        initKeras() {
            this.model = new KerasJS.Model({
                filepath: './static/cnn_v3_3.h5',
                gpu: false,
                filesystem: true,
                transferLayerOutputs: true,
            });
        },

        getImage(url) {
            return new Promise((resolve, reject) => {
                let img = document.createElement('img');
                img.onload = function () {
                    resolve(this);
                };
                img.src = url;
            });
        },

        getAndSetImageData(url) {
            this.getImage(url)
                .then((img) => {
                    this.$refs.imageCanvas.width = img.width;
                    this.$refs.imageCanvas.height = img.height;
                    let context = this.$refs.imageCanvas.getContext('2d');
                    context.drawImage(img, 0, 0, img.width, img.height);

                    // 获取像素信息
                    let offsetX = 0;
                    let offsetY = 0;
                    let getImgWidth = img.width;
                    let getImgHeight = img.height;
                    let imageData = context.getImageData(offsetX, offsetY, getImgWidth, getImgHeight);
                    this.imageInfo = new ImageInfo(imageData);
                    this.selectStart = new Point(1010, 81);
                    this.selectEnd = new Point(1044, 196);
                    // this.selectStart = new Point(225, 162);
                    // this.selectEnd = new Point(305, 334);
                    // this.selectStart = new Point(231, 516);
                    // this.selectEnd = new Point(308, 647);
                    this.updateImage();
                });
        },

        updateImage() {
            let newImageInfo = this.imageInfo.getClipInstance(this.selectStart, this.selectEnd);
            let startX = 0;
            let startY = 0;
            let ct = this.$refs.selectionCanvas.getContext('2d');
            this.$refs.selectionCanvas.width = newImageInfo.width;
            this.$refs.selectionCanvas.height = newImageInfo.height;
            ct.putImageData(newImageInfo.toImageData(), startX, startY);


            let imageInfo = ImageProcessor.toBinaryImage(newImageInfo);
            CCLProcessor.label(imageInfo);
            let charImageInfos = TextProcessor.findText(imageInfo);
            let ct2 = this.$refs.OCRcanvas.getContext('2d');
            this.$refs.OCRcanvas.width = imageInfo.width;
            this.$refs.OCRcanvas.height = imageInfo.height;
            ct2.putImageData(imageInfo.toImageData(), startX, startY);

            this.resultImages = charImageInfos.length;
            let resultImageInfo = ImageProcessor.toBinaryImage(newImageInfo);
            setTimeout(() => {
                for (let i = 0; i < charImageInfos.length; i++) {
                    this.$refs.results[i].width = charImageInfos[i].width;
                    this.$refs.results[i].height = charImageInfos[i].height;
                    this.$refs.results[i].getContext('2d').putImageData(charImageInfos[i].toImageData(), startX, startY);
                }
            }, 100);
        },

        handleMouseDown(e) {
            this.selectStart = new Point(e.offsetX, e.offsetY);
            document.addEventListener('mouseup', this.handleMouseUp);
            console.log(this.selectStart);
        },

        handleMouseUp(e) {
            this.selectEnd = new Point(e.offsetX, e.offsetY);
            console.log(this.selectEnd);
            document.removeEventListener('mouseup', this.handleMouseUp);
            if (this.selectEnd.x - this.selectStart.x > 20 && this.selectEnd.y - this.selectStart.y > 20) {
                this.updateImage();
            }
        }

    }
};
</script>

<style lang="less" scoped>
.hello {
  display: flex;
  flex-direction: row;
  justify-content: center;
  canvas {
      background:#ccc;
  }
  > .container {
    display: flex;
    width: 640px;
    flex-direction: column;
    align-items: center;

    > .ocr-canvas {
        margin-top: 50px;
    }
    > .result-images-container {
        display: flex;
        margin-top: 150px;
        // transform: scale(2);
        canvas {
            margin: 10px;
        }
    }
  }
}
</style>
