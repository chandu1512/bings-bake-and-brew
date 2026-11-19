"""
Builds the hero videos from the original clips in source-media/story.

    python3 scripts/build-hero-videos.py     (needs ffmpeg with libx264, plus: pip install pillow)

For each clip and size it writes to public/story/:
  <clip>-720.mp4 / <clip>-480.mp4               H.264 Main profile, yuv420p, 30fps CFR, ~2 Mbps,
                                                keyframe every 1s. The only format: it plays everywhere,
                                                including iOS autoplay (no HEVC; the hero needs no transparency)
  <clip>-720-poster.webp / <clip>-480-poster.webp   first frame
  <clip>-anim.webp                              animated WebP of the 480p loop at 20fps, shown when
                                                iOS refuses to autoplay video (Low Power Mode)
No audio, faststart. The page hides the clip's rectangle edge with a soft CSS
radial mask (HeroVideo.tsx), so the frames are the plain footage. The clips end differently
than they start, so the last FADE seconds are crossfaded into the first FADE
seconds and each file loops seamlessly.
"""
import os, subprocess, tempfile
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "source-media", "story")
OUT = os.path.join(ROOT, "public", "story")
FADE = 0.8
SIZES = {"720": (1280, 720), "480": (854, 480)}
def run(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def main():
    tmp = tempfile.mkdtemp()
    for clip in ("brew", "bake"):
        src = os.path.join(SRC, f"{clip}.mp4")
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], capture_output=True, text=True, check=True).stdout)
        offset = dur - 2 * FADE
        for tag, (w, h) in SIZES.items():
            if os.environ.get("ONLY") and os.environ["ONLY"] != f"{clip}-{tag}":
                continue
            graph = (
                f"[0:v]fps=30,trim=start={FADE},setpts=PTS-STARTPTS[main];"
                f"[0:v]fps=30,trim=end={FADE},setpts=PTS-STARTPTS[head];"
                f"[main][head]xfade=transition=fade:duration={FADE}:offset={offset},scale={w}:{h}:flags=lanczos,"
                # BT.709 matrix, transfer tagged sRGB: Safari colour-manages video and draws it like the CSS colours.
                f"scale=out_color_matrix=bt709:out_range=tv,"
                f"setparams=color_primaries=bt709:color_trc=iec61966-2-1:colorspace=bt709:range=tv,format=yuv420p[out]"
            )
            inputs = ["-i", src]
            # -t: the looped clip's length (the crossfade shortens it by FADE).
            common = ["-filter_complex", graph, "-map", "[out]", "-t", f"{dur - FADE:.3f}", "-an", "-r", "30", "-fps_mode", "cfr", "-g", "30", "-movflags", "+faststart",
                      "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "iec61966-2-1", "-color_range", "tv"]
            h264 = os.path.join(OUT, f"{clip}-{tag}.mp4")
            run(*inputs, *common, "-c:v", "libx264", "-profile:v", "main", "-pix_fmt", "yuv420p", "-preset", "medium",
                "-b:v", "2000k", "-maxrate", "2400k", "-bufsize", "4000k", "-keyint_min", "30", "-sc_threshold", "0", h264)
            png = os.path.join(tmp, f"{clip}-{tag}-poster.png")
            run("-i", h264, "-frames:v", "1", png)
            Image.open(png).save(os.path.join(OUT, f"{clip}-{tag}-poster.webp"), "WEBP", quality=82, method=6)
            if tag == "480":
                # Animated images still play when iOS blocks video autoplay (Low Power Mode).
                fdir = tempfile.mkdtemp()
                run("-i", h264, "-vf", "fps=20", os.path.join(fdir, "%04d.png"))
                frames = [Image.open(os.path.join(fdir, f)).convert("RGB") for f in sorted(os.listdir(fdir))]
                anim = os.path.join(OUT, f"{clip}-anim.webp")
                frames[0].save(anim, "WEBP", save_all=True, append_images=frames[1:], duration=50, loop=0, quality=62, method=4)
                print(os.path.relpath(anim, ROOT), os.path.getsize(anim) // 1024, "KB", flush=True)
            for f in (h264,):
                print(os.path.relpath(f, ROOT), os.path.getsize(f) // 1024, "KB", flush=True)


if __name__ == "__main__":
    main()
