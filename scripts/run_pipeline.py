"""
Master Pipeline Script for Automated Parallel Corpus Construction
Integrates all modules: Preprocessing -> Alignment -> Cleaning -> Evaluation -> Export
"""
import os
import sys
import shutil
import argparse
from pathlib import Path
from core.config import BOOKS, OUTPUT_DIR, DATASETS_MIDTERM_DIR, MIN_SIMILARITY_THRESHOLD
from core.preprocess import DocumentPreprocessor
from core.aligner import SentenceAligner
from core.cleaner import PPOCRLabelFormatter, TextCleaner
from core.evaluator import AlignmentEvaluator
from core.exporter import CorpusExporter

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def run_book_pipeline(book_key: str):
    book = BOOKS.get(book_key)
    if not book:
        print(f"Error: Unknown book key {book_key}")
        return False

    title = book["title"]
    print("=" * 80)
    print(f"RUNNING PIPELINE FOR: {title}")
    print("=" * 80)

    pdf_path = DATASETS_MIDTERM_DIR / "pdf" / book["pdf_filename"]
    csv_path = DATASETS_MIDTERM_DIR / "csv" / book["csv_filename"]

    if not pdf_path.exists():
        print(f"Error: PDF not found at {pdf_path}")
        return False
    if not csv_path.exists():
        print(f"Error: CSV not found at {csv_path}")
        return False

    book_out_dir = OUTPUT_DIR / title
    preprocessor = DocumentPreprocessor(book, OUTPUT_DIR)

    # ---------------------------------------------------------
    # STEP 1: PDF SPLITTING & PAGE CLASSIFICATION
    # ---------------------------------------------------------
    print("\n--- STEP 1: Extracting and Classifying Pages ---")
    extracted_pages = preprocessor.split_and_extract_images(str(pdf_path))
    print(f"Extracted {len(extracted_pages)} total pages.")

    content_images = []
    blank_images = []
    misc_images = []

    for page_num, img_name, img_path in extracted_pages:
        category = preprocessor.classify_page(img_path, page_num, len(extracted_pages))
        if category == "content":
            content_images.append((page_num, img_name, img_path))
            # Copy to ch/ and vi/
            shutil.copy2(str(img_path), str(preprocessor.dir_ch / img_name))
            shutil.copy2(str(img_path), str(preprocessor.dir_vi / img_name))
        elif category == "blank":
            blank_images.append((page_num, img_name, img_path))
            shutil.copy2(str(img_path), str(preprocessor.dir_blank / img_name))
        else:
            misc_images.append((page_num, img_name, img_path))
            shutil.copy2(str(img_path), str(preprocessor.dir_misc / img_name))

    print(f"Classification: Content={len(content_images)}, Blank={len(blank_images)}, Misc={len(misc_images)}")

    # Copy original PDF to book directory
    shutil.copy2(str(pdf_path), str(book_out_dir / f"{title}.pdf"))

    # ---------------------------------------------------------
    # STEP 2: BILINGUAL SENTENCE ALIGNMENT & RESTORATION
    # ---------------------------------------------------------
    print("\n--- STEP 2: Bilingual Sentence Alignment & Reconstruction ---")
    aligner = SentenceAligner(book, csv_path)
    aligned_records = aligner.align_book_data()
    print(f"Aligned {len(aligned_records)} sentence pairs.")

    # ---------------------------------------------------------
    # STEP 3: SEGMENTATION & PPOCRLABEL GENERATION
    # ---------------------------------------------------------
    print("\n--- STEP 3: Generating PPOCRLabel Annotations (ch/ & vi/) ---")
    # Group aligned sentences by image
    ch_labels_by_img = {}
    vi_labels_by_img = {}

    # Map aligned text by page
    page_to_records = {}
    for r in aligned_records:
        img_id = r["img_id"]
        if img_id not in page_to_records:
            page_to_records[img_id] = []
        page_to_records[img_id].append(r)

    for page_num, img_name, img_path in content_images:
        seg_res = preprocessor.segment_t2b_lines(img_path)
        ch_boxes = seg_res["ch"]
        vi_boxes = seg_res["vi"]

        # Match with aligned records for this page
        recs_for_page = page_to_records.get(img_name, [])

        # Assign Nôm text to CH boxes
        ch_annotated = []
        for b_idx, box in enumerate(ch_boxes):
            text = recs_for_page[b_idx]["SinoNom_Char"] if b_idx < len(recs_for_page) else ""
            ch_annotated.append({
                "transcription": text,
                "points": box["points"]
            })
        ch_labels_by_img[img_name] = ch_annotated

        # Assign Quốc ngữ text to VI boxes
        vi_annotated = []
        for b_idx, box in enumerate(vi_boxes):
            text = recs_for_page[b_idx]["ChuQN_txt"] if b_idx < len(recs_for_page) else ""
            vi_annotated.append({
                "transcription": text,
                "points": box["points"]
            })
        vi_labels_by_img[img_name] = vi_annotated

    PPOCRLabelFormatter.write_ppocr_dataset(preprocessor.dir_ch, "ch", ch_labels_by_img)
    PPOCRLabelFormatter.write_ppocr_dataset(preprocessor.dir_vi, "vi", vi_labels_by_img)

    # ---------------------------------------------------------
    # STEP 4: QUALITY EVALUATION & SIMILARITY SCORING
    # ---------------------------------------------------------
    print("\n--- STEP 4: Evaluating Alignment & Similarity Metric ---")
    evaluator = AlignmentEvaluator()
    eval_report = evaluator.evaluate_dataset(aligned_records)

    print(f"Total Evaluated Characters : {eval_report['total_chars']}")
    print(f"Total Matched (Black) Chars: {eval_report['total_black_chars']}")
    print(f"Total Mismatched (Red) Chars: {eval_report['total_red_chars']}")
    print(f"Similarity Percentage      : {eval_report['similarity_percentage']:.2f}%")
    print(f"Requirement Passed (>=95%) : {'YES [PASSED]' if eval_report['is_passed'] else 'NO [FAILED]'}")

    # ---------------------------------------------------------
    # STEP 5: EXPORT XLSX (COLOR-CODED) & CSV
    # ---------------------------------------------------------
    print("\n--- STEP 5: Exporting CSV & Color-coded XLSX ---")
    out_csv = book_out_dir / f"{title}.csv"
    out_xlsx = book_out_dir / f"{title}.xlsx"

    CorpusExporter.export_csv(aligned_records, out_csv)
    CorpusExporter.export_xlsx(aligned_records, eval_report["row_evaluations"], out_xlsx)

    print("\n" + "=" * 80)
    print(f"PIPELINE COMPLETED SUCCESSFULLY FOR: {title}")
    print(f"Output files stored in: {book_out_dir}")
    print("=" * 80 + "\n")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Parallel Corpus Construction Pipeline")
    parser.add_argument("--book", type=str, default="AB_160", choices=list(BOOKS.keys()) + ["all"],
                        help="Book to process (default: AB_160, or 'all')")
    args = parser.parse_args()

    if args.book == "all":
        for k in BOOKS.keys():
            run_book_pipeline(k)
    else:
        run_book_pipeline(args.book)
