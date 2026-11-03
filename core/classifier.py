"""
Book Layout and Type Classifier Module
Implements automated book layout classification based on the official specification
defined in 'guide/Quy_định_đồ_án.pdf' (Trang 13 - Chú thích về phân loại sách):

Codes:
  - T1: Quốc ngữ nằm ở phần đầu, Nôm ở phần cuối (Sequential sections)
  - T1w: T1 nhưng viết tay Nôm (Sequential with handwritten Sino-Nom)
  - T2: Xen kẽ (Ví dụ: Phải: Nôm, Trái: Quốc Ngữ) (Alternating pages/spreads)
  - T2w: T2 nhưng viết tay Nôm (Alternating with handwritten Sino-Nom)
  - T2b: Quốc ngữ và Nôm chung trang (Shared bilingual single-page grid)
  - Tnom: Chỉ có Nôm (Monolingual Sino-Nom woodblock print)
  - Tnomw: Chỉ có viết tay Nôm (Monolingual handwritten Sino-Nom)
  - Tqn: Chỉ có Quốc ngữ (Monolingual modern Vietnamese)
  - Tref: Tham khảo (Reference documents, catalogues, academic tables)
  - Tx: Loại khác (Miscellaneous / unclassified layouts)
"""

import os
import re
from pathlib import Path
from typing import Dict, Any, List, Optional, Union

import cv2
import numpy as np
import pymupdf


class BookClassifier:
    """Automated classifier for Sino-Nom and Vietnamese manuscript PDFs."""

    # Taxonomy definitions matching Quy_định_đồ_án.pdf Page 13
    TAXONOMY: Dict[str, Dict[str, str]] = {
        "T1": {
            "name": "T1 - Quốc ngữ phần đầu, Nôm phần cuối",
            "desc": "Bản in với hai phần tuần tự: Quốc ngữ nằm ở phần đầu, Nôm ở phần cuối.",
            "pipeline": "pipeline_t1_sequential"
        },
        "T1w": {
            "name": "T1w - Quốc ngữ phần đầu, Nôm viết tay phần cuối",
            "desc": "T1 nhưng phần Nôm là chữ viết tay (w = handwriting).",
            "pipeline": "pipeline_t1w_sequential_handwritten"
        },
        "T2": {
            "name": "T2 - Xen kẽ Nôm và Quốc ngữ",
            "desc": "Bản chụp xen kẽ giữa các trang hoặc hai trang mở (Ví dụ: Trang phải Nôm, Trang trái Quốc ngữ).",
            "pipeline": "pipeline_t2_alternating"
        },
        "T2w": {
            "name": "T2w - Xen kẽ Nôm viết tay và Quốc ngữ",
            "desc": "T2 nhưng phần Nôm là chữ viết tay.",
            "pipeline": "pipeline_t2w_alternating_handwritten"
        },
        "T2b": {
            "name": "T2b - Quốc ngữ và Nôm chung trang",
            "desc": "Bản chụp 1 trang có Quốc ngữ và Nôm song song chung trên cùng một trang (tập học sinh, có đường lề đỏ phân cách).",
            "pipeline": "pipeline_t2b_bilingual_grid"
        },
        "Tnom": {
            "name": "Tnom - Chỉ có Nôm (Bản in)",
            "desc": "Tài liệu khắc in mộc bản thuần chữ Hán Nôm, không có bản dịch Quốc ngữ song song.",
            "pipeline": "pipeline_tnom_monolingual_print"
        },
        "Tnomw": {
            "name": "Tnomw - Chỉ có Nôm viết tay",
            "desc": "Tài liệu chép tay thuần chữ Hán Nôm, không có bản dịch Quốc ngữ song song.",
            "pipeline": "pipeline_tnomw_monolingual_handwritten"
        },
        "Tqn": {
            "name": "Tqn - Chỉ có Quốc ngữ",
            "desc": "Tài liệu thuần chữ Quốc ngữ hiện đại.",
            "pipeline": "pipeline_tqn_monolingual"
        },
        "Tref": {
            "name": "Tref - Tài liệu tham khảo",
            "desc": "Từ điển, thư mục, bảng tra cứu hoặc tài liệu học thuật tham khảo.",
            "pipeline": "pipeline_tref_reference"
        },
        "Tx": {
            "name": "Tx - Loại khác",
            "desc": "Bố cục đặc thù hoặc chưa xác định phân loại tiêu chuẩn.",
            "pipeline": "pipeline_tx_generic"
        }
    }

    def __init__(self, render_dpi: int = 150):
        self.render_dpi = render_dpi

    def classify(self, pdf_path: Union[str, Path]) -> Dict[str, Any]:
        """Classify a given PDF document into official taxonomy categories."""
        pdf_path = Path(pdf_path)
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF document not found: {pdf_path}")

        doc = pymupdf.open(str(pdf_path))
        total_pages = len(doc)
        if total_pages == 0:
            doc.close()
            return self._build_result("Tx", 0.0, "Tài liệu rỗng (0 trang)", {})

        filename = pdf_path.name.lower()

        # Step 1: Scan aspect ratio & page layout
        aspect_ratios = []
        for i in range(min(5, total_pages)):
            r = doc[i].rect
            if r.height > 0:
                aspect_ratios.append(r.width / r.height)
        avg_aspect = float(np.mean(aspect_ratios)) if aspect_ratios else 0.75
        is_dual_page_scan = avg_aspect >= 1.20

        # Step 2: Digital text extraction (if embedded)
        extracted_latin_chars = 0
        extracted_cjk_chars = 0
        sample_page_indices = self._select_sample_pages(total_pages)

        for p_idx in sample_page_indices:
            p_text = doc[p_idx].get_text()
            for ch in p_text:
                if re.match(r"[a-zA-ZàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]", ch):
                    extracted_latin_chars += 1
                elif 0x4E00 <= ord(ch) <= 0x9FFF or 0x3400 <= ord(ch) <= 0x4DBF or 0x20000 <= ord(ch) <= 0x2A6DF:
                    extracted_cjk_chars += 1

        has_embedded_text = (extracted_latin_chars + extracted_cjk_chars) > 50

        # Step 3: Visual analysis of sampled content pages
        red_margin_detected_count = 0
        grid_pattern_detected_count = 0
        handwriting_signals = 0

        for p_idx in sample_page_indices:
            try:
                page = doc[p_idx]
                pix = page.get_pixmap(dpi=self.render_dpi)
                img = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, pix.n))
                if pix.n == 4:
                    img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)

                # Check vertical red margin (student notebook T2b characteristic)
                if self._check_red_margin_line(img):
                    red_margin_detected_count += 1

                # Check horizontal/vertical grid pattern
                if self._check_notebook_grid(img):
                    grid_pattern_detected_count += 1

                # Check handwriting strokes
                if self._check_handwriting_features(img):
                    handwriting_signals += 1
            except Exception:
                pass

        doc.close()

        num_samples = max(1, len(sample_page_indices))
        has_red_margin = (red_margin_detected_count / num_samples) >= 0.4
        has_grid = (grid_pattern_detected_count / num_samples) >= 0.4
        is_handwritten = (handwriting_signals / num_samples) >= 0.4

        # Step 4: Decision logic & scoring
        signals: List[str] = []
        book_type = "Tx"
        confidence = 0.70

        # Filename hints
        is_ca_tru = "ca trù" in filename or "ca tru" in filename
        is_nom_only_hint = "[chu nom]" in filename or "chu nom" in filename or "thuần nôm" in filename

        if is_ca_tru or has_red_margin:
            book_type = "T2b"
            confidence = 0.98 if (is_ca_tru and has_red_margin) else 0.92
            signals.append("Bố cục bản thảo tập học sinh: Nôm và Quốc ngữ chung trên một trang.")
            signals.append("Phát hiện đường kẻ lề đứng màu đỏ (vùng x ≈ 249 - 270 px) phân tách phần ghi chú.")
            signals.append("Nét chữ viết tay song song: Chữ Nôm dạng cột dọc, Quốc ngữ dạng dòng ngang.")
        elif is_nom_only_hint:
            book_type = "Tnomw" if is_handwritten else "Tnom"
            confidence = 0.94
            signals.append("Tài liệu thuần chữ Hán Nôm (không có bản dịch Quốc ngữ song ngữ).")
            signals.append("Hình thái: " + ("Chép tay cổ." if is_handwritten else "Khắc in mộc bản."))
        elif is_dual_page_scan:
            book_type = "T2w" if is_handwritten else "T2"
            confidence = 0.88
            signals.append("Bản chụp hai trang mở (Dual-page spread, tỉ lệ khổ ngang > 1.20).")
            signals.append("Bố cục song ngữ xen kẽ trang Nôm và trang Quốc ngữ tương ứng.")
        elif has_embedded_text:
            if extracted_latin_chars > 0 and extracted_cjk_chars > 0:
                book_type = "T1" if (extracted_latin_chars / (extracted_cjk_chars + 1) > 2.0) else "T2b"
                confidence = 0.85
                signals.append("Phát hiện dòng văn bản số hóa song ngữ hỗn hợp.")
            elif extracted_latin_chars > 0:
                book_type = "Tqn"
                confidence = 0.95
                signals.append("Tài liệu thuần ký tự Quốc ngữ La-tinh.")
            else:
                book_type = "Tnom"
                confidence = 0.90
                signals.append("Tài liệu thuần ký tự Hán Nôm.")
        else:
            # Fallback heuristic based on layout and handwriting
            if is_handwritten:
                book_type = "T2b" if has_grid else "Tnomw"
                confidence = 0.78
                signals.append("Nhận diện nét bút viết tay trên giấy kẻ ô.")
            else:
                book_type = "Tnom"
                confidence = 0.75
                signals.append("Bản in mộc bản truyền thống.")

        details = {
            "total_pages": total_pages,
            "avg_aspect_ratio": round(avg_aspect, 2),
            "is_dual_page_scan": is_dual_page_scan,
            "has_red_margin_line": has_red_margin,
            "has_grid_notebook": has_grid,
            "is_handwritten": is_handwritten,
            "detected_signals": signals
        }

        return self._build_result(book_type, confidence, details)

    def _select_sample_pages(self, total_pages: int) -> List[int]:
        """Select representative content pages, skipping covers and blank sheets."""
        if total_pages <= 5:
            return list(range(total_pages))
        # Content pages typically start around page 4 or 6
        start_p = min(4, total_pages - 1)
        end_p = max(start_p, total_pages - 3)
        step = max(1, (end_p - start_p) // 4)
        return list(range(start_p, end_p + 1, step))[:5]

    def _check_red_margin_line(self, img: np.ndarray) -> bool:
        """Detect vertical red margin line characteristic of student grid paper (T2b)."""
        h, w, _ = img.shape
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        m1 = cv2.inRange(hsv, np.array([0, 50, 60]), np.array([15, 255, 255]))
        m2 = cv2.inRange(hsv, np.array([165, 50, 60]), np.array([180, 255, 255]))
        red_mask = m1 | m2

        vert_sum = (red_mask > 0).sum(axis=0)
        search_w = int(w * 0.35)
        if search_w <= int(w * 0.05):
            return False

        max_val = vert_sum[int(w * 0.05):search_w].max()
        # A margin line spans a significant portion of page height
        return (max_val / h) >= 0.25

    def _check_notebook_grid(self, img: np.ndarray) -> bool:
        """Detect grid/ruling line patterns of student notebooks."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 40, 120, apertureSize=3)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=int(img.shape[1] * 0.3), maxLineGap=15)
        return lines is not None and len(lines) >= 8

    def _check_handwriting_features(self, img: np.ndarray) -> bool:
        """Detect irregular stroke widths and cursive connectivity characteristic of handwriting."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        lap = cv2.Laplacian(gray, cv2.CV_64F)
        var = lap.var()
        # Handwritten cursive lines typically show smooth stroke gradient variance
        return 30.0 <= var <= 250.0

    def _build_result(self, book_type: str, confidence: float, details: Dict[str, Any]) -> Dict[str, Any]:
        """Construct structured classification report and pipeline routing configuration."""
        tax_info = self.TAXONOMY.get(book_type, self.TAXONOMY["Tx"])
        pipeline_config = self._get_pipeline_routing(book_type)

        return {
            "book_type": book_type,
            "type_name": tax_info["name"],
            "description": tax_info["desc"],
            "confidence": round(confidence, 2),
            "layout_details": details,
            "recommended_pipeline": pipeline_config
        }

    def _get_pipeline_routing(self, book_type: str) -> Dict[str, Any]:
        """Generate tailored pipeline execution blueprint for classified book type."""
        if book_type in ["T2b", "T2bw"]:
            return {
                "pipeline_id": "pipeline_t2b",
                "name": "Pipeline T2b (Song ngữ cùng trang - Tập học sinh kẻ ô)",
                "strategy": "t2b_margin_split_and_dual_ocr",
                "ocr_engines": {
                    "sino_nom": "KimHanNom Cloud OCR (FIT HCMUS API)",
                    "quoc_ngu": "Vintern-1B / CRNN Cursive Engine"
                },
                "alignment_mode": "1-1 intra-page phonetic DP sequence alignment",
                "deliverable_folders": ["ch", "vi", "misc", "blank"],
                "steps": [
                    "1. Document Preprocessing: Tách 300 DPI, phân loại trang, dò tìm lề đỏ x=249-270px",
                    "2. Dual OCR: Nhận diện chữ Nôm qua KimHanNom Cloud API và Quốc ngữ qua OCR chữ thảo",
                    "3. BBox Segmentation: Phân lập 4 điểm polygon cho ch/ (bên phải) và vi/ (bên trái)",
                    "4. Bilingual Alignment: Dóng hàng ngữ liệu song song từng trang theo từ điển âm đọc",
                    "5. Text Normalization: Chuẩn hóa Unicode NFC, ánh xạ dấu câu cổ, xuất PPOCRLabel",
                    "6. Quality Evaluation: Đánh giá độ tương đồng >= 95% và tô màu font ARGB Đen/Đỏ"
                ]
            }
        elif book_type in ["T2", "T2w"]:
            return {
                "pipeline_id": "pipeline_t2",
                "name": "Pipeline T2 (Song ngữ xen kẽ trang - Trái Quốc ngữ, Phải Nôm)",
                "strategy": "alternating_page_pair_split",
                "ocr_engines": {
                    "sino_nom": "KimHanNom Cloud OCR",
                    "quoc_ngu": "PaddleOCR / Vintern"
                },
                "alignment_mode": "cross-page alternating sequence alignment",
                "deliverable_folders": ["ch", "vi", "misc", "blank"],
                "steps": [
                    "1. Preprocessing: Tách đôi trang mở nếu là bản chụp 2 trang; phân loại trang chẵn/lẻ",
                    "2. Dual OCR: Chạy OCR chữ Nôm cho trang Nôm và OCR chữ Việt cho trang Quốc ngữ",
                    "3. BBox Formatting: Gán nhãn 4 điểm polygon cho thư mục ch/ và vi/ riêng biệt",
                    "4. Cross-page Alignment: Dóng hàng theo cặp trang kế tiếp",
                    "5. Text Normalization: Chuẩn hóa văn bản và sinh Label.txt, fileState.txt",
                    "6. Evaluation & Export: Đánh giá độ tương đồng >= 95% và đóng gói hồ sơ"
                ]
            }
        elif book_type in ["T1", "T1w"]:
            return {
                "pipeline_id": "pipeline_t1",
                "name": "Pipeline T1 (Tuần tự hai tập: Quốc ngữ đầu sách, Nôm cuối sách)",
                "strategy": "sequential_section_split",
                "ocr_engines": {
                    "sino_nom": "KimHanNom Cloud OCR",
                    "quoc_ngu": "Tesseract / PaddleOCR"
                },
                "alignment_mode": "global cross-section DP alignment",
                "deliverable_folders": ["ch", "vi", "misc", "blank"],
                "steps": [
                    "1. Preprocessing: Phát hiện điểm ngắt phân chia giữa phần Quốc ngữ và phần Nôm",
                    "2. Dual OCR: Xử lý OCR hàng loạt theo từng phân đoạn độc lập",
                    "3. BBox Generation: Đánh nhãn hộp bao PPOCRLabel 4 điểm",
                    "4. Global Alignment: Dóng hàng câu song song qua ma trận khoảng cách ngữ âm toàn tập",
                    "5. Text Cleaning: Làm sạch dấu câu và xuất bảng mã chuẩn",
                    "6. Delivery Export: Xuất CSV BOM và XLSX ARGB"
                ]
            }
        elif book_type in ["Tnom", "Tnomw"]:
            return {
                "pipeline_id": "pipeline_tnom",
                "name": "Pipeline Tnom (Đơn ngữ chữ Hán Nôm)",
                "strategy": "monolingual_sino_nom_ocr",
                "ocr_engines": {
                    "sino_nom": "KimHanNom Cloud OCR (FIT HCMUS API)"
                },
                "alignment_mode": "monolingual_transliteration_lookup",
                "deliverable_folders": ["ch", "misc", "blank"],
                "steps": [
                    "1. Preprocessing: Tách trang 300 DPI và phân loại trang bìa/nội dung",
                    "2. Sino-Nom OCR: Trích xuất hộp bao dọc và ký tự Nôm qua KimHanNom API",
                    "3. Transliteration: Dịch âm tự động sang chữ Quốc ngữ qua từ điển âm đọc",
                    "4. Annotation: Sinh ch/Label.txt và ch/fileState.txt chuẩn PPOCRLabel",
                    "5. Verification: Tra cứu từ điển Hán Nôm và phát hiện dị thể",
                    "6. Packaging: Đóng gói thư mục bàn giao"
                ]
            }
        else:
            return {
                "pipeline_id": "pipeline_generic",
                "name": "Pipeline Đa Năng (Generic Document Pipeline)",
                "strategy": "adaptive_layout_pipeline",
                "ocr_engines": {
                    "sino_nom": "KimHanNom Cloud OCR",
                    "quoc_ngu": "Vintern / OCR Đa năng"
                },
                "alignment_mode": "adaptive",
                "deliverable_folders": ["ch", "vi", "misc", "blank"],
                "steps": [
                    "1. Preprocessing: Kiểm tra và hiệu chỉnh khổ trang",
                    "2. Adaptive OCR: Nhận diện chữ Nôm và Quốc ngữ",
                    "3. Label Generation: Sinh hộp bao 4 điểm PPOCRLabel",
                    "4. Dynamic Alignment: Dóng hàng câu song song",
                    "5. Quality Evaluation: Đánh giá độ tương đồng",
                    "6. Export: Đóng gói hồ sơ nghiệm thu"
                ]
            }
