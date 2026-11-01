# 🏛️ Human-in-the-Loop Web Studio
### *Sino-Nom Parallel Corpus Digital Curation & Verification Platform*

A high-performance, enterprise-grade web application built with **React, TypeScript, Vite, Tailwind CSS, and Zustand** for humanities researchers and Sino-Nom linguists.

This platform bridges raw scanned historical manuscripts (*Ca Trù Thể Cách*) with training-ready parallel corpora, offering real-time OCR visualization, 4-point polygon bounding box editing, bilingual alignment verification, and automated packaging compliant with academic submission guidelines.

---

## 🌟 Key Architecture & Features

### 1. Document Upload & Pipeline Monitoring
- **Drag-and-Drop Ingestion**: Uploads multi-page PDF files, validates formats, and specifies standardized metadata (`<Tên sách>`, student IDs).
- **6-Stage Pipeline Telemetry**: Live progress tracking across `Preprocessing`, `OCR`, `Alignment`, `Cleaning`, `Evaluation`, and `Export Prep`.
- **Similarity Score Card**: Computes the official evaluation metric:
  $$\text{Similarity (\%)} = \left(1 - \frac{N_{mismatch}}{N_{total}}\right) \times 100 \ge 95.0\%$$

### 2. Tri-Pane Human-in-the-Loop Workspace
- **Pane 1: Document Sidebar**: Lists all 45 pages with thumbnails, categorization tags (`content`, `misc`, `blank`), region counts, and mismatch alerts.
- **Pane 2: Interactive Scan Viewer & Canvas**:
  - High-DPI crisp rendering on HTML5 Canvas.
  - Smooth pan (hold `Space` or middle-click) and zoom (mouse wheel / toolbar).
  - Renders the T2b red vertical margin guide at $x \approx 260\text{ px}$.
  - Overlays 4-point polygon bounding boxes:
    - `ch` (Sino-Nom, Emerald) vs `vi` (Quốc ngữ, Blue).
    - Status-based color coding (Black for matched, Red for mismatches).
    - Vertex anchor dragging to fine-tune polygon points.
- **Pane 3: Alignment Data Grid**:
  - Strict 4 academic columns: `img_id`, `sentence_id`, `SinoNom_Char`, `ChuQN_txt`.
  - Sentence ID format: `<img_id without .jpg>.<index>`.
  - Two-way sync: clicking a table row highlights the box on canvas, and clicking a box scrolls to the table row.
  - Filter by `All`, `Mismatched (Red) Only`, or `Approved Only`.

### 3. Inline Inspector & Character-Level Phonetic Analysis
- Double-click any box or click the Edit button in the table to open the Inspector modal.
- Provides real-time character-by-character dictionary lookup showing readings and match classifications.
- One-click approval recalculates the live similarity score instantly.

### 4. Automated Academic Packaging & Export
- Validates that every bounding box has strictly 4 points and valid bounds.
- Generates:
  - `ch/` & `vi/` containing `Label.txt` and `fileState.txt` (PPOCRLabel standard).
  - `<Tên sách>.csv` with UTF-8 BOM.
  - `<Tên sách>.xlsx` with openpyxl/Excel ARGB font colors (Black `FF000000`, Red `FFFF0000`).
  - Bundles everything into `<MSSV1_MSSV2...>.zip` matching official academic structure.

---

## ⚡ Keyboard Shortcuts (Hotkeys)

| Shortcut | Description |
|:---|:---|
| `↑` / `↓` | Navigate previous / next alignment row |
| `N` | Jump to next mismatched (Red) sentence |
| `P` | Jump to previous mismatched (Red) sentence |
| `Enter` | Open inline inspector for active pair |
| `R` | Toggle Reviewed / Approved status |
| `Ctrl + S` | Save pending edits and sync state |
| `Ctrl + Z` | Undo last edit or vertex move |
| `Ctrl + Shift + Z` | Redo previously undone action |
| `Space + Drag` | Pan scan canvas smoothly |
| `+` / `-` | Zoom in / Zoom out |
| `0` | Fit page to screen |
| `Esc` | Deselect box / close modal |
| `?` | Show hotkey cheat sheet |

---

## 🚀 Getting Started

### 1. Standalone Frontend (Mock Mode)
The studio features a high-fidelity mock adapter with real `Ca Trù Thê Cách, AB 160` data. It runs standalone without any backend server:

```powershell
cd web-studio
npm install
npm run dev
```

Open your browser at `http://localhost:5173`.

### 2. Full-Stack with FastAPI Backend
To run with the real Python backend:

```powershell
# Terminal 1: Start FastAPI backend (port 8000)
python server/main.py

# Terminal 2: Start React frontend (port 5173)
cd web-studio
npm run dev
```

Click the **Live API / Local Mock** button in the header to toggle between real backend endpoints and local mock mode.

### 3. Run Test Suite
```powershell
cd web-studio
npm test
```
