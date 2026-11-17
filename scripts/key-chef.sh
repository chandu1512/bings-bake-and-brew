#!/usr/bin/env bash
# Removes the green screen from the baker mascot and makes web-ready files.
#
#   bash scripts/key-chef.sh        (needs ffmpeg with libvpx-vp9 and hevc_videotoolbox: macOS + brew install ffmpeg)
#
# Sources: source-media/chef/{walk.mp4,wave.mp4,chef.jpg} (1920x1080, solid green).
# Writes to public/chef/:
#   walk.webm, wave.webm   VP9 with alpha (Chrome, Firefox)
#   walk.mov,  wave.mov    HEVC with alpha, tagged hvc1 (Safari)
#   chef.png               the still, keyed, same crop
#   wave-end.png           the last frame of wave, keyed
# Both videos are cropped to ONE box that fits the baker in every frame of both
# clips, so he never jumps when the page switches from walking to waving.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=source-media/chef
OUT=public/chef
KEY="chromakey=0x00ff00:0.18:0.08,despill=type=green"
H=360
mkdir -p "$OUT"

# 1. Bounding box of the keyed baker in every frame of both clips.
read -r X1 Y1 X2 Y2 < <(
  for clip in walk wave; do
    ffmpeg -v info -nostats -i "$SRC/$clip.mp4" -vf "format=yuva420p,$KEY,alphaextract,bbox=min_val=40" -f null - 2>&1 | grep -o 'x1:[0-9]* x2:[0-9]* y1:[0-9]* y2:[0-9]*'
  done | sed 's/[xy][12]://g' | awk 'NR==1{a=$1;b=$2;c=$3;d=$4} {if($1<a)a=$1; if($2>b)b=$2; if($3<c)c=$3; if($4>d)d=$4} END{print a, c, b, d}'
)
PAD=12
X1=$(( X1 > PAD ? X1 - PAD : 0 )); Y1=$(( Y1 > PAD ? Y1 - PAD : 0 ))
X2=$(( X2 + PAD < 1919 ? X2 + PAD : 1919 )); Y2=$(( Y2 + PAD < 1079 ? Y2 + PAD : 1079 ))
W=$(( (X2 - X1 + 2) / 2 * 2 )); HH=$(( (Y2 - Y1 + 2) / 2 * 2 ))
CROP="crop=$W:$HH:$X1:$Y1"
OW=$(( (W * H / HH + 1) / 2 * 2 ))
echo "crop box: ${W}x${HH} at $X1,$Y1 -> output ${OW}x${H}"

for clip in walk wave; do
  VF="format=yuva420p,$KEY,$CROP,scale=$OW:$H:flags=lanczos"
  ffmpeg -v error -y -i "$SRC/$clip.mp4" -an -vf "$VF,format=yuva420p" \
    -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 34 -row-mt 1 -deadline good -cpu-used 2 -auto-alt-ref 0 \
    "$OUT/$clip.webm"
  ffmpeg -v error -y -i "$SRC/$clip.mp4" -an -vf "$VF,format=bgra" \
    -c:v hevc_videotoolbox -allow_sw 1 -alpha_quality 0.75 -q:v 55 -tag:v hvc1 \
    "$OUT/$clip.mov"
done

# Last frame of the wave, with transparency.
ffmpeg -v error -y -sseof -0.1 -i "$SRC/wave.mp4" -vf "format=yuva420p,$KEY,$CROP,scale=$OW:$H:flags=lanczos,format=rgba" -update 1 -frames:v 1 "$OUT/wave-end.png"
# The still: scaled to the videos' 1920x1080 first, then the same key and crop.
ffmpeg -v error -y -i "$SRC/chef.jpg" -vf "scale=1920:1080,format=yuva420p,$KEY,$CROP,scale=$OW:$H:flags=lanczos,format=rgba" -frames:v 1 "$OUT/chef.png"

echo "{\"width\": $OW, \"height\": $H}" > "$OUT/size.json"
ls -lh "$OUT"
