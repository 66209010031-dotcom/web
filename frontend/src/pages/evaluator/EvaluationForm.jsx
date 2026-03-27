// pages/evaluator/EvaluationForm.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Kanit:wght@500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Sarabun',sans-serif;background:#f0f4ff;color:#1e2a3b;}

  .page { display:flex; flex-direction:column; min-height:100vh; }
  .topbar { background:linear-gradient(135deg,#0f2057,#1a56db); color:#fff; height:58px; padding:0 24px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; box-shadow:0 2px 16px rgba(26,86,219,.4); }
  .back-btn { background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25); color:#fff; padding:6px 12px; border-radius:7px; cursor:pointer; font-size:13px; }
  .back-btn:hover { background:rgba(255,255,255,.25); }
  .topbar-title { font-family:'Kanit',sans-serif; font-size:17px; font-weight:600; }

  .staff-bar { background:#fff; border-bottom:1px solid #e2e8f0; padding:12px 24px; display:flex; align-items:center; gap:16px; }
  .si-name { font-weight:600; font-size:15px; }
  .si-meta { font-size:12px; color:#94a3b8; margin-top:2px; }
  .prog-wrap { margin-left:auto; display:flex; align-items:center; gap:10px; }
  .prog-track { width:120px; height:7px; background:#e2e8f0; border-radius:99px; overflow:hidden; }
  .prog-fill  { height:100%; background:linear-gradient(90deg,#1a56db,#60a5fa); border-radius:99px; transition:width .4s; }
  .prog-pct   { font-size:12px; font-weight:700; color:#1a56db; white-space:nowrap; }

  .body { display:flex; flex:1; overflow:hidden; }
  .sidebar { width:256px; background:#fff; border-right:1px solid #e2e8f0; overflow-y:auto; flex-shrink:0; position:sticky; top:111px; height:calc(100vh - 111px); }
  .sb-head { padding:14px 18px 8px; font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.08em; }
  .sb-item { display:flex; align-items:center; gap:10px; padding:10px 18px; cursor:pointer; font-size:13px; color:#475569; border-left:3px solid transparent; transition:all .18s; }
  .sb-item:hover  { background:#f0f4ff; }
  .sb-item.active { background:#eff6ff; border-left-color:#1a56db; color:#1a56db; font-weight:600; }
  .sb-dot { width:8px; height:8px; border-radius:50%; background:#e2e8f0; flex-shrink:0; transition:background .2s; }
  .sb-item.active .sb-dot { background:#1a56db; }
  .sb-item.done   .sb-dot { background:#10b981; }
  .sb-badge { margin-left:auto; font-size:11px; color:#94a3b8; }

  .main { flex:1; overflow-y:auto; padding:24px; }
  .sec-title { font-family:'Kanit',sans-serif; font-size:20px; font-weight:600; margin-bottom:22px; }

  .ind-card { background:#fff; border-radius:14px; border:1px solid #e2e8f0; padding:20px 22px; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,.04); transition:border-color .2s; }
  .ind-card.done { border-color:#bbf7d0; }
  .ind-head { display:flex; align-items:flex-start; gap:12px; margin-bottom:14px; }
  .ind-num  { width:28px; height:28px; border-radius:50%; background:#1a56db; color:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0; }
  .ind-title { font-size:15px; font-weight:600; line-height:1.4; }
  .ind-desc  { font-size:13px; color:#64748b; margin-top:4px; line-height:1.5; }
  .ind-weight { margin-left:auto; background:#eff6ff; color:#1a56db; padding:3px 10px; border-radius:99px; font-size:12px; font-weight:700; white-space:nowrap; }

  .self-preview { background:#f8faff; border:1px solid #e2e8f0; border-radius:8px; padding:10px 14px; margin-bottom:14px; display:flex; align-items:flex-start; flex-direction:column; gap:6px; font-size:13px; }
  .sp-row { display:flex; align-items:center; gap:8px; }
  .sp-label { color:#94a3b8; font-size:12px; }
  .sp-val   { font-weight:700; color:#1a56db; }
  .sp-note  { font-size:12px; color:#64748b; font-style:italic; }

  .ev-section { margin-bottom:14px; }
  .ev-label { font-size:12px; color:#94a3b8; margin-bottom:6px; }
  .ev-list  { display:flex; flex-wrap:wrap; gap:8px; }
  .ev-chip  { display:inline-flex; align-items:center; gap:6px; background:#eff6ff; border:1px solid #dbeafe; border-radius:6px; padding:4px 10px; font-size:12px; color:#1a56db; cursor:pointer; text-decoration:none; max-width:260px; }
  .ev-chip:hover { background:#dbeafe; }
  .ev-chip-name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

  .score-label { font-size:13px; font-weight:600; color:#374151; margin-bottom:10px; }
  .scale { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
  .sc-btn { padding:12px 8px; border-radius:12px; border:2px solid #e2e8f0; cursor:pointer; background:#fff; display:flex; flex-direction:column; align-items:center; gap:6px; font-family:'Sarabun',sans-serif; transition:all .2s; }
  .sc-btn:hover { border-color:#94a3b8; background:#f8faff; }
  .sc-num  { font-size:24px; font-weight:700; color:#1e2a3b; }
  .sc-desc { font-size:11px; text-align:center; color:#64748b; line-height:1.4; }
  .sc-btn[data-v="1"].sel { border-color:#ef4444; background:#fef2f2; } .sc-btn[data-v="1"].sel .sc-num { color:#ef4444; }
  .sc-btn[data-v="2"].sel { border-color:#f59e0b; background:#fffbeb; } .sc-btn[data-v="2"].sel .sc-num { color:#f59e0b; }
  .sc-btn[data-v="3"].sel { border-color:#84cc16; background:#f7fee7; } .sc-btn[data-v="3"].sel .sc-num { color:#84cc16; }
  .sc-btn[data-v="4"].sel { border-color:#10b981; background:#ecfdf5; } .sc-btn[data-v="4"].sel .sc-num { color:#10b981; }

  .yesno { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .yn-btn { padding:14px; border-radius:12px; border:2px solid #e2e8f0; cursor:pointer; font-family:'Sarabun',sans-serif; font-size:15px; font-weight:600; background:#fff; color:#64748b; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:8px; }
  .yn-btn:hover { border-color:#94a3b8; }
  .yn-btn.yes { border-color:#10b981; background:#ecfdf5; color:#065f46; }
  .yn-btn.no  { border-color:#ef4444; background:#fef2f2; color:#991b1b; }

  .note-wrap  { margin-top:14px; }
  .note-label { font-size:12px; color:#94a3b8; margin-bottom:6px; }
  .note-area  { width:100%; padding:10px 12px; border:1.5px solid #e2e8f0; border-radius:8px; font-family:'Sarabun',sans-serif; font-size:13px; resize:vertical; min-height:70px; outline:none; transition:border-color .2s; color:#1e2a3b; }
  .note-area:focus { border-color:#1a56db; }

  .bottom-bar { background:#fff; border-top:1px solid #e2e8f0; padding:13px 24px; display:flex; align-items:center; justify-content:space-between; position:sticky; bottom:0; box-shadow:0 -4px 16px rgba(0,0,0,.06); }
  .save-status { font-size:12px; color:#10b981; }
  .btn { padding:11px 22px; border-radius:9px; font-family:'Sarabun',sans-serif; font-size:14px; font-weight:600; cursor:pointer; border:none; transition:all .2s; display:flex; align-items:center; gap:7px; }
  .btn-outline { background:#fff; border:1.5px solid #e2e8f0; color:#475569; }
  .btn-outline:hover { border-color:#1a56db; color:#1a56db; }
  .btn-blue   { background:linear-gradient(135deg,#1a56db,#1e429f); color:#fff; }
  .btn-blue:hover { transform:translateY(-1px); }
  .btn-green  { background:linear-gradient(135deg,#10b981,#059669); color:#fff; }
  .btn-green:hover { transform:translateY(-1px); }
  .btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
  .btn-row { display:flex; gap:10px; }

  .overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; z-index:999; padding:20px; }
  .modal  { background:#fff; border-radius:18px; padding:30px; max-width:520px; width:100%; box-shadow:0 24px 60px rgba(0,0,0,.2); max-height:90vh; overflow-y:auto; }
  .modal h3 { font-family:'Kanit',sans-serif; font-size:20px; font-weight:600; margin-bottom:6px; }
  .modal-sub { font-size:13px; color:#64748b; margin-bottom:20px; }
  .field { margin-bottom:16px; }
  .field label { font-size:13px; font-weight:600; color:#374151; display:block; margin-bottom:7px; }
  .field textarea { width:100%; padding:10px 12px; border:1.5px solid #e2e8f0; border-radius:8px; font-family:'Sarabun',sans-serif; font-size:14px; resize:vertical; min-height:90px; outline:none; transition:border-color .2s; }
  .field textarea:focus { border-color:#1a56db; }
  .modal-btns { display:flex; gap:10px; justify-content:flex-end; margin-top:18px; }
`;

const SCALE_DEF = [{ v:1,emoji:'😟' },{ v:2,emoji:'😐' },{ v:3,emoji:'😊' },{ v:4,emoji:'🌟' }];

export default function EvaluationForm() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const [pageData,  setPageData]  = useState(null);
  const [activeCat, setActiveCat] = useState('');
  const [scores,    setScores]    = useState({});
  const [saving,    setSaving]    = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [summaryModal, setSummaryModal] = useState(false);
  const [summary,   setSummary]   = useState({ strengths:'', improvements:'', overall_comment:'' });
  const saveTimer = useRef({});

  useEffect(() => {
    api.get(`/scores/evaluator/${assignmentId}`).then(r => {
      const d = r.data.data;
      setPageData(d);
      // group by category
      const grouped = {};
      d.indicators.forEach(i => {
        if (!grouped[i.category_name]) grouped[i.category_name] = [];
        grouped[i.category_name].push(i);
      });
      const cats = Object.keys(grouped);
      if (cats.length) setActiveCat(cats[0]);
      // load existing scores
      const sc = {};
      d.indicators.forEach(i => {
        if (i.eval_score !== null && i.eval_score !== undefined)
          sc[i.id] = { score: Number(i.eval_score), note: i.eval_note || '' };
      });
      setScores(sc);
      // load existing summary
      if (d.summary && (d.summary.strengths || d.summary.improvements || d.summary.overall_comment)) {
        setSummary({ strengths: d.summary.strengths||'', improvements: d.summary.improvements||'', overall_comment: d.summary.overall_comment||'' });
      }
    });
  }, [assignmentId]);

  const debounceSave = useCallback((indId, score, note) => {
    clearTimeout(saveTimer.current[indId]);
    saveTimer.current[indId] = setTimeout(async () => {
      setSaving(true);
      await api.post(`/scores/evaluator/${assignmentId}`, { indicatorId: indId, score, note });
      setLastSaved(new Date());
      setSaving(false);
    }, 800);
  }, [assignmentId]);

  function onScore(indId, val) {
    const note = scores[indId]?.note || '';
    setScores(p => ({ ...p, [indId]: { score: val, note } }));
    debounceSave(indId, val, note);
  }

  function onNote(indId, note) {
    const score = scores[indId]?.score;
    setScores(p => ({ ...p, [indId]: { ...(p[indId]||{}), note } }));
    if (score !== undefined) debounceSave(indId, score, note);
  }

  async function saveSummary(submit) {
    await api.post(`/scores/evaluator/${assignmentId}/summary`, { ...summary, is_submitted: submit });
    setSummaryModal(false);
    if (submit) navigate('/evaluator');
  }

  if (!pageData) return (
    <div style={{ padding:40, textAlign:'center', fontFamily:'Sarabun,sans-serif', color:'#94a3b8' }}>⏳ กำลังโหลด...</div>
  );

  const { assign, indicators, evidences } = pageData;

  // group indicators by category
  const grouped = {};
  indicators.forEach(i => {
    if (!grouped[i.category_name]) grouped[i.category_name] = [];
    grouped[i.category_name].push(i);
  });
  const catNames = Object.keys(grouped);
  const activeInds = grouped[activeCat] || [];

  // evidence map
  const evMap = {};
  (evidences||[]).forEach(e => {
    if (!evMap[e.indicator_id]) evMap[e.indicator_id] = [];
    evMap[e.indicator_id].push(e);
  });

  const allCount = indicators.length;
  const answered = indicators.filter(i => scores[i.id] !== undefined).length;
  const pct = allCount ? Math.round(answered/allCount*100) : 0;

  return (
    <>
      <style>{CSS}</style>
      <div className="page">

        {/* Topbar */}
        <header className="topbar">
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <button className="back-btn" onClick={() => navigate('/evaluator')}>← กลับ</button>
            <div className="topbar-title">✍️ ให้คะแนนการประเมิน</div>
          </div>
          <div style={{ fontSize:12, opacity:.8 }}>
            {saving ? '⏳ กำลังบันทึก...' : lastSaved ? `✅ บันทึกแล้ว ${lastSaved.toLocaleTimeString('th-TH')}` : ''}
          </div>
        </header>

        {/* Staff info bar */}
        <div className="staff-bar">
          <div style={{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg,#1a56db,#60a5fa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#fff', flexShrink:0 }}>👤</div>
          <div>
            <div className="si-name">{assign?.staff_name}</div>
            <div className="si-meta">{assign?.employee_id} · {assign?.department} · {assign?.position}</div>
          </div>
          <div className="prog-wrap">
            <span style={{ fontSize:12, color:'#64748b' }}>ให้คะแนนแล้ว</span>
            <div className="prog-track"><div className="prog-fill" style={{ width:`${pct}%` }} /></div>
            <span className="prog-pct">{answered}/{allCount} ({pct}%)</span>
          </div>
        </div>

        {/* Body */}
        <div className="body">

          {/* Sidebar */}
          <nav className="sidebar">
            <div className="sb-head">หมวดหมู่</div>
            {catNames.map(cat => {
              const inds = grouped[cat] || [];
              const done = inds.filter(i => scores[i.id] !== undefined).length;
              return (
                <div key={cat}
                  className={`sb-item ${activeCat===cat?'active':''} ${done===inds.length&&inds.length>0?'done':''}`}
                  onClick={() => setActiveCat(cat)}>
                  <span className="sb-dot" />
                  <span>{cat}</span>
                  <span className="sb-badge">{done}/{inds.length}</span>
                </div>
              );
            })}
          </nav>

          {/* Main */}
          <main className="main">
            <div className="sec-title">{activeCat}</div>

            {activeInds.map((ind, idx) => {
              const cur = scores[ind.id];
              const evs = evMap[ind.id] || [];
              return (
                <div key={ind.id} className={`ind-card ${cur!==undefined?'done':''}`}>
                  <div className="ind-head">
                    <div className="ind-num">{idx+1}</div>
                    <div style={{ flex:1 }}>
                      <div className="ind-title">{ind.name}</div>
                      {ind.description && <div className="ind-desc">{ind.description}</div>}
                    </div>
                    <span className="ind-weight">น้ำหนัก {ind.weight}%</span>
                  </div>

                  {/* Self score preview */}
                  {ind.self_score !== null && ind.self_score !== undefined && (
                    <div className="self-preview">
                      <div className="sp-row">
                        <span className="sp-label">📊 ผู้ประเมินตนเอง:</span>
                        <span className="sp-val">
                          {ind.score_type==='yes_no'?(Number(ind.self_score)===1?'✅ มี':'❌ ไม่มี'):`${ind.self_score}/4`}
                        </span>
                      </div>
                      {ind.self_note && <div className="sp-note">"{ind.self_note}"</div>}
                    </div>
                  )}

                  {/* Evidence */}
                  {evs.length > 0 && (
                    <div className="ev-section">
                      <div className="ev-label">📎 หลักฐานที่แนบมา ({evs.length} รายการ)</div>
                      <div className="ev-list">
                        {evs.map((ev, i) => (
                          <a key={i} className="ev-chip"
                            href={ev.url || `/uploads/${ev.file_path}`}
                            target="_blank" rel="noreferrer">
                            <span>{ev.type==='pdf'?'📄':ev.type==='url'?'🔗':'🖼️'}</span>
                            <span className="ev-chip-name">{(ev.original_name||ev.url||'').slice(0,40)}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Score input */}
                  <div className="score-label">คะแนนของคุณ:</div>
                  {ind.score_type === 'yes_no' ? (
                    <div className="yesno">
                      <button className={`yn-btn ${cur?.score===1?'yes':''}`} onClick={() => onScore(ind.id,1)}>✅ มี / ทำได้</button>
                      <button className={`yn-btn ${cur?.score===0?'no':''}`}  onClick={() => onScore(ind.id,0)}>❌ ไม่มี / ทำไม่ได้</button>
                    </div>
                  ) : (
                    <div className="scale">
                      {SCALE_DEF.map(({ v, emoji }) => (
                        <button key={v} data-v={String(v)}
                          className={`sc-btn ${cur?.score===v?'sel':''}`}
                          onClick={() => onScore(ind.id, v)}>
                          <span className="sc-num">{v}</span>
                          <span className="sc-desc">{emoji}<br />{ind[`scale_${v}_desc`]||''}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Note */}
                  <div className="note-wrap">
                    <div className="note-label">💬 ความเห็นในตัวชี้วัดนี้</div>
                    <textarea className="note-area"
                      placeholder="เพิ่มความเห็นหรือเหตุผลประกอบการให้คะแนน (ถ้ามี)"
                      value={cur?.note||''}
                      onChange={e => onNote(ind.id, e.target.value)} />
                  </div>
                </div>
              );
            })}
          </main>
        </div>

        {/* Bottom bar */}
        <footer className="bottom-bar">
          <div className="save-status">
            {lastSaved && <>✅ บันทึกอัตโนมัติแล้ว {lastSaved.toLocaleTimeString('th-TH')}</>}
          </div>
          <div className="btn-row">
            <button className="btn btn-outline" onClick={() => navigate('/evaluator')}>กลับ</button>
            <button className="btn btn-blue" onClick={() => setSummaryModal(true)}>
              📝 เขียนสรุปและส่งผล
            </button>
          </div>
        </footer>
      </div>

      {/* Summary Modal */}
      {summaryModal && (
        <div className="overlay" onClick={e => e.target===e.currentTarget && setSummaryModal(false)}>
          <div className="modal">
            <h3>📝 ความเห็นสรุปจากกรรมการ</h3>
            <div className="modal-sub">
              ให้คะแนนแล้ว {answered}/{allCount} ตัวชี้วัด · กรุณาเขียนสรุปความเห็นภาพรวม
            </div>
            {[
              { key:'strengths',       icon:'⭐', label:'จุดเด่น / จุดแข็ง',    ph:'ระบุความสามารถ ผลงาน และพฤติกรรมที่โดดเด่น...' },
              { key:'improvements',    icon:'🎯', label:'จุดที่ควรพัฒนา',        ph:'ระบุด้านที่ควรปรับปรุงหรือพัฒนาเพิ่มเติม...' },
              { key:'overall_comment', icon:'📋', label:'ความเห็นโดยรวม',       ph:'สรุปภาพรวมผลการปฏิบัติงาน และข้อเสนอแนะ...' },
            ].map(f => (
              <div className="field" key={f.key}>
                <label>{f.icon} {f.label}</label>
                <textarea placeholder={f.ph}
                  value={summary[f.key]}
                  onChange={e => setSummary(p=>({...p,[f.key]:e.target.value}))} />
              </div>
            ))}
            <div className="modal-btns">
              <button className="btn btn-outline" onClick={() => setSummaryModal(false)}>ยกเลิก</button>
              <button className="btn btn-outline" style={{ borderColor:'#94a3b8' }} onClick={() => saveSummary(false)}>💾 บันทึกร่าง</button>
              <button className="btn btn-green" onClick={() => saveSummary(true)}>✅ ยืนยันส่งผลการประเมิน</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
