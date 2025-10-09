/**
 * Fix Import Statement Errors
 * 
 * The automated script incorrectly combined import statements.
 * This script fixes the syntax errors.
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '../src/app/api');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the broken import pattern:
  // import { NextRequest, NextResponse }
  // import { withCSRF } from '@/lib/security'; from "next/server";
  
  const brokenPattern = /import\s+\{\s*NextRequest,\s*NextResponse\s*\}\s*\nimport\s+\{\s*withCSRF\s*\}\s+from\s+['"]@\/lib\/security['"];\s*from\s+["']next\/server["'];/g;
  
  if (brokenPattern.test(content)) {
    console.log(`🔧 Fixing ${path.relative(API_DIR, filePath)}`);
    
    content = content.replace(
      brokenPattern,
      `import { NextRequest, NextResponse } from "next/server";\nimport { withCSRF } from '@/lib/security';`
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${path.relative(API_DIR, filePath)}`);
    return true;
  }
  
  return false;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fixedCount += walkDir(filePath);
    } else if (file === 'route.ts') {
      if (fixFile(filePath)) {
        fixedCount++;
      }
    }
  });

  return fixedCount;
}

console.log('🚀 Starting import fix...\n');
const count = walkDir(API_DIR);
console.log(`\n✨ Complete! Fixed ${count} files.`);

