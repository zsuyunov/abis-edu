const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin(phone = '+998901234567', password = 'admin123') {
  console.log('🔐 Creating admin user...');
  
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create admin user
    const admin = await prisma.admin.upsert({
      where: { phone },
      update: { password: hashedPassword },
      create: {
        id: `admin-${Date.now()}`,
        phone,
        password: hashedPassword,
      },
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📱 Phone:', admin.phone);
    console.log('🔑 Password:', password);
    console.log('🆔 ID:', admin.id);
    
    return admin;
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createAdmin()
    .catch((e) => {
      console.error('❌ Error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { createAdmin };
