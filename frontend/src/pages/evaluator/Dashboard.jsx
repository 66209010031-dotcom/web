// pages/evaluator/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';

const CSS = `
  .assign-card {
    background: #fff; border-radius: 14px; border: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0,0,0,.04); padding: 22px 24px; margin-bottom: 16px;
    display: flex; align-items: center; gap: 20px;
    transition: transform .2s, box-shadow .2s; cursor: pointer;
  }
  .assign-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,86,219,.1); }
  .staff-icon { width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, #1a56db, #60a5fa); display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; color: #fff; }
  .staff-name { font-family: 'Kanit', sans-serif; font-size: 17px; font-weight: 600; color: #1e2a3b; }
  .staff-meta { font-size: 13px; color: #64748b; margin-top: 3px; }
  .role-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; }
  .role-chair { background: #fef9c3; color: #92400e; }
  .role-member{ background: #dbeafe; color: #1e40af; }
  .status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; }
  .ml-auto { margin-left: auto; }
  .btn-eval { padding: 10px 22px; background: #1a56db; color: #fff; border: none; border-radius: 9px; font-family: 'Sarabun', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .2s; }
  .btn-eval:hover { background: #1e429f; }
  .empty { text-align: center; padding: 60px; color: #94a3b8; }
  .empty .big { font-size: 56px; margin-bottom: 14px; }
`;

const STATUS_CONFIG = {
  pending:    { label: 'รอประเมินตนเอง', bg:'#f1f5f9', color:'#475569', icon:'⏳' },
  self_done:  { label: 'พร้อมให้คะแนน',  bg:'#dcfce7', color:'#166534', icon:'✅' },
  evaluating: { label: 'กำลังประเมิน',   bg:'#dbeafe', color:'#1e40af', icon:'🔍' },
  completed:  { label: 'เสร็จสิ้น',       bg:'#f1f5f9', color:'#475569', icon:'🏁' },
};

export default function EvaluatorDashboard() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);

  useEffect(() => { api.get('/evaluatees/my-assignments').then(r => setList(r.data.data)); }, []);

  return (
    <Layout title="รายการที่ต้องประเมิน" subtitle="ดูรายชื่อและให้คะแนนผู้รับการประเมิน">
      <style>{CSS}</style>
      {list.length === 0 ? (
        <div className="empty"><div className="big">📋</div><p>ยังไม่มีรายการที่ต้องประเมิน</p></div>
      ) : list.map(item => {
        const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
        const canEval = item.status === 'self_done' || item.status === 'evaluating';
        return (
          <div key={item.assignment_id} className="assign-card" onClick={() => canEval && navigate(`/evaluator/form/${item.assignment_id}`)}>
            <div className="staff-icon">👤</div>
            <div>
              <div className="staff-name">{item.full_name}</div>
              <div className="staff-meta">{item.employee_id} · {item.department} · {item.position}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className={`role-badge ${item.role==='chair'?'role-chair':'role-member'}`}>
                  {item.role==='chair'?'👑 ประธาน':'👤 กรรมการ'}
                </span>
                <span className="status-badge" style={{ background:s.bg, color:s.color }}>{s.icon} {s.label}</span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>{item.period_title}</div>
            </div>
            <div className="ml-auto">
              {canEval && (
                <button className="btn-eval" onClick={e => { e.stopPropagation(); navigate(`/evaluator/form/${item.assignment_id}`); }}>
                  ✍️ ให้คะแนน
                </button>
              )}
              {item.status === 'completed' && (
                <button className="btn-eval" style={{ background:'#10b981' }} onClick={e => { e.stopPropagation(); navigate(`/evaluator/summary/${item.evaluatee_id}`); }}>
                  📊 ดูสรุป
                </button>
              )}
            </div>
          </div>
        );
      })}
    </Layout>
  );
}
