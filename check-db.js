const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking database state...');
  
  // Check branches
  const branches = await prisma.branch.findMany();
  console.log(`\n📊 Branches (${branches.length}):`);
  branches.forEach(branch => {
    console.log(`   - ${branch.shortName} (ID: ${branch.id}) - ${branch.legalName}`);
  });
  
  // Check academic years
  const academicYears = await prisma.academicYear.findMany();
  console.log(`\n📊 Academic Years (${academicYears.length}):`);
  academicYears.forEach(ay => {
    console.log(`   - ${ay.name} (ID: ${ay.id}) - ${ay.startDate.toISOString().split('T')[0]} to ${ay.endDate.toISOString().split('T')[0]}`);
  });
  
  // Check classes
  const classes = await prisma.class.findMany();
  console.log(`\n📊 Classes (${classes.length}):`);
  classes.forEach(cls => {
    console.log(`   - ${cls.name} (ID: ${cls.id}) - Branch: ${cls.branchId}, Capacity: ${cls.capacity}`);
  });
  
  // Check students
  const students = await prisma.student.findMany();
  console.log(`\n📊 Students (${students.length}):`);
  students.forEach(student => {
    console.log(`   - ${student.firstName} ${student.lastName} (${student.studentId}) - Phone: ${student.phone}, Class: ${student.classId}`);
  });
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
