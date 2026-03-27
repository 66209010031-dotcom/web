-- ============================================================
-- ระบบประเมินบุคลากร — Database Schema
-- Engine: MySQL 8.0+  |  Charset: utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS eval_system
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eval_system;

-- 1. ผู้ใช้งาน
CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(20)  UNIQUE NOT NULL,
  full_name   VARCHAR(100) NOT NULL,
  email       VARCHAR(100) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('admin','staff','evaluator') NOT NULL DEFAULT 'staff',
  department  VARCHAR(100),
  position    VARCHAR(100),
  phone       VARCHAR(20),
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. รอบการประเมิน
CREATE TABLE evaluation_periods (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  status      ENUM('draft','active','closed') NOT NULL DEFAULT 'draft',
  created_by  INT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 3. หมวดหมู่ตัวชี้วัด
CREATE TABLE categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  period_id   INT NOT NULL,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  FOREIGN KEY (period_id) REFERENCES evaluation_periods(id) ON DELETE CASCADE
);

-- 4. ตัวชี้วัด
CREATE TABLE indicators (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  category_id    INT NOT NULL,
  name           VARCHAR(300) NOT NULL,
  description    TEXT,
  weight         DECIMAL(5,2) NOT NULL DEFAULT 0,
  score_type     ENUM('yes_no','scale') NOT NULL DEFAULT 'scale',
  allow_evidence TINYINT(1) NOT NULL DEFAULT 1,
  sort_order     INT NOT NULL DEFAULT 0,
  scale_1_desc   VARCHAR(300) DEFAULT 'ต่ำกว่าคาดหวังมาก',
  scale_2_desc   VARCHAR(300) DEFAULT 'ต่ำกว่าคาดหวัง',
  scale_3_desc   VARCHAR(300) DEFAULT 'ตามคาดหวัง',
  scale_4_desc   VARCHAR(300) DEFAULT 'สูงกว่าคาดหวัง',
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 5. ผู้รับการประเมิน
CREATE TABLE evaluatees (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  period_id    INT NOT NULL,
  user_id      INT NOT NULL,
  status       ENUM('pending','self_done','evaluating','completed') NOT NULL DEFAULT 'pending',
  submitted_at DATETIME,
  UNIQUE KEY uq_period_user (period_id, user_id),
  FOREIGN KEY (period_id) REFERENCES evaluation_periods(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)
);

-- 6. การมอบหมายกรรมการ
CREATE TABLE evaluator_assignments (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  evaluatee_id INT NOT NULL,
  evaluator_id INT NOT NULL,
  role         ENUM('chair','member') NOT NULL DEFAULT 'member',
  UNIQUE KEY uq_assign (evaluatee_id, evaluator_id),
  FOREIGN KEY (evaluatee_id) REFERENCES evaluatees(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluator_id) REFERENCES users(id)
);

-- 7. คะแนนประเมินตนเอง
CREATE TABLE self_scores (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  evaluatee_id INT NOT NULL,
  indicator_id INT NOT NULL,
  score        DECIMAL(3,1) NOT NULL,
  note         TEXT,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_self_score (evaluatee_id, indicator_id),
  FOREIGN KEY (evaluatee_id) REFERENCES evaluatees(id) ON DELETE CASCADE,
  FOREIGN KEY (indicator_id) REFERENCES indicators(id)
);

-- 8. หลักฐาน
CREATE TABLE evidences (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  evaluatee_id  INT NOT NULL,
  indicator_id  INT NOT NULL,
  type          ENUM('pdf','image','url') NOT NULL,
  file_path     VARCHAR(500),
  url           VARCHAR(500),
  original_name VARCHAR(255),
  uploaded_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evaluatee_id) REFERENCES evaluatees(id) ON DELETE CASCADE,
  FOREIGN KEY (indicator_id) REFERENCES indicators(id)
);

-- 9. คะแนนจากกรรมการ
CREATE TABLE evaluator_scores (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  indicator_id  INT NOT NULL,
  score         DECIMAL(3,1) NOT NULL,
  note          TEXT,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_eval_score (assignment_id, indicator_id),
  FOREIGN KEY (assignment_id) REFERENCES evaluator_assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (indicator_id)  REFERENCES indicators(id)
);

-- 10. ความเห็นสรุปจากกรรมการ
CREATE TABLE evaluator_summaries (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id   INT NOT NULL UNIQUE,
  strengths       TEXT,
  improvements    TEXT,
  overall_comment TEXT,
  is_submitted    TINYINT(1) NOT NULL DEFAULT 0,
  submitted_at    DATETIME,
  FOREIGN KEY (assignment_id) REFERENCES evaluator_assignments(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_evaluatees_period  ON evaluatees(period_id);
CREATE INDEX idx_evaluatees_user    ON evaluatees(user_id);
CREATE INDEX idx_self_evaluatee     ON self_scores(evaluatee_id);
CREATE INDEX idx_eval_assignment    ON evaluator_scores(assignment_id);
CREATE INDEX idx_evidences_eval     ON evidences(evaluatee_id);
