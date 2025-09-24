const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAdminLogin(phone, password) {
  try {
    const admin = await prisma.admin.findUnique({ where: { phone } });
    
    if (!admin) {
      return { success: false, message: 'Admin not found' };
    }
    
    const isValidPassword = await bcrypt.compare(password, admin.password);
    
    if (isValidPassword) {
      return { success: true, message: 'Login successful', adminId: admin.id };
    } else {
      return { success: false, message: 'Invalid password' };
    }
  } catch (error) {
    return { success: false, message: 'Error: ' + error.message };
  }
}

async function testBothAdmins() {
  console.log('🧪 Testing both admin login credentials...\n');
  
  // Test Admin 1
  console.log('Testing Admin 1:');
  const admin1Result = await testAdminLogin('+998901234567', 'admin123');
  console.log(`   Phone: +998901234567`);
  console.log(`   Password: admin123`);
  console.log(`   Result: ${admin1Result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  if (admin1Result.success) {
    console.log(`   Admin ID: ${admin1Result.adminId}`);
  } else {
    console.log(`   Error: ${admin1Result.message}`);
  }
  console.log('');
  
  // Test Admin 2
  console.log('Testing Admin 2:');
  const admin2Result = await testAdminLogin('+998901234568', 'admin456');
  console.log(`   Phone: +998901234568`);
  console.log(`   Password: admin456`);
  console.log(`   Result: ${admin2Result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  if (admin2Result.success) {
    console.log(`   Admin ID: ${admin2Result.adminId}`);
  } else {
    console.log(`   Error: ${admin2Result.message}`);
  }
  console.log('');
  
  // Summary
  const bothWorking = admin1Result.success && admin2Result.success;
  console.log('📊 Summary:');
  console.log(`   Both admins working: ${bothWorking ? '✅ YES' : '❌ NO'}`);
  console.log('');
  console.log('🎉 You can now use both admin accounts to login!');
}

// Run if called directly
if (require.main === module) {
  testBothAdmins()
    .catch((e) => {
      console.error('❌ Error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { testBothAdmins };
