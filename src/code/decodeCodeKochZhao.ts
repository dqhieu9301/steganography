import { convertBinaryToText, dividePixels, getRedChannel, imageToBlock, mergePixels, toMatrix, toYCbCrModel, useDCTtoBlocks } from "./common";
const fs = require('fs');
const jpeg = require('jpeg-js');
const Jimp = require('jimp');

const N = 8;

export const decodeKochZhao = (pathImage: any) => {
  const jpegData = fs.readFileSync(pathImage);
  const rawImageData = jpeg.decode(jpegData, {useTArray: true}); // return as Uint8Array
  const unit8Array = rawImageData.data;

  const width = rawImageData.width;
  const height = rawImageData.height;

  let divided = dividePixels(unit8Array);
  let YCbCr = toYCbCrModel(divided); //RGB to YCbCr transform
  let merged = mergePixels(YCbCr);
  let Ychannel = getRedChannel(merged);
  let YchannelMatrix = toMatrix(Ychannel, width, height);
  let blockedImage = imageToBlock(YchannelMatrix, width, height);
  let blockedImageWithDCT = useDCTtoBlocks(blockedImage, width, height);
  let mess = [] as String[];
    let i1 = parseInt((N / 3).toString()), i2 = i1 + i1;
    for (let i = 0; i < blockedImageWithDCT.length; i++) {
        for (let j = 0; j < blockedImageWithDCT[i].length; j++) {
            if (Math.abs(blockedImageWithDCT[i][j][i2][i1]) > Math.abs(blockedImageWithDCT[i][j][i1][i2])){
                mess.push('1');
            } else {
                mess.push('0');
            }
        }
    }
  const results = convertBinaryToText(mess.join(''))
  console.log(results)
}