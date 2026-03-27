// pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Kanit:wght@500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Sarabun',sans-serif;}

  .login-page {
    min-height: 100vh; display: flex;
    background: linear-gradient(135deg, #0f2057 0%, #1a3a8f 50%, #1a56db 100%);
  }

  .login-left {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 40px; position: relative; overflow: hidden;
  }
  .login-left::before {
    content: ''; position: absolute; inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
  .login-brand { position: relative; text-align: center; color: #fff; max-width: 400px; }
  .login-icon  { font-size: 72px; margin-bottom: 20px; filter: drop-shadow(0 4px 12px rgba(0,0,0,.3)); }
  .login-brand h1 {
    font-family: 'Kanit', sans-serif; font-size: 32px; font-weight: 700;
    line-height: 1.2; margin-bottom: 12px;
    text-shadow: 0 2px 8px rgba(0,0,0,.3);
  }
  .login-brand p { font-size: 16px; opacity: .8; line-height: 1.6; }
  .login-features { margin-top: 36px; display: flex; flex-direction: column; gap: 12px; text-align: left; }
  .feat-item {
    display: flex; align-items: center; gap: 12px;
    background: rgba(255,255,255,.1); border-radius: 10px;
    padding: 12px 16px; backdrop-filter: blur(4px);
    border: 1px solid rgba(255,255,255,.15);
  }
  .feat-icon { font-size: 20px; }
  .feat-text { font-size: 14px; color: rgba(255,255,255,.9); }

  .login-right {
    width: 460px; background: #fff; display: flex; align-items: center;
    justify-content: center; padding: 40px;
    box-shadow: -10px 0 40px rgba(0,0,0,.15);
  }
  .login-form-wrap { width: 100%; max-width: 360px; }
  .form-title {
    font-family: 'Kanit', sans-serif; font-size: 26px; font-weight: 700;
    color: #1e2a3b; margin-bottom: 6px;
  }
  .form-subtitle { font-size: 14px; color: #64748b; margin-bottom: 32px; }

  .field { margin-bottom: 18px; }
  .field-label { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 7px; display: block; }
  .field-input {
    width: 100%; padding: 12px 14px; border: 1.5px solid #e2e8f0;
    border-radius: 10px; font-family: 'Sarabun', sans-serif;
    font-size: 15px; color: #1e2a3b; outline: none; transition: all .2s;
    background: #fafbff;
  }
  .field-input:focus { border-color: #1a56db; background: #fff; box-shadow: 0 0 0 3px rgba(26,86,219,.1); }
  .field-input::placeholder { color: #94a3b8; }

  .demo-accounts {
    background: #f0f4ff; border: 1px solid #dde3f0; border-radius: 10px;
    padding: 14px 16px; margin-bottom: 22px;
  }
  .demo-title { font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: .05em; }
  .demo-item  { display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; color: #374151; }
  .demo-role  { font-weight: 600; color: #1a56db; }
  .demo-copy  { cursor: pointer; color: #64748b; font-size: 11px; }
  .demo-copy:hover { color: #1a56db; }

  .error-box {
    background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;
    padding: 10px 14px; color: #dc2626; font-size: 13px; margin-bottom: 16px;
    display: flex; align-items: center; gap: 8px;
  }
  .btn-login {
    width: 100%; padding: 14px; background: linear-gradient(135deg, #1a56db, #1e429f);
    color: #fff; border: none; border-radius: 10px; font-family: 'Sarabun', sans-serif;
    font-size: 16px; font-weight: 700; cursor: pointer; transition: all .2s;
    box-shadow: 0 4px 14px rgba(26,86,219,.35);
  }
  .btn-login:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(26,86,219,.45); }
  .btn-login:disabled { opacity: .65; cursor: not-allowed; }

  @media (max-width: 768px) {
    .login-left { display: none; }
    .login-right { width: 100%; }
  }
`;

const DEMO = [
  { role: 'Admin',     email: 'admin@eval.com',   pw: 'password' },
  { role: 'Staff',     email: 'somchai@eval.com',  pw: 'password' },
  { role: 'Evaluator', email: 'chair@eval.com',    pw: 'password' },
];

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form,  setForm]  = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const res = await login(form.email, form.password);
    if (res.ok) {
      navigate({ admin: '/admin', staff: '/staff', evaluator: '/evaluator' }[res.role] || '/');
    } else {
      setError(res.message);
    }
  }

  function fillDemo(email, pw) {
    setForm({ email, password: pw });
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="login-page">
        <div className="login-left">
          <div className="login-brand">
            <div className="login-icon">🏛️</div>
            <h1>ระบบประเมินบุคลากร</h1>
            <p>Personnel Evaluation System<br />สำหรับองค์กรยุคใหม่</p>
            <div className="login-features">
              {[
                { icon: '📋', text: 'ประเมินตัวชี้วัดแบบ Yes/No และ Scale 1-4' },
                { icon: '📎', text: 'แนบหลักฐานเป็นไฟล์ PDF, รูปภาพ หรือ URL' },
                { icon: '📊', text: 'Dashboard ติดตามสถานะแบบ Real-time' },
                { icon: '⬇️', text: 'Export รายงานผลการประเมินเป็น PDF' },
              ].map(f => (
                <div key={f.text} className="feat-item">
                  <span className="feat-icon">{f.icon}</span>
                  <span className="feat-text">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-wrap">
            <div className="form-title">เข้าสู่ระบบ</div>
            <div className="form-subtitle">กรุณากรอกข้อมูลเพื่อเข้าใช้งาน</div>

            <div className="demo-accounts">
              <div className="demo-title">🔑 บัญชีทดสอบ (คลิกเพื่อเติม)</div>
              {DEMO.map(d => (
                <div key={d.role} className="demo-item" onClick={() => fillDemo(d.email, d.pw)} style={{ cursor: 'pointer' }}>
                  <span className="demo-role">{d.role}</span>
                  <span>{d.email}</span>
                  <span className="demo-copy">คลิก</span>
                </div>
              ))}
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>รหัสผ่านทุกบัญชี: password </div>
            </div>

            {error && <div className="error-box">⚠️ {error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label className="field-label">อีเมล</label>
                <input className="field-input" type="email" placeholder="กรอกอีเมล"
                  value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div className="field">
                <label className="field-label">รหัสผ่าน</label>
                <input className="field-input" type="password" placeholder="กรอกรหัสผ่าน"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
              </div>
              <button className="btn-login" type="submit" disabled={loading}>
                {loading ? '⏳ กำลังเข้าสู่ระบบ...' : '🔐 เข้าสู่ระบบ'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
