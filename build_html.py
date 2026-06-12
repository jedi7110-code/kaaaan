#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""kaaaan.md を読書用の単一HTMLへ変換する。"""
import html
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "kaaaan.md"
OUT = ROOT / "index.html"


def parse_markdown(text):
    blocks = []
    para = []
    quote = []

    def flush_para():
        nonlocal para
        if para:
            blocks.append(("p", "".join(para)))
            para = []

    def flush_quote():
        nonlocal quote
        if quote:
            blocks.append(("quote", quote[:]))
            quote = []

    def flush_all():
        flush_para()
        flush_quote()

    for raw in text.splitlines():
        line = raw.rstrip()
        s = line.strip()
        if not s:
            flush_all()
            continue
        if s.startswith("# "):
            flush_all()
            blocks.append(("h1", s[2:].strip()))
            continue
        if s.startswith("## "):
            flush_all()
            blocks.append(("h2", s[3:].strip()))
            continue
        if s.startswith("### "):
            flush_all()
            blocks.append(("h3", s[4:].strip()))
            continue
        if s == "---":
            flush_all()
            blocks.append(("hr", None))
            continue
        if s.startswith(">"):
            flush_para()
            quote.append(s.lstrip(">").strip())
            continue
        flush_quote()
        para.append(s)

    flush_all()
    return blocks


def inline(text):
    escaped = html.escape(text)
    escaped = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", escaped)
    escaped = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<em>\1</em>", escaped)
    return escaped


def title_parts(title):
    if "──" in title:
        en, jp = [part.strip() for part in title.split("──", 1)]
        return en, jp
    return title, ""


def render_block(block, section_id=None):
    typ, payload = block
    if typ == "h1":
        en, jp = title_parts(payload)
        jp_html = f'<span class="ttl-jp">{inline(jp)}</span>' if jp else ""
        return (
            '<div class="series">SILENT WORLD / ARTIFICIAL MEMORY</div>'
            '<h1 class="title">'
            f'<span class="ttl-en">{inline(en)}</span>{jp_html}'
            "</h1>"
        )
    if typ == "h2":
        sid = f' id="{section_id}"' if section_id else ""
        return f"<h2{sid}>{inline(payload)}</h2>"
    if typ == "h3":
        return f"<h3>{inline(payload)}</h3>"
    if typ == "p":
        return f"<p>{inline(payload)}</p>"
    if typ == "quote":
        body = "".join(f"<p>{inline(line)}</p>" for line in payload)
        return f"<blockquote>{body}</blockquote>"
    if typ == "hr":
        return '<hr class="scene">'
    return ""


def build():
    blocks = parse_markdown(SRC.read_text(encoding="utf-8"))
    title = "KAAAAN"
    sections = []
    nav = []
    h2_count = 0
    rendered = []

    for block in blocks:
        typ, payload = block
        if typ == "h1":
            title = title_parts(payload)[0]
            rendered.append(render_block(block))
        elif typ == "h2":
            h2_count += 1
            sid = f"chapter-{h2_count:02d}"
            sections.append((sid, payload))
            nav.append(f'<a href="#{sid}">{html.escape(payload)}</a>')
            rendered.append(render_block(block, sid))
        else:
            rendered.append(render_block(block))

    body = "\n".join(rendered)
    nav_html = "\n".join(nav)
    doc = f"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<link rel="stylesheet" href="reader.css">
</head>
<body>
<header class="bar" id="bar">
  <button id="barToggle" type="button" aria-label="メニュー" aria-expanded="false">☰</button>
  <span class="nm">KAAAAN</span>
  <nav>{nav_html}</nav>
  <button id="fontDec" type="button" aria-label="文字を小さく">A-</button>
  <button id="fontInc" type="button" aria-label="文字を大きく">A+</button>
  <button id="themeBtn" type="button" aria-label="テーマ切替">paper</button>
  <button id="bmBtn" type="button" aria-label="しおり">bookmark</button>
</header>
<main id="scroll" class="scroll">
  <article class="book">
{body}
  </article>
</main>
<aside class="progress" aria-hidden="true">
  <div class="track"></div>
  <div class="ticks" id="ticks"></div>
  <div class="fill" id="fill"></div>
  <div class="pct" id="pct">0%</div>
</aside>
<a class="resume" id="resume" href="#">前回の続き <small class="pct">--%</small></a>
<script src="reader.js"></script>
</body>
</html>
"""
    OUT.write_text(doc, encoding="utf-8")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    build()

