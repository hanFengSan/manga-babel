import ImageInfo from 'src/bean/ImageInfo'

class ImageProcessor {
    // 计算图像的灰度值,公式为：Gray = R*0.299 + G*0.587 + B*0.114
    _calculateGrayValue(pixel) {
        return parseInt(pixel.r * 0.299 + pixel.g * 0.587 + pixel.b * 0.114);
    }

    toGrayImage(imageInfo) {
        imageInfo.dataMatrix.forEach((row) => {
            row.forEach((pixel) => {
                let gray = this._calculateGrayValue(pixel);
                pixel.r = pixel.g = pixel.b = gray;
            });
        });
        return imageInfo;
    }

    // 使用OTSU算法算出最优阈值, 然后二值化图片
    toBinaryImage(imageInfo) {
        let pFstdHistogram = []; // 表示灰度值的分布点概率
        let pFGrayAccu = []; // 其中每一个值等于pFstdHistogram中从0到当前下标值的和
        let pFGrayAve = []; // 其中每一值等于pFstdHistogram中从0到当前指定下标值*对应的下标之和
        let pAverage = 0; // 值为pFstdHistogram【256】中每一点的分布概率*当前下标之和
        let pHistogram = []; // 灰度直方图
        let i, j;
        let temp = 0;
        let fMax = 0; // 定义一个临时变量和一个最大类间方差的值
        let nThresh = 0; // 最优阀值
        // 获取灰度图像的信息
        let grayImageInfo = this.toGrayImage(imageInfo);
        // 初始化各项参数
        for (i = 0; i < 256; i++) {
            pFstdHistogram[i] = 0;
            pFGrayAccu[i] = 0;
            pFGrayAve[i] = 0;
            pHistogram[i] = 0;
        }
        // 获取图像信息
        let canvasData = grayImageInfo.imageData;
        // 获取图像的像素
        let pixels = canvasData.data;
        // 下面统计图像的灰度分布信息
        for (i = 0; i < pixels.length; i += 4) {
            // 获取r的像素值，因为灰度图像，r=g=b，所以取第一个即可
            var r = pixels[i];
            pHistogram[r]++;
        }
        // 下面计算每一个灰度点在图像中出现的概率
        var size = canvasData.width * canvasData.height;
        for (i = 0; i < 256; i++) {
            pFstdHistogram[i] = pHistogram[i] / size;
        }
        // 下面开始计算pFGrayAccu和pFGrayAve和pAverage的值
        for (i = 0; i < 256; i++) {
            for (j = 0; j <= i; j++) {
                // 计算m_pFGaryAccu[256]
                pFGrayAccu[i] += pFstdHistogram[j];
                // 计算pFGrayAve[256]
                pFGrayAve[i] += j * pFstdHistogram[j];
            }
            // 计算平均值
            pAverage += i * pFstdHistogram[i];
        }
        // 下面开始就算OSTU的值，从0-255个值中分别计算ostu并寻找出最大值作为分割阀值
        for (i = 0; i < 256; i++) {
            temp = (pAverage * pFGrayAccu[i] - pFGrayAve[i]) *
                (pAverage * pFGrayAccu[i] - pFGrayAve[i]) /
                (pFGrayAccu[i] * (1 - pFGrayAccu[i]));
            if (temp > fMax) {
                fMax = temp;
                nThresh = i;
            }
        }
        // 下面执行二值化过程
        for (i = 0; i < canvasData.width; i++) {
            for (j = 0; j < canvasData.height; j++) {
                // 取得每一点的位置
                let ids = (i + j * canvasData.width) * 4;
                // 取得像素的R分量的值
                let r = canvasData.data[ids];
                // 与阀值进行比较，如果小于阀值，那么将改点置为0，否则置为255
                let gray = r > nThresh ? 255 : 0;
                canvasData.data[ids + 0] = gray;
                canvasData.data[ids + 1] = gray;
                canvasData.data[ids + 2] = gray;
            }
        }
        return new ImageInfo(canvasData);
    }
}

let instance = new ImageProcessor();
export default instance;
