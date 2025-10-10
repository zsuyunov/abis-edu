// tests/jwt/sign.js
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;
const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
if (!secret || !refreshSecret) {
  console.error('Set JWT_SECRET and REFRESH_TOKEN_SECRET in env');
  process.exit(1);
}

const access = jwt.sign(
  { id: 'user-123', role: 'student', tokenVersion: 1 },
  secret,
  { algorithm: 'HS256', expiresIn: '15m', issuer: 'school-management-system', audience: 'school-app' }
);

const refresh = jwt.sign(
  { id: 'user-123', role: 'student', type: 'refresh', tokenVersion: 1 },
  refreshSecret,
  { algorithm: 'HS256', expiresIn: '7d', issuer: 'school-management-system', audience: 'school-app', jwtid: 'r-' + Date.now() }
);

console.log('ACCESS_TOKEN=', access);
console.log('REFRESH_TOKEN=', refresh);
