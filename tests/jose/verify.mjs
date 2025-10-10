// tests/jose/verify.mjs
import { jwtVerify } from 'jose';

const token = process.argv[2];
const secretBase = process.env.JWT_SECRET;

if (!token || !secretBase) {
  console.error('Usage: JWT_SECRET=secret node --input-type=module verify.mjs <token>');
  process.exit(1);
}

const secret = new TextEncoder().encode(secretBase);

(async () => {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'school-management-system',
      audience: 'school-app',
    });
    console.log('✅ token valid. payload:', payload);
  } catch (err) {
    console.error('❌ invalid token:', err.message);
  }
})();
