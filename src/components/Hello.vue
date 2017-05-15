<template>
    <div class="hello">
        <canvas id="draw_image_canvas"
                style="background:#ccc;"></canvas>
        <canvas id="get_image_canvas"
                style="background:#ccc;"></canvas>
    </div>
</template>

<script>
import ImageInfo from 'src/bean/ImageInfo'
import ImageProcessor from 'src/service/image/ImageProcessor'
// import Point from 'src/bean/Point'
import CCLProcessor from 'src/service/image/CCLProcessor'
import TextProcessor from 'src/service/image/TextProcessor'

export default {
    name: 'hello',

    data() {
        return {
        };
    },

    created() {
        window.setTimeout(() => {
            // this.drawImage('./static/test.jpg');
            this.getAndSetImageData('./static/test.jpg');
            // this.getAndSetImageData('./static/a.png');
            // this.getAndSetImageData('./static/CCL.jpg');
            // this.getAndSetImageData('./static/test/indigo_inherit_06.jpg');
        }, 100);
    },

    methods: {
        getImage(url) {
            return new Promise((resolve, reject) => {
                let img = document.createElement('img');
                img.onload = function () {
                    resolve(this);
                };
                img.src = url;
            });
        },

        drawImage(url) {
            let canvas = document.querySelector('#draw_image_canvas');
            let context = canvas.getContext('2d');
            this.getImage(url)
                .then((img) => {
                    canvas.width = img.width;
                    canvas.height = img.height;

                    let offsetX = 0;
                    let offsetY = 0;
                    let drawWidth = img.width;
                    let drawHeight = img.height;

                    context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                    console.log(context.getImageData(0, 0, img.width, img.height));
                });
        },
        getAndSetImageData(url) {
            this.getImage(url)
                .then((img) => {
                    document.querySelector('#draw_image_canvas').width = img.width;
                    document.querySelector('#draw_image_canvas').height = img.height;
                    let context = document.querySelector('#draw_image_canvas').getContext('2d');
                    context.drawImage(img, 0, 0, img.width, img.height);

                    // 获取像素信息
                    let offsetX = 0;
                    let offsetY = 0;
                    let getImgWidth = img.width;
                    let getImgHeight = img.height;
                    let imageData = context.getImageData(offsetX, offsetY, getImgWidth, getImgHeight);
                    let imageInfo = new ImageInfo(imageData);
                    imageInfo = ImageProcessor.toBinaryImage(imageInfo);
                    CCLProcessor.label(imageInfo);
                    TextProcessor.findText(imageInfo);
                    console.log(imageInfo);
                    // 设置像素信息，此处先忽略具体代码，知道是把上面获取的像素信息原封不动放到另一canvas里即可
                    let startX = 0;
                    let startY = 0;
                    let ct = document.querySelector('#get_image_canvas').getContext('2d');
                    document.querySelector('#get_image_canvas').width = img.width;
                    document.querySelector('#get_image_canvas').height = img.height;
                    ct.putImageData(imageInfo.toImageData(), startX, startY);
                });
        }
    }
};
</script>

<style lang="less" scoped>

</style>
