// routes/evaluatees.js
const router = require('express').Router();
const db     = require('../config/db');
const auth   = require('../middleware/auth');
const { requireRole } = auth;

// GET /api/evaluatees?period_id=1
router.get('/', auth, async (req, res) => {
  try {
    const { period_id } = req.query;
    let query = `
      SELECT e.*, u.full_name, u.employee_id, u.department, u.position, u.email,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT(
          'assignment_id', ea.id,
          'evaluator_id',  ea.evaluator_id,
          'role',          ea.role,
          'full_name',     eu.full_name
        )) FROM evaluator_assignments ea
         JOIN users eu ON eu.id = ea.evaluator_id
         WHERE ea.evaluatee_id = e.id) AS evaluators
      FROM evaluatees e
      JOIN users u ON u.id = e.user_id
    `;
    const params = [];
    if (period_id) { query += ' WHERE e.period_id = ?'; params.push(period_id); }
    query += ' ORDER BY u.full_name';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/evaluatees/my — ดูรอบที่ตัวเองถูกประเมิน (Staff)
router.get('/my', auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.*, ep.title AS period_title, ep.start_date, ep.end_date, ep.status AS period_status
      FROM evaluatees e
      JOIN evaluation_periods ep ON ep.id = e.period_id
      WHERE e.user_id = ?
      ORDER BY e.id DESC
    `, [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/evaluatees/my-assignments — ดูรายการที่ตัวเองต้องประเมิน (Evaluator)
router.get('/my-assignments', auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT ea.id AS assignment_id, ea.role, ea.evaluatee_id,
             u.full_name, u.employee_id, u.department, u.position,
             ev.status, ev.submitted_at,
             ep.title AS period_title, ep.id AS period_id
      FROM evaluator_assignments ea
      JOIN evaluatees ev  ON ev.id  = ea.evaluatee_id
      JOIN users u        ON u.id   = ev.user_id
      JOIN evaluation_periods ep ON ep.id = ev.period_id
      WHERE ea.evaluator_id = ?
      ORDER BY ea.id DESC
    `, [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/evaluatees/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [[row]] = await db.query(`
      SELECT e.*, u.full_name, u.employee_id, u.department, u.position, u.email,
             ep.title AS period_title, ep.start_date, ep.end_date
      FROM evaluatees e
      JOIN users u ON u.id = e.user_id
      JOIN evaluation_periods ep ON ep.id = e.period_id
      WHERE e.id = ?
    `, [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูล' });
    res.json({ success: true, data: row });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/evaluatees — เพิ่มผู้รับการประเมิน
router.post('/', ...requireRole('admin'), async (req, res) => {
  const { period_id, user_id } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO evaluatees (period_id, user_id) VALUES (?, ?)',
      [period_id, user_id]
    );
    res.json({ success: true, id: r.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ success: false, message: 'ผู้ใช้นี้อยู่ในรอบการประเมินแล้ว' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/evaluatees/:id
router.delete('/:id', ...requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM evaluatees WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/evaluatees/:id/assignments — มอบหมายกรรมการ
router.post('/:id/assignments', ...requireRole('admin'), async (req, res) => {
  const { evaluator_id, role } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO evaluator_assignments (evaluatee_id, evaluator_id, role) VALUES (?,?,?)',
      [req.params.id, evaluator_id, role || 'member']
    );
    res.json({ success: true, id: r.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ success: false, message: 'กรรมการนี้ถูกมอบหมายแล้ว' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/evaluatees/assignments/:assignId
router.delete('/assignments/:assignId', ...requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM evaluator_assignments WHERE id=?', [req.params.assignId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/users/staff — ดึงรายชื่อ staff ทั้งหมด (สำหรับ admin เลือก)
router.get('/users/all', ...requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, employee_id, full_name, email, department, position, role FROM users WHERE is_active=1 ORDER BY full_name"
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
