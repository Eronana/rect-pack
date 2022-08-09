import fs from 'fs';
import ndarray from 'ndarray';
import savePixels from 'save-pixels';

import { pack } from ".";

const N = 10000;
const W = 100;
const H = 100;

const rects = Array(N).fill(0).map(() => ({
  width: Math.ceil(Math.random() * W),
  height: Math.ceil(Math.random() * H),
}));

const totalArea = rects.reduce((a, b) => a + b.width * b.height, 0);
const result = pack(rects);
const rectArea = result.width * result.height;
console.log(`packed ${N} rectangles into ${result.width}x${result.height}`);
console.log(`utilization: ${totalArea}/${rectArea}(${(100 * totalArea / (rectArea)).toFixed(2)}%)`);

const pixels = ndarray(new Uint8Array(result.width * result.height * 4), [result.height, result.width, 4]);
for (let i = 0; i < rects.length; i++) {
  const pos = result.positions[i];
  const rect = rects[i];
  const width = pos.rotated ? rect.height : rect.width;
  const height = pos.rotated ? rect.width : rect.height;
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const px = pos.x + x;
      const py = pos.y + y;
      pixels.set(py, px, 0, r);
      pixels.set(py, px, 1, g);
      pixels.set(py, px, 2, b);
      pixels.set(py, px, 3, 255);
    }
  }
}

savePixels(pixels, 'png').pipe(fs.createWriteStream('test.png'));
console.log('generated test.png');
