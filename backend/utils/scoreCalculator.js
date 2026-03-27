// utils/scoreCalculator.js

/**
 * แปลงคะแนนดิบ → 0-100
 * yes_no : มี(1)=100, ไม่มี(0)=0
 * scale  : 1→25, 2→50, 3→75, 4→100
 */
function normalizeScore(rawScore, scoreType) {
  if (scoreType === 'yes_no') return rawScore === 1 ? 100 : 0;
  if (scoreType === 'scale')  return (Number(rawScore) / 4) * 100;
  return 0;
}

/**
 * คำนวณคะแนนถ่วงน้ำหนัก
 * @param {Array} indicators [{id, name, weight, score_type, score}]
 */
function calculateWeightedScore(indicators) {
  const validItems = indicators.filter(i => i.score !== null && i.score !== undefined);
  const totalWeight = validItems.reduce((s, i) => s + Number(i.weight), 0);

  const breakdown = validItems.map(ind => {
    const norm     = normalizeScore(Number(ind.score), ind.score_type);
    const weighted = (norm * Number(ind.weight)) / 100;
    return {
      id:             ind.id,
      name:           ind.name,
      scoreType:      ind.score_type,
      weight:         Number(ind.weight),
      rawScore:       Number(ind.score),
      normalizedScore: Math.round(norm * 10) / 10,
      weightedScore:  Math.round(weighted * 100) / 100,
    };
  });

  const totalScore = breakdown.reduce((s, i) => s + i.weightedScore, 0);

  return {
    breakdown,
    totalWeight:  Math.round(totalWeight * 10) / 10,
    totalScore:   Math.round(totalScore * 10) / 10,
    grade:        getGrade(totalScore),
    answeredCount: validItems.length,
  };
}

function getGrade(score) {
  if (score >= 90) return { label: 'ดีเยี่ยม',       color: '#10b981', level: 4 };
  if (score >= 75) return { label: 'ดี',              color: '#84cc16', level: 3 };
  if (score >= 60) return { label: 'พอใช้',           color: '#f59e0b', level: 2 };
  return              { label: 'ต้องปรับปรุง',    color: '#ef4444', level: 1 };
}

/**
 * เฉลี่ยคะแนนกรรมการ: ประธาน=60%, กรรมการร่วม=40%
 */
function averageEvaluatorScores(results) {
  const chairs  = results.filter(r => r.role === 'chair');
  const members = results.filter(r => r.role === 'member');
  const avg     = arr => arr.length ? arr.reduce((s,v) => s + v.totalScore, 0) / arr.length : 0;
  if (!members.length) return avg(chairs);
  if (!chairs.length)  return avg(members);
  return avg(chairs) * 0.6 + avg(members) * 0.4;
}

/**
 * คะแนนสุดท้าย: Self=30%, กรรมการ=70%
 */
function calculateFinalScore(selfScore, evalScore) {
  return Math.round((selfScore * 0.3 + evalScore * 0.7) * 10) / 10;
}

module.exports = { normalizeScore, calculateWeightedScore, getGrade, averageEvaluatorScores, calculateFinalScore };
