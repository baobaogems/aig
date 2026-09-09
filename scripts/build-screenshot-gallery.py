#!/usr/bin/env python3
"""Dựng một trang HTML nội bộ để xem bộ ảnh baseline landing page.

Đọc computed-styles.json + các PNG trong một thư mục baseline, xuất ra
index.html nằm CẠNH các ảnh (dùng đường dẫn tương đối, mở bằng file:// là xem
được, không cần server).

Dùng:  python3 scripts/build-screenshot-gallery.py [thư-mục-baseline]
"""
import html
import json
import sys
from pathlib import Path

DEFAULT_DIR = Path("frontend/.screenshots/baseline-260821-feat-reskin")

# Nhãn tiếng Việt cho từng ảnh section, khớp theo tiền tố số của tên file.
SECTION_VN = {
    "full-page": "Toàn trang",
    "nav": "Thanh điều hướng",
    "hero": "Hero — khối đầu trang",
    "problem": "Vấn đề",
    "flow": "Luồng hoạt động",
    "safety": "An toàn (nền tối)",
    "evidence": "Bằng chứng on-chain",
    "footer": "Chân trang",
}


def esc(v):
    return html.escape(str(v))


def section_label(png: Path) -> str:
    stem = png.stem                      # ví dụ "04-flow"
    key = stem.split("-", 1)[1] if "-" in stem else stem
    return f"{stem.split('-')[0]} · {SECTION_VN.get(key, key)}"


def img_card(rel_src: str, title: str, note: str = "") -> str:
    note_html = f'<p class="note">{note}</p>' if note else ""
    return f"""<figure class="card">
      <a href="{esc(rel_src)}" target="_blank"><img loading="lazy" src="{esc(rel_src)}" alt="{esc(title)}"></a>
      <figcaption><strong>{esc(title)}</strong>{note_html}</figcaption>
    </figure>"""


def hover_section(hovers: list, viewport: str) -> str:
    if not hovers:
        return '<p class="empty">Không đo hover ở viewport này (không có con trỏ chuột trên mobile).</p>'
    cards = []
    for h in hovers:
        changed = h.get("changed") or {}
        if changed:
            rows = "".join(
                f"<tr><td>{esc(k)}</td><td>{esc(v)}</td></tr>" for k, v in changed.items()
            )
            note = f'<table class="diff">{rows}</table>'
            badge = f'<span class="badge ok">đổi {len(changed)} thuộc tính</span>'
        else:
            note = ""
            badge = '<span class="badge bad">KHÔNG đổi thuộc tính nào</span>'
        title = f'{h.get("label", "?")} <{h.get("tag", "?")}>'
        cards.append(
            f"""<figure class="card hover">
      <a href="{viewport}/{esc(h['file'])}" target="_blank"><img loading="lazy" src="{viewport}/{esc(h['file'])}" alt="{esc(title)}"></a>
      <figcaption><strong>{esc(title)}</strong> {badge}{note}</figcaption>
    </figure>"""
        )
    return '<div class="grid">' + "".join(cards) + "</div>"


def numbers_table(numbers: list) -> str:
    rows = "".join(
        f"<tr><td class=\"mono\">{esc(n.get('text', ''))}</td><td>{esc(n.get('fontFamily', '').split(',')[0])}</td>"
        f"<td>{esc(n.get('fontSize'))}</td>"
        f"<td class=\"{'bad-cell' if n.get('fontVariantNumeric') == 'normal' else 'ok-cell'}\">"
        f"{esc(n.get('fontVariantNumeric'))}</td></tr>"
        for n in numbers
    )
    return (
        '<table class="data"><thead><tr><th>Nội dung</th><th>Font</th><th>Cỡ</th>'
        "<th>font-variant-numeric</th></tr></thead><tbody>" + rows + "</tbody></table>"
    )


def vars_swatches(css_vars: dict) -> str:
    out = []
    for k, v in css_vars.items():
        if isinstance(v, str) and v.strip().startswith("#"):
            out.append(
                f'<div class="swatch"><span style="background:{esc(v)}"></span>'
                f'<code>{esc(k)}</code><em>{esc(v)}</em></div>'
            )
    return '<div class="swatches">' + "".join(out) + "</div>"


def viewport_block(name: str, vp: dict, base: Path) -> str:
    folder = base / name
    pngs = sorted(p for p in folder.glob("*.png") if not p.name.startswith("hover-"))
    styles = vp.get("styles", {})
    motion = styles.get("motion", {})
    missing = vp.get("missingSections") or []
    missing_html = (
        '<p class="empty">Không chụp được: ' + esc(", ".join(missing)) + "</p>" if missing else ""
    )
    w = vp.get("viewport", {}).get("width", "?")
    return f"""
  <section class="viewport" id="{esc(name)}">
    <h2>{esc(name)} — {esc(w)}px</h2>
    {missing_html}
    <h3>Các khối của trang</h3>
    <div class="grid">{''.join(img_card(f"{name}/{p.name}", section_label(p)) for p in pngs)}</div>
    <h3>Trạng thái rê chuột (hover)</h3>
    {hover_section(vp.get("hovers") or [], name)}
    <h3>Mọi con số trên trang</h3>
    <p class="empty">Cột cuối là thứ quyết định các chữ số có thẳng cột hay không.
    <code>normal</code> = chưa bật <code>tabular-nums</code>.</p>
    {numbers_table(styles.get("numbers", []))}
    <h3>Chuyển động</h3>
    <p class="empty">keyframes: <code>{esc(', '.join(motion.get('keyframes', [])) or 'không có')}</code> ·
    reveal đã hiện: <code>{esc(motion.get('revealVisible'))}/{esc(motion.get('revealCount'))}</code> ·
    chiều cao trang: <code>{esc(motion.get('scrollHeight'))}px</code></p>
    <h3>Biến màu đang dùng</h3>
    {vars_swatches(styles.get("cssVars", {}))}
  </section>"""


CSS = """
:root{--bg:#19181c;--fg:#ededed;--muted:#a9aab1;--line:#333;--accent:#de1e14}
*{box-sizing:border-box}
body{margin:0;padding:32px;background:var(--bg);color:var(--fg);
     font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
h1{font-size:26px;margin:0 0 4px}h2{margin:48px 0 8px;font-size:21px;border-bottom:1px solid var(--line);padding-bottom:8px}
h3{margin:32px 0 12px;font-size:16px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
a{color:var(--accent)}
.meta{color:var(--muted);margin:0 0 24px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px}
.card{margin:0;background:#27282d;border:1px solid var(--line);border-radius:12px;overflow:hidden}
.card img{width:100%;display:block;max-height:520px;object-fit:contain;object-position:top;background:#111}
.card.hover img{max-height:180px}
figcaption{padding:12px 14px;font-size:13px}
.note{margin:6px 0 0;color:var(--muted)}
.empty{color:var(--muted);font-size:13px}
.badge{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;font-size:11px}
.badge.ok{background:#2ca6bd22;color:#2ca6bd;border:1px solid #2ca6bd55}
.badge.bad{background:#de1e1422;color:#ff8a82;border:1px solid #de1e1455}
table{border-collapse:collapse;width:100%;font-size:13px;margin-top:8px}
th,td{text-align:left;padding:6px 10px;border-bottom:1px solid var(--line)}
th{color:var(--muted);font-weight:500}
.diff td{padding:4px 0;border:0;font-family:ui-monospace,monospace;font-size:11px;color:var(--muted)}
.mono{font-family:ui-monospace,monospace}
.bad-cell{color:#ff8a82}.ok-cell{color:#2ca6bd}
.swatches{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px}
.swatch{display:flex;align-items:center;gap:10px;font-size:12px}
.swatch span{width:26px;height:26px;border-radius:6px;border:1px solid var(--line);flex:0 0 auto}
.swatch code{flex:1}.swatch em{color:var(--muted);font-style:normal;font-family:ui-monospace,monospace}
nav.top{position:sticky;top:0;background:var(--bg);padding:8px 0;border-bottom:1px solid var(--line);margin-bottom:8px}
nav.top a{margin-right:16px;text-decoration:none}
"""


def main():
    root = Path(__file__).resolve().parent.parent
    base = root / (sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DIR)
    data = json.loads((base / "computed-styles.json").read_text())
    blocks = "".join(
        viewport_block(name, vp, base) for name, vp in data["viewports"].items()
    )
    links = "".join(
        f'<a href="#{esc(n)}">{esc(n)}</a>' for n in data["viewports"]
    )
    out = f"""<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Baseline landing — {esc(base.name)}</title><style>{CSS}</style></head><body>
<h1>Ảnh baseline landing page</h1>
<p class="meta">Chụp từ <code>{esc(data['url'])}</code> lúc <code>{esc(data['capturedAt'])}</code>
· nhánh <code>feat/reskin</code> · bấm vào ảnh để mở kích thước thật.</p>
<nav class="top">{links}</nav>
{blocks}
</body></html>"""
    dest = base / "index.html"
    dest.write_text(out)
    print(dest)


if __name__ == "__main__":
    main()
