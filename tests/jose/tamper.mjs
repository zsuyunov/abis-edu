// tests/jose/tamper.mjs
import { jwtVerify } from 'jose';

const token = process.argv[2];
const secretBase = process.env.JWT_SECRET;

if (!token || !secretBase) {
  console.error('Usage: JWT_SECRET=secret node --input-type=module tamper.mjs <token>');
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

const [headerB64, payloadB64, sigB64] = token.split('.');

if (!headerB64 || !payloadB64 || !sigB64) {
  console.error('Token format invalid');
  process.exit(1);
}

const payloadJson = JSON.parse(base64urlDecode(payloadB64));
console.log('Original payload:', payloadJson);

// Tamper: flip role (or add a field)
payloadJson.role = payloadJson.role === 'admin' ? 'student' : 'admin';
const newPayloadB64 = base64urlEncode(JSON.stringify(payloadJson));

// Re-assemble token WITHOUT resigning (so signature is invalid)
const tampered = `${headerB64}.${newPayloadB64}.${sigB64}`;
console.log('Tampered token:', tampered);

(async () => {
  const secret = new TextEncoder().encode(secretBase);
  try {
    await jwtVerify(tampered, secret, {
      issuer: 'school-management-system',
      audience: 'school-app',
    });
    console.error('❌ Tampered token was accepted (unexpected)');
  } catch (err) {
    console.log('✅ Tampered token rejected as expected:', err.message);
  }
})();
