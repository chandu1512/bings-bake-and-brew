#!/usr/bin/env bash
# Builds the web-ready hero videos from the original clips in source-media/story.
#
#   bash scripts/build-hero-videos.sh   (needs ffmpeg and Pillow: brew install ffmpeg; pip install pillow)
#
# For each clip it writes to public/story/:
#   <clip>.mp4   H.264, about 1.5 Mbps, no audio, fast start
#   <clip>.webm  VP9, no audio
#   <clip>-poster.webp   the first frame, shown before the video plays
# The clips end differently than they start, so the last FADE seconds are
# crossfaded into the first FADE seconds: the file's end flows into its start
# and a plain <video loop> loops without a jump.
set -euo pipefail
cd "$(dirname "$0")/.."
FADE=0.8
mkdir -p public/story
for clip in bake brew; do
  src="source-media/story/$clip.mp4"
  len=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
  offset=$(echo "$len - 2 * $FADE" | bc -l)
  loop="[0:v]trim=start=$FADE,setpts=PTS-STARTPTS[main];[0:v]trim=end=$FADE,setpts=PTS-STARTPTS[head];[main][head]xfade=transition=fade:duration=$FADE:offset=$offset,format=yuv420p[v]"
  ffmpeg -v error -y -i "$src" -filter_complex "$loop" -map "[v]" -an \
    -c:v libx264 -profile:v high -preset slow -b:v 1500k -maxrate 1800k -bufsize 3000k -movflags +faststart \
    "public/story/$clip.mp4"
  ffmpeg -v error -y -i "public/story/$clip.mp4" -an -c:v libvpx-vp9 -b:v 1200k -row-mt 1 -deadline good -cpu-used 2 \
    "public/story/$clip.webm"
  # Homebrew's ffmpeg has no WebP encoder, so export a PNG and convert it with Pillow (pip install pillow).
  ffmpeg -v error -y -i "public/story/$clip.mp4" -frames:v 1 "/tmp/$clip-poster.png"
  "${PYTHON:-python3}" -c "from PIL import Image; Image.open('/tmp/$clip-poster.png').save('public/story/$clip-poster.webp', 'WEBP', quality=80, method=6)"
  # Top-left corner of the first frame: the colour used behind the video.
  rgb=$(ffmpeg -v error -i "public/story/$clip.mp4" -vf "crop=8:8:0:0,scale=1:1:flags=area" -frames:v 1 -f rawvideo -pix_fmt rgb24 - | xxd -p)
  echo "$clip done, corner colour #$rgb"
done
ls -lh public/story
