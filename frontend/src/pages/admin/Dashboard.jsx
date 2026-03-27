// pages/admin/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';

const STATUS_CONFIG = {
  pending:    { label: 'รอประเมินตนเอง',       bg: '#f1f5f9', color: '#475569', icon: '⏳' },
  self_done:  { label: 'ประเมินตนเองแล้ว',      bg: '#fef9c3', color: '#92400e', icon: '✍️' },
  evaluating: { label: 'กรรมการกำลังประเมิน',  bg: '#dbeafe', color: '#1e40af', icon: '🔍' },
  completed:  { label: 'เสร็จสิ้น',             bg: '#dcfce7', color: '#166534', icon: '✅' },
};

const CSS = `
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px; }
  .stat-card {
    background: #fff; border-radius: 14px; padding: 22px 20px;
    border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,.05);
    display: flex; align-items: center; gap: 16px; transition: transform .2s;
  }
  .stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.1); }
  .stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
  .stat-num   { font-family: 'Kanit', sans-serif; font-size: 30px; font-weight: 700; color: #1e2a3b; line-height: 1; }
  .stat-label { font-size: 13px; color: #64748b; margin-top: 4px; }

  .card { background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,.04); overflow: hidden; margin-bottom: 20px; }
  .card-header { padding: 18px 22px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
  .card-title  { font-family: 'Kanit', sans-serif; font-size: 16px; font-weight: 600; color: #1e2a3b; }

  .filters { display: flex; gap: 10px; flex-wrap: wrap; }
  .inp { padding: 8px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-family: 'Sarabun', sans-serif; font-size: 13px; outline: none; transition: border-color .2s; }
  .inp:focus { border-color: #1a56db; }
  .sel { padding: 8px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-family: 'Sarabun', sans-serif; font-size: 13px; background: #fff; cursor: pointer; outline: none; }

  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #f8faff; }
  th { padding: 11px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-align: left; text-transform: uppercase; letter-spacing: .06em; white-space: nowrap; }
  td { padding: 13px 16px; font-size: 14px; border-bottom: 1px solid #f8faff; color: #1e2a3b; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #fafbff; }

  .badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; }

  .btn { padding: 7px 14px; border-radius: 8px; font-family: 'Sarabun', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all .2s; display: inline-flex; align-items: center; gap: 6px; }
  .btn-sm    { padding: 5px 11px; font-size: 12px; }
  .btn-ghost { background: #f1f5f9; color: #475569; }
  .btn-ghost:hover { background: #e2e8f0; }
  .btn-blue  { background: #1a56db; color: #fff; }
  .btn-blue:hover  { background: #1e429f; }
  .btn-red   { background: #fee2e2; color: #dc2626; }
  .btn-red:hover   { background: #fecaca; }
  .btn-green { background: #dcfce7; color: #166534; }
  .btn-green:hover { background: #bbf7d0; }

  .prog-mini { display: flex; align-items: center; gap: 8px; }
  .prog-track { flex: 1; height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden; min-width: 70px; }
  .prog-fill  { height: 100%; background: linear-gradient(90deg, #1a56db, #60a5fa); border-radius: 99px; transition: width .4s; }

  .period-select { padding: 8px 14px; border: 1.5px solid #dde3f0; border-radius: 8px; font-family: 'Sarabun', sans-serif; font-size: 14px; background: #fff; cursor: pointer; outline: none; }
  .period-select:focus { border-color: #1a56db; }
  .empty { text-align: center; padding: 48px; color: #94a3b8; font-size: 14px; }
`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [periods,    setPeriods]    = useState([]);
  const [activePid,  setActivePid]  = useState('');
  const [evaluatees, setEvaluatees] = useState([]);
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState('all');

  useEffect(() => {
    api.get('/periods').then(r => {
      setPeriods(r.data.data);
      const active = r.data.data.find(p => p.status === 'active');
      if (active) setActivePid(String(active.id));
      else if (r.data.data.length) setActivePid(String(r.data.data[0].id));
    });
  }, []);

  useEffect(() => {
    if (!activePid) return;
    api.get(`/evaluatees?period_id=${activePid}`).then(r => setEvaluatees(r.data.data));
  }, [activePid]);

  const stats = {
    total:      evaluatees.length,
    pending:    evaluatees.filter(e => e.status === 'pending').length,
    self_done:  evaluatees.filter(e => e.status === 'self_done').length,
    evaluating: evaluatees.filter(e => e.status === 'evaluating').length,
    completed:  evaluatees.filter(e => e.status === 'completed').length,
  };

  const filtered = evaluatees.filter(e => {
    const q = search.toLowerCase();
    const matchQ = !q || e.full_name?.toLowerCase().includes(q) || e.employee_id?.toLowerCase().includes(q);
    const matchF = filter === 'all' || e.status === filter;
    return matchQ && matchF;
  });

  const pctMap = { pending: 0, self_done: 33, evaluating: 66, completed: 100 };

  return (
    <Layout title="Dashboard" subtitle="ภาพรวมและติดตามสถานะการประเมินบุคลากร">
      <style>{CSS}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <select className="period-select" value={activePid} onChange={e => setActivePid(e.target.value)}>
            {periods.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/admin/periods')}>📅 จัดการรอบประเมิน</button>
          {activePid && <button className="btn btn-ghost" onClick={() => navigate(`/admin/periods/${activePid}/indicators`)}>📋 จัดการตัวชี้วัด</button>}
          {activePid && <button className="btn btn-blue" onClick={() => navigate(`/admin/periods/${activePid}/evaluatees`)}>👥 จัดการรายชื่อ</button>}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {[
          { icon: '👥', label: 'ทั้งหมด',              num: stats.total,      bg: '#dbeafe', ic: '#1e40af' },
          { icon: '⏳', label: 'รอประเมินตนเอง',       num: stats.pending,    bg: '#f1f5f9', ic: '#475569' },
          { icon: '✍️', label: 'ประเมินตนเองแล้ว',    num: stats.self_done,  bg: '#fef9c3', ic: '#92400e' },
          { icon: '🔍', label: 'กรรมการกำลังประเมิน', num: stats.evaluating, bg: '#ede9fe', ic: '#5b21b6' },
          { icon: '✅', label: 'เสร็จสิ้น',            num: stats.completed,  bg: '#dcfce7', ic: '#166534' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.bg, color: s.ic }}>{s.icon}</div>
            <div><div className="stat-num">{s.num}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">รายชื่อผู้รับการประเมิน</div>
          <div className="filters">
            <input className="inp" placeholder="🔍 ค้นหาชื่อหรือรหัส" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 210 }} />
            <select className="sel" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">ทุกสถานะ</option>
              {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th><th>ชื่อ-สกุล / รหัส</th><th>แผนก</th>
              <th>กรรมการ</th><th>ความคืบหน้า</th><th>สถานะ</th><th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7}><div className="empty">ไม่พบข้อมูล</div></td></tr>
            ) : filtered.map((e, i) => {
              const s  = STATUS_CONFIG[e.status] || STATUS_CONFIG.pending;
              const pct = pctMap[e.status] || 0;
              const evs = (() => { try { return JSON.parse(e.evaluators) || []; } catch { return e.evaluators || []; } })();
              return (
                <tr key={e.id}>
                  <td style={{ color: '#94a3b8', fontSize: 12 }}>{i+1}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{e.full_name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{e.employee_id}</div>
                  </td>
                  <td style={{ fontSize: 13, color: '#475569' }}>{e.department}</td>
                  <td style={{ fontSize: 12 }}>
                    {evs.map(ev => (
                      <div key={ev.evaluator_id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>{ev.role === 'chair' ? '👑' : '👤'}</span>
                        <span>{ev.full_name}</span>
                      </div>
                    ))}
                    {evs.length === 0 && <span style={{ color: '#94a3b8' }}>ยังไม่มี</span>}
                  </td>
                  <td>
                    <div className="prog-mini">
                      <div className="prog-track"><div className="prog-fill" style={{ width: `${pct}%` }} /></div>
                      <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 28 }}>{pct}%</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: s.bg, color: s.color }}>{s.icon} {s.label}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/evaluator/summary/${e.id}`)}>ดูผล</button>
                      <button className="btn btn-sm btn-red" onClick={() => window.open(`/api/reports/pdf/${e.id}`, '_blank')}>PDF</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
