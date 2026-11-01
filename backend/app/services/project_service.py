import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd

from app.core.config import settings
from app.services.evaluator_service import evaluator_service

class ProjectDataStore:
    """
    In-memory and disk-backed store for active project, pages, alignment records, and bounding boxes.
    Provides fast sub-millisecond retrieval with live phonetic verification on mutations.
    """
    def __init__(self):
        self.project_id = "proj_ab160_midterm"
        self.book_key = "AB_160"
        self.book_name = "Ca Trù Thê Cách, AB 160, Nôm_Y"
        self.student_ids = ["21120001", "21120002"]
        self.total_pages = 45
        self.records: List[Dict[str, Any]] = []
        self.boxes: Dict[int, List[Dict[str, Any]]] = {}
        self._load_dataset()

    def _load_dataset(self):
        book_dir = settings.OUTPUT_DIR / self.book_name
        csv_file = book_dir / f"{self.book_name}.csv"
        
        if csv_file.exists():
            df = pd.read_csv(csv_file, encoding="utf-8-sig")
            raw_records = df.to_dict("records")
            
            # Evaluate with dictionary
            eval_res = evaluator_service.evaluator.evaluate_dataset(raw_records)
            
            self.records = []
            for idx, (r, ev) in enumerate(zip(raw_records, eval_res["row_evaluations"]), 1):
                try:
                    p_num = int(r["img_id"].split(".")[-2])
                except Exception:
                    p_num = 1

                char_statuses = []
                for item in ev.get("char_statuses", []):
                    ch, is_m = item[0], item[1]
                    reason = item[2] if len(item) > 2 else ("matched" if is_m else "not_in_dict")
                    char_statuses.append({
                        "char": ch,
                        "isMatched": is_m,
                        "color": "BLACK" if is_m else "RED",
                        "reason": reason
                    })

                is_matched = ev["mismatched_chars"] == 0
                self.records.append({
                    "id": f"rec_{idx}",
                    "img_id": r["img_id"],
                    "sentence_id": r["sentence_id"],
                    "SinoNom_Char": r["SinoNom_Char"],
                    "ChuQN_txt": r["ChuQN_txt"],
                    "pageNumber": p_num,
                    "lineIndex": idx,
                    "isMatched": is_matched,
                    "color": "BLACK" if is_matched else "RED",
                    "charStatuses": char_statuses,
                    "reviewStatus": "approved" if is_matched else "pending",
                    "editorNote": ""
                })

        # Load PPOCRLabel bounding boxes
        ch_label = book_dir / "ch" / "Label.txt"
        vi_label = book_dir / "vi" / "Label.txt"
        
        self.boxes = {}
        for p in range(1, self.total_pages + 1):
            self.boxes[p] = []

        self._load_boxes_from_label_file(ch_label, "ch")
        self._load_boxes_from_label_file(vi_label, "vi")

    def _load_boxes_from_label_file(self, label_path: Path, r_type: str):
        if not label_path.exists():
            return
        with open(label_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                parts = line.split("\t")
                if len(parts) >= 2:
                    img_name = parts[0]
                    try:
                        p_num = int(img_name.split(".")[-2])
                    except Exception:
                        continue

                    try:
                        raw_boxes = json.loads(parts[1])
                        for b_idx, b in enumerate(raw_boxes):
                            sentence_id = f"{self.book_name}.{p_num:03d}.{b_idx + 1}"
                            rec = next((r for r in self.records if r["sentence_id"] == sentence_id), None)
                            is_mismatch = rec["color"] == "RED" if rec else False

                            box_obj = {
                                "id": f"box_{r_type}_{p_num}_{b_idx}",
                                "img_id": img_name,
                                "sentence_id": sentence_id,
                                "region_type": r_type,
                                "transcription": b.get("transcription", ""),
                                "points": b.get("points", []),
                                "status": "mismatched" if is_mismatch else "matched"
                            }
                            if p_num in self.boxes:
                                self.boxes[p_num].append(box_obj)
                    except Exception:
                        pass

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "id": self.project_id,
            "name": self.book_name,
            "bookName": self.book_name,
            "studentIds": self.student_ids,
            "originalPdfName": f"{self.book_name}.pdf",
            "originalPdfSize": 9989975,
            "totalPages": self.total_pages,
            "status": "READY",
            "createdAt": "2026-10-31T23:00:00Z",
            "updatedAt": "2026-11-01T01:00:00Z"
        }

    def get_pages(self) -> List[Dict[str, Any]]:
        pages = []
        for i in range(1, self.total_pages + 1):
            page_id = f"{i:03d}"
            is_misc = i in [1, 2, 45]
            category = "misc" if is_misc else "content"
            img_name = f"{self.book_name}.{page_id}.jpg"
            folder = "misc" if is_misc else "ch"
            img_url = f"/static/output/{self.book_name}/{folder}/{img_name}"

            recs_for_page = [r for r in self.records if r["pageNumber"] == i]
            mismatches = len([r for r in recs_for_page if r["color"] == "RED"])

            pages.append({
                "pageNumber": i,
                "pageId": page_id,
                "imgName": img_name,
                "imageUrl": img_url,
                "category": category,
                "reviewStatus": "has_issues" if mismatches > 0 else "approved",
                "width": 1400,
                "height": 1800,
                "detectedChRegions": len(recs_for_page),
                "detectedViRegions": len(recs_for_page),
                "mismatchedCount": mismatches
            })
        return pages

    def get_annotations_for_page(self, page_num: int) -> List[Dict[str, Any]]:
        return self.boxes.get(page_num, [])

    def update_alignment(self, record_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        rec = next((r for r in self.records if r["id"] == record_id or r["sentence_id"] == record_id), None)
        if not rec:
            return None

        if "SinoNom_Char" in updates and updates["SinoNom_Char"] is not None:
            rec["SinoNom_Char"] = updates["SinoNom_Char"]
        if "ChuQN_txt" in updates and updates["ChuQN_txt"] is not None:
            rec["ChuQN_txt"] = updates["ChuQN_txt"]
        if "reviewStatus" in updates and updates["reviewStatus"] is not None:
            rec["reviewStatus"] = updates["reviewStatus"]
        if "editorNote" in updates and updates["editorNote"] is not None:
            rec["editorNote"] = updates["editorNote"]

        # Live re-evaluation
        eval_result = evaluator_service.evaluate_pair(rec["SinoNom_Char"], rec["ChuQN_txt"])
        rec["isMatched"] = eval_result["isMatched"]
        rec["color"] = eval_result["color"]
        rec["charStatuses"] = eval_result["charStatuses"]
        rec["isEdited"] = True
        return rec

    def update_box(self, box_id: str, points: List[List[int]], transcription: Optional[str] = None) -> Optional[Dict[str, Any]]:
        for p_num, b_list in self.boxes.items():
            for b in b_list:
                if b["id"] == box_id:
                    b["points"] = points
                    if transcription is not None:
                        b["transcription"] = transcription
                    b["isModified"] = True
                    return b
        return None

    def get_metrics(self) -> Dict[str, Any]:
        sim_calc = evaluator_service.compute_similarity(self.records)
        total_chars = sim_calc["totalChars"]
        mismatched_chars = sim_calc["mismatchedChars"]
        score = sim_calc["similarityScore"]
        is_passed = sim_calc["isSimilarityPassed"]

        return {
            "totalPages": self.total_pages,
            "processedPages": self.total_pages,
            "totalAlignedPairs": len(self.records),
            "totalSinoNomChars": total_chars,
            "totalVietnameseWords": sum(len(r["ChuQN_txt"].split()) for r in self.records),
            "validatedPairs": len([r for r in self.records if r["reviewStatus"] == "approved"]),
            "mismatchedChars": mismatched_chars,
            "pendingReviews": len([r for r in self.records if r["reviewStatus"] == "pending"]),
            "similarityScore": score,
            "isSimilarityPassed": is_passed
        }

project_store = ProjectDataStore()
