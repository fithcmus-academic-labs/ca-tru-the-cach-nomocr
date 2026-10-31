"""
System Configuration for Hán Nôm - Quốc ngữ Parallel Corpus Pipeline
"""
import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
DICTS_DIR = DATA_DIR / "dicts"
INTERIM_DIR = DATA_DIR / "interim"
OUTPUT_DIR = BASE_DIR / "output"
DATASETS_MIDTERM_DIR = BASE_DIR / "datasets-midterm"

# Files
HANNOM_DICT_PKL = DICTS_DIR / "hannom_dict.pkl"
HANNOM_DICT_JSON = DICTS_DIR / "hannom_dict.json"

# Thresholds & Rules
MIN_SIMILARITY_THRESHOLD = 0.95  # Yêu cầu >= 95%
RENDER_DPI = 300
LAPLACIAN_BLUR_THRESHOLD = 50.0

# Excel Colors (ARGB)
COLOR_BLACK = "FF000000"
COLOR_RED = "FFFF0000"

# Target Books in Midterm Datasets
BOOKS = {
    "NOM_Y": {
        "title": "Ca Trù Thể Cách, Nôm_Y",
        "pdf_filename": "Ca Trù Thể Cách, Nôm_Y.pdf",
        "csv_filename": "Ca Trù Thể Cách, Nôm.csv",
        "xlsx_filename": "Ca Trù Thể Cách, Nôm.xlsx",
        "layout_type": "T2b",
    },
    "AB_160": {
        "title": "Ca Trù Thê Cách, AB 160, Nôm_Y",
        "pdf_filename": "Ca Trù Thê Cách, AB 160, Nôm_Y.pdf",
        "csv_filename": "Ca Trù Thê Cách, AB 160 [Title matches another notebook, AB number listed to help differentiate] , Nôm.csv",
        "xlsx_filename": "Ca Trù Thê Cách, AB 160 [Title matches another notebook, AB number listed to help differentiate] , Nôm.xlsx",
        "layout_type": "T2b",
    },
    "AB_431": {
        "title": "Ca Trù Thế Cách, AB 431, Nôm_Y",
        "pdf_filename": "Ca Trù Thế Cách, AB 431, Nôm_Y.pdf",
        "csv_filename": "Ca Trù Thế Cách, AB 431 [Title matches another notebook, AB number listed to help differentiate], Nôm.csv",
        "xlsx_filename": "Ca Trù Thế Cách, AB 431 [Title matches another notebook, AB number listed to help differentiate], Nôm.xlsx",
        "layout_type": "T2b",
    },
    "AB_456": {
        "title": "Ca Trù Thế Cách, AB 456, Nôm_Y",
        "pdf_filename": "Ca Trù Thế Cách, AB 456, Nôm_Y.pdf",
        "csv_filename": "Ca Trù Thế Cách, AB 456 [Title matches another notebook, AB number listed to help differentiate], Nôm.csv",
        "xlsx_filename": "Ca Trù Thế Cách, AB 456 [Title matches another notebook, AB number listed to help differentiate], Nôm.xlsx",
        "layout_type": "T2b",
    }
}
