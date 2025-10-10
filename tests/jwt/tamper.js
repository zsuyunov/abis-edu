// tests/jwt/tamper.js
const jwt = require('jsonwebtoken');

const token = process.argv[2];
const secret = process.env.JWT_SECRET;

if (!token || !secret) {
  console.error('Usage: JWT_SECRET=secret node tests/jwt/tamper.js <token>');
  process.exit(1);
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}
function base64urlEncode(str) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const [headB64, payloadB64, sigB64] = token.split('.');
const payload = JSON.parse(base64urlDecode(payloadB64));
console.log('Original payload:', payload);

payload.role = payload.role === 'admin' ? 'student' : 'admin';
const newPayloadB64 = base64urlEncode(JSON.stringify(payload));
const tampered = `${headB64}.${newPayloadB64}.${sigB64}`;

console.log('Tampered token:', tampered);

try {
  jwt.verify(tampered, secret, { algorithms: ['HS256'], issuer: 'school-management-system', audience: 'school-app' });
  console.error('❌ Tampered token accepted (unexpected)');
} catch (err) {
  console.log('✅ Tampered token rejected as expected:', err.message);
}
