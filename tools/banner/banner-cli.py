#!/usr/bin/env python3
"""banner-cli.py — @baobao_gems banner generator (dark "standard" format).

Layout: logo top-left + accent bar · yellow eyebrow · headline (white + red
emphasis via *...*) · rounded dark card with sub copy + handle bottom-right.

Uses Bold / Medium / Regular Montserrat statics shipped alongside this script
and an optional baobao_logo.png in the same folder.

Example:
    python3 tools/banner/banner-cli.py \\
        --label "🚨 HOT HOT HOT:" \\
        --headline "Viet Nam *CHINH THUC* dua *CRYPTO* vao dien..." \\
        --sub "Xem chi tiet + phan tich trong bai" \\
        -o cover.png
"""

import argparse
import re
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
try:
    from pilmoji import Pilmoji
    _HAS_PILMOJI = True
except ImportError:
    _HAS_PILMOJI = False

# --- brand ---
HANDLE = "@baobao_gems"

# --- dark "standard" palette (reference: baobao_gems X posts) ---
BG_COLOR = (10, 10, 11)              # near-black
TEXT_COLOR = (250, 250, 247)         # near-white
ACCENT_COLOR = (239, 68, 68)         # red-500 — emphasis in headline (*...*)
EYEBROW_COLOR = (255, 193, 7)        # amber — eyebrow text + decorative bar
CARD_BG = (24, 24, 27)               # zinc-900 — sub card
CARD_TEXT = (228, 228, 231)          # zinc-200 — sub copy
HANDLE_COLOR = (161, 161, 170)       # zinc-400 — handle in card

SCRIPT_DIR = Path(__file__).resolve().parent
FONT_BOLD = SCRIPT_DIR / "Montserrat-Bold.ttf"
FONT_MEDIUM = SCRIPT_DIR / "Montserrat-Medium.ttf"
FONT_REGULAR = SCRIPT_DIR / "Montserrat-Regular.ttf"
LOGO_PATH = SCRIPT_DIR / "baobao_logo.png"


def check_assets():
    missing = [p.name for p in (FONT_BOLD, FONT_MEDIUM, FONT_REGULAR) if not p.exists()]
    if missing:
        sys.exit(f"missing font file(s) in {SCRIPT_DIR}: {', '.join(missing)}")


def parse_emphasis(text: str) -> list:
    """Split text on *...* markers into [(span, is_accent), ...]."""
    parts = []
    for chunk in re.split(r"(\*[^*]+\*)", text):
        if not chunk:
            continue
        if chunk.startswith("*") and chunk.endswith("*"):
            parts.append((chunk[1:-1], True))
        else:
            parts.append((chunk, False))
    return parts


def wrap_to_width(draw, text: str, font, max_w: int) -> list:
    """Greedy word-wrap returning a list of lines (handles \\n as forced break)."""
    out = []
    for raw_line in text.split("\n"):
        words = raw_line.split()
        if not words:
            out.append("")
            continue
        cur = words[0]
        for w in words[1:]:
            trial = cur + " " + w
            if draw.textlength(trial, font=font) <= max_w:
                cur = trial
            else:
                out.append(cur)
                cur = w
        out.append(cur)
    return out


def measure_line_h(font, leading=1.15) -> int:
    asc, desc = font.getmetrics()
    return int((asc + desc) * leading)


def wrap_with_spans(draw, parts, font, max_w):
    """Wrap parsed spans (text, is_accent) preserving accent flags per line."""
    lines, cur_line, cur_w = [], [], 0
    space_w = draw.textlength(" ", font=font)
    for span, accent in parts:
        for word in span.split(" "):
            if not word:
                continue
            w = draw.textlength(word, font=font)
            sep_w = space_w if cur_line else 0
            if cur_w + sep_w + w > max_w and cur_line:
                lines.append(cur_line)
                cur_line, cur_w = [], 0
                sep_w = 0
            if sep_w and cur_line and cur_line[-1][1] == accent:
                cur_line[-1] = (cur_line[-1][0] + " " + word, accent)
            else:
                cur_line.append((" " + word if sep_w else word, accent))
            cur_w += sep_w + w
    if cur_line:
        lines.append(cur_line)
    return lines


def draw_logo(img, draw, PAD, W, H, f_eyebrow):
    """Render logo centered horizontally at top. Returns (logo_w, logo_h)."""
    if not LOGO_PATH.exists():
        # Fallback: centered handle text
        hw = draw.textlength(HANDLE, font=f_eyebrow)
        draw.text(((W - hw) // 2, PAD), HANDLE, fill=TEXT_COLOR, font=f_eyebrow)
        return 0, int(H * 0.055)
    try:
        logo = Image.open(LOGO_PATH).convert("RGBA")
        is_wide = (logo.width / logo.height) >= 1.4
        target_h = int(H * (0.080 if is_wide else 0.140))
        ratio = target_h / logo.height
        logo = logo.resize((int(logo.width * ratio), target_h), Image.LANCZOS)
        img.paste(logo, ((W - logo.width) // 2, PAD), logo)
        return logo.width, target_h
    except Exception as e:
        print(f"[warn] logo load failed: {e}", file=sys.stderr)
        return 0, int(H * 0.055)


def draw_headline(draw, lines_with_spans, font, x, y, line_h):
    for line_spans in lines_with_spans:
        cx = x
        for span, is_accent in line_spans:
            color = ACCENT_COLOR if is_accent else TEXT_COLOR
            draw.text((cx, y), span, fill=color, font=font)
            cx += draw.textlength(span, font=font)
        y += line_h
    return y


def render(args):
    check_assets()
    W, H = args.width, args.height
    PAD = max(64, int(W * 0.065))

    img = Image.new("RGB", (W, H), BG_COLOR)
    draw = ImageDraw.Draw(img)

    f_eyebrow = ImageFont.truetype(str(FONT_BOLD), int(W * 0.034))
    f_headline = ImageFont.truetype(str(FONT_BOLD), int(W * 0.058))
    f_sub = ImageFont.truetype(str(FONT_MEDIUM), int(W * 0.026))
    f_handle = ImageFont.truetype(str(FONT_MEDIUM), int(W * 0.022))

    # 1) Logo + decorative bar
    _, logo_h = draw_logo(img, draw, PAD, W, H, f_eyebrow)

    # 2) Optional eyebrow (yellow line — emoji + label). Only rendered if
    # --label is non-empty. pilmoji handles color emoji sprites.
    eyebrow_y = PAD + logo_h + int(H * 0.045)
    eyebrow_h = 0
    if args.label:
        if _HAS_PILMOJI:
            with Pilmoji(img) as pm:
                pm.text((PAD, eyebrow_y), args.label, fill=EYEBROW_COLOR, font=f_eyebrow)
        else:
            draw.text((PAD, eyebrow_y), args.label, fill=EYEBROW_COLOR, font=f_eyebrow)
        eyebrow_h = measure_line_h(f_eyebrow)

    # 3) Headline (white base + red emphasis on *...*)
    max_text_w = W - 2 * PAD
    parts = parse_emphasis(args.headline)
    headline_lines = wrap_with_spans(draw, parts, f_headline, max_text_w)
    h_line_h = measure_line_h(f_headline, leading=1.20)
    headline_y = eyebrow_y + eyebrow_h + (int(H * 0.020) if args.label else 0)
    end_y = draw_headline(draw, headline_lines, f_headline, PAD, headline_y, h_line_h)

    # 4) Sub copy — plain on black (no card), handle bottom-right corner
    sub_lines = wrap_to_width(draw, args.sub, f_sub, max_text_w)
    s_line_h = measure_line_h(f_sub, leading=1.40)
    sub_y = end_y + int(H * 0.040)
    for line in sub_lines:
        draw.text((PAD, sub_y), line, fill=CARD_TEXT, font=f_sub)
        sub_y += s_line_h

    # Handle in bottom-right corner
    asc, desc = f_handle.getmetrics()
    hw = draw.textlength(HANDLE, font=f_handle)
    draw.text((W - PAD - hw, H - PAD - (asc + desc)), HANDLE,
              fill=HANDLE_COLOR, font=f_handle)

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, "PNG", optimize=True)
    print(f"[banner] wrote {out} ({W}x{H}, {out.stat().st_size//1024} KB)")


def main():
    ap = argparse.ArgumentParser(description="Generate baobao_gems standard-format banner (dark, eyebrow + headline + sub card).")
    ap.add_argument("--label", default="", help="Optional yellow eyebrow text (include emoji prefix, e.g. '🚨 HOT HOT HOT:'). Empty = no eyebrow.")
    ap.add_argument("--headline", required=True, help="Headline (white). Wrap span in *...* for red emphasis. Use \\n for forced break.")
    ap.add_argument("--sub", required=True, help="Sub copy rendered inside the bottom card.")
    ap.add_argument("-o", "--output", required=True, help="Output PNG path.")
    ap.add_argument("--width", type=int, default=1080)
    ap.add_argument("--height", type=int, default=1080)
    render(ap.parse_args())


if __name__ == "__main__":
    main()
