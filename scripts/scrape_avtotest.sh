#!/usr/bin/env bash
# ============================================================
# test-avto.uz — barcha biletlar (savol + rasm + javob variantlari
# + to'g'ri javob) ni yig'ib oluvchi skript.
#
# ISHLATISH (Git Bash / Linux / Mac):
#   chmod +x scrape_avtotest.sh
#   ./scrape_avtotest.sh                # barcha 122 ta biletni oladi
#   ./scrape_avtotest.sh 1 5            # faqat 1-5 biletlarni oladi (test uchun)
#
# NATIJA:
#   output/bilet_001/savol_01.png ... savol_10.png  (rasmlar)
#   output/bilet_001/data.json                      (o'sha biletning barcha savol/javoblari)
#   output/all_biletlar.json                         (hammasi birlashtirilgan)
#
# ESLATMA: Sayt Next.js'da client-side render qilinadi, ya'ni
# oddiy curl/wget bilan HTML tortib bo'lmaydi (faqat "Yuklanmoqda..."
# chiqadi). Shu sababli skript Playwright (headless Chrome) orqali
# ishlaydi — sahifani xuddi brauzerdek ochib, JS ishga tushgandan
# keyin DOM'dan ma'lumot o'qiydi.
# ============================================================

set -euo pipefail

BASE_URL="https://test-avto.uz/uz/biletlar"
OUT_DIR="$(pwd)/output"
START="${1:-1}"
END="${2:-122}"

echo "==> Muhit tayyorlanmoqda..."

# --- Python borligini tekshirish ---
if ! command -v python3 &>/dev/null && ! command -v python &>/dev/null; then
    echo "XATO: Python topilmadi. Avval Python 3 o'rnating: https://www.python.org/downloads/"
    exit 1
fi
PY=$(command -v python3 || command -v python)

# --- Virtual environment yaratish (agar bo'lmasa) ---
if [ ! -d "venv" ]; then
    echo "==> venv yaratilmoqda..."
    "$PY" -m venv venv
fi

# Git Bash'da venv activate yo'li Windows uslubida bo'ladi
if [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate      # Windows (Git Bash)
else
    source venv/bin/activate          # Linux / Mac
fi

echo "==> Kerakli kutubxonalar o'rnatilmoqda (birinchi marta biroz vaqt oladi)..."
pip install --quiet --upgrade pip || true
pip install --quiet playwright
python -m playwright install chromium --with-deps >/dev/null 2>&1 || python -m playwright install chromium

mkdir -p "$OUT_DIR"

echo "==> Scraping boshlanmoqda: bilet $START dan $END gacha"

python - "$BASE_URL" "$OUT_DIR" "$START" "$END" << 'PYEOF'
import sys, json, os, re, time, urllib.request
from playwright.sync_api import sync_playwright

base_url, out_dir, start, end = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])

all_data = {}

def clean_text(t):
    return re.sub(r'\s+', ' ', (t or '')).strip()

def download_image(url, path):
    try:
        if url.startswith('//'):
            url = 'https:' + url
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=20) as r, open(path, 'wb') as f:
            f.write(r.read())
        return True
    except Exception as e:
        print(f"    [!] Rasm yuklanmadi: {url} ({e})")
        return False

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900})

    for bilet_no in range(start, end + 1):
        url = f"{base_url}/{bilet_no}"
        print(f"\n=== Bilet {bilet_no} === {url}")
        bilet_dir = os.path.join(out_dir, f"bilet_{bilet_no:03d}")
        os.makedirs(bilet_dir, exist_ok=True)

        try:
            page.goto(url, wait_until="networkidle", timeout=30000)
        except Exception as e:
            print(f"  [!] Sahifa ochilmadi: {e}")
            continue

        # Savol matni chiqishini kutamiz (client-side render tugashi)
        try:
            page.wait_for_selector("h2", timeout=15000)
        except Exception:
            print("  [!] Savol matni topilmadi, o'tkazib yuborilmoqda")
            continue

        bilet_questions = []

        for q_no in range(1, 11):
            time.sleep(0.4)  # render uchun kichik pauza

            # --- Savol matnini olish ---
            question_text = ""
            try:
                # sahifadagi eng katta/asosiy h2 savol matni bo'ladi
                h2_elements = page.query_selector_all("h2")
                candidates = [clean_text(h.inner_text()) for h in h2_elements]
                candidates = [c for c in candidates if len(c) > 5]
                question_text = candidates[0] if candidates else ""
            except Exception:
                pass

            # --- Rasmni olish (agar mavjud bo'lsa) ---
            image_saved = None
            try:
                imgs = page.query_selector_all("img")
                for img in imgs:
                    src = img.get_attribute("src") or ""
                    # ehtimol logotip/ikonka emas, savol rasmi kattaroq va /uploads yoki /images bo'ladi
                    if src and not any(x in src.lower() for x in ["logo", "icon", "avatar", "og-image"]):
                        img_path = os.path.join(bilet_dir, f"savol_{q_no:02d}.png")
                        full_src = src
                        if full_src.startswith("/"):
                            full_src = "https://test-avto.uz" + full_src
                        if download_image(full_src, img_path):
                            image_saved = os.path.relpath(img_path, out_dir)
                        break
            except Exception:
                pass

            # --- Javob variantlarini olish ---
            # Ekrandagi variant tugmalari odatda button yoki katta div bo'ladi
            option_texts = []
            option_elements = []
            try:
                buttons = page.query_selector_all("button")
                for b in buttons:
                    txt = clean_text(b.inner_text())
                    if txt and len(txt) > 1 and txt not in ("Keyingi savol", "Izohni ko'rish"):
                        option_texts.append(txt)
                        option_elements.append(b)
            except Exception:
                pass

            # --- To'g'ri javobni aniqlash: birinchi variantni bosib,
            #     pastda chiqadigan yashil "to'g'ri javob" boxini o'qiymiz ---
            correct_answer = ""
            try:
                before_html = page.content()
                if option_elements:
                    option_elements[0].click()
                    page.wait_for_timeout(700)
                    after_html = page.content()

                    # Sahifadagi barcha matn bloklarini solishtirib,
                    # yangi paydo bo'lgan (yashil) blokni topamiz
                    all_divs = page.query_selector_all("div")
                    best_match = ""
                    for d in all_divs:
                        txt = clean_text(d.inner_text())
                        cls = (d.get_attribute("class") or "").lower()
                        if ("green" in cls or "61d17d" in cls or "4fab67" in cls or "22c55e" in cls) and txt:
                            if len(txt) > len(best_match) and len(txt) < 300:
                                best_match = txt
                    correct_answer = best_match
            except Exception as e:
                print(f"    [!] To'g'ri javob aniqlanmadi: {e}")

            bilet_questions.append({
                "savol_raqami": q_no,
                "savol_matni": question_text,
                "rasm": image_saved,
                "variantlar": option_texts,
                "togri_javob": correct_answer,
            })

            print(f"  Savol {q_no}: {question_text[:50]}...")

            # --- Keyingi savolga o'tish ---
            if q_no < 10:
                try:
                    next_btn = page.query_selector("button:has-text('Keyingi savol')")
                    if next_btn:
                        next_btn.click()
                        page.wait_for_timeout(600)
                    else:
                        print("    [!] 'Keyingi savol' tugmasi topilmadi")
                        break
                except Exception as e:
                    print(f"    [!] Keyingi savolga o'tib bo'lmadi: {e}")
                    break

        all_data[f"bilet_{bilet_no}"] = bilet_questions

        with open(os.path.join(bilet_dir, "data.json"), "w", encoding="utf-8") as f:
            json.dump(bilet_questions, f, ensure_ascii=False, indent=2)

    browser.close()

with open(os.path.join(out_dir, "all_biletlar.json"), "w", encoding="utf-8") as f:
    json.dump(all_data, f, ensure_ascii=False, indent=2)

print("\n==> Tugadi. Natijalar 'output/' papkasida.")
PYEOF

echo ""
echo "==> Barcha ma'lumotlar '$OUT_DIR' papkasiga saqlandi."
