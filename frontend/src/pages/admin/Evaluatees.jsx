// pages/admin/Evaluatees.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';

const CSS = `
  .back-btn { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 20px; transition: all .2s; }
  .back-btn:hover { border-color: #1a56db; color: #1a56db; }
  .card { background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,.04); overflow: hidden; margin-bottom: 20px; }
  .card-header { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
  .card-title  { font-family: 'Kanit', sans-serif; font-size: 16px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; }
  th { padding: 10px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-align: left; text-transform: uppercase; letter-spacing: .06em; background: #f8faff; }
  td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #f8faff; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #fafbff; }
  .btn  { padding: 8px 16px; border-radius: 8px; font-family: 'Sarabun', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all .2s; display: inline-flex; align-items: center; gap: 6px; }
  .btn-blue   { background: #1a56db; color: #fff; }
  .btn-blue:hover { background: #1e429f; }
  .btn-sm     { padding: 5px 11px; font-size: 12px; }
  .btn-ghost  { background: #f1f5f9; color: #475569; border: none; }
  .btn-ghost:hover { background: #e2e8f0; }
  .btn-danger { background: #fee2e2; color: #dc2626; }
  .btn-danger:hover { background: #fecaca; }
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 99px; font-size: 11px; font-weight: 600; }
  .badge-chair  { background: #fef9c3; color: #92400e; }
  .badge-member { background: #dbeafe; color: #1e40af; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 20px; }
  .modal { background: #fff; border-radius: 16px; padding: 28px; width: 100%; max-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,.2); }
  .modal h3 { font-family: 'Kanit', sans-serif; font-size: 18px; font-weight: 600; margin-bottom: 18px; }
  .field { margin-bottom: 14px; }
  .field label { font-size: 12px; font-weight: 600; color: #374151; display: block; margin-bottom: 5px; }
  .field select { width: 100%; padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-family: 'Sarabun', sans-serif; font-size: 14px; outline: none; }
  .field select:focus { border-color: #1a56db; }
  .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px; }
  .ev-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px dashed #f1f5f9; }
  .ev-item:last-child { border-bottom: none; }
`;

export default function AdminEvaluatees() {
  const { id: periodId } = useParams();
  const navigate = useNavigate();
  const [period,     setPeriod]     = useState(null);
  const [evaluatees, setEvaluatees] = useState([]);
  const [allUsers,   setAllUsers]   = useState([]);
  const [modal,      setModal]      = useState(null);
  const [selEvId,    setSelEvId]    = useState(null);
  const [form,       setForm]       = useState({ user_id: '', evaluator_id: '', role: 'member' });

  const load = () => {
    api.get(`/periods/${periodId}`).then(r => setPeriod(r.data.data));
    api.get(`/evaluatees?period_id=${periodId}`).then(r => setEvaluatees(r.data.data));
    api.get('/evaluatees/users/all').then(r => setAllUsers(r.data.data));
  };
  useEffect(load, [periodId]);

  async function addEvaluatee() {
    await api.post('/evaluatees', { period_id: periodId, user_id: form.user_id });
    setModal(null); setForm(p => ({ ...p, user_id: '' })); load();
  }

  async function addEvaluator() {
    await api.post(`/evaluatees/${selEvId}/assignments`, { evaluator_id: form.evaluator_id, role: form.role });
    setModal(null); setForm(p => ({ ...p, evaluator_id: '', role: 'member' })); load();
  }

  async function removeEvaluatee(id) {
    if (!window.confirm('ลบผู้รับการประเมินออกจากรอบนี้?')) return;
    await api.delete(`/evaluatees/${id}`); load();
  }

  async function removeAssignment(id) {
    await api.delete(`/evaluatees/assignments/${id}`); load();
  }

  const staffUsers = allUsers.filter(u => u.role === 'staff');
  const evalUsers  = allUsers.filter(u => u.role === 'evaluator');

  return (
    <Layout title="จัดการรายชื่อ / กรรมการ" subtitle={period?.title}>
      <style>{CSS}</style>
      <button className="back-btn" onClick={() => navigate('/admin/periods')}>← กลับ</button>

      <div className="card">
        <div className="card-header">
          <div className="card-title">ผู้รับการประเมิน ({evaluatees.length} คน)</div>
          <button className="btn btn-blue" onClick={() => setModal('add')}>➕ เพิ่มผู้รับการประเมิน</button>
        </div>
        <table>
          <thead>
            <tr><th>#</th><th>ชื่อ-สกุล</th><th>แผนก / ตำแหน่ง</th><th>กรรมการที่มอบหมาย</th><th>จัดการ</th></tr>
          </thead>
          <tbody>
            {evaluatees.map((e, i) => {
              const evs = (() => { try { return JSON.parse(e.evaluators) || []; } catch { return e.evaluators || []; } })();
              return (
                <tr key={e.id}>
                  <td style={{ color: '#94a3b8' }}>{i+1}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{e.full_name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{e.employee_id}</div>
                  </td>
                  <td style={{ color: '#475569' }}>{e.department}<br/><span style={{ fontSize: 11, color: '#94a3b8' }}>{e.position}</span></td>
                  <td>
                    {evs.map(ev => (
                      <div key={ev.evaluator_id} className="ev-item">
                        <span className={`badge ${ev.role === 'chair' ? 'badge-chair' : 'badge-member'}`}>
                          {ev.role === 'chair' ? '👑 ประธาน' : '👤 กรรมการ'}
                        </span>
                        <span style={{ flex: 1, fontSize: 13 }}>{ev.full_name}</span>
                        <button className="btn btn-sm btn-danger" onClick={() => removeAssignment(ev.assignment_id)}>✕</button>
                      </div>
                    ))}
                    <button className="btn btn-sm btn-ghost" style={{ marginTop: 6 }}
                      onClick={() => { setSelEvId(e.id); setModal('assign'); }}>
                      ➕ มอบหมายกรรมการ
                    </button>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => removeEvaluatee(e.id)}>🗑️ ลบออก</button>
                  </td>
                </tr>
              );
            })}
            {!evaluatees.length && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>ยังไม่มีผู้รับการประเมิน</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Add Evaluatee Modal */}
      {modal === 'add' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <h3>➕ เพิ่มผู้รับการประเมิน</h3>
            <div className="field">
              <label>เลือกบุคลากร</label>
              <select value={form.user_id} onChange={e => setForm(p=>({...p,user_id:e.target.value}))}>
                <option value="">-- เลือกบุคลากร --</option>
                {staffUsers.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.employee_id}) - {u.department}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>ยกเลิก</button>
              <button className="btn btn-blue" onClick={addEvaluatee} disabled={!form.user_id}>💾 เพิ่ม</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Evaluator Modal */}
      {modal === 'assign' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <h3>👥 มอบหมายกรรมการ</h3>
            <div className="field">
              <label>เลือกกรรมการ</label>
              <select value={form.evaluator_id} onChange={e => setForm(p=>({...p,evaluator_id:e.target.value}))}>
                <option value="">-- เลือกกรรมการ --</option>
                {evalUsers.map(u => <option key={u.id} value={u.id}>{u.full_name} - {u.position}</option>)}
              </select>
            </div>
            <div className="field">
              <label>บทบาท</label>
              <select value={form.role} onChange={e => setForm(p=>({...p,role:e.target.value}))}>
                <option value="chair">👑 ประธาน</option>
                <option value="member">👤 กรรมการร่วม</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>ยกเลิก</button>
              <button className="btn btn-blue" onClick={addEvaluator} disabled={!form.evaluator_id}>💾 มอบหมาย</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
