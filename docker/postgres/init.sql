-- ==============================================================================
-- DATABASE INITIALIZATION SCRIPT FOR SINO-NOM PARALLEL CORPUS PLATFORM
-- PostgreSQL 16+
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    book_name VARCHAR(255) NOT NULL,
    student_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    original_pdf_name VARCHAR(255) NOT NULL,
    original_pdf_size BIGINT NOT NULL DEFAULT 0,
    minio_pdf_key VARCHAR(512),
    total_pages INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED', -- CREATED, PROCESSING, READY, COMPLETED, FAILED
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_book_name ON projects(book_name);

-- 2. Documents Table (PDFs, Updated PDFs, Metadata Manifests)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- ORIGINAL_PDF, UPDATED_PDF, MANIFEST_JSON
    minio_key VARCHAR(512) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    mime_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);

-- 3. Pages Table (Individual scanned manuscript pages)
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    page_id VARCHAR(10) NOT NULL, -- '001', '002'
    img_name VARCHAR(255) NOT NULL,
    minio_image_key VARCHAR(512) NOT NULL,
    minio_thumb_key VARCHAR(512),
    category VARCHAR(20) NOT NULL DEFAULT 'content', -- content, misc, blank, intro, ref, toc
    review_status VARCHAR(20) NOT NULL DEFAULT 'unreviewed', -- unreviewed, in_progress, approved, has_issues
    width INT NOT NULL DEFAULT 1400,
    height INT NOT NULL DEFAULT 1800,
    detected_ch INT NOT NULL DEFAULT 0,
    detected_vi INT NOT NULL DEFAULT 0,
    mismatched_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_project_page_number UNIQUE (project_id, page_number)
);

CREATE INDEX IF NOT EXISTS idx_pages_project_id ON pages(project_id);
CREATE INDEX IF NOT EXISTS idx_pages_category ON pages(category);
CREATE INDEX IF NOT EXISTS idx_pages_review_status ON pages(review_status);

-- 4. Pipeline Tasks Table (6-stage asynchronous task execution)
CREATE TABLE IF NOT EXISTS pipeline_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    celery_task_id VARCHAR(255),
    stage VARCHAR(50) NOT NULL, -- PREPROCESS, OCR, ALIGN, CLEAN, EVALUATE, EXPORT_PREP
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, QUEUED, RUNNING, COMPLETED, FAILED
    progress INT NOT NULL DEFAULT 0, -- 0 to 100
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    stage_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pipeline_tasks_project_id ON pipeline_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_tasks_stage ON pipeline_tasks(stage);
CREATE INDEX IF NOT EXISTS idx_pipeline_tasks_status ON pipeline_tasks(status);

-- 5. Bounding Boxes Table (Strict 4-point polygon format for PPOCRLabel)
CREATE TABLE IF NOT EXISTS bounding_boxes (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'box_ch_006_0'
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    sentence_id VARCHAR(255) NOT NULL,
    region_type VARCHAR(10) NOT NULL, -- 'ch' (Sino-Nom) or 'vi' (Quoc Ngu)
    transcription TEXT NOT NULL DEFAULT '',
    points JSONB NOT NULL, -- [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
    confidence NUMERIC(5, 4) DEFAULT 1.0000,
    status VARCHAR(20) NOT NULL DEFAULT 'matched', -- matched, mismatched, unverified
    is_modified BOOLEAN NOT NULL DEFAULT FALSE,
    revision_number INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bboxes_page_id ON bounding_boxes(page_id);
CREATE INDEX IF NOT EXISTS idx_bboxes_sentence_id ON bounding_boxes(sentence_id);
CREATE INDEX IF NOT EXISTS idx_bboxes_region_type ON bounding_boxes(region_type);

-- 6. Alignment Records Table (Strict 4 academic columns + metadata)
CREATE TABLE IF NOT EXISTS alignment_records (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'rec_6_1'
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    img_id VARCHAR(255) NOT NULL,
    sentence_id VARCHAR(255) NOT NULL, -- <img_id without .jpg>.<index>
    sino_nom_char TEXT NOT NULL,
    chu_qn_txt TEXT NOT NULL,
    page_number INT NOT NULL,
    line_index INT NOT NULL,
    is_matched BOOLEAN NOT NULL DEFAULT TRUE,
    color VARCHAR(10) NOT NULL DEFAULT 'BLACK', -- 'BLACK' or 'RED'
    char_statuses JSONB NOT NULL DEFAULT '[]'::jsonb,
    review_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, reviewed, approved
    editor_note TEXT DEFAULT '',
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    revision_number INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_project_sentence_id UNIQUE (project_id, sentence_id)
);

CREATE INDEX IF NOT EXISTS idx_alignments_project_id ON alignment_records(project_id);
CREATE INDEX IF NOT EXISTS idx_alignments_img_id ON alignment_records(img_id);
CREATE INDEX IF NOT EXISTS idx_alignments_color ON alignment_records(color);
CREATE INDEX IF NOT EXISTS idx_alignments_review_status ON alignment_records(review_status);

-- 7. Review Records (Tracking reviewer actions and approvals)
CREATE TABLE IF NOT EXISTS review_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    alignment_id VARCHAR(64) NOT NULL REFERENCES alignment_records(id) ON DELETE CASCADE,
    reviewer_id VARCHAR(100) NOT NULL DEFAULT 'linguist_expert',
    action VARCHAR(50) NOT NULL, -- APPROVE, REJECT, MODIFY_TEXT, MODIFY_BBOX
    previous_nom TEXT,
    new_nom TEXT,
    previous_qn TEXT,
    new_qn TEXT,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_review_records_project_id ON review_records(project_id);
CREATE INDEX IF NOT EXISTS idx_review_records_alignment_id ON review_records(alignment_id);

-- 8. Evaluation Metrics Table (Similarity score history)
CREATE TABLE IF NOT EXISTS evaluation_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    total_pages INT NOT NULL,
    processed_pages INT NOT NULL,
    total_aligned_pairs INT NOT NULL,
    total_sinonom_chars INT NOT NULL,
    total_vietnamese_words INT NOT NULL,
    validated_pairs INT NOT NULL,
    mismatched_chars INT NOT NULL,
    pending_reviews INT NOT NULL,
    similarity_score NUMERIC(5, 2) NOT NULL, -- Formula: (1 - N_mismatch / N_total) * 100
    is_similarity_passed BOOLEAN NOT NULL, -- >= 95.0%
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metrics_project_id ON evaluation_metrics(project_id);

-- 9. Export Jobs Table (Tracking final artifact packaging)
CREATE TABLE IF NOT EXISTS export_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    zip_name VARCHAR(255) NOT NULL, -- <MSSV1_MSSV2...>.zip
    minio_zip_key VARCHAR(512),
    file_size BIGINT DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'QUEUED', -- QUEUED, RUNNING, COMPLETED, FAILED
    validation_report JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_valid BOOLEAN NOT NULL DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_export_jobs_project_id ON export_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON export_jobs(status);

-- 10. Audit Logs Table (Full enterprise compliance tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id VARCHAR(64) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- PROJECT, PAGE, BOUNDING_BOX, ALIGNMENT, EXPORT
    entity_id VARCHAR(64) NOT NULL,
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, EVALUATE, EXPORT
    changes JSONB,
    actor_id VARCHAR(100) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_project_id ON audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
