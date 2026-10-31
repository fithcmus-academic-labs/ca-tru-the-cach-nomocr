# HƯỚNG DẪN CHẠY DỰ ÁN (USER GUIDE)
## Đồ án Xây dựng Ngữ liệu Song song Hán Nôm – Quốc ngữ

Tài liệu này hướng dẫn chi tiết cách cài đặt và chạy toàn bộ quy trình (pipeline) xử lý tự động từ đầu đến cuối trên một máy tính mới.

---

### 1. Yêu cầu hệ thống (Prerequisites)
* **Hệ điều hành**: Windows 10/11 hoặc Linux (Ubuntu 20.04/22.04 LTS).
* **Python**: Phiên bản 3.10 đến 3.12 (khuyến nghị Python 3.12).
* **RAM**: Tối thiểu 8 GB.
* **Bộ nhớ trống**: Tối thiểu 5 GB.

---

### 2. Thiết lập Môi trường (Environment Setup)

#### Bước 2.1: Tạo và kích hoạt môi trường ảo
```bash
# Trên Windows PowerShell
python -m venv venv
.\venv\Scripts\Activate.ps1

# Trên Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

#### Bước 2.2: Cài đặt các thư viện phụ thuộc (Pinned Dependencies)
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

### 3. Xây dựng Cơ sở Dữ liệu Từ điển Hán Nôm Offline
Hệ thống sử dụng dữ liệu chính thức từ **Unicode Consortium (Unihan)** và **Nôm Na Việt**. Chạy lệnh sau để tải và biên dịch kho từ điển:

```bash
python scripts/build_dictionary.py
```
*Kết quả sinh ra kho tra cứu offline tại `data/dicts/hannom_dict.pkl` và `data/dicts/hannom_dict.json` với hơn 27.000 ký tự Hán Nôm.*

---

### 4. Chạy Toàn bộ Pipeline Tự động (Run Pipeline)

#### Chạy cho một cuốn sách cụ thể (mặc định AB 160):
```bash
# Thiết lập biến môi trường và chạy
python scripts/run_pipeline.py --book AB_160
```

#### Chạy cho tất cả các bản sách trong đề tài:
```bash
python scripts/run_pipeline.py --book all
```

*Các tùy chọn sách khả dụng*:
* `AB_160`: Bản *Ca Trù Thê Cách, AB 160* (45 trang).
* `AB_431`: Bản *Ca Trù Thế Cách, AB 431* (41 trang).
* `AB_456`: Bản *Ca Trù Thế Cách, AB 456* (45 trang).
* `NOM_Y`: Bản *Ca Trù Thể Cách, Nôm_Y* (101 trang).
* `all`: Xử lý toàn bộ cả 4 cuốn.

---

### 5. Kiểm thử & Thẩm định Tiêu chuẩn Nộp bài (Verify Deliverables)

Sau khi pipeline hoàn tất, chạy script kiểm tra tính hợp lệ:
```bash
python scripts/verify_output.py
```
Script sẽ tự động kiểm tra:
1. Cấu trúc cây thư mục theo đúng quy chuẩn (`ch/`, `vi/`, `misc/`, `blank/`).
2. Định dạng file `Label.txt` và `fileState.txt` chuẩn **PPOCRLabel** (mỗi box đúng 4 điểm).
3. Định dạng file `.csv` (chuẩn UTF-8 with BOM, không lệch cột).
4. Định dạng file `.xlsx` (chuẩn format và màu sắc đen/đỏ).
5. Chỉ số độ tương đồng đạt chuẩn $\ge 95\%$.

---

### 6. Cấu trúc Kết quả Đầu ra (Output Directory)
Toàn bộ sản phẩm hoàn thiện được lưu trữ tại `output/<Tên sách>/` sẵn sàng nén thành file zip nộp bài:
```text
output/<Tên sách>/
|-- ch/
|   |-- <Tên sách>.<stt>.jpg
|   |-- Label.txt
|   `-- fileState.txt
|-- vi/
|   |-- <Tên sách>.<stt>.jpg
|   |-- Label.txt
|   `-- fileState.txt
|-- misc/
|-- blank/
|-- <Tên sách>.pdf
|-- <Tên sách>.csv
`-- <Tên sách>.xlsx
```
