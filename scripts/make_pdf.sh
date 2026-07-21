#!/usr/bin/env bash
# ============================================================
# scrape_avtotest.sh orqali yig'ilgan output/ papkasidagi
# ma'lumotlardan (all_biletlar.json + rasmlar) bitta chiroyli
# PDF yasaydi.
#
# ISHLATISH (avval scrape_avtotest.sh ishlatilgan bo'lishi kerak):
#   chmod +x make_pdf.sh
#   ./make_pdf.sh
#
# NATIJA:
#   output/Avto_Test_Barcha_Biletlar.pdf
# ============================================================

set -euo pipefail

OUT_DIR="$(pwd)/output"
JSON_FILE="$OUT_DIR/all_biletlar.json"

if [ ! -f "$JSON_FILE" ]; then
    echo "XATO: '$JSON_FILE' topilmadi."
    echo "Avval scrape_avtotest.sh ni ishga tushiring va shu papkada turib buni ishlating."
    exit 1
fi

# --- venv borligini tekshirish / yaratish ---
if [ ! -d "venv" ]; then
    PY=$(command -v python3 || command -v python)
    "$PY" -m venv venv
fi

if [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

echo "==> reportlab o'rnatilmoqda..."
pip install --quiet reportlab

python - "$OUT_DIR" "$JSON_FILE" << 'PYEOF'
import sys, json, os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak,
    Table, TableStyle, KeepTogether
)

out_dir, json_file = sys.argv[1], sys.argv[2]

with open(json_file, "r", encoding="utf-8") as f:
    data = json.load(f)

pdf_path = os.path.join(out_dir, "Avto_Test_Barcha_Biletlar.pdf")

styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    "TitleUZ", parent=styles["Title"], fontSize=22, spaceAfter=20
)
bilet_style = ParagraphStyle(
    "BiletHeading", parent=styles["Heading1"], fontSize=16,
    spaceBefore=10, spaceAfter=10, textColor=colors.HexColor("#1F2937")
)
question_style = ParagraphStyle(
    "Question", parent=styles["Normal"], fontSize=12, leading=16,
    spaceAfter=8, fontName="Helvetica-Bold"
)
option_style = ParagraphStyle(
    "Option", parent=styles["Normal"], fontSize=11, leading=15,
    spaceAfter=3, leftIndent=10
)
correct_option_style = ParagraphStyle(
    "CorrectOption", parent=option_style,
    textColor=colors.HexColor("#15803D"), fontName="Helvetica-Bold",
    backColor=colors.HexColor("#DCFCE7"), leftIndent=10, spaceAfter=3,
    borderPadding=4,
)
answer_box_style = ParagraphStyle(
    "AnswerBox", parent=styles["Normal"], fontSize=11, leading=15,
    textColor=colors.HexColor("#15803D"), fontName="Helvetica-Bold",
    spaceBefore=6, spaceAfter=14,
)

doc = SimpleDocTemplate(
    pdf_path, pagesize=A4,
    topMargin=1.5*cm, bottomMargin=1.5*cm,
    leftMargin=1.8*cm, rightMargin=1.8*cm,
)

story = []
story.append(Paragraph("Avto Test — Barcha Biletlar", title_style))
story.append(Paragraph(
    f"Jami biletlar soni: {len(data)}",
    styles["Normal"]
))
story.append(PageBreak())

def norm_option(text, correct_text):
    text_c = (text or "").strip()
    correct_c = (correct_text or "").strip()
    is_correct = bool(correct_c) and (text_c == correct_c or text_c in correct_c or correct_c in text_c)
    return is_correct

for bilet_key in sorted(data.keys(), key=lambda k: int(k.split("_")[1])):
    bilet_no = bilet_key.split("_")[1]
    questions = data[bilet_key]

    story.append(Paragraph(f"Bilet {bilet_no}", bilet_style))
    story.append(Spacer(1, 6))

    for q in questions:
        block = []

        q_no = q.get("savol_raqami", "?")
        q_text = q.get("savol_matni", "").strip()
        img_rel = q.get("rasm")
        options = q.get("variantlar", [])
        correct = q.get("togri_javob", "").strip()

        block.append(Paragraph(f"{q_no}. {q_text}", question_style))

        if img_rel:
            img_path = os.path.join(out_dir, img_rel)
            if os.path.exists(img_path):
                try:
                    img = Image(img_path)
                    max_w, max_h = 12*cm, 7*cm
                    ratio = min(max_w / img.imageWidth, max_h / img.imageHeight, 1)
                    img.drawWidth = img.imageWidth * ratio
                    img.drawHeight = img.imageHeight * ratio
                    block.append(img)
                    block.append(Spacer(1, 6))
                except Exception:
                    pass

        for opt in options:
            is_correct = norm_option(opt, correct)
            style = correct_option_style if is_correct else option_style
            prefix = "✔ " if is_correct else "• "
            block.append(Paragraph(prefix + opt, style))

        if correct:
            block.append(Paragraph(f"To'g'ri javob: {correct}", answer_box_style))
        else:
            block.append(Spacer(1, 14))

        story.append(KeepTogether(block))

    story.append(PageBreak())

doc.build(story)
print(f"\n==> PDF tayyor: {pdf_path}")
PYEOF
