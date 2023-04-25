import { Image, createCanvas } from "canvas";
import {
  convertTextToBinary,
  dividePixels,
  flatBlocked,
  getRedChannel,
  imageToBlock,
  mergePixels,
  toMatrix,
  toRGB,
  toYCbCrModel,
  useDCTtoBlocks,
  useIDCTtoBlocks,
} from "./common";
const fs = require("fs");
const { loadImage } = require("canvas");

const N = 8,
  Pr = 15;
export const encodeBengam = async (inputMessage: string, pathImage: any) => {
  const inputBinary = convertTextToBinary(inputMessage);

  loadImage(pathImage).then((imageData: Image) => {
    const canvas = createCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(imageData, 0, 0);
    const image = ctx.getImageData(0, 0, imageData.width, imageData.height);
    const unit8Array = image.data;

    const width = imageData.width;
    const height = imageData.height;
    const divided = dividePixels(unit8Array as any);

    const YCbCr = toYCbCrModel(divided);

    const merged = mergePixels(YCbCr);
    const Ychannel = getRedChannel(merged);

    const YchannelMatrix = toMatrix(Ychannel, width, height);
    const blockedImage = imageToBlock(YchannelMatrix, width, height);
    const blockedImageWithDCT = useDCTtoBlocks(blockedImage, width, height);

    let index = 0;
    for (
      let i = 0;
      i < Math.min(blockedImageWithDCT.length, inputBinary.length);
      i++
    ) {
      let i2 = parseInt((N / 3).toString()),
        i1 = i2 + i2,
        i3 = (i1 + i2) / 2;
      // let i2 = 1, i1 = 2, i3 = 3;
      for (let j = 0; j < blockedImageWithDCT[i].length; j++) {
        if (inputBinary[index] === "1") {
          if (blockedImageWithDCT[i][j][i3][i3] > 0) {
            blockedImageWithDCT[i][j][i3][i3] =
              Math.max(
                Math.abs(blockedImageWithDCT[i][j][i2][i1]),
                Math.abs(blockedImageWithDCT[i][j][i1][i2])
              ) + Pr;
          } else {
            blockedImageWithDCT[i][j][i3][i3] =
              -Math.max(
                Math.abs(blockedImageWithDCT[i][j][i2][i1]),
                Math.abs(blockedImageWithDCT[i][j][i1][i2])
              ) + Pr;
          }
          index++;
        } else {
          if (blockedImageWithDCT[i][j][i3][i3] > 0) {
            blockedImageWithDCT[i][j][i3][i3] =
              Math.min(
                Math.abs(blockedImageWithDCT[i][j][i2][i1]),
                Math.abs(blockedImageWithDCT[i][j][i1][i2])
              ) - Pr;
          } else {
            blockedImageWithDCT[i][j][i3][i3] =
              -Math.min(
                Math.abs(blockedImageWithDCT[i][j][i2][i1]),
                Math.abs(blockedImageWithDCT[i][j][i1][i2])
              ) - Pr;
          }
          index++;
        }
      }
    }

    let blockedImageWithIDCT = useIDCTtoBlocks(
      blockedImageWithDCT,
      width,
      height
    );
    let changedYchannel = flatBlocked(blockedImageWithIDCT);

    for (let i = 0, index = 0; i < merged.length; i++) {
      if (i % 4 === 0) {
        merged[i] = changedYchannel[index];
        index++;
      }
    }
    let div = dividePixels(merged);
    let backToRGB = toRGB(div);
    let backToRGBarr = mergePixels(backToRGB);

    image.data.set(backToRGBarr);
    ctx.putImageData(image, 0, 0);
    const buffer = canvas.toBuffer();
    fs.writeFileSync("src/image/output.png", buffer);
  });
};
