# Sino-Nom and Vietnamese Quoc Ngu Parallel Dataset (Midterm)

## 1. Overview
This dataset contains digitized Sino-Nom (Han-Nom) literary documents and their aligned modern Vietnamese (Quoc Ngu) translations, curated for Natural Language Processing and Optical Character Recognition (OCR) tasks.

- Project: Sino-Nom & Quoc Ngu Parallel Corpus Construction
- Student IDs: 24127457, 24127192, 24127402, 24127445
- Total Document Entities: 24 (23 Scanned PDFs + 1 Text Translation)
- Total Scanned Pages: 2,569 pages
- Total Aligned Sentence Pairs: > 3,600 pairs

## 2. Directory Structure
```text
datasets-midterm/
|-- pdf/                          # Original scanned PDF files and reference text
|-- csv/                          # Aligned sentence pairs in CSV format (UTF-8 SIG)
|-- xlsx/                         # Aligned pairs in Excel format with dual sheets:
|                                 #   - Parallel Corpus (Color-coded: Black=Match, Red=Mismatch)
|                                 #   - Page_Classification (Metadata per page)
|-- audit_dataset_summary.csv     # Full dataset audit summary
`-- audit_dataset_summary.xlsx    # Full dataset audit summary spreadsheet
```

## 3. CSV Schema
- `img_id`: The source page image filename (e.g., `Lorem ipsum.024.jpg`).
- `sentence_id`: Unique identifier formatted as `<img_id_without_ext>.<sentence_number>`.
- `SinoNom_Char`: Cleaned Sino-Nom text (conjoined without unnecessary spacing).
- `ChuQN_txt`: Corresponding modern Vietnamese Quoc Ngu translation.

## 4. Book Layout Classifications
- `T2bw`: Bilingual handwritten notebooks on grid paper (Yale Collection).
- `T2b`: Parallel columns / interleaved woodblock prints.
- `T2w`: Handwritten Nom with parallel manuscript editions.
- `Tnom` / `Tqn`: Single script documents paired via sibling translation corpora.

## 5. License
Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0).
