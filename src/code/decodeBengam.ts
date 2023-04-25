import { Image, createCanvas, loadImage } from "canvas";
import {
  convertBinaryToText,
  dividePixels,
  getRedChannel,
  imageToBlock,
  mergePixels,
  toMatrix,
  toYCbCrModel,
  useDCTtoBlocks,
} from "./common";

const N = 8;

export const decodeBengam = (pathImage: string) => {
  loadImage(pathImage).then((imageData: Image) => {
    const canvas = createCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(imageData, 0, 0);
    const image = ctx.getImageData(0, 0, imageData.width, imageData.height);
    const unit8Array = image.data;

    const width = imageData.width;
    const height = imageData.height;

    let divided = dividePixels(unit8Array as any);
    let YCbCr = toYCbCrModel(divided); //RGB to YCbCr transform
    let merged = mergePixels(YCbCr);
    let Ychannel = getRedChannel(merged);
    let YchannelMatrix = toMatrix(Ychannel, width, height);
    let blockedImage = imageToBlock(YchannelMatrix, width, height);
    let blockedImageWithDCT = useDCTtoBlocks(blockedImage, width, height);

    let mess: string[] = [];
    let i1 = parseInt((N / 3).toString()),
      i2 = i1 + i1,
      i3 = (i1 + i2) / 2;
    // let i2 = 1, i1 = 2, i3 = 3;
    for (let i = 0; i < blockedImageWithDCT.length; i++) {
      for (let j = 0; j < blockedImageWithDCT[i].length; j++) {
        if (
          blockedImageWithDCT[i][j][i3][i3] >
          Math.max(
            Math.abs(blockedImageWithDCT[i][j][i2][i1]),
            Math.abs(blockedImageWithDCT[i][j][i1][i2])
          )
        ) {
          mess.push("1");
        } else {
          mess.push("0");
        }
      }
    }

    const results = convertBinaryToText(mess.join(""));
    console.log(results);
  });
};
