// pages/staff/SelfEvaluation.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Kanit:wght@500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Sarabun',sans-serif;background:#f0f4ff;color:#1e2a3b;}

  .page { display: flex; flex-direction: column; min-height: 100vh; }

  /* Topbar */
  .topbar {
    background: linear-gradient(135deg, #0f2057, #1a56db);
    color: #fff; height: 58px; padding: 0 24px;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 100;
    box-shadow: 0 2px 16px rgba(26,86,219,.4);
  }
  .topbar-left  { display: flex; align-items: center; gap: 14px; }
  .back-btn     { background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.25); color: #fff; padding: 6px 12px; border-radius: 7px; cursor: pointer; font-size: 13px; transition: all .2s; }
  .back-btn:hover { background: rgba(255,255,255,.25); }
  .topbar-title { font-family: 'Kanit', sans-serif; font-size: 17px; font-weight: 600; }
  .save-status  { font-size: 12px; opacity: .8; }

  /* Progress */
  .progress-bar {
    background: #fff; border-bottom: 1px solid #e2e8f0; padding: 10px 24px;
    display: flex; align-items: center; gap: 14px;
  }
  .prog-label  { font-size: 13px; color: #64748b; white-space: nowrap; }
  .prog-track  { flex: 1; height: 8px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
  .prog-fill   { height: 100%; background: linear-gradient(90deg, #1a56db, #60a5fa); border-radius: 99px; transition: width .5s cubic-bezier(.4,0,.2,1); }
  .prog-pct    { font-size: 13px; font-weight: 700; color: #1a56db; white-space: nowrap; min-width: 60px; }

  /* Body layout */
  .body { display: flex; flex: 1; overflow: hidden; }

  /* Sidebar */
  .sidebar {
    width: 256px; background: #fff; border-right: 1px solid #e2e8f0;
    overflow-y: auto; flex-shrink: 0;
    position: sticky; top: 90px; height: calc(100vh - 90px);
  }
  .sb-head { padding: 14px 18px 8px; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .08em; }
  .sb-item {
    display: flex; align-items: center; gap: 10px; padding: 10px 18px;
    cursor: pointer; font-size: 13px; color: #475569;
    border-left: 3px solid transparent; transition: all .18s;
  }
  .sb-item:hover  { background: #f0f4ff; }
  .sb-item.active { background: #eff6ff; border-left-color: #1a56db; color: #1a56db; font-weight: 600; }
  .sb-dot { width: 8px; height: 8px; border-radius: 50%; background: #e2e8f0; flex-shrink: 0; transition: background .2s; }
  .sb-item.active .sb-dot { background: #1a56db; }
  .sb-item.done   .sb-dot { background: #10b981; }
  .sb-badge { margin-left: auto; font-size: 11px; color: #94a3b8; }

  /* Main content */
  .main { flex: 1; overflow-y: auto; padding: 24px; }
  .sec-title { font-family: 'Kanit', sans-serif; font-size: 20px; font-weight: 600; margin-bottom: 4px; }
  .sec-desc  { font-size: 14px; color: #64748b; margin-bottom: 22px; }

  /* Indicator card */
  .ind-card {
    background: #fff; border-radius: 14px; border: 1px solid #e2e8f0;
    padding: 20px 22px; margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,.04); transition: box-shadow .2s;
  }
  .ind-card:hover { box-shadow: 0 6px 20px rgba(26,86,219,.1); }
  .ind-card.answered { border-color: #bbf7d0; }

  .ind-head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
  .ind-num  { width: 28px; height: 28px; border-radius: 50%; background: #1a56db; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
  .ind-title{ font-size: 15px; font-weight: 600; color: #1e2a3b; line-height: 1.4; }
  .ind-desc { font-size: 13px; color: #64748b; margin-top: 4px; line-height: 1.5; }
  .ind-weight { margin-left: auto; background: #eff6ff; color: #1a56db; padding: 3px 10px; border-radius: 99px; font-size: 12px; font-weight: 700; white-space: nowrap; }

  /* Yes/No buttons */
  .yesno { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .yn-btn {
    padding: 14px; border-radius: 12px; border: 2px solid #e2e8f0;
    cursor: pointer; font-family: 'Sarabun', sans-serif; font-size: 15px; font-weight: 600;
    background: #fff; color: #64748b; transition: all .2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .yn-btn:hover { border-color: #94a3b8; background: #f8faff; }
  .yn-btn.yes   { border-color: #10b981; background: #ecfdf5; color: #065f46; }
  .yn-btn.no    { border-color: #ef4444; background: #fef2f2; color: #991b1b; }

  /* Scale buttons */
  .scale { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .sc-btn {
    padding: 12px 8px; border-radius: 12px; border: 2px solid #e2e8f0;
    cursor: pointer; background: #fff; transition: all .2s;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    font-family: 'Sarabun', sans-serif;
  }
  .sc-btn:hover { border-color: #94a3b8; background: #f8faff; }
  .sc-num  { font-size: 24px; font-weight: 700; color: #1e2a3b; }
  .sc-desc { font-size: 11px; text-align: center; color: #64748b; line-height: 1.4; }
  .sc-btn[data-v="1"].sel { border-color:#ef4444; background:#fef2f2; }
  .sc-btn[data-v="1"].sel .sc-num { color:#ef4444; }
  .sc-btn[data-v="2"].sel { border-color:#f59e0b; background:#fffbeb; }
  .sc-btn[data-v="2"].sel .sc-num { color:#f59e0b; }
  .sc-btn[data-v="3"].sel { border-color:#84cc16; background:#f7fee7; }
  .sc-btn[data-v="3"].sel .sc-num { color:#84cc16; }
  .sc-btn[data-v="4"].sel { border-color:#10b981; background:#ecfdf5; }
  .sc-btn[data-v="4"].sel .sc-num { color:#10b981; }

  /* Note */
  .note-wrap { margin-top: 14px; }
  .note-label{ font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
  .note-area {
    width: 100%; padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px;
    font-family: 'Sarabun', sans-serif; font-size: 13px; resize: vertical; min-height: 70px;
    outline: none; color: #1e2a3b; transition: border-color .2s;
  }
  .note-area:focus { border-color: #1a56db; }

  /* Evidence */
  .ev-wrap  { margin-top: 14px; padding-top: 14px; border-top: 1px dashed #e2e8f0; }
  .ev-label { font-size: 12px; color: #94a3b8; margin-bottom: 8px; }
  .ev-tabs  { display: flex; gap: 8px; margin-bottom: 10px; }
  .ev-tab   { padding: 5px 12px; border-radius: 6px; border: 1.5px solid #e2e8f0; font-size: 12px; font-family: 'Sarabun', sans-serif; cursor: pointer; background: #fff; color: #64748b; transition: all .2s; }
  .ev-tab.on{ background: #1a56db; border-color: #1a56db; color: #fff; }

  .ev-upload {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    border: 2px dashed #e2e8f0; border-radius: 10px; padding: 16px;
    cursor: pointer; font-size: 13px; color: #94a3b8; background: #fafbff; transition: all .2s;
  }
  .ev-upload:hover { border-color: #1a56db; background: #eff6ff; color: #1a56db; }
  .ev-input { display: none; }

  .ev-url-row { display: flex; gap: 8px; }
  .ev-url-inp { flex: 1; padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-family: 'Sarabun', sans-serif; font-size: 13px; outline: none; transition: border-color .2s; }
  .ev-url-inp:focus { border-color: #1a56db; }
  .btn-add-url { padding: 9px 16px; background: #1a56db; color: #fff; border: none; border-radius: 8px; font-family: 'Sarabun', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; }

  .ev-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  .ev-chip  { display: flex; align-items: center; gap: 6px; background: #eff6ff; border: 1px solid #dbeafe; border-radius: 6px; padding: 5px 10px; font-size: 12px; color: #1a56db; max-width: 250px; }
  .ev-chip-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ev-chip-rm { cursor: pointer; color: #94a3b8; font-size: 15px; flex-shrink: 0; }
  .ev-chip-rm:hover { color: #ef4444; }

  /* Bottom bar */
  .bottom-bar {
    background: #fff; border-top: 1px solid #e2e8f0; padding: 13px 24px;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; bottom: 0; box-shadow: 0 -4px 16px rgba(0,0,0,.06);
  }
  .auto-save { font-size: 12px; color: #10b981; display: flex; align-items: center; gap: 5px; }
  .btn-row { display: flex; gap: 10px; }
  .btn      { padding: 11px 22px; border-radius: 9px; font-family: 'Sarabun', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all .2s; display: flex; align-items: center; gap: 7px; }
  .btn-outline { background: #fff; border: 1.5px solid #e2e8f0; color: #475569; }
  .btn-outline:hover { border-color: #1a56db; color: #1a56db; }
  .btn-submit { background: linear-gradient(135deg, #10b981, #059669); color: #fff; box-shadow: 0 3px 10px rgba(16,185,129,.3); }
  .btn-submit:hover { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(16,185,129,.4); }
  .btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }

  /* Confirm modal */
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 20px; }
  .modal   { background: #fff; border-radius: 18px; padding: 32px; max-width: 420px; width: 100%; box-shadow: 0 24px 60px rgba(0,0,0,.2); }
  .modal h3{ font-family: 'Kanit', sans-serif; font-size: 20px; font-weight: 600; margin-bottom: 12px; }
  .modal p { font-size: 14px; color: #64748b; line-height: 1.6; }
  .modal-btns { display: flex; gap: 10px; margin-top: 24px; justify-content: flex-end; }
`;

const SCALE_DEF = [
  { v: 1, emoji: '😟' }, { v: 2, emoji: '😐' },
  { v: 3, emoji: '😊' }, { v: 4, emoji: '🌟' },
];

export default function SelfEvaluation() {
  const { evaluateeId } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories]   = useState([]);
  const [activeCat,  setActiveCat]    = useState('');
  const [scores,     setScores]       = useState({});
  const [evidences,  setEvidences]    = useState({});
  const [evTab,      setEvTab]        = useState({});
  const [urlInputs,  setUrlInputs]    = useState({});
  const [saving,     setSaving]       = useState(false);
  const [lastSaved,  setLastSaved]    = useState(null);
  const [confirm,    setConfirm]      = useState(false);
  const saveTimer = useRef({});

  useEffect(() => { fetchData(); }, [evaluateeId]);

  async function fetchData() {
    const { data } = await api.get(`/scores/self/${evaluateeId}`);
    const grouped = {};
    data.data.forEach(row => {
      if (!grouped[row.category_name]) grouped[row.category_name] = [];
      grouped[row.category_name].push(row);
    });
    const cats = Object.entries(grouped).map(([name, indicators]) => ({ name, indicators }));
    setCategories(cats);
    if (cats.length) setActiveCat(cats[0].name);

    const sc = {}, ev = {};
    data.data.forEach(row => {
      if (row.score !== null) sc[row.id] = { score: Number(row.score), note: row.note || '' };
      if (row.evidences?.length) ev[row.id] = row.evidences;
    });
    setScores(sc); setEvidences(ev);
  }

  const debounceSave = useCallback((indId, score, note) => {
    clearTimeout(saveTimer.current[indId]);
    saveTimer.current[indId] = setTimeout(async () => {
      setSaving(true);
      await api.post(`/scores/self/${evaluateeId}`, { indicatorId: indId, score, note });
      setLastSaved(new Date());
      setSaving(false);
    }, 800);
  }, [evaluateeId]);

  function onScore(indId, val) {
    const note = scores[indId]?.note || '';
    setScores(p => ({ ...p, [indId]: { score: val, note } }));
    debounceSave(indId, val, note);
  }

  function onNote(indId, note) {
    const score = scores[indId]?.score;
    setScores(p => ({ ...p, [indId]: { ...(p[indId] || {}), note } }));
    if (score !== undefined) debounceSave(indId, score, note);
  }

  async function onFileUpload(indId, file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const fd  = new FormData();
    fd.append('file', file); fd.append('indicatorId', indId);
    fd.append('type', ext === 'pdf' ? 'pdf' : 'image');
    await api.post(`/scores/evidence/${evaluateeId}`, fd);
    setEvidences(p => ({ ...p, [indId]: [...(p[indId]||[]), { original_name: file.name, type: ext==='pdf'?'pdf':'image' }] }));
  }

  async function onUrlAdd(indId) {
    const url = urlInputs[indId]; if (!url) return;
    await api.post(`/scores/evidence/${evaluateeId}`, { indicatorId: indId, type: 'url', url });
    setEvidences(p => ({ ...p, [indId]: [...(p[indId]||[]), { url, type: 'url', original_name: url }] }));
    setUrlInputs(p => ({ ...p, [indId]: '' }));
  }

  async function handleSubmit() {
    await api.post(`/scores/self/${evaluateeId}/submit`);
    setConfirm(false);
    navigate('/staff');
  }

  const allInds  = categories.flatMap(c => c.indicators);
  const answered = allInds.filter(i => scores[i.id] !== undefined).length;
  const pct      = allInds.length ? Math.round((answered / allInds.length) * 100) : 0;
  const activeInds = categories.find(c => c.name === activeCat)?.indicators || [];

  return (
    <>
      <style>{CSS}</style>
      <div className="page">
        <header className="topbar">
          <div className="topbar-left">
            <button className="back-btn" onClick={() => navigate('/staff')}>← กลับ</button>
            <div className="topbar-title">📋 แบบประเมินตนเอง</div>
          </div>
          <div className="save-status">
            {saving ? '⏳ กำลังบันทึก...' : lastSaved ? `✅ บันทึกแล้ว ${lastSaved.toLocaleTimeString('th-TH')}` : ''}
          </div>
        </header>

        <div className="progress-bar">
          <span className="prog-label">ความคืบหน้า</span>
          <div className="prog-track"><div className="prog-fill" style={{ width: `${pct}%` }} /></div>
          <span className="prog-pct">{answered}/{allInds.length} ข้อ ({pct}%)</span>
        </div>

        <div className="body">
          <nav className="sidebar">
            <div className="sb-head">หมวดหมู่</div>
            {categories.map(cat => {
              const done = cat.indicators.filter(i => scores[i.id] !== undefined).length;
              return (
                <div key={cat.name}
                  className={`sb-item ${activeCat===cat.name?'active':''} ${done===cat.indicators.length?'done':''}`}
                  onClick={() => setActiveCat(cat.name)}>
                  <span className="sb-dot" />
                  <span>{cat.name}</span>
                  <span className="sb-badge">{done}/{cat.indicators.length}</span>
                </div>
              );
            })}
          </nav>

          <main className="main">
            <div className="sec-title">{activeCat}</div>
            <div className="sec-desc">กรุณาประเมินตนเองในแต่ละตัวชี้วัดอย่างตรงไปตรงมา</div>

            {activeInds.map((ind, idx) => {
              const cur = scores[ind.id];
              return (
                <div key={ind.id} className={`ind-card ${cur!==undefined?'answered':''}`}>
                  <div className="ind-head">
                    <div className="ind-num">{idx+1}</div>
                    <div style={{ flex: 1 }}>
                      <div className="ind-title">{ind.name}</div>
                      {ind.description && <div className="ind-desc">{ind.description}</div>}
                    </div>
                    <span className="ind-weight">น้ำหนัก {ind.weight}%</span>
                  </div>

                  {ind.score_type === 'yes_no' ? (
                    <div className="yesno">
                      <button className={`yn-btn ${cur?.score===1?'yes':''}`} onClick={() => onScore(ind.id, 1)}>✅ มี / ทำได้</button>
                      <button className={`yn-btn ${cur?.score===0?'no':''}`}  onClick={() => onScore(ind.id, 0)}>❌ ไม่มี / ทำไม่ได้</button>
                    </div>
                  ) : (
                    <div className="scale">
                      {SCALE_DEF.map(({ v, emoji }) => (
                        <button key={v} data-v={v} className={`sc-btn ${cur?.score===v?'sel':''}`} onClick={() => onScore(ind.id, v)}>
                          <span className="sc-num">{v}</span>
                          <span className="sc-desc">{emoji}<br/>{ind[`scale_${v}_desc`] || ''}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="note-wrap">
                    <div className="note-label">💬 หมายเหตุ</div>
                    <textarea className="note-area" placeholder="อธิบายเพิ่มเติม (ถ้ามี)"
                      value={cur?.note || ''} onChange={e => onNote(ind.id, e.target.value)} />
                  </div>

                  {ind.allow_evidence && (
                    <div className="ev-wrap">
                      <div className="ev-label">📎 แนบหลักฐาน</div>
                      <div className="ev-tabs">
                        {['file','url'].map(t => (
                          <button key={t} className={`ev-tab ${(evTab[ind.id]||'file')===t?'on':''}`} onClick={() => setEvTab(p=>({...p,[ind.id]:t}))}>
                            {t==='file'?'📁 ไฟล์':'🔗 URL'}
                          </button>
                        ))}
                      </div>
                      {(evTab[ind.id]||'file') === 'file' ? (
                        <label className="ev-upload">
                          <input type="file" className="ev-input" accept=".pdf,.jpg,.jpeg,.png,.gif"
                            onChange={e => e.target.files[0] && onFileUpload(ind.id, e.target.files[0])} />
                          ➕ คลิกอัพโหลด PDF หรือรูปภาพ (ขนาดสูงสุด 10 MB)
                        </label>
                      ) : (
                        <div className="ev-url-row">
                          <input className="ev-url-inp" placeholder="https://..." value={urlInputs[ind.id]||''}
                            onChange={e => setUrlInputs(p=>({...p,[ind.id]:e.target.value}))}
                            onKeyDown={e => e.key==='Enter' && onUrlAdd(ind.id)} />
                          <button className="btn-add-url" onClick={() => onUrlAdd(ind.id)}>เพิ่ม</button>
                        </div>
                      )}
                      {(evidences[ind.id]||[]).length > 0 && (
                        <div className="ev-chips">
                          {evidences[ind.id].map((ev, i) => (
                            <div key={i} className="ev-chip">
                              <span>{ev.type==='pdf'?'📄':ev.type==='url'?'🔗':'🖼️'}</span>
                              <span className="ev-chip-name">{(ev.original_name||ev.url||'').slice(0,35)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </main>
        </div>

        <footer className="bottom-bar">
          <div className="auto-save">{lastSaved && <>✅ บันทึกอัตโนมัติแล้ว</>}</div>
          <div className="btn-row">
            <button className="btn btn-outline" onClick={() => navigate('/staff')}>กลับ</button>
            <button className="btn btn-submit" disabled={pct < 100} onClick={() => setConfirm(true)}>
              ✅ ส่งการประเมินตนเอง {pct < 100 && `(${pct}%)`}
            </button>
          </div>
        </footer>
      </div>

      {confirm && (
        <div className="overlay">
          <div className="modal">
            <h3>📤 ยืนยันส่งแบบประเมิน</h3>
            <p>ตอบครบทุกข้อแล้ว ({answered}/{allInds.length} ข้อ)<br/>
               <strong>เมื่อส่งแล้วจะไม่สามารถแก้ไขได้</strong><br/>
               ต้องการส่งการประเมินตนเองหรือไม่?</p>
            <div className="modal-btns">
              <button className="btn btn-outline" onClick={() => setConfirm(false)}>ยกเลิก</button>
              <button className="btn btn-submit"  onClick={handleSubmit}>ยืนยันส่ง</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
