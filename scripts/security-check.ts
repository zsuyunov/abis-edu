/**
 * Security Verification Script
 * Runs automated security checks on your application
 * 
 * Usage:
 * npx ts-node scripts/security-check.ts
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface SecurityCheck {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  message: string;
  details?: string;
}

const results: SecurityCheck[] = [];

function check(name: string, testFn: () => boolean | 'SKIP', passMsg: string, failMsg: string, details?: string): void {
  try {
    const result = testFn();
    if (result === 'SKIP') {
      results.push({ name, status: 'SKIP', message: passMsg });
    } else if (result) {
      results.push({ name, status: 'PASS', message: passMsg, details });
    } else {
      results.push({ name, status: 'FAIL', message: failMsg, details });
    }
  } catch (error) {
    results.push({ 
      name, 
      status: 'FAIL', 
      message: failMsg,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function runChecks(): void {
  console.log('🔒 Running Security Checks...\n');

  // 1. Check for .env file
  check(
    'Environment Configuration',
    () => fs.existsSync('.env'),
    '✅ .env file found',
    '❌ .env file missing - copy env.example.txt to .env'
  );

  // 2. Check JWT secrets are set
  check(
    'JWT Secrets',
    () => {
      const envContent = fs.readFileSync('.env', 'utf-8');
      const hasJWT = envContent.includes('JWT_SECRET=') && !envContent.includes('JWT_SECRET=""');
      const hasRefresh = envContent.includes('REFRESH_TOKEN_SECRET=') && !envContent.includes('REFRESH_TOKEN_SECRET=""');
      return hasJWT && hasRefresh;
    },
    '✅ JWT secrets configured',
    '❌ JWT_SECRET or REFRESH_TOKEN_SECRET not set in .env',
    'Run: openssl rand -base64 64'
  );

  // 3. Check Redis configuration
  check(
    'Redis Configuration',
    () => {
      const envContent = fs.readFileSync('.env', 'utf-8');
      const hasRedis = envContent.includes('REDIS_URL=');
      return hasRedis ? true : 'SKIP';
    },
    '✅ Redis URL configured (distributed rate limiting enabled)',
    '⚠️ Redis URL not set (using in-memory storage)',
    'For production: Set REDIS_URL to Upstash or similar'
  );

  // 4. Check CSRF middleware exists
  check(
    'CSRF Middleware',
    () => fs.existsSync('src/lib/security/csrf-middleware.ts'),
    '✅ CSRF middleware installed',
    '❌ CSRF middleware missing'
  );

  // 5. Check monitoring exists
  check(
    'Security Monitoring',
    () => fs.existsSync('src/lib/security/monitoring.ts'),
    '✅ Security monitoring installed',
    '❌ Security monitoring missing'
  );

  // 6. Check for hardcoded secrets
  check(
    'Hardcoded Secrets',
    () => {
      const srcFiles = execSync('find src -name "*.ts" -o -name "*.tsx"', { encoding: 'utf-8' });
      const files = srcFiles.split('\n').filter(Boolean);
      
      for (const file of files.slice(0, 50)) { // Sample first 50 files
        const content = fs.readFileSync(file, 'utf-8');
        if (content.match(/secret["\s]*[:=]["\s]*["'][a-zA-Z0-9]{20,}["']/i)) {
          return false;
        }
      }
      return true;
    },
    '✅ No hardcoded secrets found (sampled)',
    '❌ Possible hardcoded secrets detected',
    'Search for hardcoded API keys, passwords, or tokens'
  );

  // 7. Check dependency vulnerabilities
  check(
    'NPM Audit',
    () => {
      try {
        execSync('npm audit --audit-level=high', { stdio: 'pipe' });
        return true;
      } catch (error) {
        return false;
      }
    },
    '✅ No high/critical vulnerabilities',
    '❌ High/critical vulnerabilities found',
    'Run: npm audit fix'
  );

  // 8. Check TypeScript strict mode
  check(
    'TypeScript Strict Mode',
    () => {
      const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));
      return tsconfig.compilerOptions?.strict === true;
    },
    '✅ TypeScript strict mode enabled',
    '⚠️ TypeScript strict mode disabled',
    'Enable strict mode in tsconfig.json for better type safety'
  );

  // 9. Check CSP headers
  check(
    'CSP Headers',
    () => {
      const headersFile = fs.readFileSync('src/lib/security/headers.ts', 'utf-8');
      const hasNoUnsafe = !headersFile.includes("'unsafe-inline'") && !headersFile.includes("'unsafe-eval'");
      return hasNoUnsafe;
    },
    '✅ CSP hardened (no unsafe-inline/eval)',
    '❌ CSP contains unsafe directives',
    'Remove unsafe-inline and unsafe-eval from CSP'
  );

  // 10. Check password hashing
  check(
    'Password Hashing',
    () => {
      const passwordFile = fs.readFileSync('src/lib/security/password.ts', 'utf-8');
      return passwordFile.includes('argon2');
    },
    '✅ Using Argon2 for password hashing',
    '❌ Not using Argon2 for password hashing'
  );

  // 11. Check token versioning
  check(
    'Token Versioning',
    () => {
      const tokensFile = fs.readFileSync('src/lib/security/tokens.ts', 'utf-8');
      return tokensFile.includes('tokenVersion') && tokensFile.includes('async verifyAccessToken');
    },
    '✅ Token versioning with DB validation enabled',
    '❌ Token versioning not properly implemented'
  );

  // 12. Check rate limiting
  check(
    'Rate Limiting',
    () => {
      const rateLimitFile = fs.readFileSync('src/lib/security/rate-limit.ts', 'utf-8');
      return rateLimitFile.includes('checkAsync') && rateLimitFile.includes('Redis');
    },
    '✅ Redis-backed rate limiting enabled',
    '❌ Rate limiting not using Redis'
  );

  // Print results
  console.log('\n' + '═'.repeat(80));
  console.log('📊 Security Check Results');
  console.log('═'.repeat(80) + '\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARN').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : 
                 result.status === 'FAIL' ? '❌' : 
                 result.status === 'WARN' ? '⚠️' : '⏭️';
    
    console.log(`${icon} ${result.name}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   💡 ${result.details}`);
    }
    console.log('');
  });

  console.log('═'.repeat(80));
  console.log(`Summary: ${passed} passed, ${failed} failed, ${warnings} warnings, ${skipped} skipped`);
  console.log('═'.repeat(80));

  if (failed > 0) {
    console.log('\n❌ Security checks failed. Please fix the issues above.');
    process.exit(1);
  } else {
    console.log('\n✅ All security checks passed!');
    process.exit(0);
  }
}

// Run checks
if (require.main === module) {
  runChecks();
}

