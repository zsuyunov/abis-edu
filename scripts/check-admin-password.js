/**
 * Quick diagnostic script to check admin credentials
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAdminPassword() {
  console.log('🔍 Checking admin accounts...\n');

  try {
    // Get all admins
    const admins = await prisma.admin.findMany();
    
    console.log(`Found ${admins.length} admin(s):\n`);
    
    for (const admin of admins) {
      console.log(`Admin ID: ${admin.id}`);
      console.log(`Phone: ${admin.phone}`);
      console.log(`Password hash: ${admin.password.substring(0, 30)}...`);
      console.log(`Hash type: ${admin.password.startsWith('$2') ? 'bcrypt' : 'argon2'}`);
      console.log(`Token Version: ${admin.tokenVersion}`);
      console.log(`Failed Login Attempts: ${admin.failedLoginAttempts}`);
      console.log(`Account Locked Until: ${admin.accountLockedUntil || 'Not locked'}`);
      console.log('---\n');
      
      // Test with common passwords
      const testPasswords = ['admin123', 'admin', 'password', '123456'];
      
      for (const testPass of testPasswords) {
        try {
          const match = await bcrypt.compare(testPass, admin.password);
          if (match) {
            console.log(`✅ PASSWORD FOUND: "${testPass}" matches for ${admin.phone}`);
          }
        } catch (e) {
          // Ignore
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminPassword();

