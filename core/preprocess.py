"""
Document Preprocessing and Layout Segmentation Module
Handles PDF splitting, page classification, and T2b layout line/bbox extraction.
"""
import os
import cv2
import numpy as np
import pymupdf
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from core.config import LAPLACIAN_BLUR_THRESHOLD, RENDER_DPI

def cv2_imread_unicode(path: Path | str, flags=cv2.IMREAD_COLOR) -> Optional[np.ndarray]:
    """Safely read image with Unicode/non-ASCII characters on Windows."""
    try:
        with open(str(path), 'rb') as f:
            bytes_data = np.frombuffer(f.read(), dtype=np.uint8)
            return cv2.imdecode(bytes_data, flags)
    except Exception as e:
        return None

def cv2_imwrite_unicode(path: Path | str, img: np.ndarray, ext: str = ".jpg") -> bool:
    """Safely write image with Unicode/non-ASCII characters on Windows."""
    try:
        success, encoded = cv2.imencode(ext, img)
        if success:
            with open(str(path), 'wb') as f:
                f.write(encoded)
            return True
    except Exception as e:
        pass
    return False

class DocumentPreprocessor:
    def __init__(self, book_info: dict, out_base_dir: Path):
        self.book_info = book_info
        self.title = book_info["title"]
        self.pdf_filename = book_info["pdf_filename"]
        self.out_base_dir = Path(out_base_dir) / self.title
        
        # Subdirectories according to submission requirements
        self.dir_ch = self.out_base_dir / "ch"
        self.dir_vi = self.out_base_dir / "vi"
        self.dir_blank = self.out_base_dir / "blank"
        self.dir_misc = self.out_base_dir / "misc"
        
        for d in [self.dir_ch, self.dir_vi, self.dir_blank, self.dir_misc]:
            d.mkdir(parents=True, exist_ok=True)

    def split_and_extract_images(self, pdf_path: str) -> List[Tuple[int, str, Path]]:
        """
        Extract high-resolution JPEG images for all pages in PDF.
        Returns list of (page_num_1_indexed, image_filename, saved_path).
        """
        doc = pymupdf.open(pdf_path)
        extracted = []
        
        # Determine number formatting: >= 3 digits (e.g. 001, 002)
        total_pages = len(doc)
        pad_width = max(3, len(str(total_pages)))
        
        # Save temporary render cache
        cache_dir = self.out_base_dir / "extracted_all"
        cache_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"Extracting {total_pages} pages from {pdf_path}...")
        for idx in range(total_pages):
            page_num = idx + 1
            page = doc[idx]
            
            # Format filename: <Tên sách>.<Số thứ tự hình ảnh>.jpg
            stt_str = f"{page_num:0{pad_width}d}"
            img_name = f"{self.title}.{stt_str}.jpg"
            img_path = cache_dir / img_name
            
            # If page contains a native embedded image, extract it directly to maintain 100% original quality
            imgs = page.get_images()
            if imgs and len(imgs) >= 1 and idx > 0: # non-title pages
                xref = imgs[0][0]
                base_img = doc.extract_image(xref)
                with open(img_path, "wb") as f:
                    f.write(base_img["image"])
            else:
                # Render using PyMuPDF at high quality
                pix = page.get_pixmap(dpi=RENDER_DPI)
                pix.save(str(img_path))
                
            extracted.append((page_num, img_name, img_path))
            
        return extracted

    @staticmethod
    def classify_page(img_path: Path, page_num: int, total_pages: int) -> str:
        """
        Classify page into 'misc', 'blank', or 'content'.
        """
        if page_num == 1:
            return "misc" # Digital library cover / metadata
        if page_num == 2 or page_num == total_pages:
            return "misc" # Front cover or back cover
            
        img = cv2_imread_unicode(img_path)
        if img is None:
            return "misc"
            
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        mean_val = gray.mean()
        
        # Completely blank or uniform paper
        if mean_val > 240 and lap_var < 15.0:
            return "blank"
            
        return "content"

    @staticmethod
    def detect_margin_x(img: np.ndarray) -> int:
        """
        Detect vertical margin line of notebook paper (usually red line around x=200..350).
        """
        h, w, _ = img.shape
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        m1 = cv2.inRange(hsv, np.array([0, 70, 50]), np.array([10, 255, 255]))
        m2 = cv2.inRange(hsv, np.array([170, 70, 50]), np.array([180, 255, 255]))
        red_mask = m1 | m2
        
        vert_proj = red_mask.sum(axis=0) // 255
        # Search for sharp vertical line peak in x: 150..400
        search_region = vert_proj[150:450]
        if len(search_region) > 0 and search_region.max() > 200:
            peak_x = 150 + int(np.argmax(search_region))
            return peak_x + 10 # Offset slightly past the line
        return int(w * 0.18) # Default 18% left margin

    def segment_t2b_lines(self, img_path: Path) -> Dict[str, List[dict]]:
        """
        Segment text lines and produce tight 4-point bounding boxes for Nôm (ch) and Quốc ngữ (vi)
        strictly adhering to guide/Quy_định_đồ_án.pdf:
        - Tight boxes hugging text strokes (ôm sát, tránh lệch hàng).
        - Strips headers, footers, page numbering, margin guides.
        - Proper ordering: Top-to-bottom for horizontal writing.
        - Exactly 4 points per polygon [[x1,y1],[x2,y1],[x2,y2],[x1,y2]].
        """
        img = cv2_imread_unicode(img_path)
        if img is None:
            return {"ch": [], "vi": []}
            
        h, w, _ = img.shape
        margin_x = self.detect_margin_x(img)
        
        # Crop main text content area: exclude left margin and top/bottom 3% margins (page numbers/folio)
        top_cut = int(h * 0.03)
        bot_cut = int(h * 0.97)
        main_area = img[top_cut:bot_cut, margin_x:w - 30]
        
        gray = cv2.cvtColor(main_area, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 185, 255, cv2.THRESH_BINARY_INV)
        
        # Horizontal morphological closing to connect ink characters into lines
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 3))
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        
        h_proj = cleaned.sum(axis=1) // 255
        
        # Detect horizontal line spans
        raw_lines = []
        in_line = False
        start_y = 0
        min_line_h = 12
        for y, val in enumerate(h_proj):
            if val > 60 and not in_line:
                in_line = True
                start_y = y
            elif val <= 60 and in_line:
                in_line = False
                if y - start_y >= min_line_h:
                    raw_lines.append((start_y + top_cut, y + top_cut))
                    
        # Sort lines strictly Top-to-Bottom
        raw_lines = sorted(raw_lines, key=lambda l: l[0])
        
        ch_boxes = []
        vi_boxes = []
        
        for idx, (y1, y2) in enumerate(raw_lines):
            # Compute tight horizontal bounding box within the line roi
            line_roi = thresh[y1 - top_cut:y2 - top_cut, :]
            col_proj = line_roi.sum(axis=0) // 255
            non_zeros = np.where(col_proj > 4)[0]
            if len(non_zeros) == 0:
                continue
            x1 = margin_x + int(non_zeros[0]) - 4
            x2 = margin_x + int(non_zeros[-1]) + 4
            x1 = max(0, x1)
            x2 = min(w, x2)
            
            box = {
                "points": [[x1, y1], [x2, y1], [x2, y2], [x1, y2]],
                "y_center": (y1 + y2) / 2
            }
            
            # In T2b interlinear layout: Even indexed lines are NOM, Odd indexed are QN
            if idx % 2 == 0:
                ch_boxes.append(box)
            else:
                vi_boxes.append(box)
                
        return {"ch": ch_boxes, "vi": vi_boxes}

    def segment_vertical_nom_columns(self, img_path: Path) -> List[dict]:
        """
        Segment vertical Sino-Nom columns (Tnom, Tnomw, T1/T2 vertical) adhering to regulation:
        - Level: Vertical columns (cột dọc).
        - Ordering: RIGHT-TO-LEFT, TOP-TO-BOTTOM (từ phải sang trái, từ trên xuống dưới).
        - Exactly 4 points per polygon.
        """
        img = cv2_imread_unicode(img_path)
        if img is None:
            return []
            
        h, w, _ = img.shape
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        # Remove borders & frames
        vert_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 60))
        vert_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, vert_kernel)
        text_only = cv2.subtract(thresh, vert_lines)
        
        horiz_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (60, 1))
        horiz_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horiz_kernel)
        text_only = cv2.subtract(text_only, horiz_lines)
        
        # Connect vertical character strokes within each column
        char_connect = cv2.getStructuringElement(cv2.MORPH_RECT, (4, 40))
        connected = cv2.morphologyEx(text_only, cv2.MORPH_CLOSE, char_connect)
        
        contours, _ = cv2.findContours(connected, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        raw_boxes = []
        for cnt in contours:
            x, y, bw, bh = cv2.boundingRect(cnt)
            # Filter text columns (valid height > 50, width between 15 and 400)
            if bh > 50 and 15 < bw < 450:
                raw_boxes.append((x, y, x + bw, y + bh))
                
        # Sort strictly RIGHT-TO-LEFT (x descending), then TOP-TO-BOTTOM (y ascending)
        sorted_boxes = sorted(raw_boxes, key=lambda b: (-b[0], b[1]))
        
        nom_boxes = []
        for x1, y1, x2, y2 in sorted_boxes:
            nom_boxes.append({
                "points": [[x1, y1], [x2, y1], [x2, y2], [x1, y2]],
                "x_center": (x1 + x2) / 2,
                "y_center": (y1 + y2) / 2
            })
        return nom_boxes
