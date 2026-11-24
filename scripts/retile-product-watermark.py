"""
One-off (2026-11-24): swap the baked-in "www.ALLUVI.org" watermark on the 36 product photos
for "alluvihealthcare.co".

The old watermark is a semi-transparent grey tile (Montserrat 44.5px, rotated 6.97 deg CW,
411.4px period, 52.63px row pitch) that is pixel-aligned across every 1200x802 product photo,
plus an opaque grey "www.ALLUVI.org" caption bottom-centre. Because the tile is identical on
every photo we can *estimate* its alpha matte and un-blend it exactly
(I = (J - a*c) / (1 - a)) instead of smudging it out, then lay down the new tile with the same
geometry, opacity and colour.

Steps
  1. Read ORIGINAL photos from git (rev below) - never from public/images (may already be edited).
  2. Alpha matte: on every photo, pixels whose local background is near-white give
     a = (B - J) / (B - c) directly; median per pixel across photos, then median across all
     lattice copies of the tile -> clean periodic matte.
  3. Un-blend the old tile, inpaint the old caption (smooth background), draw new tile + caption.

Usage (needs Python 3 + pillow + numpy, and Montserrat Regular/Bold/Medium .ttf files):
  python scripts/retile-product-watermark.py <fontsDir> <outDir> [--rev 7c07712]
  then copy <outDir>/<x>images/* over public/images/<x>images/.
"""
import argparse, io, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument("fonts"); ap.add_argument("out"); ap.add_argument("--rev", default="7c07712")
args = ap.parse_args()
FONTS, OUT = Path(args.fonts), Path(args.out)

# ---- fitted constants (see header) -------------------------------------------------------
C_WM = 146.0                      # watermark grey (0-255)
THETA = -6.97                     # degrees, PIL convention (negative = clockwise)
PERIOD, PITCH = 411.4, 52.63      # along-baseline period, row pitch
ANCHOR = (285.0, 302.0)           # baseline-left of one old "www.ALLUVI.org" instance
OLD_SIZE = 44.5
ALPHA_SOLID = 0.176               # alpha at solid strokes of the old tile
CAPTION_RGB = (124, 137, 149)     # old caption colour (darkest antialiased cores ~128,141,153)
CAPTION_BOX = (450, 714, 750, 758)  # x0,y0,x1,y1 around old caption
H, W = 802, 1200

th = np.deg2rad(-THETA)
U = np.array([np.cos(th), np.sin(th)])        # baseline direction (x,y)
N = np.array([-np.sin(th), np.cos(th)])       # next-row direction (x,y)

def font(w, s): return ImageFont.truetype(str(FONTS / f"Montserrat-{w}.ttf"), s)

def git_bytes(path):
    return subprocess.run(["git", "show", f"{args.rev}:{path}"], check=True, capture_output=True).stdout

def box(a, r, ax):
    pad = [(r + 1, r) if i == ax else (0, 0) for i in range(a.ndim)]
    c = np.cumsum(np.pad(a, pad, mode="edge"), axis=ax); n = a.shape[ax]
    return (np.take(c, np.arange(2 * r + 1, 2 * r + 1 + n), axis=ax) - np.take(c, np.arange(n), axis=ax)) / (2 * r + 1)

def blur(a, r):
    for _ in range(3): a = box(box(a, r, 0), r, 1)
    return a

def render_tile(parts, size, period, alpha_scale=1.0):
    """Coverage map (0..1) of `parts` tiled on the rotated grid, anchored like the old tile."""
    fonts = [(t, font(w, size)) for t, w in parts]
    big = Image.new("L", (W * 3, H * 3), 0); d = ImageDraw.Draw(big)
    ox, oy = W * 1.5, H * 1.5                       # rotation centre = the anchor point
    for row in range(-30, 31):
        y = oy + row * PITCH
        for col in range(-8, 9):
            x = ox + col * period
            for t, f in fonts:
                d.text((x, y), t, font=f, fill=255, anchor="ls"); x += f.getlength(t)
    r = big.rotate(THETA, resample=Image.BICUBIC, center=(ox, oy))
    x0, y0 = int(ox - ANCHOR[0]), int(oy - ANCHOR[1])
    return np.asarray(r.crop((x0, y0, x0 + W, y0 + H)), np.float32) / 255 * alpha_scale

def samp(img, y, x):
    y0 = np.floor(y).astype(int); x0 = np.floor(x).astype(int); fy = y - y0; fx = x - x0
    ok = (y0 >= 0) & (x0 >= 0) & (y0 < H - 1) & (x0 < W - 1)
    y0 = np.clip(y0, 0, H - 2); x0 = np.clip(x0, 0, W - 2)
    v = img[y0, x0] * (1 - fy) * (1 - fx) + img[y0 + 1, x0] * fy * (1 - fx) + img[y0, x0 + 1] * (1 - fy) * fx + img[y0 + 1, x0 + 1] * fy * fx
    return np.where(ok, v, np.nan)

# ---- 1. load originals --------------------------------------------------------------------
files = subprocess.run(["git", "ls-tree", "-r", "--name-only", args.rev, "public/images/"],
                       check=True, capture_output=True, text=True).stdout.splitlines()
files = [f for f in files if "images/" in f.split("public/images/", 1)[1]]  # <x>images/ subfolders only
imgs = {f: np.asarray(Image.open(io.BytesIO(git_bytes(f))).convert("RGB"), np.float32) for f in files}
print(len(imgs), "product photos")

# ---- 2. alpha matte -------------------------------------------------------------------------
old_parts = [("www.", "Regular"), ("ALLUVI", "Bold"), (".org", "Regular")]
old_cov = render_tile(old_parts, OLD_SIZE, PERIOD)
# Watermark mask from the data: median edge strength across all photos (only the shared tile
# survives the median), dilated ~3px so stroke interiors are covered.
stack = [J.mean(2) for J in imgs.values() if J.shape[:2] == (H, W)]
mg = np.median([np.abs(np.diff(L, axis=1, append=L[:, -1:])) + np.abs(np.diff(L, axis=0, append=L[-1:])) for L in stack], axis=0)
del stack
M = (blur((mg > 3).astype(np.float32), 1) > 0.001).astype(np.float32)
keep = 1 - M; den = blur(keep, 6) + 1e-6
amaps = []
for f, J in imgs.items():
    if J.shape[:2] != (H, W): continue
    L = J.mean(2)
    B = blur(L * keep, 6) / den
    V = blur(L * L * keep, 6) / den - B * B
    ok = (B >= 244) & (V < 12) & (den > 0.03)
    amaps.append(np.where(ok, (B - L) / (B - C_WM), np.nan).astype(np.float32))
a1 = np.nanmedian(np.stack(amaps), axis=0)
del amaps
# The matte is periodic, so compute it on a canvas larger than the photo by ~one lattice cell:
# a photo whose tile is offset by any amount is then just a crop of this canvas.
PAD = 220
yy, xx = np.mgrid[-PAD:H + PAD, -PAD:W + PAD].astype(np.float32)
copies = []
for i in range(-22, 23):
    for j in range(-4, 5):
        dx, dy = i * PITCH * N + j * PERIOD * U
        if abs(dx) < W + PAD and abs(dy) < H + PAD:
            s = samp(a1, yy + dy, xx + dx).astype(np.float32)
            if np.isfinite(s).any(): copies.append(s)
alpha_big = np.nan_to_num(np.nanmedian(np.stack(copies), axis=0))
del copies
alpha_big = np.clip(alpha_big, 0, 0.28)                # solid strokes are ~0.2; higher = noise spikes
alpha_big[alpha_big < 0.01] = 0                         # drop estimation noise
yb, xb = np.mgrid[0:H + 2 * PAD, 0:W + 2 * PAD]

def grad(x):
    return np.hypot(*np.gradient(x))
gA_big = grad(alpha_big)

def alpha_for(J):
    """Matte aligned to this photo. Most photos share the exact tile position; a few (UV shots,
    the 1200x801 one) are offset. Integer offset by FFT gradient correlation over one lattice cell,
    then sub-pixel refinement (0.25px) for the offset ones."""
    h = J.shape[0]
    gJ = grad(J.mean(2))
    def crop(dy, dx):  # matte value at photo pixel (y,x) = alpha_big[y+PAD+dy, x+PAD+dx]
        if float(dy).is_integer() and float(dx).is_integer():
            return alpha_big[PAD + int(dy):PAD + int(dy) + h, PAD + int(dx):PAD + int(dx) + W]
        ys, xs = np.mgrid[0:h, 0:W].astype(np.float32)
        y, x = ys + PAD + dy, xs + PAD + dx
        y0 = np.floor(y).astype(int); x0 = np.floor(x).astype(int); fy = y - y0; fx = x - x0
        A = alpha_big
        return A[y0, x0] * (1 - fy) * (1 - fx) + A[y0 + 1, x0] * fy * (1 - fx) + A[y0, x0 + 1] * (1 - fy) * fx + A[y0 + 1, x0 + 1] * fy * fx
    def score(dy, dx):
        g = grad(crop(dy, dx)); return float((g * gJ).sum() / np.sqrt((g * g).sum()))
    G = gA_big; g0 = gJ - gJ.mean()
    cc = np.fft.irfft2(np.fft.rfft2(G) * np.conj(np.fft.rfft2(g0, s=G.shape)), s=G.shape)[:2 * PAD + 1, :2 * PAD + 1]
    oy, ox = np.unravel_index(np.argmax(cc), cc.shape)
    cand = {(int(oy) - PAD, int(ox) - PAD), (0, 0)}
    best = max((score(dy, dx), dy, dx) for dy, dx in cand)
    s0 = score(0, 0)
    if s0 >= 0.9 * best[0]:   # the shared position (or a lattice-equivalent of it) -> keep exact
        return crop(0, 0), (0, 0)
    for step in (1, 0.5, 0.25):
        _, by, bx = best
        if step < 1 and (by, bx) == (0, 0):
            break  # aligned photos stay pixel-exact (interpolation blur would bias the score)
        best = max([best] + [(score(by + sy, bx + sx), by + sy, bx + sx)
                             for sy in (-step, 0, step) for sx in (-step, 0, step) if (sy or sx)
                             and abs(by + sy) <= PAD - 2 and abs(bx + sx) <= PAD - 2])
    return crop(best[1], best[2]), (best[1], best[2])

# ---- 3. new overlay -----------------------------------------------------------------------
new_parts = [("alluvihealthcare", "Bold"), (".co", "Regular")]
new_w = sum(font(w, OLD_SIZE).getlength(t) for t, w in new_parts)
new_alpha = render_tile(new_parts, OLD_SIZE, new_w + (PERIOD - 389.0), ALPHA_SOLID)

cap_layer = Image.new("L", (W, H), 0); d = ImageDraw.Draw(cap_layer)
cap_parts = [("www.", "Regular"), ("alluvihealthcare", "Bold"), (".co", "Regular")]
cap_size = 30
cap_w = sum(font(w, cap_size).getlength(t) for t, w in cap_parts)
x = W / 2 - cap_w / 2
for t, w in cap_parts:
    f = font(w, cap_size); d.text((x, 746), t, font=f, fill=255, anchor="ls"); x += f.getlength(t)
cap_a = np.asarray(cap_layer, np.float32)[..., None] / 255
cap_rgb = np.array(CAPTION_RGB, np.float32)

def process(J, alpha, dy=0):
    a = alpha[..., None]
    I = (J - a * C_WM) / (1 - a)                          # un-blend old tile
    # inpaint old caption: mask = pixels clearly darker than the local background
    x0, y0, x1, y1 = CAPTION_BOX
    L = I.mean(2); sub = L[y0:y1, x0:x1]
    bg = np.percentile(sub, 70)
    cm = np.zeros(L.shape, np.float32); cm[y0:y1, x0:x1] = (sub < bg - 10)
    cm = (blur(cm, 2) > 0.01).astype(np.float32)
    # normalised-convolution fill: smallest radius with enough known support wins (bg is smooth)
    k = 1 - cm; todo = cm > 0
    for r in (3, 6, 10, 16, 24):
        dn = blur(k, r)
        good = todo & (dn > 0.08)
        if good.any():
            fill = np.stack([blur(I[..., ch] * k, r) for ch in range(3)], 2) / np.maximum(dn, 1e-6)[..., None]
            I = np.where(good[..., None], fill, I)
            todo &= ~good
    I = np.where(cm[..., None] > 0, np.stack([blur(I[..., ch], 2) for ch in range(3)], 2), I)  # soften seams
    na = new_alpha[dy:dy + J.shape[0]][..., None]
    I = I * (1 - na) + na * C_WM                         # new tile, same opacity/colour
    ca = cap_a[dy:dy + J.shape[0]]
    I = I * (1 - ca) + ca * cap_rgb                       # new caption
    return np.clip(I + 0.5, 0, 255).astype(np.uint8)

for f, J in imgs.items():
    alpha, shift = alpha_for(J)
    out = Image.fromarray(process(J, alpha))
    dest = OUT / Path(f).relative_to("public/images"); dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.suffix.lower() == ".webp": out.save(dest, "WEBP", quality=90, method=6)
    else: out.save(dest, "JPEG", quality=90, subsampling=0, optimize=True, progressive=True)
    print("ok", dest, "shift", shift)
