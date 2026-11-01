import os
import json
import zipfile
from pathlib import Path
from typing import Dict, Any, List, Tuple
import pandas as pd

from app.core.config import settings
from app.services.evaluator_service import evaluator_service

class ExportService:
    def __init__(self):
        pass

    def validate_deliverable_structure(self, book_dir: Path, book_name: str, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Validate all strict academic criteria before packaging.
        """
        checks = []

        # 1. Folder structure check
        required_dirs = ["ch", "vi", "misc", "blank"]
        dirs_ok = True
        missing_dirs = []
        for d in required_dirs:
            if not (book_dir / d).is_dir():
                dirs_ok = False
                missing_dirs.append(d)
        
        checks.append({
            "name": "Directory Structure (ch, vi, misc, blank)",
            "passed": dirs_ok,
            "detail": "All 4 required folders present" if dirs_ok else f"Missing directories: {missing_dirs}"
        })

        # 2. PPOCRLabel files in ch/ and vi/
        ppocr_ok = True
        missing_files = []
        for d in ["ch", "vi"]:
            for f in ["Label.txt", "fileState.txt"]:
                target = book_dir / d / f
                if not target.exists():
                    ppocr_ok = False
                    missing_files.append(f"{d}/{f}")
        
        checks.append({
            "name": "PPOCRLabel Files (Label.txt & fileState.txt)",
            "passed": ppocr_ok,
            "detail": "All Label.txt and fileState.txt present" if ppocr_ok else f"Missing: {missing_files}"
        })

        # 3. Strictly 4 points for all bounding boxes in Label.txt
        points_strict_4 = True
        bad_box_count = 0
        for d in ["ch", "vi"]:
            lbl_file = book_dir / d / "Label.txt"
            if lbl_file.exists():
                with open(lbl_file, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        parts = line.split("\t")
                        if len(parts) >= 2:
                            try:
                                boxes = json.loads(parts[1])
                                for b in boxes:
                                    pts = b.get("points", [])
                                    if len(pts) != 4:
                                        points_strict_4 = False
                                        bad_box_count += 1
                            except Exception:
                                points_strict_4 = False
                                bad_box_count += 1

        checks.append({
            "name": "Strict 4-Point Bounding Box Polygon Format",
            "passed": points_strict_4,
            "detail": "All bounding boxes have strictly 4 coordinates" if points_strict_4 else f"{bad_box_count} boxes have non-4 coordinates"
        })

        # 4. CSV and XLSX existence
        csv_file = book_dir / f"{book_name}.csv"
        xlsx_file = book_dir / f"{book_name}.xlsx"
        files_exist = csv_file.exists() and xlsx_file.exists()
        checks.append({
            "name": "Corpus Files (<Book_Name>.csv & .xlsx)",
            "passed": files_exist,
            "detail": "Both CSV (UTF-8 BOM) and styled Excel files present" if files_exist else "CSV or XLSX missing"
        })

        # 5. Strict 4 columns verification
        columns_ok = True
        if csv_file.exists():
            try:
                df = pd.read_csv(csv_file, encoding="utf-8-sig", nrows=2)
                expected_cols = ["img_id", "sentence_id", "SinoNom_Char", "ChuQN_txt"]
                if list(df.columns) != expected_cols:
                    columns_ok = False
            except Exception:
                columns_ok = False

        checks.append({
            "name": "Strict 4 Columns Schema (img_id, sentence_id, SinoNom_Char, ChuQN_txt)",
            "passed": columns_ok,
            "detail": "4 columns strictly match academic schema" if columns_ok else "Column header mismatch in CSV"
        })

        # 6. Similarity score threshold >= 95%
        sim_eval = evaluator_service.compute_similarity(records)
        score = sim_eval["similarityScore"]
        score_passed = sim_eval["isSimilarityPassed"]
        checks.append({
            "name": "Similarity Metric Threshold (>= 95.0%)",
            "passed": score_passed,
            "detail": f"Current similarity score: {score:.2f}% (Threshold: >= 95.0%)"
        })

        is_valid = all(c["passed"] for c in checks)
        return {
            "isValid": is_valid,
            "similarityScore": score,
            "isSimilarityPassed": score_passed,
            "checks": checks
        }

    def package_deliverable_zip(self, book_dir: Path, book_name: str, student_ids: List[str], output_zip_path: Path) -> Path:
        """
        Package book into <MSSV1_MSSV2...>.zip with root directory named <Book_Name>.
        """
        output_zip_path.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(output_zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(book_dir):
                for file in files:
                    file_full = Path(root) / file
                    rel_path = Path(book_name) / file_full.relative_to(book_dir)
                    zipf.write(file_full, arcname=str(rel_path))

        return output_zip_path

export_service = ExportService()
