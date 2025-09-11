const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Checking existing data...\n');
    
    // Get teachers
    const teachers = await prisma.teacher.findMany({
      select: { id: true, firstName: true, lastName: true, teacherId: true }
    });
    console.log('📚 Teachers found:', teachers.length);
    teachers.forEach(t => console.log(`  - ${t.firstName} ${t.lastName} (${t.teacherId})`));
    
    console.log('\n');
    
    // Get subjects
    const subjects = await prisma.subject.findMany({
      select: { id: true, name: true }
    });
    console.log('📖 Subjects found:', subjects.length);
    subjects.forEach(s => console.log(`  - ${s.name}`));
    
    console.log('\n');
    
    // Get classes
    const classes = await prisma.class.findMany({
      select: { id: true, name: true, branchId: true, academicYearId: true }
    });
    console.log('🏫 Classes found:', classes.length);
    classes.forEach(c => console.log(`  - ${c.name} (Branch: ${c.branchId}, Year: ${c.academicYearId})`));
    
    console.log('\n');
    
    // Get academic years
    const academicYears = await prisma.academicYear.findMany({
      select: { id: true, name: true }
    });
    console.log('📅 Academic Years found:', academicYears.length);
    academicYears.forEach(ay => console.log(`  - ${ay.name} (ID: ${ay.id})`));
    
    console.log('\n');
    
    // Get branches
    const branches = await prisma.branch.findMany({
      select: { id: true, legalName: true, shortName: true }
    });
    console.log('🏢 Branches found:', branches.length);
    branches.forEach(b => console.log(`  - ${b.legalName} (${b.shortName}) - ID: ${b.id}`));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
