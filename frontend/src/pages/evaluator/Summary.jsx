// pages/evaluator/Summary.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';

const CSS = `
  .profile-banner {
    background: linear-gradient(135deg, #0f2057, #1a56db);
    color: #fff; border-radius: 16px; padding: 24px 28px;
    display: flex; align-items: center; gap: 20px; margin-bottom: 24px;
    box-shadow: 0 8px 24px rgba(26,86,219,.25);
  }
  .avatar { width:56px; height:56px; border-radius:50%; background:rgba(255,255,255,.2); display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0; }
  .p-name { font-family:'Kanit',sans-serif; font-size:20px; font-weight:600; }
  .p-meta { font-size:13px; opacity:.75; margin-top:3px; }

  .score-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:24px; }
  .score-card { background:#fff; border-radius:14px; border:1px solid #e2e8f0; padding:20px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,.04); }
  .sc-label { font-size:12px; color:#94a3b8; margin-bottom:8px; }
  .sc-num   { font-family:'Kanit',sans-serif; font-size:38px; font-weight:700; line-height:1; }
  .sc-grade { display:inline-block; padding:3px 12px; border-radius:99px; font-size:12px; font-weight:600; margin-top:8px; }
  .sc-weight{ font-size:11px; color:#94a3b8; margin-top:6px; }

  .card { background:#fff; border-radius:14px; border:1px solid #e2e8f0; box-shadow:0 2px 8px rgba(0,0,0,.04); overflow:hidden; margin-bottom:20px; }
  .card-header { padding:16px 22px; border-bottom:1px solid #f1f5f9; display:flex; align-items:center; justify-content:space-between; }
  .card-title  { font-family:'Kanit',sans-serif; font-size:16px; font-weight:600; }

  table { width:100%; border-collapse:collapse; }
  thead tr { background:#f8faff; }
  th { padding:10px 16px; font-size:11px; font-weight:700; color:#94a3b8; text-align:left; text-transform:uppercase; letter-spacing:.06em; white-space:nowrap; }
  th.ctr, td.ctr { text-align:center; }
  td { padding:12px 16px; font-size:13px; border-bottom:1px solid #f8faff; color:#1e2a3b; }
  tr:last-child td { border-bottom:none; }
  tr:hover td { background:#fafbff; }
  .cat-row td { background:#eff6ff; font-weight:600; font-size:12px; color:#1a56db; }
  .total-row td { background:#f0fdf4; font-weight:700; }

  .sc-pill { display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:50%; font-weight:700; font-size:14px; font-family:'Kanit',sans-serif; }
  .diff-pos { color:#10b981; font-weight:600; }
  .diff-neg { color:#ef4444; font-weight:600; }
  .diff-zero{ color:#94a3b8; }

  .weight-bar { height:4px; background:#e2e8f0; border-radius:99px; overflow:hidden; margin-top:4px; }
  .weight-fill{ height:100%; background:#1a56db; border-radius:99px; }

  .summary-form { padding:20px 22px; }
  .field { margin-bottom:16px; }
  .field label { font-size:13px; font-weight:600; color:#374151; display:flex; align-items:center; gap:7px; margin-bottom:7px; }
  .field textarea { width:100%; padding:12px 14px; border:1.5px solid #e2e8f0; border-radius:10px; font-family:'Sarabun',sans-serif; font-size:14px; resize:vertical; min-height:100px; outline:none; color:#1e2a3b; line-height:1.6; transition:border-color .2s; }
  .field textarea:focus { border-color:#1a56db; }

  .action-bar { display:flex; align-items:center; justify-content:space-between; margin-top:16px; }
  .btn { padding:11px 22px; border-radius:9px; font-family:'Sarabun',sans-serif; font-size:14px; font-weight:600; cursor:pointer; border:none; transition:all .2s; display:inline-flex; align-items:center; gap:7px; }
  .btn-outline { background:#fff; border:1.5px solid #e2e8f0; color:#475569; }
  .btn-outline:hover { border-color:#1a56db; color:#1a56db; }
  .btn-draft  { background:#f1f5f9; color:#475569; }
  .btn-draft:hover { background:#e2e8f0; }
  .btn-submit { background:linear-gradient(135deg,#10b981,#059669); color:#fff; box-shadow:0 3px 10px rgba(16,185,129,.3); }
  .btn-submit:hover { transform:translateY(-1px); }
  .btn-pdf    { background:#fee2e2; color:#dc2626; }
  .btn-pdf:hover { background:#fecaca; }
  .btn-row { display:flex; gap:10px; }
  .btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
`;

function gradeColor(s) { return s>=90?'#10b981':s>=75?'#84cc16':s>=60?'#f59e0b':'#ef4444'; }
function gradeLabel(s) { return s>=90?'ดีเยี่ยม':s>=75?'ดี':s>=60?'พอใช้':'ต้องปรับปรุง'; }
function scColor(v,t)  { return t==='yes_no'?(v===1?'#10b981':'#ef4444'):({1:'#ef4444',2:'#f59e0b',3:'#84cc16',4:'#10b981'}[v]||'#94a3b8'); }

export default function EvaluatorSummary() {
  const { evaluateeId } = useParams();
  const navigate = useNavigate();

  const [data,    setData]    = useState(null);
  const [info,    setInfo]    = useState(null);
  const [summary, setSummary] = useState({ strengths:'', improvements:'', overall_comment:'' });
  const [saving,  setSaving]  = useState(false);
  const [myAssignId, setMyAssignId] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/scores/summary/${evaluateeId}`),
      api.get(`/evaluatees/${evaluateeId}`),
    ]).then(([sumRes, infoRes]) => {
      setData(sumRes.data.data);
      setInfo(infoRes.data.data);
    });

    api.get('/evaluatees/my-assignments').then(r => {
      const found = r.data.data.find(a => String(a.evaluatee_id) === String(evaluateeId));
      if (found) setMyAssignId(found.assignment_id);
    });
  }, [evaluateeId]);

  // Load existing summary for this evaluator
  useEffect(() => {
    if (!myAssignId) return;
    api.get(`/scores/evaluator/${myAssignId}`).then(r => {
      const s = r.data.data.summary;
      if (s && (s.strengths || s.improvements || s.overall_comment)) {
        setSummary({ strengths:s.strengths||'', improvements:s.improvements||'', overall_comment:s.overall_comment||'' });
      }
    });
  }, [myAssignId]);

  async function handleSave(submit) {
    if (!myAssignId) return;
    setSaving(true);
    await api.post(`/scores/evaluator/${myAssignId}/summary`, { ...summary, is_submitted: submit });
    setSaving(false);
    if (submit) navigate('/evaluator');
  }

  if (!data || !info) return (
    <Layout title="สรุปผลการประเมิน">
      <div style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>⏳ กำลังโหลด...</div>
    </Layout>
  );

  const { selfScore, evaluatorAvg, finalScore, selfBreakdown, evaluatorResults, indicators } = data;

  // group breakdown by category
  const grouped = {};
  (selfBreakdown||[]).forEach((item, idx) => {
    const cat = indicators?.[idx]?.category_name || item.category_name || 'ทั่วไป';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ ...item, category_name: cat });
  });

  return (
    <Layout title="สรุปผลการประเมินรายบุคคล" subtitle={info?.period_title}>
      <style>{CSS}</style>

      <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginBottom:18 }}>
        <button className="btn btn-outline" onClick={() => navigate(`/evaluator/form/${myAssignId}`)}>← แก้ไขคะแนน</button>
        <button className="btn btn-pdf" onClick={() => window.open(`/api/reports/pdf/${evaluateeId}`, '_blank')}>⬇ Export PDF</button>
      </div>

      {/* Profile */}
      <div className="profile-banner">
        <div className="avatar">👤</div>
        <div>
          <div className="p-name">{info.full_name}</div>
          <div className="p-meta">{info.employee_id} · {info.position} · {info.department}</div>
        </div>
        <div style={{ marginLeft:'auto', textAlign:'right' }}>
          <div style={{ fontSize:12, opacity:.7 }}>คะแนนสุดท้าย</div>
          <div style={{ fontFamily:'Kanit,sans-serif', fontSize:36, fontWeight:700 }}>{finalScore?.toFixed(1)}</div>
          <div style={{ fontSize:14, fontWeight:600, color: gradeColor(finalScore)==='#10b981'?'#a7f3d0':'#fde68a' }}>{gradeLabel(finalScore)}</div>
        </div>
      </div>

      {/* Score overview */}
      <div className="score-grid">
        {[
          { label:'คะแนนประเมินตนเอง',   score:selfScore,    weight:'น้ำหนัก 30%' },
          { label:'คะแนนเฉลี่ยกรรมการ', score:evaluatorAvg, weight:'น้ำหนัก 70%' },
          { label:'คะแนนสุดท้าย',        score:finalScore,   weight:'คะแนนรวม' },
        ].map(({ label, score, weight }) => {
          const c = gradeColor(score);
          return (
            <div className="score-card" key={label}>
              <div className="sc-label">{label}</div>
              <div className="sc-num" style={{ color:c }}>{score?.toFixed(1)}</div>
              <div className="sc-grade" style={{ background:c+'22', color:c }}>{gradeLabel(score)}</div>
              <div className="sc-weight">{weight}</div>
            </div>
          );
        })}
      </div>

      {/* Breakdown table */}
      <div className="card">
        <div className="card-header"><div className="card-title">📋 รายละเอียดคะแนนแต่ละตัวชี้วัด</div></div>
        <table>
          <thead>
            <tr>
              <th style={{ width:'38%' }}>ตัวชี้วัด</th>
              <th className="ctr" style={{ width:'8%' }}>น้ำหนัก</th>
              <th className="ctr">Self</th>
              {(evaluatorResults||[]).map((ev,i) => <th key={i} className="ctr" style={{ fontSize:10 }}>{ev.role==='chair'?'👑':'👤'} {ev.evaluator_name?.split(' ')[0]}</th>)}
              <th className="ctr">ถ่วงน้ำหนัก</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([catName, items]) => (
              <>
                <tr className="cat-row" key={`cat-${catName}`}>
                  <td colSpan={4 + (evaluatorResults?.length||0)}>▸ {catName}</td>
                </tr>
                {items.map((item, i) => {
                  const evScores = evaluatorResults?.map(ev => ev.breakdown?.find(b=>b.name===item.name)?.rawScore ?? null) || [];
                  const diffs    = evScores.map(es => es !== null ? Number(es) - Number(item.rawScore) : null);
                  return (
                    <tr key={i}>
                      <td>
                        {item.name}
                        <div className="weight-bar"><div className="weight-fill" style={{ width:`${item.weight}%` }} /></div>
                      </td>
                      <td className="ctr">
                        <span style={{ background:'#eff6ff',color:'#1a56db',padding:'2px 8px',borderRadius:'99px',fontSize:11,fontWeight:700 }}>
                          {item.weight}%
                        </span>
                      </td>
                      <td className="ctr">
                        <span className="sc-pill" style={{ background:scColor(item.rawScore,item.scoreType)+'22', color:scColor(item.rawScore,item.scoreType) }}>
                          {item.scoreType==='yes_no'?(item.rawScore===1?'✓':'✗'):item.rawScore}
                        </span>
                      </td>
                      {evScores.map((es, ei) => (
                        <td className="ctr" key={ei}>
                          {es !== null ? (
                            <span className="sc-pill" style={{ background:scColor(es,item.scoreType)+'22', color:scColor(es,item.scoreType) }}>
                              {item.scoreType==='yes_no'?(es===1?'✓':'✗'):es}
                            </span>
                          ) : <span style={{ color:'#94a3b8' }}>-</span>}
                        </td>
                      ))}
                      <td className="ctr" style={{ fontWeight:600 }}>{item.weightedScore?.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </>
            ))}
            <tr className="total-row">
              <td colSpan={3 + (evaluatorResults?.length||0)} style={{ textAlign:'right', paddingRight:20, fontSize:14 }}>
                คะแนนประเมินตนเองรวม (ถ่วงน้ำหนัก)
              </td>
              <td className="ctr" style={{ fontSize:18, color:gradeColor(selfScore), fontFamily:'Kanit,sans-serif' }}>
                {selfScore?.toFixed(1)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary comment form */}
      <div className="card">
        <div className="card-header"><div className="card-title">✍️ ความเห็นสรุปของคุณ</div></div>
        <div className="summary-form">
          {[
            { key:'strengths',       icon:'⭐', label:'จุดเด่น / จุดแข็ง',   ph:'ระบุความสามารถและผลงานที่ควรชื่นชม...' },
            { key:'improvements',    icon:'🎯', label:'จุดที่ควรพัฒนา',       ph:'ระบุด้านที่ควรปรับปรุง...' },
            { key:'overall_comment', icon:'📝', label:'ความเห็นและข้อเสนอแนะโดยรวม', ph:'สรุปภาพรวมผลการปฏิบัติงานและทิศทางการพัฒนา...' },
          ].map(f => (
            <div className="field" key={f.key}>
              <label>{f.icon} {f.label}</label>
              <textarea placeholder={f.ph}
                value={summary[f.key]}
                onChange={e => setSummary(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
          <div className="action-bar">
            <button className="btn btn-outline" onClick={() => navigate('/evaluator')}>← กลับ</button>
            <div className="btn-row">
              <button className="btn btn-draft" onClick={() => handleSave(false)} disabled={saving}>
                💾 บันทึกร่าง
              </button>
              <button className="btn btn-submit" onClick={() => handleSave(true)} disabled={saving}>
                ✅ ยืนยันส่งผลการประเมิน
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
