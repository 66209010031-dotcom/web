// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' });

  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
};

module.exports.requireRole = function (...roles) {
  return [
    module.exports,
    (req, res, next) => {
      if (!roles.includes(req.user.role))
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึง' });
      next();
    },
  ];
};
