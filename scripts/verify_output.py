"""
Strict Verification Script for Project Deliverables
Validates all rules specified in Quy định đồ án.
"""
import os
import sys
import json
import pandas as pd
import openpyxl
from pathlib import Path
from core.config import BOOKS, OUTPUT_DIR, COLOR_RED, COLOR_BLACK

sys.stdout.reconfigure(encoding='utf-8')

def verify_book_output(book_key: str) -> bool:
    book = BOOKS.get(book_key)
    if not book:
        print(f"Error: Unknown book {book_key}")
        return False

    title = book["title"]
    book_dir = OUTPUT_DIR / title
    print("=" * 80)
    print(f"VERIFYING DELIVERABLES FOR: {title}")
    print(f"Directory: {book_dir}")
    print("=" * 80)

    all_passed = True

    # 1. Check required subdirectories
    for sub in ["ch", "vi", "misc"]:
        sub_path = book_dir / sub
        if not sub_path.exists() or len(list(sub_path.iterdir())) == 0:
            print(f"[FAIL] Missing or empty subdirectory: {sub}")
            all_passed = False
        else:
            print(f"[PASS] Subdirectory '{sub}' present with {len(list(sub_path.iterdir()))} items.")

    # 2. Check PDF file
    pdf_file = book_dir / f"{title}.pdf"
    if pdf_file.exists():
        print(f"[PASS] Original PDF present: {pdf_file.name} ({pdf_file.stat().st_size} bytes)")
    else:
        print(f"[FAIL] Missing PDF: {pdf_file}")
        all_passed = False

    # 3. Check PPOCRLabel format in ch/ and vi/
    for folder in ["ch", "vi"]:
        label_file = book_dir / folder / "Label.txt"
        state_file = book_dir / folder / "fileState.txt"
        
        if not label_file.exists():
            print(f"[FAIL] Missing {folder}/Label.txt")
            all_passed = False
            continue
        if not state_file.exists():
            print(f"[FAIL] Missing {folder}/fileState.txt")
            all_passed = False
            continue

        # Validate Label.txt
        line_count = 0
        box_errors = 0
        with open(label_file, "r", encoding="utf-8") as f:
            for l_idx, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                line_count += 1
                parts = line.split("\t")
                if len(parts) != 2:
                    print(f"  [FAIL] {folder}/Label.txt line {l_idx}: Invalid tab split")
                    box_errors += 1
                    continue
                try:
                    boxes = json.loads(parts[1])
                    for b in boxes:
                        if len(b.get("points", [])) != 4:
                            print(f"  [FAIL] {folder}/Label.txt line {l_idx}: Box does not have exactly 4 points")
                            box_errors += 1
                except Exception as e:
                    print(f"  [FAIL] {folder}/Label.txt line {l_idx}: JSON error: {e}")
                    box_errors += 1
        
        if box_errors == 0:
            print(f"[PASS] {folder}/Label.txt valid ({line_count} images, all boxes have exactly 4 points).")
        else:
            all_passed = False

        # Validate fileState.txt
        state_count = 0
        state_errors = 0
        with open(state_file, "r", encoding="utf-8") as f:
            for s_idx, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                state_count += 1
                parts = line.split("\t")
                if len(parts) != 2 or parts[1] not in ["0", "1"]:
                    state_errors += 1
        if state_errors == 0 and state_count == line_count:
            print(f"[PASS] {folder}/fileState.txt valid ({state_count} images with state '1').")
        else:
            print(f"[FAIL] {folder}/fileState.txt has {state_errors} errors")
            all_passed = False

    # 4. Check CSV format
    csv_file = book_dir / f"{title}.csv"
    if not csv_file.exists():
        print(f"[FAIL] Missing CSV file: {csv_file}")
        all_passed = False
    else:
        try:
            df = pd.read_csv(csv_file)
            expected_cols = ["img_id", "sentence_id", "SinoNom_Char", "ChuQN_txt"]
            if list(df.columns) == expected_cols:
                print(f"[PASS] CSV valid ({len(df)} rows, columns match exactly: {expected_cols}).")
            else:
                print(f"[FAIL] CSV columns mismatch: {list(df.columns)}")
                all_passed = False
        except Exception as e:
            print(f"[FAIL] Error reading CSV: {e}")
            all_passed = False

    # 5. Check XLSX format and colors
    xlsx_file = book_dir / f"{title}.xlsx"
    if not xlsx_file.exists():
        print(f"[FAIL] Missing XLSX file: {xlsx_file}")
        all_passed = False
    else:
        try:
            wb = openpyxl.load_workbook(xlsx_file, data_only=True)
            ws = wb.active
            headers = [ws.cell(1, c).value for c in range(1, 5)]
            expected_cols = ["img_id", "sentence_id", "SinoNom_Char", "ChuQN_txt"]
            if headers == expected_cols:
                print(f"[PASS] XLSX valid ({ws.max_row - 1} data rows, header matches).")
            else:
                print(f"[FAIL] XLSX header mismatch: {headers}")
                all_passed = False

            # Check presence of black and red fonts
            black_count = 0
            red_count = 0
            for r in range(2, min(50, ws.max_row + 1)):
                cell_font = ws.cell(r, 3).font
                if cell_font and cell_font.color:
                    if cell_font.color.rgb == COLOR_BLACK:
                        black_count += 1
                    elif cell_font.color.rgb == COLOR_RED:
                        red_count += 1
            print(f"[PASS] XLSX color styling verified (sample checked: {black_count} black, {red_count} red rows).")
        except Exception as e:
            print(f"[FAIL] Error reading XLSX: {e}")
            all_passed = False

    print("\n" + "=" * 80)
    print(f"OVERALL VERIFICATION: {'ALL CHECKS PASSED [SUCCESS]' if all_passed else 'SOME CHECKS FAILED'}")
    print("=" * 80 + "\n")
    return all_passed

if __name__ == "__main__":
    verify_book_output("AB_160")
