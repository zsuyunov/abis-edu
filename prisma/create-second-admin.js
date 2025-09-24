const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSecondAdmin() {
  console.log('🔐 Creating second admin user...');
  
  try {
    // New admin credentials
    const phone = '+998901234568';
    const password = 'admin456';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { phone }
    });
    
    if (existingAdmin) {
      console.log('⚠️  Admin with this phone number already exists!');
      console.log('📱 Phone:', existingAdmin.phone);
      console.log('🆔 ID:', existingAdmin.id);
      return existingAdmin;
    }
    
    // Create new admin user
    const admin = await prisma.admin.create({
      data: {
        id: `admin-2`,
        phone,
        password: hashedPassword,
      },
    });
    
    console.log('✅ Second admin user created successfully!');
    console.log('📱 Phone:', admin.phone);
    console.log('🔑 Password:', password);
    console.log('🆔 ID:', admin.id);
    console.log('');
    console.log('🎉 Now you have 2 admin accounts:');
    console.log('   Admin 1: +998901234567 / admin123');
    console.log('   Admin 2: +998901234568 / admin456');
    
    return admin;
    
  } catch (error) {
    console.error('❌ Error creating second admin:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createSecondAdmin()
    .catch((e) => {
      console.error('❌ Error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { createSecondAdmin };
