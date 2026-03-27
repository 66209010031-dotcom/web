// routes/reports.js — Export PDF
const router = require('express').Router();
const db     = require('../config/db');
const auth   = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const { calculateWeightedScore, averageEvaluatorScores, calculateFinalScore, getGrade } = require('../utils/scoreCalculator');

// GET /api/reports/pdf/:evaluateeId
router.get('/pdf/:evaluateeId', auth, async (req, res) => {
  try {
    const [[info]] = await db.query(`
      SELECT e.*, u.full_name, u.employee_id, u.department, u.position,
             ep.title AS period_title
      FROM evaluatees e
      JOIN users u ON u.id = e.user_id
      JOIN evaluation_periods ep ON ep.id = e.period_id
      WHERE e.id = ?
    `, [req.params.evaluateeId]);

    const [indicators] = await db.query(`
      SELECT i.id, i.name, i.weight, i.score_type, c.name AS category_name,
             ss.score AS self_score
      FROM categories c JOIN indicators i ON i.category_id = c.id
      LEFT JOIN self_scores ss ON ss.indicator_id = i.id AND ss.evaluatee_id = ?
      WHERE c.period_id = (SELECT period_id FROM evaluatees WHERE id = ?)
      ORDER BY c.sort_order, i.sort_order
    `, [req.params.evaluateeId, req.params.evaluateeId]);

    const selfResult = calculateWeightedScore(indicators.map(i => ({ ...i, score: i.self_score })));

    const [assignments] = await db.query(
      `SELECT ea.id, ea.role, u.full_name AS evaluator_name
       FROM evaluator_assignments ea JOIN users u ON u.id = ea.evaluator_id
       WHERE ea.evaluatee_id = ?`, [req.params.evaluateeId]
    );

    const evalResults = await Promise.all(assignments.map(async a => {
      const [scores] = await db.query(
        `SELECT i.weight, i.score_type, es.score FROM evaluator_scores es
         JOIN indicators i ON i.id = es.indicator_id WHERE es.assignment_id = ?`, [a.id]
      );
      const r = calculateWeightedScore(scores);
      return { ...a, totalScore: r.totalScore };
    }));

    const evalAvg    = averageEvaluatorScores(evalResults);
    const finalScore = calculateFinalScore(selfResult.totalScore, evalAvg);
    const finalGrade = getGrade(finalScore);

    // Build PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="eval-${info.employee_id}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('Personnel Evaluation Report', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(info.period_title, { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // Staff info
    doc.font('Helvetica-Bold').text('Staff Information', { underline: true });
    doc.font('Helvetica')
       .text(`Name: ${info.full_name}   ID: ${info.employee_id}`)
       .text(`Department: ${info.department}   Position: ${info.position}`);
    doc.moveDown();

    // Score summary
    doc.font('Helvetica-Bold').text('Score Summary', { underline: true });
    doc.font('Helvetica')
       .text(`Self-evaluation Score: ${selfResult.totalScore.toFixed(1)} / 100`)
       .text(`Evaluator Average Score: ${evalAvg.toFixed(1)} / 100`)
       .text(`Final Score (Self 30% + Evaluator 70%): ${finalScore.toFixed(1)} / 100`)
       .text(`Grade: ${finalGrade.label}`);
    doc.moveDown();

    // Breakdown table header
    doc.font('Helvetica-Bold').text('Indicator Breakdown', { underline: true });
    doc.moveDown(0.3);

    let currentCat = '';
    indicators.forEach(ind => {
      if (ind.category_name !== currentCat) {
        currentCat = ind.category_name;
        doc.font('Helvetica-Bold').fontSize(10).text(`[ ${currentCat} ]`);
      }
      const score = ind.self_score ?? '-';
      doc.font('Helvetica').fontSize(9)
         .text(`  • ${ind.name}  (Weight: ${ind.weight}%)  Score: ${score}`, { indent: 20 });
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
