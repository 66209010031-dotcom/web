// pages/staff/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

const STATUS_CONFIG = {
  pending:    { label: 'รอการประเมิน',          bg: '#f1f5f9', color: '#475569', icon: '⏳', action: 'เริ่มประเมินตนเอง', canAct: true },
  self_done:  { label: 'ส่งการประเมินแล้ว',     bg: '#fef9c3', color: '#92400e', icon: '✍️', action: 'ดูที่ส่งแล้ว', canAct: true },
  evaluating: { label: 'กรรมการกำลังประเมิน',  bg: '#dbeafe', color: '#1e40af', icon: '🔍', action: 'รอผล...', canAct: false },
  completed:  { label: 'ประเมินเสร็จสิ้น',      bg: '#dcfce7', color: '#166534', icon: '✅', action: 'ดูผลการประเมิน', canAct: true },
};

const CSS = `
  .welcome { background: linear-gradient(135deg, #0f2057, #1a56db); color: #fff; border-radius: 16px; padding: 28px 30px; margin-bottom: 24px; display: flex; align-items: center; gap: 20px; }
  .welcome-icon { font-size: 48px; flex-shrink: 0; }
  .welcome h2 { font-family: 'Kanit', sans-serif; font-size: 22px; font-weight: 600; margin-bottom: 4px; }
  .welcome p  { font-size: 14px; opacity: .8; }

  .period-card {
    background: #fff; border-radius: 16px; border: 1px solid #e2e8f0;
    box-shadow: 0 4px 16px rgba(0,0,0,.06); padding: 24px; margin-bottom: 16px;
    transition: transform .2s, box-shadow .2s;
  }
  .period-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,.1); }
  .period-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
  .period-title  { font-family: 'Kanit', sans-serif; font-size: 18px; font-weight: 600; color: #1e2a3b; }
  .period-dates  { font-size: 12px; color: #94a3b8; margin-top: 4px; }

  .badge { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }

  .info-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 18px; }
  .info-item { background: #f8faff; border-radius: 10px; padding: 14px 16px; }
  .info-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 5px; }
  .info-val   { font-family: 'Kanit', sans-serif; font-size: 20px; font-weight: 600; color: #1e2a3b; }

  .btn { padding: 12px 24px; border-radius: 10px; font-family: 'Sarabun', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .2s; display: inline-flex; align-items: center; gap: 8px; }
  .btn-primary { background: linear-gradient(135deg, #1a56db, #1e429f); color: #fff; box-shadow: 0 4px 12px rgba(26,86,219,.3); }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(26,86,219,.4); }
  .btn-success { background: linear-gradient(135deg, #10b981, #059669); color: #fff; box-shadow: 0 4px 12px rgba(16,185,129,.3); }
  .btn-success:hover { transform: translateY(-1px); }
  .btn-disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }

  .empty-state { text-align: center; padding: 60px 20px; color: #94a3b8; }
  .empty-state .big-icon { font-size: 56px; margin-bottom: 16px; }
  .empty-state h3 { font-family: 'Kanit', sans-serif; font-size: 18px; color: #475569; margin-bottom: 8px; }
`;

export default function StaffDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/evaluatees/my').then(r => { setList(r.data.data); setLoading(false); });
  }, []);

  function handleAction(ev) {
    if (ev.status === 'pending' || ev.status === 'self_done') navigate(`/staff/evaluate/${ev.id}`);
    else if (ev.status === 'completed') navigate(`/staff/result/${ev.id}`);
  }

  return (
    <Layout title="หน้าหลักบุคลากร" subtitle="ดูสถานะและทำแบบประเมินตนเอง">
      <style>{CSS}</style>

      <div className="welcome">
        <div className="welcome-icon">👋</div>
        <div>
          <h2>สวัสดี, คุณ{user?.full_name}</h2>
          <p>{user?.position} · {user?.department}</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>⏳ กำลังโหลด...</div>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <div className="big-icon">📋</div>
          <h3>ยังไม่มีรอบการประเมิน</h3>
          <p>เมื่อมีการกำหนดรอบการประเมินจาก Admin จะแสดงที่นี่</p>
        </div>
      ) : list.map(ev => {
        const s = STATUS_CONFIG[ev.status] || STATUS_CONFIG.pending;
        return (
          <div className="period-card" key={ev.id}>
            <div className="period-header">
              <div>
                <div className="period-title">{ev.period_title}</div>
                <div className="period-dates">📅 {ev.start_date?.slice(0,10)} — {ev.end_date?.slice(0,10)}</div>
              </div>
              <span className="badge" style={{ background: s.bg, color: s.color }}>{s.icon} {s.label}</span>
            </div>

            <div className="info-row">
              <div className="info-item">
                <div className="info-label">สถานะรอบ</div>
                <div className="info-val" style={{ fontSize: 14 }}>{ev.period_status === 'active' ? '🟢 เปิดอยู่' : '🔴 ปิดแล้ว'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">ส่งตนเองเมื่อ</div>
                <div className="info-val" style={{ fontSize: 13 }}>{ev.submitted_at ? new Date(ev.submitted_at).toLocaleDateString('th-TH') : '-'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">สถานะการประเมิน</div>
                <div className="info-val" style={{ fontSize: 14 }}>{s.label}</div>
              </div>
            </div>

            <button
              className={`btn ${!s.canAct ? 'btn-disabled' : ev.status === 'completed' ? 'btn-success' : 'btn-primary'}`}
              onClick={() => s.canAct && handleAction(ev)}
              disabled={!s.canAct}
            >
              {s.icon} {s.action}
            </button>
          </div>
        );
      })}
    </Layout>
  );
}
