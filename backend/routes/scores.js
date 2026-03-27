// routes/scores.js
const router  = require('express').Router();
const db      = require('../config/db');
const auth    = require('../middleware/auth');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { calculateWeightedScore, averageEvaluatorScores, calculateFinalScore } = require('../utils/scoreCalculator');

// ── Multer ──────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads', String(req.params.evaluateeId));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/pdf|jpe?g|png|gif/i.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('ไฟล์ต้องเป็น PDF หรือรูปภาพ'));
  },
});

// ── Self Scores ─────────────────────────────────────────────

// GET /api/scores/self/:evaluateeId
router.get('/self/:evaluateeId', auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT i.id, i.name, i.description, i.weight, i.score_type, i.allow_evidence,
             i.scale_1_desc, i.scale_2_desc, i.scale_3_desc, i.scale_4_desc,
             c.name AS category_name, c.id AS category_id,
             ss.score, ss.note
      FROM categories c
      JOIN indicators i ON i.category_id = c.id
      LEFT JOIN self_scores ss ON ss.indicator_id = i.id AND ss.evaluatee_id = ?
      WHERE c.period_id = (SELECT period_id FROM evaluatees WHERE id = ?)
      ORDER BY c.sort_order, i.sort_order
    `, [req.params.evaluateeId, req.params.evaluateeId]);

    // ดึงหลักฐาน
    const [evs] = await db.query(
      'SELECT * FROM evidences WHERE evaluatee_id = ?', [req.params.evaluateeId]
    );

    const evMap = {};
    evs.forEach(e => {
      if (!evMap[e.indicator_id]) evMap[e.indicator_id] = [];
      evMap[e.indicator_id].push(e);
    });

    const data = rows.map(r => ({ ...r, evidences: evMap[r.id] || [] }));
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/scores/self/:evaluateeId
router.post('/self/:evaluateeId', auth, async (req, res) => {
  const { indicatorId, score, note } = req.body;
  try {
    await db.query(
      `INSERT INTO self_scores (evaluatee_id, indicator_id, score, note) VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE score=VALUES(score), note=VALUES(note)`,
      [req.params.evaluateeId, indicatorId, score, note || null]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/scores/self/:evaluateeId/submit
router.post('/self/:evaluateeId/submit', auth, async (req, res) => {
  try {
    await db.query(
      `UPDATE evaluatees SET status='self_done', submitted_at=NOW() WHERE id=?`,
      [req.params.evaluateeId]
    );
    res.json({ success: true, message: 'ส่งการประเมินตนเองเรียบร้อย' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/scores/evidence/:evaluateeId — แนบหลักฐาน
router.post('/evidence/:evaluateeId', auth, upload.single('file'), async (req, res) => {
  const { indicatorId, type, url } = req.body;
  try {
    if (type === 'url') {
      await db.query(
        'INSERT INTO evidences (evaluatee_id,indicator_id,type,url) VALUES (?,?,?,?)',
        [req.params.evaluateeId, indicatorId, 'url', url]
      );
    } else {
      await db.query(
        'INSERT INTO evidences (evaluatee_id,indicator_id,type,file_path,original_name) VALUES (?,?,?,?,?)',
        [req.params.evaluateeId, indicatorId, type || 'image', req.file.path, req.file.originalname]
      );
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/scores/evidence/:evidenceId
router.delete('/evidence/:evidenceId', auth, async (req, res) => {
  try {
    const [[ev]] = await db.query('SELECT * FROM evidences WHERE id=?', [req.params.evidenceId]);
    if (ev?.file_path && fs.existsSync(ev.file_path)) fs.unlinkSync(ev.file_path);
    await db.query('DELETE FROM evidences WHERE id=?', [req.params.evidenceId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Evaluator Scores ────────────────────────────────────────

// GET /api/scores/evaluator/:assignmentId
router.get('/evaluator/:assignmentId', auth, async (req, res) => {
  try {
    const [[assign]] = await db.query(`
      SELECT ea.*, u.full_name AS staff_name, u.employee_id, u.department, u.position,
             ev.status, ev.period_id
      FROM evaluator_assignments ea
      JOIN evaluatees ev ON ev.id = ea.evaluatee_id
      JOIN users u ON u.id = ev.user_id
      WHERE ea.id = ?
    `, [req.params.assignmentId]);

    const [indicators] = await db.query(`
      SELECT i.id, i.name, i.description, i.weight, i.score_type,
             i.scale_1_desc, i.scale_2_desc, i.scale_3_desc, i.scale_4_desc,
             c.name AS category_name,
             ss.score AS self_score, ss.note AS self_note,
             es.score AS eval_score, es.note AS eval_note
      FROM categories c
      JOIN indicators i ON i.category_id = c.id
      LEFT JOIN self_scores ss ON ss.indicator_id = i.id AND ss.evaluatee_id = ?
      LEFT JOIN evaluator_scores es ON es.indicator_id = i.id AND es.assignment_id = ?
      WHERE c.period_id = ?
      ORDER BY c.sort_order, i.sort_order
    `, [assign.evaluatee_id, req.params.assignmentId, assign.period_id]);

    const [evs] = await db.query(
      'SELECT * FROM evidences WHERE evaluatee_id = ?', [assign.evaluatee_id]
    );

    const [[summary]] = await db.query(
      'SELECT * FROM evaluator_summaries WHERE assignment_id=?', [req.params.assignmentId]
    );

    res.json({ success: true, data: { assign, indicators, evidences: evs, summary: summary || {} } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/scores/evaluator/:assignmentId
router.post('/evaluator/:assignmentId', auth, async (req, res) => {
  const { indicatorId, score, note } = req.body;
  try {
    await db.query(
      `INSERT INTO evaluator_scores (assignment_id,indicator_id,score,note) VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE score=VALUES(score), note=VALUES(note)`,
      [req.params.assignmentId, indicatorId, score, note || null]
    );

    // อัพเดต status เป็น evaluating
    const [[a]] = await db.query('SELECT evaluatee_id FROM evaluator_assignments WHERE id=?', [req.params.assignmentId]);
    await db.query(
      `UPDATE evaluatees SET status='evaluating' WHERE id=? AND status='self_done'`, [a.evaluatee_id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/scores/evaluator/:assignmentId/summary
router.post('/evaluator/:assignmentId/summary', auth, async (req, res) => {
  const { strengths, improvements, overall_comment, is_submitted } = req.body;
  try {
    await db.query(
      `INSERT INTO evaluator_summaries (assignment_id,strengths,improvements,overall_comment,is_submitted,submitted_at)
       VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE
       strengths=VALUES(strengths), improvements=VALUES(improvements),
       overall_comment=VALUES(overall_comment), is_submitted=VALUES(is_submitted),
       submitted_at=IF(VALUES(is_submitted)=1, NOW(), submitted_at)`,
      [req.params.assignmentId, strengths, improvements, overall_comment,
       is_submitted ? 1 : 0, is_submitted ? new Date() : null]
    );

    if (is_submitted) {
      const [[a]] = await db.query('SELECT evaluatee_id FROM evaluator_assignments WHERE id=?', [req.params.assignmentId]);
      // ตรวจว่ากรรมการทุกคนส่งแล้ว
      const [[{ total }]] = await db.query(
        'SELECT COUNT(*) AS total FROM evaluator_assignments WHERE evaluatee_id=?', [a.evaluatee_id]
      );
      const [[{ done }]] = await db.query(`
        SELECT COUNT(*) AS done FROM evaluator_assignments ea
        JOIN evaluator_summaries es ON es.assignment_id = ea.id
        WHERE ea.evaluatee_id = ? AND es.is_submitted = 1
      `, [a.evaluatee_id]);
      if (total === done) {
        await db.query(`UPDATE evaluatees SET status='completed' WHERE id=?`, [a.evaluatee_id]);
      }
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/scores/summary/:evaluateeId — คะแนนสรุปรายบุคคล
router.get('/summary/:evaluateeId', auth, async (req, res) => {
  try {
    const [indicators] = await db.query(`
      SELECT i.id, i.name, i.weight, i.score_type, c.name AS category_name,
             ss.score AS self_score
      FROM categories c
      JOIN indicators i ON i.category_id = c.id
      LEFT JOIN self_scores ss ON ss.indicator_id = i.id AND ss.evaluatee_id = ?
      WHERE c.period_id = (SELECT period_id FROM evaluatees WHERE id = ?)
      ORDER BY c.sort_order, i.sort_order
    `, [req.params.evaluateeId, req.params.evaluateeId]);

    const selfItems = indicators.map(i => ({ ...i, score: i.self_score }));
    const selfResult = calculateWeightedScore(selfItems);

    const [assignments] = await db.query(`
      SELECT ea.id, ea.role, u.full_name AS evaluator_name,
             es.is_submitted
      FROM evaluator_assignments ea
      JOIN users u ON u.id = ea.evaluator_id
      LEFT JOIN evaluator_summaries es ON es.assignment_id = ea.id
      WHERE ea.evaluatee_id = ?
    `, [req.params.evaluateeId]);

    const evalResults = await Promise.all(assignments.map(async a => {
      const [scores] = await db.query(`
        SELECT i.weight, i.score_type, es.score
        FROM evaluator_scores es JOIN indicators i ON i.id = es.indicator_id
        WHERE es.assignment_id = ?
      `, [a.id]);
      const r = calculateWeightedScore(scores.map(s => ({ ...s, score: s.score })));
      return { ...a, totalScore: r.totalScore, breakdown: r.breakdown };
    }));

    const evalAvg   = averageEvaluatorScores(evalResults);
    const finalScore = calculateFinalScore(selfResult.totalScore, evalAvg);
    const { getGrade } = require('../utils/scoreCalculator');

    res.json({
      success: true,
      data: {
        selfScore:        selfResult.totalScore,
        selfGrade:        selfResult.grade,
        selfBreakdown:    selfResult.breakdown.map((b,i) => ({ ...b, category_name: indicators[i]?.category_name })),
        evaluatorAvg:     Math.round(evalAvg * 10) / 10,
        finalScore,
        finalGrade:       getGrade(finalScore),
        evaluatorResults: evalResults,
        indicators,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
