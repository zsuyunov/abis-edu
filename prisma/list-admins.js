const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listAdmins() {
  console.log('📋 Listing all admin accounts...');
  
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        phone: true,
        // Don't select password for security
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    if (admins.length === 0) {
      console.log('❌ No admin accounts found!');
      return;
    }
    
    console.log(`✅ Found ${admins.length} admin account(s):`);
    console.log('');
    
    admins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ID: ${admin.id}`);
      console.log(`      Phone: ${admin.phone}`);
      console.log('');
    });
    
    console.log('🔐 Login Credentials:');
    console.log('   Admin 1: +998901234567 / admin123');
    console.log('   Admin 2: +998901234568 / admin456');
    
  } catch (error) {
    console.error('❌ Error listing admins:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  listAdmins()
    .catch((e) => {
      console.error('❌ Error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { listAdmins };