const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting HR users seeding...');

  // Get first available branch
  const branch = await prisma.branch.findFirst({
    where: { status: 'ACTIVE' }
  });

  if (!branch) {
    console.error('❌ No active branch found. Please create at least one branch first.');
    return;
  }

  console.log(`✅ Found branch: ${branch.shortName} (ID: ${branch.id})`);

  // Hash password
  const hashedPassword = await bcrypt.hash('hr123456', 12);

  // Create Main HR user
  const mainHR = await prisma.user.upsert({
    where: { phone: '+998901234590' },
    update: {},
    create: {
      id: 'main-hr-001',
      firstName: 'Main',
      lastName: 'HR Manager',
      gender: 'MALE',
      dateOfBirth: new Date('1985-03-15'),
      phone: '+998901234590',
      userId: 'MHR001',
      email: 'main.hr@beruniy.uz',
      status: 'ACTIVE',
      address: 'Tashkent, Uzbekistan',
      position: 'MAIN_HR',
      branchId: null, // Main HR has access to all branches
      password: hashedPassword,
    },
  });

  console.log(`✅ Created Main HR: ${mainHR.firstName} ${mainHR.lastName} (Phone: ${mainHR.phone})`);

  // Create Support HR user for the branch
  const supportHR = await prisma.user.upsert({
    where: { phone: '+998901234591' },
    update: {},
    create: {
      id: 'support-hr-001',
      firstName: 'Support',
      lastName: 'HR Assistant',
      gender: 'FEMALE',
      dateOfBirth: new Date('1990-07-20'),
      phone: '+998901234591',
      userId: 'SHR001',
      email: 'support.hr@beruniy.uz',
      status: 'ACTIVE',
      address: 'Tashkent, Uzbekistan',
      position: 'SUPPORT_HR',
      branchId: branch.id, // Support HR is assigned to specific branch
      password: hashedPassword,
    },
  });

  console.log(`✅ Created Support HR: ${supportHR.firstName} ${supportHR.lastName} (Phone: ${supportHR.phone}, Branch: ${branch.shortName})`);

  // Create additional Support HR for other branches if they exist
  const otherBranches = await prisma.branch.findMany({
    where: { 
      status: 'ACTIVE',
      id: { not: branch.id }
    },
    take: 2 // Limit to 2 additional branches
  });

  let supportHRCounter = 2;
  for (const otherBranch of otherBranches) {
    const supportHR2 = await prisma.user.upsert({
      where: { phone: `+99890123459${supportHRCounter}` },
      update: {},
      create: {
        id: `support-hr-00${supportHRCounter}`,
        firstName: 'Support',
        lastName: `HR ${otherBranch.shortName}`,
        gender: supportHRCounter % 2 === 0 ? 'FEMALE' : 'MALE',
        dateOfBirth: new Date(`199${supportHRCounter}-0${supportHRCounter}-15`),
        phone: `+99890123459${supportHRCounter}`,
        userId: `SHR00${supportHRCounter}`,
        email: `support.hr.${otherBranch.shortName.toLowerCase()}@beruniy.uz`,
        status: 'ACTIVE',
        address: `${otherBranch.district}, Uzbekistan`,
        position: 'SUPPORT_HR',
        branchId: otherBranch.id,
        password: hashedPassword,
      },
    });

    console.log(`✅ Created Support HR: ${supportHR2.firstName} ${supportHR2.lastName} (Phone: ${supportHR2.phone}, Branch: ${otherBranch.shortName})`);
    supportHRCounter++;
  }

  console.log('🎉 HR users seeding completed!');
  console.log('\n📋 HR Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Main HR:');
  console.log('  📞 Phone: +998901234590');
  console.log('  🔑 Password: hr123456');
  console.log('  🌐 Access: All branches');
  console.log('');
  console.log('Support HR:');
  console.log('  📞 Phone: +998901234591');
  console.log('  🔑 Password: hr123456');
  console.log(`  🏢 Branch: ${branch.shortName}`);
  
  if (otherBranches.length > 0) {
    console.log('');
    console.log('Additional Support HR users:');
    otherBranches.forEach((branch, index) => {
      console.log(`  📞 Phone: +99890123459${index + 2}`);
      console.log(`  🔑 Password: hr123456`);
      console.log(`  🏢 Branch: ${branch.shortName}`);
    });
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
