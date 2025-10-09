/**
 * Script to Generate CSRF Protection Code for Routes
 * 
 * This script scans your API routes and generates the code changes needed
 * to add CSRF protection to all state-changing endpoints.
 * 
 * Usage:
 * npx ts-node scripts/apply-csrf-protection.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const API_DIR = path.join(process.cwd(), 'src', 'app', 'api');

interface RouteInfo {
  file: string;
  methods: string[];
  needsCSRF: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
}

// Routes that don't need CSRF (auth routes, GET-only, etc.)
const CSRF_EXEMPT_PATTERNS = [
  /\/auth\/login/,
  /\/auth\/logout/,
  /\/auth\/refresh/,
  /\/auth\/csrf-token/,
  /\/auth\/me/,
];

// High priority routes (grades, attendance, exams, etc.)
const HIGH_PRIORITY_PATTERNS = [
  /\/grades/,
  /\/attendance/,
  /\/exams/,
  /\/homework-grading/,
  /\/teachers\/route\.ts$/,
  /\/students\/route\.ts$/,
  /\/admin\//,
];

// Medium priority routes
const MEDIUM_PRIORITY_PATTERNS = [
  /\/messages/,
  /\/announcements/,
  /\/events/,
  /\/complaints/,
  /\/documents/,
  /\/upload/,
];

function scanRoutes(dir: string, routes: RouteInfo[] = []): RouteInfo[] {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      scanRoutes(filePath, routes);
    } else if (file === 'route.ts') {
      const content = fs.readFileSync(filePath, 'utf-8');
      const methods: string[] = [];

      // Check for HTTP methods
      if (/export\s+(async\s+)?function\s+POST/m.test(content) || /export\s+const\s+POST\s*=/m.test(content)) {
        methods.push('POST');
      }
      if (/export\s+(async\s+)?function\s+PUT/m.test(content) || /export\s+const\s+PUT\s*=/m.test(content)) {
        methods.push('PUT');
      }
      if (/export\s+(async\s+)?function\s+DELETE/m.test(content) || /export\s+const\s+DELETE\s*=/m.test(content)) {
        methods.push('DELETE');
      }
      if (/export\s+(async\s+)?function\s+PATCH/m.test(content) || /export\s+const\s+PATCH\s*=/m.test(content)) {
        methods.push('PATCH');
      }

      const relativePath = filePath.replace(API_DIR, '');
      
      // Determine if needs CSRF
      const isExempt = CSRF_EXEMPT_PATTERNS.some(pattern => pattern.test(relativePath));
      const needsCSRF = methods.length > 0 && !isExempt;

      // Determine priority
      let priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' = 'NONE';
      if (needsCSRF) {
        if (HIGH_PRIORITY_PATTERNS.some(p => p.test(relativePath))) {
          priority = 'HIGH';
        } else if (MEDIUM_PRIORITY_PATTERNS.some(p => p.test(relativePath))) {
          priority = 'MEDIUM';
        } else {
          priority = 'LOW';
        }
      }

      if (methods.length > 0) {
        routes.push({
          file: relativePath,
          methods,
          needsCSRF,
          priority,
        });
      }
    }
  }

  return routes;
}

function generateReport(): void {
  console.log('🔍 Scanning API routes...\n');
  
  const routes = scanRoutes(API_DIR);
  
  const highPriority = routes.filter(r => r.priority === 'HIGH');
  const mediumPriority = routes.filter(r => r.priority === 'MEDIUM');
  const lowPriority = routes.filter(r => r.priority === 'LOW');
  const exempt = routes.filter(r => !r.needsCSRF);

  console.log('📊 CSRF Protection Status Report');
  console.log('═'.repeat(80));
  console.log(`Total routes found: ${routes.length}`);
  console.log(`Routes needing CSRF: ${routes.filter(r => r.needsCSRF).length}`);
  console.log(`CSRF-exempt routes: ${exempt.length}`);
  console.log('');

  console.log('🔴 HIGH PRIORITY (Apply IMMEDIATELY)');
  console.log('─'.repeat(80));
  highPriority.forEach(route => {
    console.log(`  ${route.file}`);
    console.log(`    Methods: ${route.methods.join(', ')}`);
    console.log(`    Code: export const POST = withCSRF(async (request) => { ... });`);
    console.log('');
  });

  console.log('🟡 MEDIUM PRIORITY (Apply Soon)');
  console.log('─'.repeat(80));
  mediumPriority.forEach(route => {
    console.log(`  ${route.file}`);
    console.log(`    Methods: ${route.methods.join(', ')}`);
  });
  console.log('');

  console.log('🟢 LOW PRIORITY (Apply When Possible)');
  console.log('─'.repeat(80));
  console.log(`  ${lowPriority.length} routes - see full list below`);
  console.log('');

  console.log('✅ CSRF-EXEMPT (No Action Needed)');
  console.log('─'.repeat(80));
  exempt.forEach(route => {
    console.log(`  ${route.file} - ${route.methods.join(', ')}`);
  });
  console.log('');

  console.log('📝 NEXT STEPS');
  console.log('═'.repeat(80));
  console.log('1. Review HIGH PRIORITY routes above');
  console.log('2. Apply CSRF protection using: import { withCSRF } from "@/lib/security"');
  console.log('3. Wrap handlers: export const POST = withCSRF(async (request) => { ... })');
  console.log('4. Test with: npm run test:security');
  console.log('5. Monitor logs for CSRF failures');
  console.log('');

  // Save detailed report to file
  const reportPath = path.join(process.cwd(), 'CSRF_ROUTES_REPORT.md');
  let markdown = '# CSRF Protection Routes Report\n\n';
  markdown += `Generated: ${new Date().toISOString()}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- Total routes: ${routes.length}\n`;
  markdown += `- Need CSRF: ${routes.filter(r => r.needsCSRF).length}\n`;
  markdown += `- High priority: ${highPriority.length}\n`;
  markdown += `- Medium priority: ${mediumPriority.length}\n`;
  markdown += `- Low priority: ${lowPriority.length}\n`;
  markdown += `- Exempt: ${exempt.length}\n\n`;

  markdown += `## High Priority Routes\n\n`;
  highPriority.forEach(route => {
    markdown += `### \`${route.file}\`\n`;
    markdown += `- Methods: ${route.methods.join(', ')}\n`;
    markdown += `- Example:\n\`\`\`typescript\n`;
    markdown += `import { withCSRF } from '@/lib/security';\n\n`;
    route.methods.forEach(method => {
      markdown += `export const ${method} = withCSRF(async (request: NextRequest) => {\n`;
      markdown += `  // ... existing code ...\n`;
      markdown += `});\n\n`;
    });
    markdown += `\`\`\`\n\n`;
  });

  markdown += `## All Routes by Priority\n\n`;
  ['HIGH', 'MEDIUM', 'LOW'].forEach(priority => {
    const priorityRoutes = routes.filter(r => r.priority === priority);
    if (priorityRoutes.length > 0) {
      markdown += `### ${priority} Priority\n\n`;
      priorityRoutes.forEach(route => {
        markdown += `- \`${route.file}\` - ${route.methods.join(', ')}\n`;
      });
      markdown += `\n`;
    }
  });

  fs.writeFileSync(reportPath, markdown);
  console.log(`📄 Detailed report saved to: CSRF_ROUTES_REPORT.md`);
}

// Run the script
if (require.main === module) {
  try {
    generateReport();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

export { scanRoutes };

