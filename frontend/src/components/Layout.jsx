// components/Layout.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const styles = `
  .layout { display: flex; min-height: 100vh; }
  .sidebar {
    width: 240px; background: linear-gradient(180deg, #0f2057 0%, #1a3a8f 60%, #1a56db 100%);
    color: #fff; display: flex; flex-direction: column;
    position: fixed; top: 0; bottom: 0; left: 0; z-index: 200;
    box-shadow: 4px 0 20px rgba(0,0,0,0.2);
  }
  .sb-logo {
    padding: 22px 20px 18px;
    border-bottom: 1px solid rgba(255,255,255,.12);
  }
  .sb-logo-title {
    font-family: 'Kanit', sans-serif; font-size: 15px; font-weight: 600;
    line-height: 1.3; color: #fff;
  }
  .sb-logo-sub { font-size: 11px; opacity: .6; margin-top: 3px; }
  .sb-user {
    padding: 14px 20px; background: rgba(255,255,255,.08);
    border-bottom: 1px solid rgba(255,255,255,.1);
    display: flex; align-items: center; gap: 10px;
  }
  .sb-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(255,255,255,.2); display: flex;
    align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0;
  }
  .sb-user-name  { font-size: 13px; font-weight: 600; color: #fff; }
  .sb-user-role  { font-size: 11px; opacity: .65; margin-top: 1px; }
  .sb-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
  .sb-section { padding: 10px 20px 4px; font-size: 10px; opacity: .45; text-transform: uppercase; letter-spacing: .1em; }
  .sb-item {
    display: flex; align-items: center; gap: 11px; padding: 11px 20px;
    cursor: pointer; font-size: 14px; color: rgba(255,255,255,.7);
    border-left: 3px solid transparent; transition: all .18s;
    user-select: none;
  }
  .sb-item:hover  { background: rgba(255,255,255,.1); color: #fff; border-left-color: rgba(255,255,255,.3); }
  .sb-item.active { background: rgba(255,255,255,.15); color: #fff; border-left-color: #60a5fa; font-weight: 600; }
  .sb-icon { width: 20px; text-align: center; font-size: 15px; }
  .sb-footer { padding: 14px 20px; border-top: 1px solid rgba(255,255,255,.1); }
  .sb-logout {
    display: flex; align-items: center; gap: 10px; padding: 9px 12px;
    border-radius: 8px; cursor: pointer; font-size: 13px;
    color: rgba(255,255,255,.65); transition: all .18s;
    background: rgba(255,255,255,.05);
  }
  .sb-logout:hover { background: rgba(239,68,68,.25); color: #fca5a5; }

  .main-area { flex: 1; margin-left: 240px; display: flex; flex-direction: column; min-height: 100vh; }
  .topbar {
    background: #fff; border-bottom: 1px solid #e2e8f0;
    padding: 0 28px; height: 60px; display: flex; align-items: center;
    justify-content: space-between; position: sticky; top: 0; z-index: 100;
    box-shadow: 0 1px 6px rgba(0,0,0,.06);
  }
  .topbar-title { font-family: 'Kanit', sans-serif; font-size: 18px; font-weight: 600; color: #1e2a3b; }
  .topbar-sub   { font-size: 12px; color: #64748b; margin-top: 1px; }
  .page-content { flex: 1; padding: 28px; background: #f0f4ff; }
`;

const ROLE_LABELS = { admin: 'ผู้ดูแลระบบ', staff: 'บุคลากร', evaluator: 'กรรมการประเมิน' };
const ROLE_ICONS  = { admin: '⚙️', staff: '👤', evaluator: '📋' };

const NAV_ITEMS = {
  admin: [
    { section: 'ภาพรวม' },
    { path: '/admin',                   icon: '📊', label: 'Dashboard' },
    { section: 'จัดการระบบ' },
    { path: '/admin/periods',            icon: '📅', label: 'รอบการประเมิน' },
  ],
  staff: [
    { section: 'ของฉัน' },
    { path: '/staff', icon: '🏠', label: 'หน้าหลัก' },
  ],
  evaluator: [
    { section: 'งานของฉัน' },
    { path: '/evaluator', icon: '📋', label: 'รายการประเมิน' },
  ],
};

export default function Layout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const navItems = NAV_ITEMS[user?.role] || [];

  return (
    <>
      <style>{styles}</style>
      <div className="layout">
        <aside className="sidebar">
          <div className="sb-logo">
            <div style={{ fontSize: 22, marginBottom: 6 }}>🏛️</div>
            <div className="sb-logo-title">ระบบประเมินบุคลากร</div>
            <div className="sb-logo-sub">Personnel Evaluation System</div>
          </div>

          <div className="sb-user">
            <div className="sb-avatar">{ROLE_ICONS[user?.role]}</div>
            <div>
              <div className="sb-user-name">{user?.full_name}</div>
              <div className="sb-user-role">{ROLE_LABELS[user?.role]}</div>
            </div>
          </div>

          <nav className="sb-nav">
            {navItems.map((item, i) =>
              item.section ? (
                <div key={i} className="sb-section">{item.section}</div>
              ) : (
                <div
                  key={i}
                  className={`sb-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  <span className="sb-icon">{item.icon}</span>
                  {item.label}
                </div>
              )
            )}
          </nav>

          <div className="sb-footer">
            <div className="sb-logout" onClick={logout}>
              <span>🚪</span> ออกจากระบบ
            </div>
          </div>
        </aside>

        <div className="main-area">
          <header className="topbar">
            <div>
              <div className="topbar-title">{title}</div>
              {subtitle && <div className="topbar-sub">{subtitle}</div>}
            </div>
          </header>
          <main className="page-content">{children}</main>
        </div>
      </div>
    </>
  );
}
