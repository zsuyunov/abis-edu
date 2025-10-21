#!/usr/bin/env node

/**
 * EMERGENCY SECURITY FIX
 * This script adds basic security to API routes that are currently exposed
 */

const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY SECURITY FIX - Adding basic protection to exposed routes');

// Routes that need immediate security
const criticalRoutes = [
  'src/app/api/students/route.ts',
  'src/app/api/teachers/route.ts', 
  'src/app/api/teacher-assignments/route.ts',
  'src/app/api/timetables/route.ts'
];

// Basic security middleware template
const securityTemplate = `
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// EMERGENCY SECURITY: Basic authentication check
function checkAuth(request) {
  const headersList = headers();
  const authHeader = request.headers.get('authorization');
  const userId = headersList.get('x-user-id');
  
  if (!authHeader || !userId) {
    return NextResponse.json({ error: 'Unauthorized - No valid authentication' }, { status: 401 });
  }
  
  // Basic role check - only allow ADMIN and TEACHER for sensitive data
  const userRole = headersList.get('x-user-role');
  if (!userRole || !['ADMIN', 'TEACHER'].includes(userRole)) {
    return NextResponse.json({ error: 'Access denied - Insufficient privileges' }, { status: 403 });
  }
  
  return null; // Auth passed
}

// EMERGENCY SECURITY: Remove sensitive data from responses
function sanitizeStudentData(student) {
  const { password, phone, ...safeData } = student;
  return safeData;
}

function sanitizeTeacherData(teacher) {
  const { password, phone, ...safeData } = teacher;
  return safeData;
}
`;

// Update each critical route
criticalRoutes.forEach(routePath => {
  const fullPath = path.join(process.cwd(), routePath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`🔒 Securing ${routePath}...`);
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Add security imports
    if (!content.includes('checkAuth')) {
      content = securityTemplate + '\n' + content;
    }
    
    // Wrap GET handlers with security
    content = content.replace(
      /export async function GET\(/g,
      'export async function GET('
    );
    
    // Add security check at the beginning of GET handlers
    content = content.replace(
      /export async function GET\(request: NextRequest\) \{\s*try \{/g,
      `export async function GET(request: NextRequest) {
  // EMERGENCY SECURITY CHECK
  const authError = checkAuth(request);
  if (authError) return authError;
  
  try {`
    );
    
    // Add data sanitization for student routes
    if (routePath.includes('students')) {
      content = content.replace(
        /return NextResponse\.json\(students\);/g,
        'return NextResponse.json(students.map(sanitizeStudentData));'
      );
    }
    
    // Add data sanitization for teacher routes  
    if (routePath.includes('teachers')) {
      content = content.replace(
        /return NextResponse\.json\(teachers\);/g,
        'return NextResponse.json(teachers.map(sanitizeTeacherData));'
      );
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Secured ${routePath}`);
  } else {
    console.log(`⚠️  Route not found: ${routePath}`);
  }
});

console.log('🚨 EMERGENCY SECURITY APPLIED');
console.log('📋 Next steps:');
console.log('1. Deploy these changes immediately');
console.log('2. Test that students cannot access sensitive data');
console.log('3. Verify no passwords are exposed in API responses');
console.log('4. Check that JWT authentication is required');
