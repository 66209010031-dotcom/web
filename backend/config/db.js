// config/db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:              process.env.DB_HOST     || 'localhost',
  port:              process.env.DB_PORT     || 3306,
  user:              process.env.DB_USER     || 'root',
  password:          process.env.DB_PASS     || '1234',
  database:          process.env.DB_NAME     || 'eval_system',
  waitForConnections: true,
  connectionLimit:   10,
  charset:           'utf8mb4',
});

module.exports = pool;
