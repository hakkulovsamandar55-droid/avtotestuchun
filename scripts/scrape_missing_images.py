#!/usr/bin/env python3
# ============================================================================
# RASMSIZ QOLGAN SAVOLLARGA avto-imtihon.uz DAN RASM YIG'ISH
#
# NIMA UCHUN KERAK:
# 94–120 biletlarda birorta savolda rasm yo'q (rasmlar eski, 93 biletli
# manbadan olingan edi — REPLACE_NOTES.md ga qarang). Natijada "Ushbu yo'l
# belgisi qanday nomlanadi?" kabi savollar ilovada rasmsiz ko'rinadi.
#
# QAYSI SAVOLLAR KERAKLIGI:
#   node scripts/find-missing-images.mjs --json
# shu ro'yxatni beradi (savol ID va matni uch tilda).
#
# ISHLATISH:
#   python3 scripts/scrape_missing_images.py --discover 94
#       Sayt tuzilishini o'rganadi: qaysi URL ishlaydi, savol/rasm qaysi
#       elementlarda. Selektorlarni aniqlash uchun BIRINCHI qadam.
#
#   python3 scripts/scrape_missing_images.py --fetch
#       Kerakli biletlarni ochib, savol matni bo'yicha moslashtiradi va
#       rasmlarni src/assets/newQuestions/ ga t<bilet>-<savol>.webp qilib
#       saqlaydi. Natija xaritasi: scripts/output/missing-images-map.json
#
#   node scripts/apply-image-map.mjs
#       Xaritani shared/data/ticketsData.js ga qo'llaydi (image maydonlari).
#
# MUHIM: sayt Next.js/React'da ishlashi mumkin, ya'ni oddiy HTML tortish
# yetmaydi — shuning uchun Playwright (headless Chrome) ishlatiladi.
# ============================================================================

import argparse
import json
import os
import re
import subprocess
import sys
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "src" / "assets" / "newQuestions"
OUT_DIR = ROOT / "scripts" / "output"

BASE = "https://avto-imtihon.uz"

# Bilet sahifasining URL shakli oldindan ma'lum emas — shuning uchun
# --discover shu ro'yxatni birma-bir sinab ko'radi va ishlaganini aytadi.
URL_CANDIDATES = [
    "/uz/biletlar/{n}",
    "/biletlar/{n}",
    "/uz/bilet/{n}",
    "/bilet/{n}",
    "/uz/tickets/{n}",
    "/tickets/{n}",
    "/ticket/{n}",
    "/uz/test/{n}",
    "/test/{n}",
]


# --- Matn solishtirish -------------------------------------------------------
# Manba sayt va bazadagi matn tinish belgilari, apostrof turlari va bo'sh
# joylar bilan farq qiladi. Solishtirishdan oldin ikkalasini bir ko'rinishga
# keltiramiz.
def normalize(text):
    if not text:
        return ""
    text = unicodedata.normalize("NFKC", text).lower()
    text = text.replace("ʻ", "'").replace("ʼ", "'").replace("‘", "'").replace("’", "'")
    text = re.sub(r"[^0-9a-zа-яёўқғҳЀ-ӿ]+", " ", text, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", text).strip()


def similarity(a, b):
    return SequenceMatcher(None, normalize(a), normalize(b)).ratio()


def load_wanted():
    """find-missing-images.mjs dan rasmsiz savollar ro'yxatini oladi."""
    res = subprocess.run(
        ["node", str(ROOT / "scripts" / "find-missing-images.mjs"), "--json"],
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(res.stdout)


# --- Playwright yordamchilari ------------------------------------------------
def new_browser(pw, headless=True):
    browser = pw.chromium.launch(headless=headless)
    ctx = browser.new_context(
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
        ),
        viewport={"width": 1400, "height": 2000},
    )
    return browser, ctx


def page_blocks(page):
    """
    Sahifadan savol bloklarini o'qiydi.

    Sayt tuzilishi oldindan ma'lum bo'lmagani uchun selektorga bog'lanmaymiz:
    har bir <img> uchun uning eng yaqin "matnli" ajdodini topamiz va o'sha
    bloknig matnini savol matni deb olamiz. Bu Next.js ning siqilgan CSS
    klasslariga bog'liq bo'lmaydi (REPLACE_NOTES.md dagi 1-urinish aynan
    shunga ilingan edi).
    """
    return page.evaluate(
        """
        () => {
          const out = [];
          for (const img of document.querySelectorAll('img')) {
            const r = img.getBoundingClientRect();
            if (r.width < 120 || r.height < 80) continue;   // ikonka/logotip emas
            let node = img.parentElement, text = '', hops = 0;
            while (node && hops < 6) {
              const t = (node.innerText || '').trim();
              if (t.length > 40) { text = t; break; }
              node = node.parentElement; hops++;
            }
            out.push({
              src: img.currentSrc || img.src,
              width: Math.round(r.width),
              height: Math.round(r.height),
              alt: img.alt || '',
              text: text.slice(0, 400),
            });
          }
          return out;
        }
        """
    )


# --- Rejim: --discover -------------------------------------------------------
def discover(ticket):
    from playwright.sync_api import sync_playwright

    print(f"==> {ticket}-bilet uchun sayt tuzilishi o'rganilmoqda\n")
    with sync_playwright() as pw:
        browser, ctx = new_browser(pw)
        page = ctx.new_page()

        print("--- Bosh sahifa ---")
        try:
            page.goto(BASE, wait_until="networkidle", timeout=60000)
            print(f"  sarlavha: {page.title()}")
            links = page.evaluate(
                "() => [...document.querySelectorAll('a')].map(a => a.getAttribute('href')).filter(Boolean).slice(0, 60)"
            )
            print("  havolalar:", json.dumps(sorted(set(links))[:40], ensure_ascii=False))
        except Exception as err:
            print(f"  XATO: {err}")

        print("\n--- URL shakllari sinovi ---")
        for pattern in URL_CANDIDATES:
            url = urljoin(BASE, pattern.format(n=ticket))
            try:
                resp = page.goto(url, wait_until="networkidle", timeout=45000)
                status = resp.status if resp else "?"
                blocks = page_blocks(page)
                body = (page.inner_text("body") or "")[:120].replace("\n", " ")
                print(f"  {url}\n      status={status} rasm bloklari={len(blocks)} matn={body!r}")
                if status == 200 and blocks:
                    print("\n--- Topilgan bloklar (birinchi 3 tasi) ---")
                    for b in blocks[:3]:
                        print(json.dumps(b, ensure_ascii=False, indent=2))
                    print(f"\n==> ISHLAYDIGAN URL SHAKLI: {pattern}")
                    browser.close()
                    return pattern
            except Exception as err:
                print(f"  {url}\n      XATO: {err}")

        browser.close()
    print("\n==> Ishlaydigan URL shakli topilmadi — yuqoridagi havolalar ro'yxatiga qarang.")
    return None


# --- Rejim: --fetch ----------------------------------------------------------
def fetch(url_pattern, tickets=None, threshold=0.90, force=False):
    from playwright.sync_api import sync_playwright

    wanted = load_wanted()
    by_ticket = {}
    for q in wanted:
        by_ticket.setdefault(q["ticket"], []).append(q)
    if tickets:
        by_ticket = {t: qs for t, qs in by_ticket.items() if t in tickets}

    ASSETS.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    mapping, unmatched = {}, []

    with sync_playwright() as pw:
        browser, ctx = new_browser(pw)
        page = ctx.new_page()

        for ticket in sorted(by_ticket):
            questions = by_ticket[ticket]
            url = urljoin(BASE, url_pattern.format(n=ticket))
            print(f"\n=== {ticket}-bilet ({len(questions)} ta savol kerak) — {url}")
            try:
                page.goto(url, wait_until="networkidle", timeout=60000)
                page.wait_for_timeout(1200)
                blocks = page_blocks(page)
            except Exception as err:
                print(f"  XATO: sahifa ochilmadi: {err}")
                unmatched.extend(q["id"] for q in questions)
                continue

            print(f"  sahifada {len(blocks)} ta rasmli blok topildi")

            for q in questions:
                best, best_score = None, 0.0
                for block in blocks:
                    # Savol matni uch tilda bo'lishi mumkin — eng yaxshisini olamiz
                    score = max(similarity(block["text"], t) for t in q["text"].values())
                    if score > best_score:
                        best, best_score = block, score

                if not best or best_score < threshold:
                    print(f"  {q['id']}: mos rasm topilmadi (eng yaxshi moslik {best_score:.2f})")
                    unmatched.append(q["id"])
                    continue

                dest = ASSETS / f"{q['id']}.webp"
                if dest.exists() and not force:
                    print(f"  {q['id']}: fayl allaqachon bor, o'tkazib yuborildi")
                    continue

                if download_webp(ctx, best["src"], dest):
                    mapping[q["id"]] = dest.name
                    print(f"  {q['id']}: OK (moslik {best_score:.2f}) <- {best['src'][:80]}")
                else:
                    unmatched.append(q["id"])

        browser.close()

    (OUT_DIR / "missing-images-map.json").write_text(
        json.dumps(mapping, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"\n=== YAKUN: {len(mapping)} ta rasm olindi, {len(unmatched)} ta topilmadi")
    if unmatched:
        print("Topilmaganlar:", ", ".join(unmatched))
    print(f"Xarita: {OUT_DIR / 'missing-images-map.json'}")
    print("Keyingi qadam: node scripts/apply-image-map.mjs")
    return mapping


def download_webp(ctx, src, dest):
    """
    Rasmni yuklab olib, webp qilib saqlaydi.

    Mavjud rasmlar ham webp (VP8, sayt o'lchamida) — bir xil formatda
    saqlaymiz, aks holda bundle'da ikki xil format aralashib ketadi.
    """
    try:
        resp = ctx.request.get(src, timeout=45000)
        if not resp.ok:
            print(f"      yuklab bo'lmadi: HTTP {resp.status}")
            return False
        data = resp.body()
    except Exception as err:
        print(f"      yuklab bo'lmadi: {err}")
        return False

    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        dest.write_bytes(data)
        return True

    try:
        from PIL import Image
        import io

        img = Image.open(io.BytesIO(data)).convert("RGB")
        img.save(dest, "WEBP", quality=88, method=6)
        return True
    except ImportError:
        print("      Pillow o'rnatilmagan — webp'ga o'girib bo'lmadi (pip install pillow)")
        return False
    except Exception as err:
        print(f"      o'girishda xato: {err}")
        return False


def main():
    ap = argparse.ArgumentParser(description="avto-imtihon.uz dan yetishmayotgan savol rasmlarini olish")
    ap.add_argument("--discover", type=int, metavar="BILET", help="sayt tuzilishini o'rganish")
    ap.add_argument("--fetch", action="store_true", help="rasmlarni yig'ish")
    ap.add_argument("--url-pattern", default=None, help="bilet sahifasi URL shakli, masalan /uz/biletlar/{n}")
    ap.add_argument("--tickets", default=None, help="faqat shu biletlar, masalan 94,95,96")
    ap.add_argument("--threshold", type=float, default=0.90, help="matn moslik chegarasi (0-1)")
    ap.add_argument("--force", action="store_true", help="mavjud fayllarni ham qayta yozish")
    args = ap.parse_args()

    if args.discover:
        found = discover(args.discover)
        sys.exit(0 if found else 1)

    if args.fetch:
        if not args.url_pattern:
            print("XATO: --url-pattern kerak. Avval --discover bilan aniqlang.", file=sys.stderr)
            sys.exit(2)
        tickets = [int(x) for x in args.tickets.split(",")] if args.tickets else None
        fetch(args.url_pattern, tickets, args.threshold, args.force)
        sys.exit(0)

    ap.print_help()


if __name__ == "__main__":
    main()
