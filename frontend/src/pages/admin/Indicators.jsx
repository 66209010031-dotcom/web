// pages/admin/Indicators.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';

const CSS = `
  .back-btn { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 20px; transition: all .2s; }
  .back-btn:hover { border-color: #1a56db; color: #1a56db; }

  .top-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .btn { padding: 9px 18px; border-radius: 9px; font-family: 'Sarabun', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all .2s; display: inline-flex; align-items: center; gap: 7px; }
  .btn-blue  { background: #1a56db; color: #fff; }
  .btn-blue:hover { background: #1e429f; }
  .btn-outline { background: #fff; border: 1.5px solid #e2e8f0; color: #475569; }
  .btn-outline:hover { border-color: #1a56db; color: #1a56db; }
  .btn-sm { padding: 5px 11px; font-size: 12px; }
  .btn-danger { background: #fee2e2; color: #dc2626; border: none; }
  .btn-danger:hover { background: #fecaca; }

  .cat-block { background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,.04); margin-bottom: 20px; overflow: hidden; }
  .cat-header { padding: 16px 20px; background: linear-gradient(135deg, #1e429f, #1a56db); color: #fff; display: flex; align-items: center; justify-content: space-between; }
  .cat-name   { font-family: 'Kanit', sans-serif; font-size: 16px; font-weight: 600; }

  .ind-table { width: 100%; border-collapse: collapse; }
  .ind-table th { padding: 10px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-align: left; text-transform: uppercase; letter-spacing: .05em; background: #f8faff; }
  .ind-table td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
  .ind-table tr:last-child td { border-bottom: none; }
  .ind-table tr:hover td { background: #fafbff; }

  .weight-pill { display: inline-block; padding: 2px 9px; background: #eff6ff; color: #1a56db; border-radius: 99px; font-size: 11px; font-weight: 700; }
  .type-pill   { display: inline-block; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 600; }
  .type-scale  { background: #ede9fe; color: #5b21b6; }
  .type-yesno  { background: #fef9c3; color: #92400e; }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 16px; }
  .modal { background: #fff; border-radius: 16px; padding: 26px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,.2); }
  .modal h3 { font-family: 'Kanit', sans-serif; font-size: 18px; font-weight: 600; margin-bottom: 18px; }
  .field { margin-bottom: 14px; }
  .field label { font-size: 12px; font-weight: 600; color: #374151; display: block; margin-bottom: 5px; }
  .field input, .field select, .field textarea { width: 100%; padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-family: 'Sarabun', sans-serif; font-size: 13px; outline: none; transition: border-color .2s; }
  .field input:focus, .field select:focus, .field textarea:focus { border-color: #1a56db; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px; }

  .weight-info { background: #fff7ed; border: 1px solid #fdba74; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #92400e; margin-bottom: 16px; }
`;

export default function AdminIndicators() {
  const { id: periodId } = useParams();
  const navigate = useNavigate();
  const [period,     setPeriod]     = useState(null);
  const [categories, setCategories] = useState([]);
  const [modal,      setModal]      = useState(null); // 'cat' | 'ind'
  const [form,       setForm]       = useState({});
  const [editing,    setEditing]    = useState(null);
  const [selCatId,   setSelCatId]   = useState(null);

  const load = () => {
    api.get(`/periods/${periodId}`).then(r => setPeriod(r.data.data));
    api.get(`/periods/${periodId}/categories`).then(r => setCategories(r.data.data));
  };
  useEffect(load, [periodId]);

  const totalWeight = categories.flatMap(c => c.indicators || []).reduce((s, i) => s + Number(i.weight), 0);

  async function saveCat() {
    if (editing) await api.put(`/periods/categories/${editing}`, form);
    else          await api.post(`/periods/${periodId}/categories`, form);
    setModal(null); setForm({}); setEditing(null); load();
  }

  async function saveInd() {
    const payload = { ...form, category_id: selCatId };
    if (editing) await api.put(`/periods/indicators/${editing}`, payload);
    else          await api.post('/periods/indicators/create', payload);
    setModal(null); setForm({}); setEditing(null); load();
  }

  async function delCat(id) {
    if (!window.confirm('ลบหมวดหมู่และตัวชี้วัดทั้งหมดใช่หรือไม่?')) return;
    await api.delete(`/periods/categories/${id}`); load();
  }

  async function delInd(id) {
    if (!window.confirm('ลบตัวชี้วัดนี้?')) return;
    await api.delete(`/periods/indicators/${id}`); load();
  }

  const openIndModal = (catId, ind = null) => {
    setSelCatId(catId);
    setEditing(ind?.id || null);
    setForm(ind ? {
      name: ind.name, description: ind.description || '', weight: ind.weight,
      score_type: ind.score_type, allow_evidence: ind.allow_evidence,
      scale_1_desc: ind.scale_1_desc || '', scale_2_desc: ind.scale_2_desc || '',
      scale_3_desc: ind.scale_3_desc || '', scale_4_desc: ind.scale_4_desc || '',
    } : { name: '', description: '', weight: '', score_type: 'scale', allow_evidence: 1,
          scale_1_desc: 'ต่ำกว่าคาดหวังมาก', scale_2_desc: 'ต่ำกว่าคาดหวัง',
          scale_3_desc: 'ตามคาดหวัง', scale_4_desc: 'สูงกว่าคาดหวัง' });
    setModal('ind');
  };

  return (
    <Layout title="จัดการตัวชี้วัด" subtitle={period?.title}>
      <style>{CSS}</style>
      <button className="back-btn" onClick={() => navigate('/admin/periods')}>← กลับ</button>

      <div className="top-actions">
        <div className="weight-info">
          น้ำหนักรวมทั้งหมด: <strong>{totalWeight.toFixed(1)}%</strong>
          {Math.abs(totalWeight - 100) > 0.01 && <span style={{ color: '#dc2626' }}> (ควรรวมได้ 100%)</span>}
        </div>
        <button className="btn btn-blue" onClick={() => { setForm({ name: '', description: '' }); setEditing(null); setModal('cat'); }}>
          ➕ เพิ่มหมวดหมู่
        </button>
      </div>

      {categories.map((cat, ci) => (
        <div className="cat-block" key={cat.id}>
          <div className="cat-header">
            <div>
              <div className="cat-name">{ci + 1}. {cat.name}</div>
              {cat.description && <div style={{ fontSize: 12, opacity: .8, marginTop: 3 }}>{cat.description}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: 'none' }}
                onClick={() => { setForm({ name: cat.name, description: cat.description || '' }); setEditing(cat.id); setModal('cat'); }}>
                ✏️
              </button>
              <button className="btn btn-sm" style={{ background: 'rgba(255,100,100,.3)', color: '#fff', border: 'none' }} onClick={() => delCat(cat.id)}>🗑️</button>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.9)', color: '#1a56db', border: 'none', fontWeight: 700 }}
                onClick={() => openIndModal(cat.id)}>
                ➕ เพิ่มตัวชี้วัด
              </button>
            </div>
          </div>

          <table className="ind-table">
            <thead>
              <tr><th>#</th><th>ชื่อตัวชี้วัด</th><th>รูปแบบ</th><th>น้ำหนัก</th><th>หลักฐาน</th><th>จัดการ</th></tr>
            </thead>
            <tbody>
              {(cat.indicators || []).map((ind, ii) => (
                <tr key={ind.id}>
                  <td style={{ color: '#94a3b8' }}>{ii+1}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{ind.name}</div>
                    {ind.description && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{ind.description}</div>}
                  </td>
                  <td>
                    <span className={`type-pill ${ind.score_type === 'scale' ? 'type-scale' : 'type-yesno'}`}>
                      {ind.score_type === 'scale' ? '📊 สเกล 1-4' : '✅ มี/ไม่มี'}
                    </span>
                  </td>
                  <td><span className="weight-pill">{ind.weight}%</span></td>
                  <td style={{ fontSize: 13 }}>{ind.allow_evidence ? '📎 ได้' : '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-outline" onClick={() => openIndModal(cat.id, ind)}>✏️ แก้ไข</button>
                      <button className="btn btn-sm btn-danger"  onClick={() => delInd(ind.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!(cat.indicators?.length) && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>ยังไม่มีตัวชี้วัด</td></tr>}
            </tbody>
          </table>
        </div>
      ))}

      {/* Category Modal */}
      {modal === 'cat' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <h3>{editing ? '✏️ แก้ไขหมวดหมู่' : '➕ เพิ่มหมวดหมู่'}</h3>
            <div className="field"><label>ชื่อหมวดหมู่ *</label><input value={form.name || ''} onChange={e => setForm(p=>({...p,name:e.target.value}))} /></div>
            <div className="field"><label>คำอธิบาย</label><textarea rows={2} value={form.description || ''} onChange={e => setForm(p=>({...p,description:e.target.value}))} /></div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setModal(null)}>ยกเลิก</button>
              <button className="btn btn-blue" onClick={saveCat}>💾 บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {/* Indicator Modal */}
      {modal === 'ind' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <h3>{editing ? '✏️ แก้ไขตัวชี้วัด' : '➕ เพิ่มตัวชี้วัด'}</h3>
            <div className="field"><label>ชื่อตัวชี้วัด *</label><input value={form.name || ''} onChange={e => setForm(p=>({...p,name:e.target.value}))} /></div>
            <div className="field"><label>รายละเอียด/เกณฑ์</label><textarea rows={2} value={form.description || ''} onChange={e => setForm(p=>({...p,description:e.target.value}))} /></div>
            <div className="grid2">
              <div className="field">
                <label>น้ำหนักคะแนน (%) *</label>
                <input type="number" min="0" max="100" step="0.5" value={form.weight || ''} onChange={e => setForm(p=>({...p,weight:e.target.value}))} />
              </div>
              <div className="field">
                <label>รูปแบบคะแนน</label>
                <select value={form.score_type} onChange={e => setForm(p=>({...p,score_type:e.target.value}))}>
                  <option value="scale">สเกล 1-4</option>
                  <option value="yes_no">มี/ไม่มี</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>อนุญาตแนบหลักฐาน</label>
              <select value={form.allow_evidence} onChange={e => setForm(p=>({...p,allow_evidence:Number(e.target.value)}))}>
                <option value={1}>อนุญาต</option>
                <option value={0}>ไม่อนุญาต</option>
              </select>
            </div>
            {form.score_type === 'scale' && (
              <>
                <div style={{ fontWeight: 600, fontSize: 12, color: '#475569', marginBottom: 8 }}>คำอธิบายระดับคะแนน</div>
                <div className="grid2">
                  {[1,2,3,4].map(v => (
                    <div className="field" key={v}>
                      <label>ระดับ {v}</label>
                      <input value={form[`scale_${v}_desc`] || ''} onChange={e => setForm(p=>({...p,[`scale_${v}_desc`]:e.target.value}))} />
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setModal(null)}>ยกเลิก</button>
              <button className="btn btn-blue" onClick={saveInd}>💾 บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
