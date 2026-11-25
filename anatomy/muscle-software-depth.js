// Canvas-only depth buffer. Neighboring rib and muscle facets can overlap in
// projection while having opposite depth order at different points on screen.
export function createDepthRenderer() {
  let image = null, pixels = null, depth = null, width = 0, height = 0;
  let scaleX = 1, scaleY = 1;
  const transparent = [];
  const littleEndian = new Uint8Array(new Uint32Array([0x01020304]).buffer)[0] === 4;

  function raster(ax, ay, az, bx, by, bz, cx, cy, cz, red, green, blue, opacity, order) {
    ax *= scaleX; bx *= scaleX; cx *= scaleX;
    ay *= scaleY; by *= scaleY; cy *= scaleY;
    const determinant = (bx-ax)*(cy-ay)-(by-ay)*(cx-ax);
    if (!determinant) return;
    const x0 = Math.max(0, Math.ceil(Math.min(ax,bx,cx)-.5));
    const y0 = Math.max(0, Math.ceil(Math.min(ay,by,cy)-.5));
    const x1 = Math.min(width-1, Math.floor(Math.max(ax,bx,cx)-.5));
    const y1 = Math.min(height-1, Math.floor(Math.max(ay,by,cy)-.5));
    if (x0>x1 || y0>y1) return;
    // Barycentric weights and normalized-device depth are affine in screen space.
    const dxB = (cy-ay)/determinant, dyB = (ax-cx)/determinant;
    const dxC = (ay-by)/determinant, dyC = (bx-ax)/determinant;
    const dzX = (bz-az)*dxB+(cz-az)*dxC;
    const dzY = (bz-az)*dyB+(cz-az)*dyC;
    let rowB = (x0+.5-ax)*dxB+(y0+.5-ay)*dyB;
    let rowC = (x0+.5-ax)*dxC+(y0+.5-ay)*dyC;
    let rowZ = az+(bz-az)*rowB+(cz-az)*rowC;
    // Give shared edges to one triangle. Transparent patches should blend once.
    const sign = Math.sign(determinant);
    const topLeft = (dx,dy) => dy*sign<0 || (dy===0 && dx*sign>0);
    const minB = topLeft(ax-cx,ay-cy) ? -1e-10 : 1e-10;
    const minC = topLeft(bx-ax,by-ay) ? -1e-10 : 1e-10;
    const maxBC = topLeft(cx-bx,cy-by) ? 1+1e-10 : 1-1e-10;
    const opaque = opacity===1;
    red = Math.max(0,Math.min(255,red));
    green = Math.max(0,Math.min(255,green));
    blue = Math.max(0,Math.min(255,blue));
    const color = littleEndian ? (0xff000000 | blue<<16 | green<<8 | red) :
      (red<<24 | green<<16 | blue<<8 | 255);
    const data = image.data;
    for (let y=y0; y<=y1; y++, rowB+=dyB, rowC+=dyC, rowZ+=dzY) {
      let b=rowB, c=rowC, z=rowZ, pixel=y*width+x0;
      for (let x=x0; x<=x1; x++, pixel++, b+=dxB, c+=dxC, z+=dzX) {
        if (b<minB || c<minC || b+c>maxBC || z < -1 || z > 1) continue;
        // Ground is a reference underneath the model. Positive render order
        // is reserved for guides whose materials disable depth testing.
        if (order<0 ? depth[pixel]!==Infinity : order===0 && z>depth[pixel]) continue;
        if (opaque) {
          pixels[pixel] = color;
          if (order===0) depth[pixel] = z;
        } else {
          const offset = pixel*4;
          const behind = data[offset+3]/255*(1-opacity);
          const alpha = opacity+behind;
          const front = opacity/alpha, back = behind/alpha;
          data[offset] = red*front+data[offset]*back;
          data[offset+1] = green*front+data[offset+1]*back;
          data[offset+2] = blue*front+data[offset+2]*back;
          data[offset+3] = 255*alpha;
        }
      }
    }
  }

  return {
    begin(ctx, logicalWidth, logicalHeight) {
      const canvas = ctx.canvas;
      if (!image || width!==canvas.width || height!==canvas.height) {
        width=canvas.width; height=canvas.height;
        if (!width || !height) return false;
        image = ctx.createImageData(width,height);
        pixels = new Uint32Array(image.data.buffer);
        depth = new Float32Array(width*height);
      } else pixels.fill(0);
      depth.fill(Infinity);
      scaleX=width/logicalWidth; scaleY=height/logicalHeight;
      transparent.length=0;
      return true;
    },
    triangle(ax,ay,az,bx,by,bz,cx,cy,cz,r,g,b,opacity,order) {
      if (opacity===1 && order===0) {
        raster(ax,ay,az,bx,by,bz,cx,cy,cz,r,g,b,opacity,order);
      } else {
        transparent.push({z:(az+bz+cz)/3,order,
          values:[ax,ay,az,bx,by,bz,cx,cy,cz,r,g,b,opacity,order]});
      }
    },
    paint(ctx) {
      transparent.sort((a,b)=>a.order-b.order || b.z-a.z);
      for (const tri of transparent) raster(...tri.values);
      ctx.putImageData(image,0,0);
    }
  };
}
