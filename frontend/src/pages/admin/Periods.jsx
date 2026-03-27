// pages/admin/Periods.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';

const STATUS_COLOR = {
  draft:  { bg: '#f1f5f9', color: '#475569', label: 'ร่าง' },
  active: { bg: '#dcfce7', color: '#166534', label: 'เปิดใช้งาน' },
  closed: { bg: '#fee2e2', color: '#991b1b', label: 'ปิดแล้ว' },
};

const CSS = `
  .card { background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,.04); overflow: hidden; }
  .card-header { padding: 18px 22px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
  .card-title  { font-family: 'Kanit', sans-serif; font-size: 16px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; }
  th { padding: 11px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-align: left; text-transform: uppercase; letter-spacing: .06em; background: #f8faff; }
  td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid #f8faff; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #fafbff; }
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .btn  { padding: 8px 16px; border-radius: 8px; font-family: 'Sarabun', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all .2s; display: inline-flex; align-items: center; gap: 6px; }
  .btn-blue  { background: #1a56db; color: #fff; }
  .btn-blue:hover { background: #1e429f; }
  .btn-sm    { padding: 5px 12px; font-size: 12px; }
  .btn-ghost { background: #f1f5f9; color: #475569; }
  .btn-ghost:hover { background: #e2e8f0; }
  .btn-danger{ background: #fee2e2; color: #dc2626; }
  .btn-danger:hover { background: #fecaca; }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 20px; }
  .modal { background: #fff; border-radius: 16px; padding: 28px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,.2); }
  .modal h3 { font-family: 'Kanit', sans-serif; font-size: 20px; font-weight: 600; margin-bottom: 20px; }
  .field { margin-bottom: 16px; }
  .field label { font-size: 13px; font-weight: 600; color: #374151; display: block; margin-bottom: 6px; }
  .field input, .field select, .field textarea { width: 100%; padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-family: 'Sarabun', sans-serif; font-size: 14px; outline: none; transition: border-color .2s; }
  .field input:focus, .field select:focus, .field textarea:focus { border-color: #1a56db; }
  .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
`;

const EMPTY = { title: '', description: '', start_date: '', end_date: '', status: 'draft' };

export default function AdminPeriods() {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState([]);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving]  = useState(false);

  const load = () => api.get('/periods').then(r => setPeriods(r.data.data));
  useEffect(() => { load(); }, []);

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) await api.put(`/periods/${editing}`, form);
      else          await api.post('/periods', form);
      setModal(false); setForm(EMPTY); setEditing(null); load();
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('ยืนยันลบรอบการประเมินนี้?')) return;
    await api.delete(`/periods/${id}`);
    load();
  }

  function openEdit(p) {
    setForm({ title: p.title, description: p.description || '', start_date: p.start_date?.slice(0,10), end_date: p.end_date?.slice(0,10), status: p.status });
    setEditing(p.id); setModal(true);
  }

  return (
    <Layout title="รอบการประเมิน" subtitle="จัดการช่วงเวลาและสถานะการประเมิน">
      <style>{CSS}</style>
      <div className="card">
        <div className="card-header">
          <div className="card-title">รายการรอบการประเมินทั้งหมด</div>
          <button className="btn btn-blue" onClick={() => { setForm(EMPTY); setEditing(null); setModal(true); }}>
            ➕ สร้างรอบใหม่
          </button>
        </div>
        <table>
          <thead>
            <tr><th>#</th><th>ชื่อรอบการประเมิน</th><th>วันเริ่ม</th><th>วันสิ้นสุด</th><th>สถานะ</th><th>จัดการ</th></tr>
          </thead>
          <tbody>
            {periods.map((p, i) => {
              const s = STATUS_COLOR[p.status];
              return (
                <tr key={p.id}>
                  <td style={{ color: '#94a3b8', fontSize: 12 }}>{i+1}</td>
                  <td><div style={{ fontWeight: 600 }}>{p.title}</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{p.description}</div></td>
                  <td style={{ fontSize: 13 }}>{p.start_date?.slice(0,10)}</td>
                  <td style={{ fontSize: 13 }}>{p.end_date?.slice(0,10)}</td>
                  <td><span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/admin/periods/${p.id}/indicators`)}>📋 ตัวชี้วัด</button>
                      <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/admin/periods/${p.id}/evaluatees`)}>👥 รายชื่อ</button>
                      <button className="btn btn-sm btn-ghost" onClick={() => openEdit(p)}>✏️</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!periods.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>ยังไม่มีรอบการประเมิน</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <h3>{editing ? '✏️ แก้ไขรอบการประเมิน' : '➕ สร้างรอบใหม่'}</h3>
            {[
              { label: 'ชื่อรอบการประเมิน *', key: 'title',       type: 'text' },
              { label: 'คำอธิบาย',             key: 'description', type: 'textarea' },
              { label: 'วันเริ่มต้น *',         key: 'start_date',  type: 'date' },
              { label: 'วันสิ้นสุด *',          key: 'end_date',    type: 'date' },
            ].map(f => (
              <div className="field" key={f.key}>
                <label>{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea rows={2} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                ) : (
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                )}
              </div>
            ))}
            <div className="field">
              <label>สถานะ</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="draft">ร่าง</option>
                <option value="active">เปิดใช้งาน</option>
                <option value="closed">ปิด</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>ยกเลิก</button>
              <button className="btn btn-blue" onClick={handleSave} disabled={saving}>
                {saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
