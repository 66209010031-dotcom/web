// routes/auth.js
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
const auth    = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'กรุณากรอก email และรหัสผ่าน' });

  try {
    const [[user]] = await db.query(
      'SELECT * FROM users WHERE email = ? AND is_active = 1',
      [email.toLowerCase().trim()]
    );
    if (!user)
      return res.status(401).json({ success: false, message: 'ไม่พบบัญชีผู้ใช้ หรืออีเมลไม่ถูกต้อง' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง' });

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set!');
      return res.status(500).json({ success: false, message: 'Server config error: JWT_SECRET missing. Check .env file.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, full_name: user.full_name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '7d' }
    );

    const { password: _pw, ...userInfo } = user;
    res.json({ success: true, token, user: userInfo });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const [[user]] = await db.query(
      'SELECT id, employee_id, full_name, email, role, department, position, phone FROM users WHERE id=?',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
  const { full_name, phone, department, position } = req.body;
  try {
    await db.query(
      'UPDATE users SET full_name=?, phone=?, department=?, position=? WHERE id=?',
      [full_name, phone, department, position, req.user.id]
    );
    res.json({ success: true, message: 'อัพเดตข้อมูลสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword)
    return res.status(400).json({ success: false, message: 'กรุณากรอกรหัสผ่านให้ครบ' });
  try {
    const [[user]] = await db.query('SELECT password FROM users WHERE id=?', [req.user.id]);
    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) return res.status(400).json({ success: false, message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password=? WHERE id=?', [hash, req.user.id]);
    res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
