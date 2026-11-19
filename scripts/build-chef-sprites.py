"""
CSS sprite sheets of the baker for touch devices (iPhone, iPad), where transparent
video is unreliable.

    python3 scripts/build-chef-sprites.py      (needs ffmpeg with libvpx-vp9, pip install pillow)

Reads the keyed clips public/chef/walk.webm and wave.webm (VP9 with alpha, made by
scripts/key-chef.sh) and writes, 24 frames each, side by side, 220px tall, WebP with alpha:
  public/chef/walk-sprite.webp   one full stride (64 clip frames = two steps), looped by CSS
  public/chef/wave-sprite.webp   the whole turn-and-wave, played once
Then checks that every corner pixel is fully transparent.
"""
import os, subprocess, sys, tempfile
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHEF = os.path.join(ROOT, "public", "chef")
FRAMES, H = 24, 220
STRIDE = 64          # clip frames in one full stride (measured: a step every 32 frames)


def frames(clip):
    tmp = tempfile.mkdtemp()
    subprocess.run(["ffmpeg", "-v", "error", "-c:v", "libvpx-vp9", "-i", os.path.join(CHEF, f"{clip}.webm"),
                    "-pix_fmt", "rgba", os.path.join(tmp, "%04d.png")], check=True)
    return [os.path.join(tmp, f) for f in sorted(os.listdir(tmp))]


def sheet(paths, out):
    imgs = [Image.open(p).convert("RGBA") for p in paths]
    w = round(imgs[0].width * H / imgs[0].height)
    s = Image.new("RGBA", (w * len(imgs), H), (0, 0, 0, 0))
    for i, im in enumerate(imgs):
        s.paste(im.resize((w, H), Image.LANCZOS), (i * w, 0))
    s.save(out, "WEBP", quality=80, alpha_quality=90, method=6, exact=True)
    return w


def check(path, n):
    im = Image.open(path).convert("RGBA")
    fw = im.width // n
    bad = []
    for i in range(n):
        for x, y in [(i * fw, 0), (i * fw + fw - 1, 0), (i * fw, im.height - 1), (i * fw + fw - 1, im.height - 1)]:
            a = im.getpixel((x, y))[3]
            if a != 0:
                bad.append((i, x, y, a))
    return bad


def main():
    walk = frames("walk")
    wave = frames("wave")
    picks_walk = [walk[round(i * STRIDE / FRAMES)] for i in range(FRAMES)]
    picks_wave = [wave[round(i * (len(wave) - 1) / (FRAMES - 1))] for i in range(FRAMES)]
    ok = True
    for name, picks in [("walk", picks_walk), ("wave", picks_wave)]:
        out = os.path.join(CHEF, f"{name}-sprite.webp")
        fw = sheet(picks, out)
        bad = check(out, FRAMES)
        size = os.path.getsize(out) // 1024
        print(f"{name}-sprite.webp: {FRAMES} frames of {fw}x{H}, {size} KB, corner pixels with alpha != 0: {len(bad)}", bad[:4])
        ok &= not bad and size < 600
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
