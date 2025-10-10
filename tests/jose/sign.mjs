// tests/jose/sign.mjs
import { SignJWT } from 'jose';

const secretBase = process.env.JWT_SECRET;
const refreshSecretBase = process.env.REFRESH_TOKEN_SECRET;

if (!secretBase || !refreshSecretBase) {
  console.error('Set JWT_SECRET and REFRESH_TOKEN_SECRET env vars and re-run.');
  process.exit(1);
}

const secret = new TextEncoder().encode(secretBase);
const refreshSecret = new TextEncoder().encode(refreshSecretBase);

async function sign() {
  const access = await new SignJWT({ id: 'user-123', role: 'student', tokenVersion: 1 })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer('school-management-system')
    .setAudience('school-app')
    .setExpirationTime('15m')
    .sign(secret);

  const refresh = await new SignJWT({ id: 'user-123', role: 'student', type: 'refresh', tokenVersion: 1 })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer('school-management-system')
    .setAudience('school-app')
    .setExpirationTime('7d')
    .setJti('r-' + Date.now())
    .sign(refreshSecret);

  console.log('ACCESS_TOKEN=', access);
  console.log('REFRESH_TOKEN=', refresh);
}

sign();
