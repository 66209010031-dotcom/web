// routes/periods.js
const router = require('express').Router();
const db     = require('../config/db');
const auth   = require('../middleware/auth');
const { requireRole } = auth;

// GET /api/periods
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM evaluation_periods ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/periods/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [[period]] = await db.query('SELECT * FROM evaluation_periods WHERE id=?', [req.params.id]);
    if (!period) return res.status(404).json({ success: false, message: 'ไม่พบรอบการประเมิน' });
    res.json({ success: true, data: period });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/periods
router.post('/', ...requireRole('admin'), async (req, res) => {
  const { title, description, start_date, end_date } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO evaluation_periods (title,description,start_date,end_date,created_by) VALUES (?,?,?,?,?)',
      [title, description, start_date, end_date, req.user.id]
    );
    res.json({ success: true, id: result.insertId, message: 'สร้างรอบการประเมินสำเร็จ' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/periods/:id
router.put('/:id', ...requireRole('admin'), async (req, res) => {
  const { title, description, start_date, end_date, status } = req.body;
  try {
    await db.query(
      'UPDATE evaluation_periods SET title=?,description=?,start_date=?,end_date=?,status=? WHERE id=?',
      [title, description, start_date, end_date, status, req.params.id]
    );
    res.json({ success: true, message: 'อัพเดตสำเร็จ' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/periods/:id
router.delete('/:id', ...requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM evaluation_periods WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'ลบสำเร็จ' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Categories ──────────────────────────────────────────────

// GET /api/periods/:id/categories
router.get('/:id/categories', auth, async (req, res) => {
  try {
    const [cats] = await db.query(
      'SELECT * FROM categories WHERE period_id=? ORDER BY sort_order', [req.params.id]
    );
    for (const cat of cats) {
      const [inds] = await db.query(
        'SELECT * FROM indicators WHERE category_id=? ORDER BY sort_order', [cat.id]
      );
      cat.indicators = inds;
    }
    res.json({ success: true, data: cats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/periods/:id/categories
router.post('/:id/categories', ...requireRole('admin'), async (req, res) => {
  const { name, description, sort_order } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO categories (period_id,name,description,sort_order) VALUES (?,?,?,?)',
      [req.params.id, name, description, sort_order || 0]
    );
    res.json({ success: true, id: r.insertId });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/periods/categories/:catId
router.put('/categories/:catId', ...requireRole('admin'), async (req, res) => {
  const { name, description, sort_order } = req.body;
  try {
    await db.query('UPDATE categories SET name=?,description=?,sort_order=? WHERE id=?',
      [name, description, sort_order, req.params.catId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/periods/categories/:catId
router.delete('/categories/:catId', ...requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM categories WHERE id=?', [req.params.catId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Indicators ──────────────────────────────────────────────

// POST /api/periods/indicators
router.post('/indicators/create', ...requireRole('admin'), async (req, res) => {
  const { category_id, name, description, weight, score_type, allow_evidence, sort_order,
          scale_1_desc, scale_2_desc, scale_3_desc, scale_4_desc } = req.body;
  try {
    const [r] = await db.query(
      `INSERT INTO indicators (category_id,name,description,weight,score_type,allow_evidence,
       sort_order,scale_1_desc,scale_2_desc,scale_3_desc,scale_4_desc) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [category_id, name, description, weight, score_type, allow_evidence ?? 1, sort_order || 0,
       scale_1_desc, scale_2_desc, scale_3_desc, scale_4_desc]
    );
    res.json({ success: true, id: r.insertId });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/periods/indicators/:indId
router.put('/indicators/:indId', ...requireRole('admin'), async (req, res) => {
  const { name, description, weight, score_type, allow_evidence, sort_order,
          scale_1_desc, scale_2_desc, scale_3_desc, scale_4_desc } = req.body;
  try {
    await db.query(
      `UPDATE indicators SET name=?,description=?,weight=?,score_type=?,allow_evidence=?,
       sort_order=?,scale_1_desc=?,scale_2_desc=?,scale_3_desc=?,scale_4_desc=? WHERE id=?`,
      [name, description, weight, score_type, allow_evidence, sort_order,
       scale_1_desc, scale_2_desc, scale_3_desc, scale_4_desc, req.params.indId]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/periods/indicators/:indId
router.delete('/indicators/:indId', ...requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM indicators WHERE id=?', [req.params.indId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
