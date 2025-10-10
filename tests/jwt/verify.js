// tests/jwt/verify.js
const jwt = require('jsonwebtoken');

const token = process.argv[2];
const secret = process.env.JWT_SECRET;
if (!token || !secret) {
  console.error('Usage: JWT_SECRET=secret node tests/jwt/verify.js <token>');
  process.exit(1);
}

try {
  const payload = jwt.verify(token, secret, {
    algorithms: ['HS256'],
    issuer: 'school-management-system',
    audience: 'school-app',
  });
  console.log('✅ verified payload:', payload);
} catch (err) {
  console.error('❌ verification failed:', err.message);
}
