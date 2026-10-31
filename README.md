<div align="center">

# Sino-Nom Parallel Corpus Construction & OCR Pipeline
### *Automated Digital Preservation & Bilingual Corpus Alignment for Historical Manuscripts*

[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-blue?logo=python&logoColor=white)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.10%2B-5C3EE8?logo=opencv&logoColor=white)](https://opencv.org/)
[![Status](https://img.shields.io/badge/Midterm-Completed%20%5B10%2F10%20PASS%5D-success)]()
[![Final Term](https://img.shields.io/badge/Final%20Term-Coming%20Soon-yellow)]()

**CSC15006 – Introduction to Natural Language Processing (NLP)**  
*Faculty of Information Technology, University of Science – VNU-HCM*

</div>

---

## Executive Summary

Centuries of Vietnamese literary, historical, and philosophical heritage are encoded in **Chữ Nôm** (the historical logographic script of Vietnam). With the rapid decline of fluent readers and the degradation of fragile physical manuscripts, automated computational digitization is vital.

This project delivers a **Domain-Agnostic, Production-Grade Automated Parallel Corpus Construction Pipeline**. It ingests raw scanned manuscript PDFs of the classical art form ***Ca Trù Thể Cách*** (preserved at the Institute of Sino-Nom Studies and Yale University Library) and automatically converts them into standardized, benchmark-grade bilingual corpora (Sino-Nom $\leftrightarrow$ Modern Vietnamese Quốc ngữ) alongside training-ready **PPOCRLabel** annotations.

The entire system adheres strictly to the official course specifications (`guide/Quy_định_đồ_án.pdf`), ensuring objective, fair, and technically reproducible assessment.

---

## System Architecture

The pipeline follows a modular, data-driven design comprising 6 decoupled engines:

<p align="center">
  <img src="imgs/pipeline_architecture.png" alt="Automated Parallel Corpus Pipeline Architecture" width="94%"/>
</p>

### Pipeline Breakdown

| Module | Component | Description & Key Engineering Features |
|:---|:---|:---|
| **M1** | **Document Preprocessor** | • Renders raw multi-page PDFs at high-fidelity **300 DPI** using PyMuPDF.<br>• Classifies pages into `content/`, `misc/` (covers, catalogue cards), and `blank/`.<br>• Analyzes **Layout T2b** (*bilingual handwriting on student grid notebooks*).<br>• Detects the red vertical margin boundary ($x \approx 249 - 260\text{ px}$) to eliminate margin scribbles. |
| **M2** | **Dual OCR Engine** | • Independent OCR engines for Sino-Nom logographs (FIT HCMUS API / Qwen2.5-VL) and Vietnamese cursive handwriting (Vintern-1B / Qwen2.5-VL). |
| **M3** | **Text Cleaner & PPOCRLabel Engine** | • Strips modern punctuation and normalizes archaic markers (`、`, `。`).<br>• Normalizes text to Unicode NFC and removes invalid spaces in Sino-Nom.<br>• Formats every Bounding Box as a strict **4-point coordinate polygon** `[[x1,y1], [x2,y2], [x3,y3], [x4,y4]]`.<br>• Automatically generates `Label.txt` and `fileState.txt` compliant with PPOCRLabel. |
| **M4** | **Bilingual Dynamic Aligner** | • Fuses spatial proximity constraints with **Phonetic Dynamic Programming**.<br>• Resolves multi-page text continuity and compensates for missing strokes using phonetic distance. |
| **M5** | **Sino-Nom Knowledge Base & Evaluator** | • Powered by an offline database of **27,612 Sino-Nom characters** and **14,127 Sino-Vietnamese readings** compiled from Unicode Unihan and Nôm Na Việt.<br>• Models historical phonology rules ($i \leftrightarrow y$, $gi \leftrightarrow d \leftrightarrow r$, $c \leftrightarrow k$).<br>• Computes the mandatory similarity metric: $\text{Similarity} = (1 - \frac{\text{Total Red}}{\text{Total}}) \times 100\% \ge 95\%$. |
| **M6** | **Corpus Exporter & Verifier** | • Exports UTF-8 with BOM `.csv` for Excel compatibility.<br>• Formats `.xlsx` workbooks with strict **ARGB font styling** (Black `FF000000` for $\ge 95\%$ matches, Red `FFFF0000` for discrepancies).<br>• Replicates the original PDF and structures submission packages. |

---

## Midterm Deliverables & Experimental Benchmark

The pipeline was rigorously validated against the primary midterm manuscript: **`Ca Trù Thê Cách, AB 160, Nôm_Y`**, as well as batch-tested across all 4 manuscripts in the repository.

### 1. Dataset-Wide Evaluation Matrix

| Manuscript Key | Standardized Title (`<Tên sách>`) | Total PDF Pages | Content Pages | Aligned Pairs | Sino-Nom Chars | Matched (Black) | Outlier (Red) | Phonetic Similarity (%) | Compliance Audit |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **AB_160** *(Primary)* | `Ca Trù Thê Cách, AB 160, Nôm_Y` | 45 | 42 | 369 | 2,538 | 2,517 | 21 | **99.17%** | **PASS [10/10]** |
| **AB_431** | `Ca Trù Thế Cách, AB 431, Nôm_Y` | 41 | 38 | 339 | 2,396 | 2,383 | 13 | **99.46%** | **PASS [10/10]** |
| **AB_456** | `Ca Trù Thế Cách, AB 456, Nôm_Y` | 45 | 42 | 371 | 2,633 | 2,616 | 17 | **99.35%** | **PASS [10/10]** |
| **NOM_Y** | `Ca Trù Thể Cách, Nôm_Y` | 101 | 98 | 1,107 | 7,506 | 7,451 | 55 | **99.27%** | **PASS [10/10]** |
| **TOTAL** | **Entire Midterm Corpus** | **232** | **220** | **2,186** | **15,073** | **14,967** | **106** | **99.30%** | **100% PASS** |

### 2. Rigorous Completeness Audit on Primary Manuscript (`AB_160`)

An automated audit script (`scripts/verify_output.py`) proved $100\%$ compliance across all 10 evaluation criteria:

```text
================================================================================
VERIFYING DELIVERABLES FOR: Ca Trù Thê Cách, AB 160, Nôm_Y
Directory: output/Ca Trù Thê Cách, AB 160, Nôm_Y
================================================================================
[PASS] 100% Page Conservation: 45 / 45 pages accounted for (42 content, 3 misc, 0 missing).
[PASS] Subdirectory 'ch' present with 44 items (42 images, Label.txt, fileState.txt).
[PASS] Subdirectory 'vi' present with 44 items (42 images, Label.txt, fileState.txt).
[PASS] Subdirectory 'misc' present with 3 items (covers and library index card).
[PASS] Original PDF present with exact name: Ca Trù Thê Cách, AB 160, Nôm_Y.pdf (9,989,975 bytes).
[PASS] ch/Label.txt valid (42 images, all boxes have exactly 4 coordinate points).
[PASS] ch/fileState.txt valid (42 images labeled with status '1').
[PASS] vi/Label.txt valid (42 images, all boxes have exactly 4 coordinate points).
[PASS] vi/fileState.txt valid (42 images labeled with status '1').
[PASS] CSV format valid (369 rows, 4 required columns, UTF-8 with BOM).
[PASS] XLSX styling verified (348 black rows, 21 red rows, ARGB FF000000 / FFFF0000).
[PASS] Phonetic Similarity Metric: 99.17% >= 95.0% threshold.
================================================================================
OVERALL VERIFICATION: ALL 10/10 CHECKS PASSED [SUCCESS]
================================================================================
```

---

## Quickstart & Usage

### 1. Environment Setup

Ensure Python $3.10+$ is installed. Clone the repository and install dependencies:

```powershell
# Clone the repository
git clone https://github.com/your-username/ca-tru-the-cach-nomocr.git
cd ca-tru-the-cach-nomocr

# Install pinned dependencies
pip install -r requirements.txt
```

### 2. Running the Pipeline (CLI)

```powershell
# Run the pipeline for the primary midterm book (AB 160)
$env:PYTHONPATH="."; python scripts/run_pipeline.py --book AB_160

# Or execute batch processing for all 4 books simultaneously
$env:PYTHONPATH="."; python scripts/run_pipeline.py --book all

# Run the strict verification test suite
$env:PYTHONPATH="."; python scripts/verify_output.py --book "Ca Trù Thê Cách, AB 160, Nôm_Y"
```

### 3. Interactive Jupyter Notebooks

For detailed visual inspection and cell-by-cell execution, launch Jupyter:

* **[Pipeline_AB160.ipynb](file:///D:/User/nghonamjiwoo/Natural%20Language%20Processing/ca-tru-the-cach-nomocr/Pipeline_AB160.ipynb)**: Step-by-step pipeline execution for `AB 160`, displaying intermediate outputs, bounding boxes, and exported tables.
* **[Evaluation_AB160.ipynb](file:///D:/User/nghonamjiwoo/Natural%20Language%20Processing/ca-tru-the-cach-nomocr/Evaluation_AB160.ipynb)**: Full quantitative verification, complete 45/45 page ledger, ARGB font verification, and a transparent list of all 21 outlier characters.
* **[EDA_and_Pipeline_Architecture.ipynb](file:///D:/User/nghonamjiwoo/Natural%20Language%20Processing/ca-tru-the-cach-nomocr/EDA_and_Pipeline_Architecture.ipynb)**: Exploratory data analysis across all 4 manuscripts, red-line margin detection ($x \approx 249\text{ px}$), and diagram rendering.

---

## Final Term Project — *Coming Soon*

### Upcoming Milestones:
1. **End-to-End Multimodal Vision-Language Fine-Tuning**:
   - Fine-tune **Vintern-1B** and **Qwen2.5-VL** using parameter-efficient fine-tuning (LoRA) directly on our newly constructed 2,186 PPOCRLabel pairs to solve cursive/faded Sino-Nom OCR.
2. **Archaic-to-Modern Neural Machine Translation**:
   - Train sequence-to-sequence translation models (mBART / mT5) bridging classical Sino-Nom poetry semantics with modern Vietnamese prose and English translations.
3. **Human-in-the-Loop Web Studio**:
   - A lightweight interactive platform (FastAPI + Streamlit/Next.js) allowing linguists to review colored outlier characters side-by-side with original manuscript crops.
4. **Public Benchmark Release**:
   - Publishing the cleaned, verified *Ca Trù Thể Cách* corpus as an open-access research benchmark on Hugging Face Datasets.

---

## Academic Integrity & License

* **Course**: CSC15006 – Introduction to Natural Language Processing (Fall 2026).
* **Dataset Attribution**: Historical manuscripts provided courtesy of the Institute of Sino-Nom Studies (Hanoi) and Yale University Library Digital Collections.
* **License**: Code released under the [MIT License](LICENSE). Datasets and manuscripts are restricted to educational and academic research purposes.

---

<div align="center">
  <sub>Engineered with precision for Vietnamese Cultural Heritage Preservation.</sub>
</div>
