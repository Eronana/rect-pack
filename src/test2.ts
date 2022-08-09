import fs from 'fs';
import path from 'path';
import getPixels from 'get-pixels';
import savePixels from 'save-pixels';
import ndarray from 'ndarray';
import { pack } from '.';

const IMAGE_DIR = './test-images';
function readImage(path: string): Promise<any> {
  return new Promise<ndarray.NdArray<Uint8Array>>((resolve, reject) => {
    getPixels(path, (err, pixels) => {
      if (err) {
        reject(err);
      } else {
        resolve(pixels);
      }
    });
  });
}

(async () => {
  const files = fs.readdirSync(IMAGE_DIR).map((file) => path.join(IMAGE_DIR, file));
  const images:ndarray.NdArray<Uint8Array>[] = [];
  for (const file of files) {
    try {
      images.push(await readImage(file));
    } catch (err) {
      console.log(`an error occurred when read ${file}:`, err);
    }
  }
  const rects = images.map((image) => ({
    width: image.shape[0],
    height: image.shape[1],
  }));
  const totalArea = rects.reduce((a, b) => a + b.width * b.height, 0);
  const result = pack(rects);
  const rectArea = result.width * result.height;
  console.log(`packed ${rects.length} rectangles into ${result.width}x${result.height}`);
  console.log(`utilization: ${totalArea}/${rectArea}(${(100 * totalArea / (rectArea)).toFixed(2)}%)`);
  const pixels = ndarray(new Uint8Array(result.width * result.height * 3), [result.width, result.height, 3]);
  for (let i = 0; i < rects.length; i++) {
    const pos = result.positions[i];
    const rect = rects[i];
    for (let x = 0; x < rect.width; x++) {
      for (let y = 0; y < rect.height; y++) {
        const px = pos.x + (pos.rotated ? rect.height - 1 - y : x);
        const py = pos.y + (pos.rotated ? x : y);
        pixels.set(px, py, 0, images[i].get(x, y, 0));
        pixels.set(px, py, 1, images[i].get(x, y, 1));
        pixels.set(px, py, 2, images[i].get(x, y, 2));
      }
    }
  }

  savePixels(pixels, 'png').pipe(fs.createWriteStream('test2.png'));
  console.log('generated test2.png');
})().catch(console.error);
