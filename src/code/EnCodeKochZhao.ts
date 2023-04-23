import { convertTextToBinary, dividePixels, flatBlocked, getRedChannel, imageToBlock, mergePixels, toMatrix, toRGB, toYCbCrModel, useDCTtoBlocks, useIDCTtoBlocks, } from "./common";
const fs = require('fs');
const jpeg = require('jpeg-js');
const Jimp = require('jimp');

const N = 8, Pr = 15;
export const encodeKochZhao = (inputMessage: string, pathImage: any) => {
  const inputBinary = convertTextToBinary(inputMessage);

  const jpegData = fs.readFileSync(pathImage);
  const rawImageData = jpeg.decode(jpegData, {useTArray: true}); // return as Uint8Array
  const unit8Array = rawImageData.data;
  
  const width = rawImageData.width;
  const height = rawImageData.height;
  const divided = dividePixels(unit8Array);
  
  const YCbCr = toYCbCrModel(divided);
 
  const merged = mergePixels(YCbCr);
  const Ychannel = getRedChannel(merged);

  const YchannelMatrix = toMatrix(Ychannel, width, height);
  // console.log(YchannelMatrix[0][YchannelMatrix[0].length-1])
  const blockedImage = imageToBlock(YchannelMatrix, width, height);
  // console.log(blockedImage[0])
  const blockedImageWithDCT = useDCTtoBlocks(blockedImage, width, height);

  let index = 0;
  for (let i = 0; i < Math.min(blockedImageWithDCT.length, inputBinary.length); i++) {
    let i2 = parseInt((N / 3).toString()), i1 = i2 + i2;
    for (let j = 0; j < blockedImageWithDCT[i].length; j++) {
        if (inputBinary[index] === '1' && index < inputBinary.length) {
            if (blockedImageWithDCT[i][j][i1][i2] > 0) {
                blockedImageWithDCT[i][j][i1][i2] = Math.abs(blockedImageWithDCT[i][j][i2][i1]) + Pr
            } else {
                blockedImageWithDCT[i][j][i1][i2] = -Math.abs(blockedImageWithDCT[i][j][i2][i1]) - Pr
            }
            index++;
        } else {
            if (blockedImageWithDCT[i][j][i2][i1] > 0) {
                blockedImageWithDCT[i][j][i2][i1] = Math.abs(blockedImageWithDCT[i][j][i1][i2]) + Pr
            } else {
                blockedImageWithDCT[i][j][i2][i1] = -Math.abs(blockedImageWithDCT[i][j][i1][i2]) - Pr
            }
            index++;
        }
    }
  }

  let blockedImageWithIDCT = useIDCTtoBlocks(blockedImageWithDCT, width, height);
  let changedYchannel = flatBlocked(blockedImageWithIDCT);

  for (let i = 0, index = 0; i < merged.length; i++) {//write changes to YCbCr arr
    if (i % 4 === 0) {
        merged[i] = changedYchannel[index];
        index++;
    }
  }
  let div = dividePixels(merged);
  let backToRGB = toRGB(div);
  let backToRGBarr = mergePixels(backToRGB);
  Jimp.create(width, height, (err: any, image: any) => {
    if (err) throw err;
    image.bitmap.data = Buffer.from(backToRGBarr);
    image.write('src/image/output.jpg');
  });
}
