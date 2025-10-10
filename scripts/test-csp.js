/**
 * CSP Testing and Validation Script
 * Tests the Content Security Policy implementation
 */

const https = require('https');
const http = require('http');

console.log('🔒 CSP Security Test Suite\n');

// Test configuration
const testConfig = {
  baseUrl: process.env.TEST_URL || 'https://abis-edu.onrender.com',
  expectedCSP: {
    hasUnsafeInline: false,
    hasUnsafeEval: false,
    hasObjectSrcNone: true,
    hasFrameSrcNone: true,
    hasNonce: true,
  }
};

/**
 * Test CSP headers
 */
async function testCSPHeaders() {
  console.log('Testing CSP Headers...');
  console.log('━'.repeat(50));

  try {
    const response = await fetch(testConfig.baseUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'CSP-Test-Suite/1.0'
      }
    });

    const cspHeader = response.headers.get('content-security-policy');
    
    if (!cspHeader) {
      console.log('❌ No CSP header found');
      return false;
    }

    console.log('✅ CSP header found');
    console.log(`📋 CSP: ${cspHeader.substring(0, 100)}...`);

    // Test for unsafe directives
    const hasUnsafeInline = cspHeader.includes("'unsafe-inline'");
    const hasUnsafeEval = cspHeader.includes("'unsafe-eval'");
    const hasObjectSrcNone = cspHeader.includes("object-src 'none'");
    const hasFrameSrcNone = cspHeader.includes("frame-src 'none'");
    const hasNonce = cspHeader.includes("'nonce-");

    console.log('\n📊 CSP Analysis:');
    console.log(`  unsafe-inline: ${hasUnsafeInline ? '❌ FOUND' : '✅ NOT FOUND'}`);
    console.log(`  unsafe-eval: ${hasUnsafeEval ? '❌ FOUND' : '✅ NOT FOUND'}`);
    console.log(`  object-src 'none': ${hasObjectSrcNone ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`  frame-src 'none': ${hasFrameSrcNone ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`  nonce support: ${hasNonce ? '✅ FOUND' : '❌ NOT FOUND'}`);

    // Security score
    let score = 0;
    if (!hasUnsafeInline) score += 25;
    if (!hasUnsafeEval) score += 25;
    if (hasObjectSrcNone) score += 25;
    if (hasFrameSrcNone) score += 25;

    console.log(`\n🎯 Security Score: ${score}/100`);

    if (score === 100) {
      console.log('🟢 EXCELLENT: CSP is fully secure');
    } else if (score >= 75) {
      console.log('🟡 GOOD: CSP is mostly secure');
    } else {
      console.log('🔴 POOR: CSP has security issues');
    }

    return score === 100;

  } catch (error) {
    console.log(`❌ Error testing CSP: ${error.message}`);
    return false;
  }
}

/**
 * Test for common CSP violations
 */
async function testCSPViolations() {
  console.log('\nTesting for CSP Violations...');
  console.log('━'.repeat(50));

  const violations = [];

  // Test inline scripts
  try {
    const response = await fetch(testConfig.baseUrl);
    const html = await response.text();
    
    // Check for inline scripts
    const inlineScripts = html.match(/<script[^>]*>(?!.*src=)[^<]*<\/script>/gi);
    if (inlineScripts && inlineScripts.length > 0) {
      violations.push(`Found ${inlineScripts.length} inline scripts without nonce`);
    }

    // Check for inline event handlers
    const inlineHandlers = html.match(/on\w+\s*=/gi);
    if (inlineHandlers && inlineHandlers.length > 0) {
      violations.push(`Found ${inlineHandlers.length} inline event handlers`);
    }

    // Check for eval usage
    const evalUsage = html.match(/eval\s*\(/gi);
    if (evalUsage && evalUsage.length > 0) {
      violations.push(`Found ${evalUsage.length} eval() calls`);
    }

  } catch (error) {
    violations.push(`Error scanning HTML: ${error.message}`);
  }

  if (violations.length === 0) {
    console.log('✅ No CSP violations found');
    return true;
  } else {
    console.log('❌ CSP violations found:');
    violations.forEach(violation => console.log(`  - ${violation}`));
    return false;
  }
}

/**
 * Test security headers
 */
async function testSecurityHeaders() {
  console.log('\nTesting Security Headers...');
  console.log('━'.repeat(50));

  try {
    const response = await fetch(testConfig.baseUrl, { method: 'HEAD' });
    
    const headers = {
      'X-Frame-Options': response.headers.get('x-frame-options'),
      'X-Content-Type-Options': response.headers.get('x-content-type-options'),
      'X-XSS-Protection': response.headers.get('x-xss-protection'),
      'Referrer-Policy': response.headers.get('referrer-policy'),
      'Strict-Transport-Security': response.headers.get('strict-transport-security'),
    };

    console.log('📋 Security Headers:');
    Object.entries(headers).forEach(([name, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`  ${status} ${name}: ${value || 'NOT SET'}`);
    });

    const setHeaders = Object.values(headers).filter(Boolean).length;
    const totalHeaders = Object.keys(headers).length;
    
    console.log(`\n📊 Headers Score: ${setHeaders}/${totalHeaders}`);
    
    return setHeaders === totalHeaders;

  } catch (error) {
    console.log(`❌ Error testing headers: ${error.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting CSP Security Tests...\n');

  const results = {
    cspHeaders: await testCSPHeaders(),
    cspViolations: await testCSPViolations(),
    securityHeaders: await testSecurityHeaders(),
  };

  console.log('\n' + '='.repeat(50));
  console.log('📋 FINAL RESULTS');
  console.log('='.repeat(50));

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  console.log(`✅ Tests Passed: ${passed}/${total}`);
  console.log(`📊 CSP Headers: ${results.cspHeaders ? 'PASS' : 'FAIL'}`);
  console.log(`📊 CSP Violations: ${results.cspViolations ? 'PASS' : 'FAIL'}`);
  console.log(`📊 Security Headers: ${results.securityHeaders ? 'PASS' : 'FAIL'}`);

  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! Your CSP is secure!');
    console.log('🟢 Security Rating: EXCELLENT');
  } else {
    console.log('\n⚠️  Some tests failed. Review the issues above.');
    console.log('🟡 Security Rating: NEEDS IMPROVEMENT');
  }

  return passed === total;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runAllTests, testCSPHeaders, testCSPViolations, testSecurityHeaders };
