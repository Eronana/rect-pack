import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';

const MIN_WIDTH = 12;
const MIN_HEIGHT = 12;

export function generateImages(n:number, width:number, height:number, saveDir:string) {
  fs.mkdirSync(saveDir, { recursive: true });
  const colorTab = ['6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
  for (let i = 1; i <= n; i++) {
    const text = '' + i;
    const w = MIN_WIDTH + Math.floor(Math.random() * Math.max(width - MIN_WIDTH, 0));
    const h = MIN_HEIGHT + Math.floor(Math.random() * Math.max(height - MIN_HEIGHT, 0));
    const fontSize = Math.min(w, h) - 6;
    const canvas = createCanvas(Math.max(text.length * fontSize, w), h);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#' + Array(3).fill(0).map(() => colorTab[Math.floor(Math.random() * colorTab.length)]).join('');
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#' + ctx.fillStyle.substring(1).split('').map((x) => (15 - parseInt(x, 16)).toString(16)).join('');
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${fontSize}px Arial`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    const buffer = canvas.toBuffer('image/png');
    const filename = path.join(saveDir, `${i}.png`);
    fs.writeFileSync(filename, buffer);
    console.log(`generated ${filename}`);
  }
}

generateImages(1000, 200, 200, 'test-images');
