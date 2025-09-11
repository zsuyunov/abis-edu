const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listAdmins() {
  console.log('👥 Listing all admin users...');
  
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        phone: true,
        // Don't show password for security
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    if (admins.length === 0) {
      console.log('❌ No admin users found');
    } else {
      console.log(`✅ Found ${admins.length} admin user(s):`);
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ID: ${admin.id}, Phone: ${admin.phone}`);
      });
    }
    
    return admins;
    
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
