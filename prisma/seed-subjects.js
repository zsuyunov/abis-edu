const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting subjects seeding...');

  // Subject data
  const subjectsData = [
    'A-Level',
    'Head of English',
    'Head of primary English Department',
    'IGCSE',
    'IT',
    'Math SAT',
    'PE',
    'arabic',
    'art',
    'business',
    'drama',
    'economics',
    'english',
    'event',
    'geography',
    'german',
    'global',
    'gym gymnastics',
    'gym taekwondo',
    'head of education',
    'head of science department',
    'high school monitoring offcier',
    'history',
    'homeroom teacher',
    'homeroom teacher 1',
    'homeroom teacher 2',
    'homeroom teacher 3',
    'homeroom teacher year 1',
    'homeroom teacher year 2',
    'italian',
    'management',
    'math',
    'music',
    'physics IGCSE',
    'poetry',
    'psychology',
    'public',
    'russian',
    'science',
    'stem',
    'support teacher',
    'support english Teacher',
    'teacher assistant',
    'uzbek'
  ];

  // Create subjects
  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const subjectName of subjectsData) {
    try {
      // Check if subject already exists
      const existingSubject = await prisma.subject.findFirst({
        where: { name: subjectName }
      });

      if (existingSubject) {
        skippedCount++;
        console.log(`⏭️  Subject already exists: ${subjectName}`);
        continue;
      }

      // Create subject
      const subject = await prisma.subject.create({
        data: {
          name: subjectName
        }
      });

      createdCount++;
      console.log(`✅ Created subject: ${subject.name}`);

    } catch (error) {
      const errorMsg = `Error processing subject ${subjectName}: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   - Subjects created: ${createdCount}`);
  console.log(`   - Subjects skipped (already exist): ${skippedCount}`);
  console.log(`   - Errors: ${errorCount}`);
  console.log(`   - Total processed: ${subjectsData.length}`);

  if (errorCount > 0) {
    console.warn(`\n⚠️  ${errorCount} subjects could not be created due to errors.`);
    console.log('\nDetailed errors:');
    errors.forEach((err, index) => console.log(`   ${index + 1}. ${err}`));
  } else {
    console.log(`\n✅ Subjects seeding completed successfully!`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
