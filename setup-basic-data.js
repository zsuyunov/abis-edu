const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Setting up basic data...');

  // Create branch with short name "85"
  const branch = await prisma.branch.upsert({
    where: { shortName: '85' },
    update: {},
    create: {
      shortName: '85',
      legalName: 'Beruniy School Branch 85',
      stir: '123456789',
      phone: '+998900000000',
      region: 'Tashkent',
      address: 'Main street 1',
      district: 'Tashkent',
      longitude: 69.2401,
      latitude: 41.2995,
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Created/Updated branch: ${branch.shortName} (ID: ${branch.id})`);

  // Create academic year 2025-2026
  const academicYear = await prisma.academicYear.upsert({
    where: { name: '2025-2026' },
    update: {},
    create: {
      name: '2025-2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-01'),
      isCurrent: true,
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Created/Updated academic year: ${academicYear.name} (ID: ${academicYear.id})`);

  console.log('\n✅ Basic data setup completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
