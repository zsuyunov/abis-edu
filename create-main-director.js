const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createMainDirector() {
  try {
    console.log('Creating Main Director user...');

    // Hash the password
    const hashedPassword = await bcrypt.hash('123456', 12);

    // Create Main Director user
    const mainDirector = await prisma.user.create({
      data: {
        firstName: 'John',
        lastName: 'Director',
        gender: 'MALE',
        dateOfBirth: new Date('1980-01-01'),
        phone: '+998901234567',
        userId: 'MD001',
        email: 'director@school.com',
        address: 'Main Office, School Building',
        position: 'MAIN_DIRECTOR',
        password: hashedPassword,
        status: 'ACTIVE',
        // You can optionally assign to a branch
        // branchId: 1
      }
    });

    console.log('✅ Main Director created successfully!');
    console.log('📱 Phone: +998901234567');
    console.log('🔑 Password: 123456');
    console.log('👤 Name: John Director');
    console.log('🆔 User ID: MD001');
    console.log('📧 Email: director@school.com');
    
    return mainDirector;
  } catch (error) {
    console.error('❌ Error creating Main Director:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createMainDirector()
  .then(() => {
    console.log('\n🎉 Main Director setup completed!');
    console.log('You can now login with:');
    console.log('Phone: +998901234567');
    console.log('Password: 123456');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
