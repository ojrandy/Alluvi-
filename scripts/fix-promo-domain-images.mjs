// One-off (2026-11-24): old domain on promo + packaging-update images -> alluvihealthcare.co. Originals in git history.
// Usage: node scripts/fix-promo-domain-images.mjs <outDir>  (run on ORIGINAL images only; then copy outputs to public/images)
// Replace baked-in old domain text on two announcement/promo images.
// Inpaint: each pixel in the band = vertical interpolation between clean rows above and below
// (+ a light horizontal blur to hide streaks), feathered at the edges; then draw new text.
import path from "node:path";
import { writeFile } from "node:fs/promises";
import sharp from "sharp";
sharp.cache(false);

const [outDir] = process.argv.slice(2);

const jobs = [
  {
    file: "public/images/homepromopromo-desktop.webp",
    band: { x0: 470, x1: 905, y0: 1304, y1: 1342 },
    svg: (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <text x="686" y="1323" dominant-baseline="central" text-anchor="middle" font-family="Century Gothic, Segoe UI, sans-serif"
        font-size="23" fill="#ffffff" letter-spacing="0.3">www.<tspan font-weight="700">ALLUVIHEALTHCARE</tspan>.co</text></svg>`,
    encode: (p) => p.webp({ quality: 92, smartSubsample: true, effort: 6 }),
  },
  {
    file: "public/images/packagingupdate.jpeg",
    band: { x0: 545, x1: 930, y0: 899, y1: 936 },
    svg: (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <text x="553" y="918" dominant-baseline="central" text-anchor="start" font-family="Segoe UI, Arial, sans-serif"
        font-size="25" fill="#f4f4f4" letter-spacing="0.2">WWW.ALLUVIHEALTHCARE.CO</text></svg>`,
    encode: (p) => p.jpeg({ quality: 95, chromaSubsampling: "4:4:4", mozjpeg: true }),
  },
];

for (const j of jobs) {
  const { data, info } = await sharp(j.file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const C = 3;
  const { x0, x1, y0, y1 } = j.band;
  const px = (x, y, c) => data[(y * W + x) * C + c];
  // Average 3 rows just outside the band for a less noisy anchor.
  const anchor = (x, y, dir, c) => (px(x, y, c) + px(x, y + dir, c) + px(x, y + 2 * dir, c)) / 3;
  const fill = new Float32Array((x1 - x0) * (y1 - y0) * C);
  for (let x = x0; x < x1; x++)
    for (let y = y0; y < y1; y++) {
      const t = (y - y0 + 1) / (y1 - y0 + 1);
      for (let c = 0; c < C; c++)
        fill[((y - y0) * (x1 - x0) + (x - x0)) * C + c] = (1 - t) * anchor(x, y0 - 1, -1, c) + t * anchor(x, y1, 1, c);
    }
  // Horizontal box blur (radius 4) on the fill.
  const R = 4, bw = x1 - x0;
  const out = Buffer.from(data);
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      // Feather: blend into original over 10px at the left/right ends.
      const edge = Math.min(x - x0, x1 - 1 - x);
      const a = Math.min(1, edge / 10);
      for (let c = 0; c < C; c++) {
        let s = 0, n = 0;
        for (let k = -R; k <= R; k++) {
          const xx = Math.min(bw - 1, Math.max(0, x - x0 + k));
          s += fill[((y - y0) * bw + xx) * C + c]; n++;
        }
        const i = (y * W + x) * C + c;
        out[i] = Math.round(a * (s / n) + (1 - a) * data[i]);
      }
    }
  const pipe = sharp(out, { raw: { width: W, height: H, channels: C } }).composite([{ input: Buffer.from(j.svg(W, H)) }]);
  const dest = path.join(outDir, path.basename(j.file));
  await writeFile(dest, await j.encode(pipe).toBuffer());
  console.log("ok", dest);
}
