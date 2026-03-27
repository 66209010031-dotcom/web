# 🏛️ ระบบประเมินบุคลากร (Personnel Evaluation System)

## 📋 ภาพรวมระบบ

ระบบประเมินบุคลากรแบบครบวงจร รองรับ 3 บทบาท:
- **Admin** — จัดการรอบ, ตัวชี้วัด, รายชื่อ, Dashboard
- **Staff** — ประเมินตนเอง, แนบหลักฐาน, ดูผล
- **Evaluator (กรรมการ)** — ให้คะแนน, เขียนสรุป

---

## 📁 โครงสร้างโปรเจกต์

```
eval-system/
├── database/
│   ├── schema.sql        ← สร้างตาราง
│   └── seed.sql          ← ข้อมูลตัวอย่าง
├── backend/              ← Node.js + Express API
│   ├── server.js
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── periods.js
│   │   ├── evaluatees.js
│   │   ├── scores.js
│   │   └── reports.js
│   └── utils/scoreCalculator.js
└── frontend/             ← React SPA
    └── src/
        ├── App.jsx
        ├── api/axios.js
        ├── context/AuthContext.jsx
        ├── components/Layout.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── admin/
            │   ├── Dashboard.jsx
            │   ├── Periods.jsx
            │   ├── Indicators.jsx
            │   └── Evaluatees.jsx
            ├── staff/
            │   ├── Dashboard.jsx
            │   ├── SelfEvaluation.jsx
            │   └── Result.jsx
            └── evaluator/
                ├── Dashboard.jsx
                ├── EvaluationForm.jsx
                └── Summary.jsx
```

---

## 🚀 วิธีติดตั้งและรัน

### ขั้นตอนที่ 1 — ติดตั้ง MySQL
```bash
# นำเข้า Database
mysql -u root -p < database/schema.sql
mysql -u root -p eval_system < database/seed.sql
```

### ขั้นตอนที่ 2 — ตั้งค่า Backend
```bash
cd backend

# คัดลอกไฟล์ .env
cp .env.example .env

# แก้ไข .env ตามการตั้งค่า MySQL ของคุณ
# DB_PASS=รหัสผ่าน MySQL ของคุณ

# ติดตั้ง dependencies
npm install

# รัน Server
npm start
# หรือ npm run dev (สำหรับ development)
```

### ขั้นตอนที่ 3 — ตั้งค่า Frontend
```bash
cd frontend

# ติดตั้ง dependencies
npm install

# รัน React App
npm start
```

### ขั้นตอนที่ 4 — เปิดเบราว์เซอร์
```
http://localhost:3000
```

---

## 🔑 บัญชีทดสอบ

| บทบาท     | Email                | รหัสผ่าน    |
|-----------|----------------------|-------------|
| Admin     | admin@eval.com       | password123 |
| Staff     | somchai@eval.com     | password123 |
| Staff     | somying@eval.com     | password123 |
| Staff     | wichai@eval.com      | password123 |
| Evaluator | chair@eval.com       | password123 |
| Evaluator | member@eval.com      | password123 |

---

## 🧮 สูตรคำนวณคะแนน

### ขั้นตอนที่ 1: แปลงคะแนนดิบเป็น 0-100
```
Yes/No  : มี = 100,  ไม่มี = 0
Scale   : (คะแนน ÷ 4) × 100
          1 = 25  |  2 = 50  |  3 = 75  |  4 = 100
```

### ขั้นตอนที่ 2: คำนวณคะแนนถ่วงน้ำหนัก
```
คะแนนถ่วงน้ำหนัก = (คะแนนปกติ × น้ำหนัก%) ÷ 100
คะแนนรวม = รวม คะแนนถ่วงน้ำหนักทุกตัวชี้วัด
```

### ขั้นตอนที่ 3: คะแนนจากกรรมการหลายคน
```
กรรมการผสม = ประธาน × 60% + กรรมการร่วม (เฉลี่ย) × 40%
```

### ขั้นตอนที่ 4: คะแนนสุดท้าย
```
คะแนนสุดท้าย = ประเมินตนเอง × 30% + กรรมการ × 70%
```

### เกรด
| ช่วงคะแนน | เกรด           |
|-----------|----------------|
| 90-100    | ดีเยี่ยม       |
| 75-89     | ดี             |
| 60-74     | พอใช้          |
| 0-59      | ต้องปรับปรุง   |

---

## 🌐 API Endpoints

### Auth
| Method | Path                    | คำอธิบาย            |
|--------|-------------------------|---------------------|
| POST   | /api/auth/login         | เข้าสู่ระบบ          |
| GET    | /api/auth/me            | ดูข้อมูลตัวเอง       |
| PUT    | /api/auth/profile       | แก้ไขโปรไฟล์         |

### Periods & Indicators
| Method | Path                                    | คำอธิบาย           |
|--------|-----------------------------------------|--------------------|
| GET    | /api/periods                            | รายการรอบ           |
| POST   | /api/periods                            | สร้างรอบ            |
| GET    | /api/periods/:id/categories             | ดูหมวด+ตัวชี้วัด   |
| POST   | /api/periods/indicators/create          | เพิ่มตัวชี้วัด      |

### Evaluatees
| Method | Path                              | คำอธิบาย                  |
|--------|-----------------------------------|---------------------------|
| GET    | /api/evaluatees                   | รายชื่อทั้งหมด             |
| GET    | /api/evaluatees/my                | รอบที่ตัวเองถูกประเมิน      |
| GET    | /api/evaluatees/my-assignments    | รายการที่กรรมการต้องประเมิน |

### Scores
| Method | Path                                    | คำอธิบาย                |
|--------|-----------------------------------------|-------------------------|
| GET    | /api/scores/self/:id                    | ดูคะแนน self            |
| POST   | /api/scores/self/:id                    | บันทึกคะแนน self        |
| POST   | /api/scores/self/:id/submit             | ส่งการประเมิน           |
| POST   | /api/scores/evidence/:id               | แนบหลักฐาน              |
| GET    | /api/scores/evaluator/:assignId        | ดูข้อมูลสำหรับกรรมการ   |
| POST   | /api/scores/evaluator/:assignId        | บันทึกคะแนนกรรมการ      |
| POST   | /api/scores/evaluator/:assignId/summary| บันทึกความเห็นสรุป      |
| GET    | /api/scores/summary/:id                | คำนวณคะแนนสุดท้าย       |

### Reports
| Method | Path                     | คำอธิบาย      |
|--------|--------------------------|----------------|
| GET    | /api/reports/pdf/:id     | Export PDF      |

---

## 🛠️ Technology Stack

| Layer    | Technology          |
|----------|---------------------|
| Frontend | React 18, React Router v6 |
| Backend  | Node.js, Express 4  |
| Database | MySQL 8.0           |
| Auth     | JWT (jsonwebtoken)  |
| Upload   | Multer              |
| PDF      | PDFKit              |
| Security | bcryptjs, helmet    |
