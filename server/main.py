"""
FastAPI Backend Server for Human-in-the-Loop Web Studio
Integrates with core/ modules for OCR, Alignment, Dictionary Verification and Deliverable Packaging.
Includes Cloud API integration with KimHanNom OCR & Transliteration service.
"""
import os
import sys
import json
import shutil
import zipfile
from pathlib import Path
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Add project root to sys.path
sys.path.append(os.path.abspath("."))
from core.config import BOOKS, OUTPUT_DIR, DATASETS_MIDTERM_DIR, COLOR_BLACK, COLOR_RED
from core.evaluator import AlignmentEvaluator
from core.dictionary import HanNomDictionary
from core.exporter import CorpusExporter
from core.api_client import KimHanNomClient
from core.classifier import BookClassifier
from scripts.run_pipeline import run_book_pipeline

app = FastAPI(
    title="Human-in-the-Loop Web Studio API",
    description="Backend API for Sino-Nom Parallel Corpus Processing and Verification",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session state for active project
class ProjectState:
    def __init__(self):
        self.project_id = "proj_ab160_midterm"
        self.book_key = "AB_160"
        self.book_name = BOOKS.get(self.book_key, {}).get("title", "Ca Trù Thê Cách, AB 160, Nôm_Y")
        self.student_ids = ["PROJECT_DEV_01", "PROJECT_DEV_02"]
        self.total_pages = BOOKS.get(self.book_key, {}).get("total_pages", 45)
        self.records: List[Dict[str, Any]] = []
        self.boxes: List[Dict[str, Any]] = []
        self.evaluator = AlignmentEvaluator()
        self._load_initial_data()

    def set_book(self, book_key: str):
        if book_key not in BOOKS:
            raise ValueError(f"Unknown book key: {book_key}")
        self.book_key = book_key
        self.book_name = BOOKS[book_key]["title"]
        self.total_pages = BOOKS[book_key]["total_pages"]
        self._load_initial_data()

    def _load_initial_data(self):
        csv_file = OUTPUT_DIR / self.book_name / f"{self.book_name}.csv"
        if csv_file.exists():
            import pandas as pd
            df = pd.read_csv(csv_file, encoding="utf-8-sig")
            raw_records = df.to_dict("records")
            eval_res = self.evaluator.evaluate_dataset(raw_records)

            self.records = []
            for idx, (r, ev) in enumerate(zip(raw_records, eval_res["row_evaluations"]), 1):
                try:
                    p_num = int(r["img_id"].split(".")[-2])
                except Exception:
                    p_num = 1

                char_statuses = []
                for item in ev.get("char_statuses", []):
                    ch, is_m, reason = item[0], item[1], item[2] if len(item) > 2 else "matched"
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
        else:
            self.records = []

state = ProjectState()

# Mount output images for direct browser viewing
if OUTPUT_DIR.exists():
    app.mount("/static/output", StaticFiles(directory=str(OUTPUT_DIR)), name="output")

# Pydantic Schemas
class ProjectCreateRequest(BaseModel):
    bookName: str
    studentIds: List[str]

class AlignmentUpdateRequest(BaseModel):
    SinoNom_Char: Optional[str] = None
    ChuQN_txt: Optional[str] = None
    reviewStatus: Optional[str] = None
    editorNote: Optional[str] = None

class AnnotationUpdateRequest(BaseModel):
    points: List[List[int]]
    transcription: Optional[str] = None

class PipelineRunRequest(BaseModel):
    book_key: Optional[str] = "AB_160"
    enable_cloud_ocr: Optional[bool] = False

class SwitchBookRequest(BaseModel):
    book_key: str

# --- API Endpoints ---

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "Human-in-the-Loop Web Studio API",
        "active_book": state.book_name,
        "total_records": len(state.records)
    }

@app.get("/api/books")
def get_books_list():
    return [
        {
            "key": k,
            "title": v["title"],
            "total_pages": v["total_pages"],
            "pdf_filename": v["pdf_filename"],
            "csv_filename": v["csv_filename"]
        }
        for k, v in BOOKS.items()
    ]

@app.post("/api/projects/switch-book")
@app.post("/api/projects/{project_id}/switch-book")
def switch_book_endpoint(payload: SwitchBookRequest):
    if payload.book_key not in BOOKS:
        raise HTTPException(status_code=400, detail=f"Unknown book key: {payload.book_key}")
    state.set_book(payload.book_key)
    return {
        "status": "success",
        "book_key": state.book_key,
        "book_name": state.book_name,
        "total_pages": state.total_pages,
        "records_count": len(state.records)
    }

@app.post("/api/pipeline/classify-book")
@app.post("/api/books/classify")
async def classify_book_endpoint(
    file: Optional[UploadFile] = File(None),
    book_key: Optional[str] = Form(None),
    pdf_path: Optional[str] = Form(None)
):
    """Classify uploaded manuscript PDF into official taxonomy categories (Quy_định_đồ_án.pdf)."""
    target_path = None
    try:
        if file and file.filename:
            temp_dir = Path("output/temp_uploads")
            temp_dir.mkdir(parents=True, exist_ok=True)
            save_path = temp_dir / file.filename
            with open(save_path, "wb") as f_out:
                content = await file.read()
                f_out.write(content)
            target_path = str(save_path)
        elif book_key and book_key in BOOKS:
            target_path = str(DATASETS_MIDTERM_DIR / "pdf" / BOOKS[book_key]["pdf_filename"])
        elif pdf_path and Path(pdf_path).exists():
            target_path = pdf_path
        else:
            target_path = str(DATASETS_MIDTERM_DIR / "pdf" / BOOKS[state.book_key]["pdf_filename"])

        classifier = BookClassifier()
        report = classifier.classify(target_path)
        return {
            "status": "success",
            "pdf_name": Path(target_path).name,
            **report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Book classification error: {str(e)}")

@app.post("/api/pipeline/run")
@app.post("/api/projects/{project_id}/pipeline/run")
def run_pipeline_endpoint(payload: PipelineRunRequest = PipelineRunRequest()):
    book_key = payload.book_key or state.book_key
    if book_key not in BOOKS:
        raise HTTPException(status_code=400, detail=f"Unknown book key: {book_key}")

    success = run_book_pipeline(book_key)
    if not success:
        raise HTTPException(status_code=500, detail=f"Pipeline execution failed for {book_key}")

    state.set_book(book_key)
    return {
        "status": "success",
        "message": f"Pipeline completed successfully for {state.book_name}",
        "book_key": book_key,
        "book_name": state.book_name,
        "records_count": len(state.records),
        "total_pages": state.total_pages
    }

@app.post("/api/pipeline/ocr-transliterate")
@app.post("/api/ocr/recognize")
async def ocr_transliterate_endpoint(
    file: Optional[UploadFile] = File(None),
    page_num: Optional[int] = Form(None),
    book_key: Optional[str] = Form(None)
):
    """End-to-end OCR and transliteration via KimHanNom Cloud API."""
    target_img_path = None

    try:
        if file and file.filename:
            temp_dir = Path("output/temp_uploads")
            temp_dir.mkdir(parents=True, exist_ok=True)
            temp_path = temp_dir / file.filename
            with open(temp_path, "wb") as f_out:
                content = await file.read()
                f_out.write(content)
            target_img_path = str(temp_path)
        elif page_num is not None:
            b_key = book_key or state.book_key
            b_name = BOOKS.get(b_key, {}).get("title", state.book_name)
            img_name = f"{b_name}.{page_num:03d}.jpg"
            possible_paths = [
                OUTPUT_DIR / b_name / "ch" / img_name,
                OUTPUT_DIR / b_name / "misc" / img_name,
                OUTPUT_DIR / b_name / "blank" / img_name,
            ]
            for p in possible_paths:
                if p.exists():
                    target_img_path = str(p)
                    break
            if not target_img_path:
                raise HTTPException(status_code=404, detail=f"Page image {img_name} not found in output directory")
        else:
            raise HTTPException(status_code=400, detail="Either 'file' or 'page_num' must be provided")

        client = KimHanNomClient()
        res = client.process_image_end_to_end(target_img_path)

        return {
            "status": "success",
            "server_file_name": res.get("server_file_name"),
            "total_lines": res.get("total_lines", 0),
            "lines": res.get("lines", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloud OCR error: {str(e)}")

@app.get("/api/projects/{project_id}")
def get_project_metadata(project_id: str):
    return {
        "id": state.project_id,
        "bookName": state.book_name,
        "studentIds": state.student_ids,
        "originalPdfName": f"{state.book_name}.pdf",
        "originalPdfSize": 9989975,
        "totalPages": state.total_pages,
        "createdAt": "2026-10-31T23:00:00Z",
        "updatedAt": "2026-11-01T01:00:00Z"
    }

@app.get("/api/projects/{project_id}/pipeline")
def get_pipeline_status(project_id: str):
    return [
        {
            "id": "preprocess",
            "name": "1. Document Preprocessing",
            "description": "Render 300 DPI images, classify content/misc/blank, detect T2b margin.",
            "status": "completed",
            "progress": 100
        },
        {
            "id": "ocr",
            "name": "2. Dual OCR Recognition (Local & KimHanNom Cloud)",
            "description": "Recognize Sino-Nom and cursive handwritten Quốc ngữ text lines.",
            "status": "completed",
            "progress": 100
        },
        {
            "id": "align",
            "name": "3. Bilingual Sentence Alignment",
            "description": "Phonetic Dynamic Programming alignment across page boundaries.",
            "status": "completed",
            "progress": 100
        },
        {
            "id": "clean",
            "name": "4. Text Cleaning & PPOCRLabel Prep",
            "description": "Unicode NFC normalization, archaic punctuation mapping, 4-pt BBox extraction.",
            "status": "completed",
            "progress": 100
        },
        {
            "id": "evaluate",
            "name": "5. Quality Evaluation & Color Coding",
            "description": "Evaluate similarity metric (>= 95%) and assign ARGB Black/Red styles.",
            "status": "completed",
            "progress": 100
        },
        {
            "id": "export_prep",
            "name": "6. Export Deliverables Preparation",
            "description": "Package PPOCRLabel Label.txt/fileState.txt, CSV with BOM, and styled XLSX.",
            "status": "completed",
            "progress": 100
        }
    ]

@app.get("/api/projects/{project_id}/pages")
def get_pages(project_id: str):
    pages = []
    book_info = BOOKS.get(state.book_key, {})
    misc_indices = book_info.get("misc_pages", [1, 2, state.total_pages])

    for i in range(1, state.total_pages + 1):
        page_id = f"{i:03d}"
        is_misc = i in misc_indices
        category = "misc" if is_misc else "content"
        img_name = f"{state.book_name}.{page_id}.jpg"

        folder = "misc" if is_misc else "ch"
        img_url = f"/static/output/{state.book_name}/{folder}/{img_name}"

        recs_count = len([r for r in state.records if r["pageNumber"] == i])
        mismatches = len([r for r in state.records if r["pageNumber"] == i and r["color"] == "RED"])

        pages.append({
            "pageNumber": i,
            "pageId": page_id,
            "imgName": img_name,
            "imageUrl": img_url,
            "category": category,
            "reviewStatus": "has_issues" if mismatches > 0 else "approved",
            "width": 1400,
            "height": 1800,
            "detectedChRegions": recs_count,
            "detectedViRegions": recs_count,
            "mismatchedCount": mismatches
        })
    return pages

@app.get("/api/projects/{project_id}/pages/{page_num}/annotations")
def get_page_annotations(project_id: str, page_num: int):
    book_dir = OUTPUT_DIR / state.book_name
    ch_label_file = book_dir / "ch" / "Label.txt"
    vi_label_file = book_dir / "vi" / "Label.txt"
    img_name = f"{state.book_name}.{page_num:03d}.jpg"

    boxes = []

    def load_boxes_from_file(file_path: Path, r_type: str):
        if not file_path.exists():
            return
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                if img_name in line:
                    parts = line.strip().split("\t")
                    if len(parts) >= 2:
                        raw_boxes = json.loads(parts[1])
                        for b_idx, b in enumerate(raw_boxes):
                            sentence_id = f"{state.book_name}.{page_num:03d}.{b_idx + 1}"
                            rec = next((r for r in state.records if r["sentence_id"] == sentence_id), None)
                            is_mismatch = rec["color"] == "RED" if rec else False

                            boxes.append({
                                "id": f"box_{r_type}_{page_num}_{b_idx}",
                                "img_id": img_name,
                                "sentence_id": sentence_id,
                                "region_type": r_type,
                                "transcription": b.get("transcription", ""),
                                "points": b.get("points", []),
                                "status": "mismatched" if is_mismatch else "matched"
                            })

    load_boxes_from_file(ch_label_file, "ch")
    load_boxes_from_file(vi_label_file, "vi")
    return boxes

@app.get("/api/projects/{project_id}/alignments")
def get_alignments(project_id: str):
    return state.records

@app.patch("/api/alignments/{record_id}")
def update_alignment(record_id: str, payload: AlignmentUpdateRequest):
    rec = next((r for r in state.records if r["id"] == record_id or r["sentence_id"] == record_id), None)
    if not rec:
        raise HTTPException(status_code=404, detail="Record not found")

    if payload.SinoNom_Char is not None:
        rec["SinoNom_Char"] = payload.SinoNom_Char
    if payload.ChuQN_txt is not None:
        rec["ChuQN_txt"] = payload.ChuQN_txt
    if payload.reviewStatus is not None:
        rec["reviewStatus"] = payload.reviewStatus
    if payload.editorNote is not None:
        rec["editorNote"] = payload.editorNote

    eval_res = state.evaluator.evaluate_record({
        "SinoNom_Char": rec["SinoNom_Char"],
        "ChuQN_txt": rec["ChuQN_txt"]
    })
    rec["isMatched"] = eval_res["mismatched_chars"] == 0
    rec["color"] = "BLACK" if rec["isMatched"] else "RED"

    char_statuses = []
    for item in eval_res.get("char_statuses", []):
        ch, is_m, reason = item[0], item[1], item[2] if len(item) > 2 else "matched"
        char_statuses.append({
            "char": ch,
            "isMatched": is_m,
            "color": "BLACK" if is_m else "RED",
            "reason": reason
        })
    rec["charStatuses"] = char_statuses
    return rec

@app.get("/api/projects/{project_id}/metrics")
def get_metrics(project_id: str):
    total_chars = sum(len(r["SinoNom_Char"]) for r in state.records)
    mismatched_chars = sum(
        sum(1 for cs in r["charStatuses"] if not cs["isMatched"])
        for r in state.records
    )

    similarity = (1.0 - (mismatched_chars / total_chars)) * 100.0 if total_chars > 0 else 100.0

    return {
        "totalPages": state.total_pages,
        "processedPages": state.total_pages,
        "totalAlignedPairs": len(state.records),
        "totalSinoNomChars": total_chars,
        "totalVietnameseWords": sum(len(r["ChuQN_txt"].split()) for r in state.records),
        "validatedPairs": len([r for r in state.records if r["reviewStatus"] == "approved"]),
        "mismatchedChars": mismatched_chars,
        "pendingReviews": len([r for r in state.records if r["reviewStatus"] == "pending"]),
        "similarityScore": round(similarity, 2),
        "isSimilarityPassed": similarity >= 95.0
    }

@app.post("/api/projects/{project_id}/export")
def export_final_artifacts(project_id: str):
    book_dir = OUTPUT_DIR / state.book_name
    student_prefix = "_".join(state.student_ids)
    zip_path = OUTPUT_DIR / f"{student_prefix}.zip"

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(book_dir):
            for file in files:
                file_full = Path(root) / file
                rel_path = Path(state.book_name) / file_full.relative_to(book_dir)
                zipf.write(file_full, arcname=str(rel_path))

    return FileResponse(
        path=str(zip_path),
        filename=f"{student_prefix}.zip",
        media_type="application/zip"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server.main:app", host="127.0.0.1", port=8000, reload=True)
