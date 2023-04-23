// const container = document.createElement('canvas');
// export let ctx = container.getContext('2d');
const N = 8, Pr = 15;

export const convertTextToBinary = (input: string): string => {
    let output = [] as String[];
    for (let i = 0; i < input.length; i++) {
        output.push(make8bit(input[i].charCodeAt(0).toString(2)));
    }
    return output.join('');
}

export const make8bit = (str: string): String => {
    let result = [] as String[];
    for (let i = 0; i < 8 - str.length; i++) {
        result.push('0');
    }
    result.push(str);
    return result.join('');
}

export const dividePixels = (imageData: number[]) => {
    let res = [] as Array<number[]>;
    for (let i = 0; i < imageData.length; i += 4) {
        let tmp = [imageData[i], imageData[i + 1], imageData[i + 2]] as number[];
        res.push(tmp);
    }
    return res;
}

export const toYCbCrModel = (pixelsRGB: Array<number[]>) => {
    let YCbCrModel = [] as Array<number[]>;
    for (let i = 0; i < pixelsRGB.length; i++) {
        YCbCrModel.push([
            parseInt((0.299 * (pixelsRGB[i][0] as number) + 0.587 * (pixelsRGB[i][1] as number) + 0.114 * (pixelsRGB[i][2] as number)).toString()),
            parseInt((-0.169 * (pixelsRGB[i][0] as number) - 0.331 * (pixelsRGB[i][1] as number) + 0.5 * (pixelsRGB[i][2] as number) + 128).toString()),
            parseInt((.5 * (pixelsRGB[i][0] as number) - 0.4187 * (pixelsRGB[i][1] as number) - 0.081 * (pixelsRGB[i][2] as number) + 128).toString())
        ]);
    }
    return YCbCrModel;
}

export const mergePixels = (imageDataArr: Array<number[]>) => {
    let res = [] as Array<number[]>;
    for (let i = 0; i < imageDataArr.length; i++) {
        res.push([].concat(imageDataArr[i] as any, 255 as any));
    }
    return res.flat();
}

export const getRedChannel = (pixels: number[]) => {
    let tmpData = [] as number[];
    for (let i = 0, index = 0; i < pixels.length; i += 4) {
        tmpData[index++] = pixels[i];
    }
    return tmpData;
}

export const toMatrix = (input: number[], width: number, height: number) => {
    let redMatrix = [] as Array<number[]>;
    for (let i = 0; i < height; i++) {
        let tmp = [] as number[];
        for (let j = 0; j < width; j++) {
            tmp.push(input[i * width + j]);
        }
        redMatrix.push(tmp);
    }
    return redMatrix;
}

let matrix = function (rows: number, columns: number) {
    let myarray = new Array((rows));
    for (let i = 0; i < columns; i += 1) {
        myarray[i] = new Array((rows))
    }
    return myarray;
}

export const imageToBlock = (image: number[][], width: number, height: number) => {
    const nn = height / N, mm = width / N;
    let r = matrix(nn, mm);
    for (let x = 0; x < mm; x++) {
        for (let y = 0; y < nn; y++) {
            let RR = matrix(N, N);
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < N; j++) {
                        RR[i][j] = image[i + x * N][j + y * N]
                }
            }
            r[x][y] = RR;
        }
    }
    return r;
}

export const useDCTtoBlocks = (blockedImage: any, width: number, height: number) => {
    let nn = height / N, mm = width / N, blockDCT = matrix(nn, mm);
    for (let i = 0; i < mm; i++) {
        for (let j = 0; j < nn; j++) {
            blockDCT[i][j] = directDCT(blockedImage[i][j])
        }
    }
    return blockDCT;
}

export const initC = () => {
    let c = matrix(N, N);
    for (let i = 1; i < N; i++) {
        for (let j = 1; j < N; j++) {
            c[i][j] = 1;
        }
    }
    for (let i = 0; i < N; i++) {
        c[i][0] = 1 / Math.sqrt(2.0);
        c[0][i] = 1 / Math.sqrt(2.0);
    }
    c[0][0] = 0.5;
    return c;
}

let c = initC();

export const directDCT = (inputData: any) => {
    let outputData = matrix(N, N);
    for (let u = 0; u < N; u++) {
        for (let v = 0; v < N; v++) {
            let sum = 0.0;
            for (let x = 0; x < N; x++) {
                for (let y = 0; y < N; y++) {
                    sum += inputData[x][y] * Math.cos(((2 * x + 1) / (2.0 * N)) * u * Math.PI) * Math.cos(((2 * y + 1) / (2.0 * N)) * v * Math.PI);
                }
            }
            sum *= c[u][v] / 4.0;
            outputData[u][v] = Math.sign(parseInt(sum.toString())) === -0 ? 0 : parseInt(sum.toString());
        }
    }
    return outputData;
}

export const inverseDCT = (inputData: any) => {
    let outputData = matrix(N, N);
    for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
            let sum = 0.0;
            for (let u = 0; u < N; u++) {
                for (let v = 0; v < N; v++) {
                    sum += c[u][v] * inputData[u][v] * Math.cos(((2 * x + 1) / (2.0 * N)) * u * Math.PI) * Math.cos(((2 * y + 1) / (2.0 * N)) * v * Math.PI);
                }
            }
            sum /= 4.0;
            outputData[x][y] = parseInt(sum.toString());
            if (outputData[x][y] > 255) outputData[x][y] = 255;
            if (outputData[x][y] < 0) outputData[x][y] = 0;
        }
    }
    return outputData;
}

export const useIDCTtoBlocks = (input: any, width: number, height: number) => {
    let nn = height / N, mm = width / N, blockDCT = matrix(nn, mm);
    for (let i = 0; i < mm; i++) {
        for (let j = 0; j < nn; j++) {
            blockDCT[i][j] = inverseDCT(input[i][j])
        }
    }
    return blockDCT;
}

export const flatBlocked = (input: any) =>{
    let output = [] as any;
    for (let i = 0; i < input.length; i++) {
        let tmp = input[i];
        for (let j = 0; j < N; j++) {
            for (let k = 0; k < tmp.length; k++) {
                output.push(tmp[k][j])
            }
        }
    }
    return output.flat();
}

export const toRGB = (pixelsYCbCr: any) => {
    let RGBmodel = [] as any;
    for (let i = 0; i < pixelsYCbCr.length; i++) {
        RGBmodel.push([
            parseInt(((pixelsYCbCr[i][0] + 1.402 * (pixelsYCbCr[i][2] - 128))).toString()),
            parseInt(((pixelsYCbCr[i][0] - 0.33414 * (pixelsYCbCr[i][1] - 128) - 0.71414 * (pixelsYCbCr[i][2] - 128))).toString()),
            parseInt(((pixelsYCbCr[i][0] + 1.772 * (pixelsYCbCr[i][1] - 128))).toString())
        ]);
    }
    return RGBmodel;
}

export const convertBinaryToText = (str: any) => {
    str = str.match(/.{1,8}/g).toString().replace(/,/g, ' ');
    str = str.split(' ');
    let binCode = [] as any;
    for (let i = 0; i < str.length; i++) {
        binCode.push(String.fromCharCode(parseInt(str[i], 2)));
    }
    return binCode.join(''); // return string
}





