/**
 * Automated CSRF Protection Application Script
 * 
 * This script systematically applies withCSRF wrapper to all
 * POST/PUT/DELETE/PATCH handlers in API routes.
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '../src/app/api');

// Routes to skip (already protected or auth routes that don't need CSRF)
const SKIP_ROUTES = [
  'auth/login',
  'auth/logout', 
  'auth/refresh',
  'auth/csrf-token',
  'grades', // already done
  'attendance/route.ts', // already done
  'exams/route.ts', // already done
  'homework-grading', // already done
  'teacher-homework/route.ts', // already done
  'upload/route.ts', // already done
  'upload-attachments', // already done
  'messages/route.ts', // already done
  'announcements/route.ts', // already done
  'exams/[id]/route.ts', // already done
  'exams/[id]/archive', // already done
  'student/profile/update', // already done
  'teacher/profile/update', // already done
  'student-homework/submit', // already done
];

function shouldProcessFile(filePath) {
  const relativePath = path.relative(API_DIR, filePath);
  return !SKIP_ROUTES.some(skip => relativePath.includes(skip));
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check if already has withCSRF import
  const hasWithCSRF = content.includes('withCSRF');
  
  // Find all exported async function declarations
  const methodPattern = /^export async function (POST|PUT|DELETE|PATCH)\s*\(/gm;
  const matches = [...content.matchAll(methodPattern)];
  
  if (matches.length === 0) {
    return false; // No state-changing methods
  }

  if (hasWithCSRF) {
    console.log(`⏭️  Skipping ${path.relative(API_DIR, filePath)} - already has withCSRF`);
    return false;
  }

  console.log(`🔒 Processing ${path.relative(API_DIR, filePath)} - found ${matches.length} methods`);

  // Add withCSRF import
  if (!content.includes("import { withCSRF } from '@/lib/security'")) {
    content = content.replace(
      /^import\s+\{.*NextRequest.*\}/m,
      (match) => `${match}\nimport { withCSRF } from '@/lib/security';`
    );
    modified = true;
  }

  // Process each method
  matches.forEach(match => {
    const method = match[1];
    const lowerMethod = method.toLowerCase();

    // Convert: export async function POST( to: async function postHandler(
    const oldDeclaration = `export async function ${method}(`;
    const newDeclaration = `async function ${lowerMethod}Handler(`;
    
    if (content.includes(oldDeclaration)) {
      content = content.replace(oldDeclaration, newDeclaration);
      
      // Add export at the end of the function
      // Find the end of this specific function
      const funcRegex = new RegExp(`async function ${lowerMethod}Handler[\\s\\S]*?\\n\\}(?=\\n|$)`, 'g');
      content = content.replace(funcRegex, (funcMatch) => {
        return `${funcMatch}\n\nexport const ${method} = withCSRF(${lowerMethod}Handler);`;
      });
      
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${path.relative(API_DIR, filePath)}`);
  }

  return modified;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let processedCount = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processedCount += walkDir(filePath);
    } else if (file === 'route.ts' && shouldProcessFile(filePath)) {
      if (processFile(filePath)) {
        processedCount++;
      }
    }
  });

  return processedCount;
}

console.log('🚀 Starting CSRF protection application...\n');
const count = walkDir(API_DIR);
console.log(`\n✨ Complete! Protected ${count} route files.`);

