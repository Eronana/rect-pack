export interface Rectangle {
  width:number;
  height:number;
}

export interface RectPosition {
  x:number;
  y:number;
  rotated:boolean;
}

export interface PackResult {
  width:number;
  height:number;
  positions:RectPosition[];
}

interface FreeSpace {
  node:RectNode;
  x:number;
  y:number;
  width:number;
  height:number;
  minWH:number;
  maxWH:number;
}

class RectNode {
  public x = 0;
  public y = 0;
  public width = 0;
  public height = 0;
  public rotated = false;
  public children:RectNode[] | undefined;
  constructor(public rect?:Rectangle, public id?:number) {
    if (rect) {
      this.width = rect.width;
      this.height = rect.height;
    } else {
      this.children = [];
    }
  }
}

export function pack(rects:Rectangle[]) : PackResult {
  const nodes = rects.map((rect, id) => new RectNode(rect, id)).sort((a, b) => {
    const aa = a.width * a.height;
    const ab = b.width * b.height;
    if (aa === ab) {
      const xa = Math.max(a.width, a.height);
      const xb = Math.max(b.width, b.height);
      if (xa === xb) {
        return Math.min(b.width, b.height) - Math.min(a.width, a.height);
      }
      return xb - xa;
    }
    return ab - aa;
  });
  let root = nodes[0];
  const freeSpaces:FreeSpace[] = [];
  for (let i = 1; i < nodes.length; i++) {
    const node = nodes[i];
    const minWH = Math.min(node.width, node.height);
    const maxWH = Math.max(node.width, node.height);
    let best = -1;
    for (let j = 0; j < freeSpaces.length; j++) {
      const cur = freeSpaces[j];
      if (cur.minWH >= minWH && cur.maxWH >= maxWH) {
        if (best === -1) {
          best = j;
        } else {
          const pre = freeSpaces[best];
          if (cur.width * cur.height < pre.width * pre.height) {
            best = j;
          }
        }
      }
    }
    if (best !== -1) {
      fillFreeSpace(node, freeSpaces, best);
    } else {
      root = mergeRect(root, node, freeSpaces);
    }
  }

  const positions = Array<RectPosition>(rects.length);
  getPositions(root, positions);
  return {
    width: root.width,
    height: root.height,
    positions,
  };
}

function mergeRect(a:RectNode, b:RectNode, freeSpaces:FreeSpace[]) : RectNode {
  if (Math.max(a.width, a.height) < Math.max(b.width, b.height)) {
    return mergeRect(b, a, freeSpaces);
  }
  const extendedWidth = a.width < a.height;
  b.rotated = (b.width < b.height) !== extendedWidth;
  b.x = extendedWidth ? a.width : 0;
  b.y = extendedWidth ? 0 : a.height;
  const width = a.width + (extendedWidth ? b.rotated ? b.height : b.width : 0);
  const height = a.height + (extendedWidth ? 0 : b.rotated ? b.width : b.height);
  const node = new RectNode();
  node.width = width;
  node.height = height;
  node.children!.push(a, b);
  const bWidth = b.rotated ? b.height : b.width;
  const bHeight = b.rotated ? b.width : b.height;
  if (extendedWidth) {
    const y = b.y + bHeight;
    if (y < height) {
      freeSpaces.push({
        node,
        x: b.x,
        y: bHeight,
        width: bWidth,
        height: height - bHeight,
        minWH: Math.min(bWidth, height - bHeight),
        maxWH: Math.max(bWidth, height - bHeight),
      });
    }
  } else {
    const x = b.x + bWidth;
    if (x < width) {
      freeSpaces.push({
        node,
        x: bWidth,
        y: b.y,
        width: width - bWidth,
        height: bHeight,
        minWH: Math.min(width - bWidth, bHeight),
        maxWH: Math.max(width - bWidth, bHeight),
      });
    }
  }
  return node;
}

function fillFreeSpace(texture:RectNode, freeSpaces:FreeSpace[], idx:number) {
  const [f] = freeSpaces.splice(idx, 1);
  let { width, height } = texture;
  if (texture.width > f.width || texture.height > f.height) {
    width = texture.height;
    height = texture.width;
    texture.rotated = true;
  }
  texture.x = f.x;
  texture.y = f.y;
  f.node.children!.push(texture);
  const rightSpace = (f.width - width) * f.height;
  const bottomSpace = f.width * (f.height - height);
  if (rightSpace > bottomSpace) {
    const w = f.width - width;
    const h = f.height;
    freeSpaces.push({
      node: f.node,
      x: f.x + width,
      y: f.y,
      width: w,
      height: h,
      minWH: Math.min(w, h),
      maxWH: Math.max(w, h),
    });
    if (bottomSpace > 0) {
      const w = width;
      const h = f.height - height;
      freeSpaces.push({
        node: f.node,
        x: f.x,
        y: f.y + height,
        width: w,
        height: h,
        minWH: Math.min(w, h),
        maxWH: Math.max(w, h),
      });
    }
  } else if (bottomSpace > rightSpace) {
    const w = f.width;
    const h = f.height - height;
    freeSpaces.push({
      node: f.node,
      x: f.x,
      y: f.y + height,
      width: w,
      height: h,
      minWH: Math.min(w, h),
      maxWH: Math.max(w, h),
    });
    if (rightSpace > 0) {
      const w = f.width - width;
      const h = height;
      freeSpaces.push({
        node: f.node,
        x: f.x + width,
        y: f.y,
        width: w,
        height: h,
        minWH: Math.min(w, h),
        maxWH: Math.max(w, h),
      });
    }
  }
}


function getPositions(node:RectNode, results:RectPosition[]) {
  function traverse(n:RectNode, x:number, y:number, rotated:boolean) {
    if (n.rect) {
      results[n.id!] = {
        x, y, rotated,
      };
    } else {
      for (const c of n.children!) {
        traverse(c, x + (rotated ? c.y : c.x), y + (rotated ? c.x : c.y), rotated !== c.rotated);
      }
    }
  }
  traverse(node, node.x, node.y, node.rotated);
}
