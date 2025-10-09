/**
 * Automated Frontend Form CSRF Integration Script
 * 
 * Updates all frontend forms to use csrfFetch
 */

const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = path.join(__dirname, '../src/components');

// Files already updated
const SKIP_FILES = [
  'GradeInputForm.tsx',
  'AttendanceForm.tsx',
  'TeacherHomeworkCreationForm.tsx',
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Skip if already using csrfFetch
  if (content.includes('csrfFetch')) {
    console.log(`⏭️  Skipping ${path.basename(filePath)} - already uses csrfFetch`);
    return false;
  }

  // Find fetch calls with POST/PUT/DELETE/PATCH
  const fetchPattern = /await\s+fetch\s*\(\s*['"](\/api\/[^'"]+)['"]\s*,\s*\{[^}]*method\s*:\s*['"](?:POST|PUT|DELETE|PATCH)['"]/g;
  const matches = [...content.matchAll(fetchPattern)];

  if (matches.length === 0) {
    return false; // No state-changing fetch calls
  }

  console.log(`🔒 Updating ${path.basename(filePath)} - found ${matches.length} fetch calls`);

  // Add csrfFetch import
  if (!content.includes("import { csrfFetch }")) {
    // Find the first import statement and add after it
    const importRegex = /^import\s+.*from\s+['"]react['"]\s*;?\s*$/m;
    if (importRegex.test(content)) {
      content = content.replace(importRegex, (match) => {
        return `${match}\nimport { csrfFetch } from '@/hooks/useCsrfToken';`;
      });
      modified = true;
    } else {
      // If no react import, add at the beginning after "use client" or "use server"
      const useClientRegex = /^["']use (?:client|server)["'];\s*$/m;
      if (useClientRegex.test(content)) {
        content = content.replace(useClientRegex, (match) => {
          return `${match}\n\nimport { csrfFetch } from '@/hooks/useCsrfToken';`;
        });
        modified = true;
      }
    }
  }

  // Replace all fetch calls with csrfFetch
  content = content.replace(
    /await\s+fetch\s*\(/g,
    'await csrfFetch('
  );
  modified = true;

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${path.basename(filePath)}`);
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
    } else if (file.endsWith('.tsx') && !SKIP_FILES.includes(file)) {
      if (processFile(filePath)) {
        processedCount++;
      }
    }
  });

  return processedCount;
}

console.log('🚀 Starting frontend form CSRF integration...\n');
const count = walkDir(COMPONENTS_DIR);
console.log(`\n✨ Complete! Updated ${count} component files.`);

