"""
Document Preprocessing and Layout Segmentation Module
Handles PDF splitting, page classification, and layout-aware bounding box extraction
strictly adhering to 'guide/Quy_định_đồ_án.pdf'.
"""
import os
import shutil
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
    except Exception:
        return None


def cv2_imwrite_unicode(path: Path | str, img: np.ndarray, ext: str = ".jpg") -> bool:
    """Safely write image with Unicode/non-ASCII characters on Windows."""
    try:
        success, encoded = cv2.imencode(ext, img)
        if success:
            with open(str(path), 'wb') as f:
                f.write(encoded)
            return True
    except Exception:
        pass
    return False


class DocumentPreprocessor:
    def __init__(self, book_info: dict, out_base_dir: Path):
        self.book_info = book_info
        self.title = book_info["title"]
        self.pdf_filename = book_info.get("pdf_filename", f"{self.title}.pdf")
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

        total_pages = len(doc)
        pad_width = max(3, len(str(total_pages)))

        cache_dir = self.out_base_dir / "extracted_all"
        cache_dir.mkdir(parents=True, exist_ok=True)

        for idx in range(total_pages):
            page_num = idx + 1
            page = doc[idx]

            stt_str = f"{page_num:0{pad_width}d}"
            img_name = f"{self.title}.{stt_str}.jpg"
            img_path = cache_dir / img_name

            if not img_path.exists() or img_path.stat().st_size == 0:
                imgs = page.get_images()
                if imgs and len(imgs) >= 1 and idx > 0:
                    xref = imgs[0][0]
                    base_img = doc.extract_image(xref)
                    with open(img_path, "wb") as f:
                        f.write(base_img["image"])
                else:
                    pix = page.get_pixmap(dpi=RENDER_DPI)
                    pix.save(str(img_path))

            extracted.append((page_num, img_name, img_path))

        doc.close()
        return extracted

    def cleanup_cache(self):
        """Remove temporary extracted_all directory so output folder only contains compliant folders."""
        cache_dir = self.out_base_dir / "extracted_all"
        if cache_dir.exists():
            shutil.rmtree(cache_dir, ignore_errors=True)

    @staticmethod
    def classify_page(img_path: Path, page_num: int, total_pages: int) -> str:
        """
        Classify page into 'misc', 'blank', or 'content'.
        """
        if total_pages > 4:
            if page_num in (1, 2) or page_num == total_pages:
                return "misc"

        img = cv2_imread_unicode(img_path)
        if img is None:
            return "misc"

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        mean_val = gray.mean()

        if mean_val > 242 and lap_var < 12.0:
            return "blank"

        return "content"

    @staticmethod
    def detect_margin_x(img: np.ndarray) -> int:
        """
        Detect vertical red margin line of notebook paper (typically x in 4%..24% of width).
        Returns x coordinate right after the red margin line, or a small 2.5% border if no red line exists.
        Never cuts off characters when a red margin is absent or near the left edge.
        """
        h, w, _ = img.shape
        b = img[:, :, 0].astype(np.int16)
        g = img[:, :, 1].astype(np.int16)
        r = img[:, :, 2].astype(np.int16)

        redness = (r - np.maximum(g, b)) > 22
        vert_counts = redness.sum(axis=0)

        x_min = max(10, int(w * 0.04))
        x_max = int(w * 0.24)
        if x_max > x_min:
            search_region = vert_counts[x_min:x_max]
            if search_region.max() > int(h * 0.25):
                peak_x = x_min + int(np.argmax(search_region))
                return peak_x + 6

        return int(w * 0.025)

    @staticmethod
    def _build_ink_binary(roi_bgr: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Build a binary mask that strongly captures both black Hán Nôm ink and red cursive Quốc ngữ ink,
        while suppressing light notebook grid/ruling lines.
        Returns (binary_ink_mask, red_chrominance_map).
        """
        g = roi_bgr[:, :, 1].astype(np.int16)
        r = roi_bgr[:, :, 2].astype(np.int16)

        bg_g = float(np.percentile(g, 85))
        dark_ink = (bg_g - g) > max(28.0, (bg_g - float(np.percentile(g, 5))) * 0.22)

        red_diff = np.clip(r - g, 0, 255).astype(np.uint8)
        red_ink = (red_diff > 24) & ((bg_g - g) > 15.0)

        combined = ((dark_ink | red_ink).astype(np.uint8)) * 255

        # Remove thin horizontal notebook ruling lines
        h_roi, w_roi = combined.shape
        rule_len = max(60, int(w_roi * 0.35))
        horiz_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (rule_len, 1))
        ruling_lines = cv2.morphologyEx(combined, cv2.MORPH_OPEN, horiz_kernel)
        cleaned_ink = cv2.subtract(combined, ruling_lines)

        open_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        cleaned_ink = cv2.morphologyEx(cleaned_ink, cv2.MORPH_OPEN, open_kernel)

        return cleaned_ink, red_diff

    def segment_t2b_lines(self, img_path: Path) -> Dict[str, List[dict]]:
        """
        Segment horizontal text lines and produce tight 4-point bounding boxes for Nôm (ch) and Quốc ngữ (vi)
        strictly adhering to guide/Quy_định_đồ_án.pdf.
        """
        img = cv2_imread_unicode(img_path)
        if img is None:
            return {"ch": [], "vi": []}

        h, w, _ = img.shape
        fname_lower = img_path.name.lower()

        # Case 1: Side-by-side table layout (Tế cô hồn văn SV4.0 Tuệ Phương)
        if "tế cô hồn" in fname_lower or ("sv4.0" in fname_lower) or (w > h * 1.15 and "thơ" not in fname_lower and "tìbà" not in fname_lower):
            return self._segment_side_by_side_table(img)

        margin_x = self.detect_margin_x(img)
        right_limit = int(w * 0.975)

        top_cut = int(h * 0.045)
        bot_cut = int(h * 0.96)
        main_area = img[top_cut:bot_cut, margin_x:right_limit]

        ink_mask, red_diff = self._build_ink_binary(main_area)

        close_w = max(25, int((right_limit - margin_x) * 0.035))
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (close_w, 3))
        closed = cv2.morphologyEx(ink_mask, cv2.MORPH_CLOSE, kernel)

        h_proj = (closed > 0).sum(axis=1)
        raw_ink_proj = (ink_mask > 0).sum(axis=1)
        min_pixels = max(18, int((right_limit - margin_x) * 0.015))
        min_line_h = max(14, int(h * 0.009))

        raw_spans: List[Tuple[int, int]] = []
        in_line = False
        start_y = 0
        for y, val in enumerate(h_proj):
            if val >= min_pixels and not in_line:
                in_line = True
                start_y = y
            elif val < min_pixels and in_line:
                in_line = False
                if (y - start_y) >= 8:
                    raw_spans.append((start_y, y))
        if in_line and (len(h_proj) - start_y) >= 8:
            raw_spans.append((start_y, len(h_proj)))

        # Step A: Merge tiny cursive descender slivers (< 2.1% page height and within 16px of line above)
        merged_spans: List[Tuple[int, int]] = []
        for sy, ey in raw_spans:
            span_h = ey - sy
            if merged_spans and span_h < int(h * 0.021) and (sy - merged_spans[-1][1]) <= 16:
                prev_sy, _ = merged_spans[-1]
                merged_spans[-1] = (prev_sy, ey)
            elif span_h >= min_line_h:
                merged_spans.append((sy, ey))

        # Step B: Multi-pass split for spans containing 2 or 3 touching lines
        max_single_line_h = int(h * 0.062)
        current_spans = list(merged_spans)
        for _ in range(3):
            next_spans: List[Tuple[int, int]] = []
            changed = False
            for sy, ey in current_spans:
                span_h = ey - sy
                should_split = span_h > max_single_line_h
                if not should_split and span_h >= int(h * 0.036):
                    mid_y = (sy + ey) // 2
                    top_ink = ink_mask[sy:mid_y, :] > 0
                    bot_ink = ink_mask[mid_y:ey, :] > 0
                    top_red = float(red_diff[sy:mid_y, :][top_ink].mean()) if top_ink.any() else 0.0
                    bot_red = float(red_diff[mid_y:ey, :][bot_ink].mean()) if bot_ink.any() else 0.0
                    if top_red < 16.0 and bot_red > 21.0:
                        should_split = True

                if should_split and span_h >= min_line_h * 2:
                    mid_start = sy + int(span_h * 0.22)
                    mid_end = sy + int(span_h * 0.78)
                    if mid_end > mid_start:
                        split_y = mid_start + int(np.argmin(raw_ink_proj[mid_start:mid_end]))
                        if (split_y - sy) >= min_line_h and (ey - split_y) >= min_line_h:
                            next_spans.append((sy, split_y))
                            next_spans.append((split_y, ey))
                            changed = True
                            continue
                next_spans.append((sy, ey))
            current_spans = next_spans
            if not changed:
                break
        refined_spans = current_spans

        line_items = []
        for sy, ey in refined_spans:
            line_ink = ink_mask[sy:ey, :]
            col_proj = (line_ink > 0).sum(axis=0)
            active_cols = np.where(col_proj >= 2)[0]
            if len(active_cols) == 0:
                continue

            gaps = np.diff(active_cols)
            large_gap_indices = np.where(gaps > int((right_limit - margin_x) * 0.18))[0]
            if len(large_gap_indices) > 0:
                segments = np.split(active_cols, large_gap_indices + 1)
                segments = [s for s in segments if len(s) >= 8]
                if not segments:
                    continue
                active_cols = np.concatenate(segments)

            row_proj = (line_ink[:, active_cols[0]:active_cols[-1] + 1] > 0).sum(axis=1)
            active_rows = np.where(row_proj >= 2)[0]
            if len(active_rows) == 0:
                continue

            ty1 = max(0, sy + int(active_rows[0]) - 4) + top_cut
            ty2 = min(h, sy + int(active_rows[-1]) + 5) + top_cut
            tx1 = max(margin_x, margin_x + int(active_cols[0]) - 6)
            tx2 = min(w - 5, margin_x + int(active_cols[-1]) + 6)

            if (tx2 - tx1) < 25 or (ty2 - ty1) < 12:
                continue

            if (ty1 < int(h * 0.08) or ty2 > int(h * 0.92)) and (tx2 - tx1) < int(w * 0.12):
                continue

            box_ink = ink_mask[sy:ey, active_cols[0]:active_cols[-1] + 1] > 0
            box_red = red_diff[sy:ey, active_cols[0]:active_cols[-1] + 1]
            mean_red_diff = float(box_red[box_ink].mean()) if box_ink.any() else 0.0

            line_items.append({
                "points": [[tx1, ty1], [tx2, ty1], [tx2, ty2], [tx1, ty2]],
                "y_center": (ty1 + ty2) / 2.0,
                "mean_red": mean_red_diff,
                "width": tx2 - tx1,
                "height": ty2 - ty1
            })

        if not line_items:
            return {"ch": [], "vi": []}

        # Case 2: Top-Nôm / Bottom-Quốc-ngữ layout (ThoNomHoXuanHuongHoangXuanHanSuuTapVaGhiChu)
        if "thonomhoxuanhuonghoangxuanhan" in fname_lower:
            ch_boxes = []
            vi_boxes = []
            split_idx = len(line_items) // 2
            for i in range(2, len(line_items) - 1):
                gap = line_items[i + 1]["points"][0][1] - line_items[i]["points"][2][1]
                if gap > int(h * 0.035):
                    split_idx = i
                    break
            for idx, item in enumerate(line_items):
                b = {"points": item["points"], "y_center": item["y_center"]}
                if idx <= split_idx:
                    ch_boxes.append(b)
                else:
                    vi_boxes.append(b)
            return {"ch": ch_boxes, "vi": vi_boxes}

        # Case 3: Red + Black ink differentiation (Yale student notebooks: black = Hán Nôm, red = Quốc ngữ)
        red_scores = [item["mean_red"] for item in line_items]
        has_red_ink_lines = any(r > 22.0 for r in red_scores)
        has_black_ink_lines = any(r < 16.0 for r in red_scores)

        ch_boxes = []
        vi_boxes = []

        if has_red_ink_lines and has_black_ink_lines:
            threshold_red = 18.5
            for item in line_items:
                b = {"points": item["points"], "y_center": item["y_center"]}
                if item["mean_red"] >= threshold_red:
                    vi_boxes.append(b)
                else:
                    ch_boxes.append(b)
        elif all(r < 16.0 for r in red_scores) and ("digcoll" in fname_lower or "ca trù" in fname_lower or "ca tru" in fname_lower):
            for item in line_items:
                ch_boxes.append({"points": item["points"], "y_center": item["y_center"]})
        else:
            for idx, item in enumerate(line_items):
                b = {"points": item["points"], "y_center": item["y_center"]}
                if idx % 2 == 0:
                    ch_boxes.append(b)
                else:
                    vi_boxes.append(b)

        return {"ch": ch_boxes, "vi": vi_boxes}

    def _segment_side_by_side_table(self, img: np.ndarray) -> Dict[str, List[dict]]:
        """
        Segment side-by-side parallel table pages (e.g. Tế cô hồn văn SV4.0 Tuệ Phương).
        """
        h, w, _ = img.shape
        top_cut = int(h * 0.05)
        bot_cut = int(h * 0.95)
        nom_x1, nom_x2 = int(w * 0.135), int(w * 0.415)
        qn_x1, qn_x2 = int(w * 0.420), int(w * 0.920)

        roi = img[top_cut:bot_cut, nom_x1:qn_x2]
        ink_mask, _ = self._build_ink_binary(roi)

        h_proj = (ink_mask > 0).sum(axis=1)
        min_row_pixels = max(12, int((qn_x2 - nom_x1) * 0.01))
        min_row_h = max(12, int(h * 0.012))

        rows = []
        in_row = False
        sy = 0
        for y, val in enumerate(h_proj):
            if val >= min_row_pixels and not in_row:
                in_row = True
                sy = y
            elif val < min_row_pixels and in_row:
                in_row = False
                if (y - sy) >= min_row_h:
                    rows.append((sy, y))
        if in_row and (len(h_proj) - sy) >= min_row_h:
            rows.append((sy, len(h_proj)))

        ch_boxes = []
        vi_boxes = []
        nom_w = nom_x2 - nom_x1

        for sy, ey in rows:
            nom_cell = ink_mask[sy:ey, :nom_w]
            nom_cols = np.where((nom_cell > 0).sum(axis=0) >= 2)[0]
            if len(nom_cols) > 0:
                nom_rows = np.where((nom_cell[:, nom_cols[0]:nom_cols[-1] + 1] > 0).sum(axis=1) >= 2)[0]
                if len(nom_rows) > 0:
                    x1 = nom_x1 + int(nom_cols[0]) - 4
                    x2 = nom_x1 + int(nom_cols[-1]) + 4
                    y1 = top_cut + sy + int(nom_rows[0]) - 3
                    y2 = top_cut + sy + int(nom_rows[-1]) + 4
                    ch_boxes.append({
                        "points": [[x1, y1], [x2, y1], [x2, y2], [x1, y2]],
                        "y_center": (y1 + y2) / 2.0
                    })

            qn_cell = ink_mask[sy:ey, (qn_x1 - nom_x1):]
            qn_cols = np.where((qn_cell > 0).sum(axis=0) >= 2)[0]
            if len(qn_cols) > 0:
                qn_rows = np.where((qn_cell[:, qn_cols[0]:qn_cols[-1] + 1] > 0).sum(axis=1) >= 2)[0]
                if len(qn_rows) > 0:
                    x1 = qn_x1 + int(qn_cols[0]) - 4
                    x2 = qn_x1 + int(qn_cols[-1]) + 4
                    y1 = top_cut + sy + int(qn_rows[0]) - 3
                    y2 = top_cut + sy + int(qn_rows[-1]) + 4
                    vi_boxes.append({
                        "points": [[x1, y1], [x2, y1], [x2, y2], [x1, y2]],
                        "y_center": (y1 + y2) / 2.0
                    })

        return {"ch": ch_boxes, "vi": vi_boxes}

    def segment_vertical_nom_columns(self, img_path: Path) -> List[dict]:
        """
        Segment vertical Sino-Nom columns (Tnom, Tnomw, T1/T2 vertical) adhering to regulation:
        - Level: Vertical columns (cột dọc).
        - Ordering: RIGHT-TO-LEFT, TOP-TO-BOTTOM (từ phải sang trái, từ trên xuống dưới).
        - Excludes outer woodblock borders and margin frame lines.
        - Exactly 4 points per polygon.
        """
        img = cv2_imread_unicode(img_path)
        if img is None:
            return []

        h, w, _ = img.shape
        gray_full = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, thresh_full = cv2.threshold(gray_full, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        # Detect top and bottom woodblock border bars if present (continuous horizontal line > 68% width)
        row_density = (thresh_full > 0).sum(axis=1) / float(w)
        top_candidates = np.where(row_density[int(h * 0.04):int(h * 0.22)] > 0.68)[0]
        bot_candidates = np.where(row_density[int(h * 0.78):int(h * 0.96)] > 0.68)[0]

        pad_y_top = int(h * 0.04) + int(top_candidates[-1]) + 12 if len(top_candidates) > 0 else int(h * 0.09)
        pad_y_bot = int(h * 0.75) + int(bot_candidates[0]) - 12 if len(bot_candidates) > 0 else int(h * 0.91)
        if pad_y_bot <= pad_y_top + int(h * 0.3):
            pad_y_top, pad_y_bot = int(h * 0.09), int(h * 0.91)

        pad_x = int(w * 0.065)
        roi_thresh = thresh_full[pad_y_top:pad_y_bot, pad_x:w - pad_x]
        rh, rw = roi_thresh.shape

        # Remove thin vertical/horizontal ruling lines inside the frame
        vert_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(80, int(rh * 0.55))))
        vert_lines = cv2.morphologyEx(roi_thresh, cv2.MORPH_OPEN, vert_kernel)
        text_only = cv2.subtract(roi_thresh, vert_lines)

        col_proj = (text_only > 0).sum(axis=0)
        # Smooth projection slightly
        col_proj_smooth = np.convolve(col_proj, np.ones(5) / 5.0, mode="same")
        min_col_ink = max(14, int(rh * 0.04))
        min_col_w = max(22, int(rw * 0.025))
        max_single_col_w = int(rw * 0.085)

        col_spans: List[Tuple[int, int]] = []
        in_col = False
        sx = 0
        for x, val in enumerate(col_proj_smooth):
            if val >= min_col_ink and not in_col:
                in_col = True
                sx = x
            elif val < min_col_ink and in_col:
                in_col = False
                if (x - sx) >= min_col_w:
                    col_spans.append((sx, x))
        if in_col and (len(col_proj_smooth) - sx) >= min_col_w:
            col_spans.append((sx, len(col_proj_smooth)))

        # Recursively split wide merged column spans at local projection minima
        for _ in range(4):
            next_cols: List[Tuple[int, int]] = []
            changed = False
            for sx, ex in col_spans:
                cw = ex - sx
                if cw > max_single_col_w and cw >= min_col_w * 2:
                    ms = sx + int(cw * 0.22)
                    me = sx + int(cw * 0.78)
                    if me > ms:
                        split_x = ms + int(np.argmin(col_proj_smooth[ms:me]))
                        if (split_x - sx) >= min_col_w and (ex - split_x) >= min_col_w:
                            next_cols.append((sx, split_x))
                            next_cols.append((split_x, ex))
                            changed = True
                            continue
                next_cols.append((sx, ex))
            col_spans = next_cols
            if not changed:
                break

        raw_boxes = []
        for sx, ex in col_spans:
            col_slice = text_only[:, sx:ex]
            row_proj = (col_slice > 0).sum(axis=1)
            active_rows = np.where(row_proj >= 3)[0]
            if len(active_rows) == 0:
                continue
            sy = int(active_rows[0])
            ey = int(active_rows[-1])
            if (ey - sy) < int(rh * 0.12):
                continue

            x1 = max(0, pad_x + sx - 3)
            x2 = min(w, pad_x + ex + 3)
            y1 = max(0, pad_y_top + sy - 4)
            y2 = min(h, pad_y_top + ey + 4)
            raw_boxes.append((x1, y1, x2, y2))

        # Sort strictly RIGHT-TO-LEFT (x descending), then TOP-TO-BOTTOM (y ascending)
        sorted_boxes = sorted(raw_boxes, key=lambda b: (-b[0], b[1]))

        nom_boxes = []
        for x1, y1, x2, y2 in sorted_boxes:
            nom_boxes.append({
                "points": [[x1, y1], [x2, y1], [x2, y2], [x1, y2]],
                "x_center": (x1 + x2) / 2.0,
                "y_center": (y1 + y2) / 2.0
            })
        return nom_boxes
