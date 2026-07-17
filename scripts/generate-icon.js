const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const size = 256;
const width = size;
const height = size;
const pixels = Buffer.alloc(width * height * 4, 0);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= width || y >= height) {
    return;
  }
  const index = (y * width + x) * 4;
  pixels[index] = clamp(Math.round(r), 0, 255);
  pixels[index + 1] = clamp(Math.round(g), 0, 255);
  pixels[index + 2] = clamp(Math.round(b), 0, 255);
  pixels[index + 3] = clamp(Math.round(a), 0, 255);
}

function blendPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= width || y >= height) {
    return;
  }
  const index = (y * width + x) * 4;
  const dstA = pixels[index + 3] / 255;
  const srcA = clamp(a, 0, 255) / 255;
  const outA = srcA + dstA * (1 - srcA);

  if (outA <= 0) {
    return;
  }

  pixels[index] = Math.round((r * srcA + pixels[index] * dstA * (1 - srcA)) / outA);
  pixels[index + 1] = Math.round((g * srcA + pixels[index + 1] * dstA * (1 - srcA)) / outA);
  pixels[index + 2] = Math.round((b * srcA + pixels[index + 2] * dstA * (1 - srcA)) / outA);
  pixels[index + 3] = Math.round(outA * 255);
}

function fillBackground() {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const blend = (x + y) / (width + height);
      const r = 28 + 16 * blend;
      const g = 31 + 20 * blend;
      const b = 36 + 24 * blend;
      setPixel(x, y, r, g, b, 255);
    }
  }
}

function fillRoundedRect(x, y, w, h, radius, colorA, colorB) {
  const r2 = radius * radius;
  for (let py = y; py < y + h; py += 1) {
    for (let px = x; px < x + w; px += 1) {
      let inside = false;
      if (px >= x + radius && px < x + w - radius) {
        inside = true;
      } else if (py >= y + radius && py < y + h - radius) {
        inside = true;
      } else {
        const corners = [
          [x + radius, y + radius],
          [x + w - radius - 1, y + radius],
          [x + radius, y + h - radius - 1],
          [x + w - radius - 1, y + h - radius - 1],
        ];
        for (const [cx, cy] of corners) {
          const dx = px - cx;
          const dy = py - cy;
          if (dx * dx + dy * dy <= r2) {
            inside = true;
            break;
          }
        }
      }

      if (!inside) {
        continue;
      }

      const blend = ((px - x) + (py - y)) / (w + h);
      const r = colorA[0] + (colorB[0] - colorA[0]) * blend;
      const g = colorA[1] + (colorB[1] - colorA[1]) * blend;
      const b = colorA[2] + (colorB[2] - colorA[2]) * blend;
      setPixel(px, py, r, g, b, 255);
    }
  }
}

function fillCircle(cx, cy, radius, color, alpha = 255) {
  const r2 = radius * radius;
  const minX = Math.floor(cx - radius);
  const maxX = Math.ceil(cx + radius);
  const minY = Math.floor(cy - radius);
  const maxY = Math.ceil(cy + radius);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) {
        blendPixel(x, y, color[0], color[1], color[2], alpha);
      }
    }
  }
}

function drawLine(x1, y1, x2, y2, thickness, color, alpha = 255) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let step = 0; step <= steps; step += 1) {
    const t = steps === 0 ? 0 : step / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    fillCircle(x, y, thickness / 2, color, alpha);
  }
}

function drawRing(cx, cy, radius, thickness, color, alpha = 255) {
  const outer = radius * radius;
  const inner = (radius - thickness) * (radius - thickness);
  const minX = Math.floor(cx - radius);
  const maxX = Math.ceil(cx + radius);
  const minY = Math.floor(cy - radius);
  const maxY = Math.ceil(cy + radius);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 <= outer && d2 >= inner) {
        blendPixel(x, y, color[0], color[1], color[2], alpha);
      }
    }
  }
}

function addShadow() {
  fillCircle(128, 144, 78, [0, 0, 0], 32);
}

function addHubSymbol() {
  const panelA = [60, 86, 118];
  const panelB = [38, 58, 84];
  fillRoundedRect(44, 44, 168, 168, 44, panelA, panelB);
  drawRing(128, 128, 72, 10, [219, 230, 241], 180);
  fillCircle(128, 128, 24, [236, 241, 247], 255);

  const nodes = [
    [128, 68],
    [182, 96],
    [176, 164],
    [80, 176],
    [68, 96],
  ];

  for (const [x, y] of nodes) {
    drawLine(128, 128, x, y, 10, [196, 214, 232], 220);
    fillCircle(x, y, 14, [146, 176, 206], 255);
    fillCircle(x, y, 8, [225, 233, 242], 255);
  }
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function encodePng() {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowLength = width * 4 + 1;
  const raw = Buffer.alloc(rowLength * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * rowLength] = 0;
    pixels.copy(raw, y * rowLength + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function writeIcon(pngBuffer) {
  const iconHeader = Buffer.alloc(6);
  iconHeader.writeUInt16LE(0, 0);
  iconHeader.writeUInt16LE(1, 2);
  iconHeader.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry[0] = 0;
  entry[1] = 0;
  entry[2] = 0;
  entry[3] = 0;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(iconHeader.length + entry.length, 12);

  const outputDir = path.join(process.cwd(), "build");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "icon.ico"), Buffer.concat([iconHeader, entry, pngBuffer]));
}

fillBackground();
addShadow();
addHubSymbol();
writeIcon(encodePng());
