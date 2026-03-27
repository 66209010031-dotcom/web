// pages/staff/Result.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';

const CSS = `
  .score-banner { background: linear-gradient(135deg, #0f2057, #1a56db); color: #fff; border-radius: 16px; padding: 30px; margin-bottom: 24px; text-align: center; }
  .score-main   { font-family: 'Kanit', sans-serif; font-size: 64px; font-weight: 700; line-height: 1; }
  .score-label  { font-size: 16px; opacity: .8; margin-top: 8px; }
  .grade-badge  { display: inline-block; padding: 6px 20px; border-radius: 99px; font-size: 16px; font-weight: 700; margin-top: 12px; }
  .score-grid   { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
  .score-item   { background: rgba(255,255,255,.1); border-radius: 10px; padding: 14px 18px; }
  .si-label     { font-size: 12px; opacity: .7; margin-bottom: 4px; }
  .si-val       { font-family: 'Kanit', sans-serif; font-size: 22px; font-weight: 600; }

  .card { background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,.04); overflow: hidden; margin-bottom: 20px; }
  .card-header { padding: 16px 22px; border-bottom: 1px solid #f1f5f9; }
  .card-title  { font-family: 'Kanit', sans-serif; font-size: 16px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; }
  th { padding: 10px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-align: left; text-transform: uppercase; background: #f8faff; }
  td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #f8faff; }
  tr:last-child td { border-bottom: none; }
  .sc-pill { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; font-weight: 700; font-size: 14px; }
  .comment-box { background: #f8faff; border-radius: 10px; padding: 16px 18px; border: 1px solid #e2e8f0; margin-bottom: 14px; }
  .comment-role { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 10px; }
  .comment-field { margin-bottom: 10px; }
  .cf-label { font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px; }
  .cf-text  { font-size: 14px; color: #1e2a3b; line-height: 1.6; }
  .btn { padding: 10px 22px; border-radius: 9px; font-family: 'Sarabun', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all .2s; display: inline-flex; align-items: center; gap: 7px; }
  .btn-ghost { background: #f1f5f9; color: #475569; }
  .btn-pdf   { background: #fee2e2; color: #dc2626; }
  .btn-pdf:hover { background: #fecaca; }
`;

function scColor(v, t) { return t==='yes_no'?(v===1?'#10b981':'#ef4444'):({1:'#ef4444',2:'#f59e0b',3:'#84cc16',4:'#10b981'}[v]||'#94a3b8'); }
function gradeColor(s) { return s>=90?'#10b981':s>=75?'#84cc16':s>=60?'#f59e0b':'#ef4444'; }
function gradeLabel(s) { return s>=90?'ดีเยี่ยม':s>=75?'ดี':s>=60?'พอใช้':'ต้องปรับปรุง'; }

export default function StaffResult() {
  const { evaluateeId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => { api.get(`/scores/summary/${evaluateeId}`).then(r => setData(r.data.data)); }, [evaluateeId]);

  if (!data) return <Layout title="ผลการประเมิน"><div style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>⏳ กำลังโหลด...</div></Layout>;

  const { selfScore, evaluatorAvg, finalScore, selfBreakdown, evaluatorResults } = data;

  return (
    <Layout title="ผลการประเมินของฉัน">
      <style>{CSS}</style>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginBottom:18 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/staff')}>← กลับ</button>
        <button className="btn btn-pdf" onClick={() => window.open(`/api/reports/pdf/${evaluateeId}`, '_blank')}>⬇ Export PDF</button>
      </div>

      <div className="score-banner">
        <div style={{ fontSize:14, opacity:.8, marginBottom:10 }}>ผลคะแนนสุดท้าย</div>
        <div className="score-main">{finalScore?.toFixed(1)}</div>
        <div className="score-label">คะแนนเต็ม 100</div>
        <div className="grade-badge" style={{ background: gradeColor(finalScore)+'33', color: '#fff', border:`2px solid ${gradeColor(finalScore)}` }}>
          {gradeLabel(finalScore)}
        </div>
        <div className="score-grid">
          <div className="score-item"><div className="si-label">ประเมินตนเอง (30%)</div><div className="si-val">{selfScore?.toFixed(1)}</div></div>
          <div className="score-item"><div className="si-label">กรรมการประเมิน (70%)</div><div className="si-val">{evaluatorAvg?.toFixed(1)}</div></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">📋 รายละเอียดคะแนนแต่ละตัวชี้วัด</div></div>
        <table>
          <thead><tr><th>ตัวชี้วัด</th><th>น้ำหนัก</th><th>Self</th><th>คะแนนถ่วงน้ำหนัก</th></tr></thead>
          <tbody>
            {selfBreakdown?.map((item, i) => (
              <tr key={i}>
                <td>{item.name}</td>
                <td><span style={{ background:'#eff6ff',color:'#1a56db',padding:'2px 9px',borderRadius:'99px',fontSize:11,fontWeight:700 }}>{item.weight}%</span></td>
                <td>
                  <span className="sc-pill" style={{ background:scColor(item.rawScore,item.scoreType)+'22', color:scColor(item.rawScore,item.scoreType) }}>
                    {item.scoreType==='yes_no'?(item.rawScore===1?'✓':'✗'):item.rawScore}
                  </span>
                </td>
                <td style={{ fontWeight:600 }}>{item.weightedScore?.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {evaluatorResults?.some(e => e.is_submitted) && (
        <div className="card">
          <div className="card-header"><div className="card-title">✍️ ความเห็นจากกรรมการ</div></div>
          <div style={{ padding:'16px 22px' }}>
            {evaluatorResults.filter(e => e.is_submitted).map((ev, i) => (
              <div key={i} className="comment-box">
                <div className="comment-role">{ev.role==='chair'?'👑 ประธาน':'👤 กรรมการ'}: {ev.evaluator_name}</div>
                {[['⭐ จุดเด่น','strengths'],['🎯 ควรพัฒนา','improvements'],['📝 ความเห็นรวม','overall_comment']].map(([label,key]) =>
                  ev[key] ? <div className="comment-field" key={key}><div className="cf-label">{label}</div><div className="cf-text">{ev[key]}</div></div> : null
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
