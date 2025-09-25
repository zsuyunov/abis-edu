const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Student data
const studentsData = [
  {
    studentId: 'S39168',
    lastName: 'Muhammadjonova',
    firstName: 'Saboxatbonu Rahmatullox qizi',
    dateOfBirth: '2001-06-15',
    phone: '+998951515299',
    password: 'Muhammadjonova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S56852',
    lastName: 'Sobitova',
    firstName: 'Sofiya Mahmud qizi',
    dateOfBirth: '2001-06-16',
    phone: '+998951515300',
    password: 'Sobitova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S48324',
    lastName: 'Xolmatova',
    firstName: 'Ominaxon Bekzod qizi',
    dateOfBirth: '2001-06-17',
    phone: '+998951515301',
    password: 'Xolmatova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S71608',
    lastName: 'Baxodirjonova',
    firstName: 'Safiya Sobirjon qizi',
    dateOfBirth: '2001-06-18',
    phone: '+998951515302',
    password: 'Baxodirjonova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S24749',
    lastName: 'Xasanova',
    firstName: 'Aziza O\'tkir qizi',
    dateOfBirth: '2001-06-19',
    phone: '+998951515303',
    password: 'Xasanova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S85982',
    lastName: 'Yoqubjonova',
    firstName: 'Muhlisabonu Abdusamad qizi',
    dateOfBirth: '2001-06-20',
    phone: '+998951515304',
    password: 'Yoqubjonova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  }
];

// Function to generate unique student ID
async function generateUniqueStudentId(originalId) {
  let newId = originalId;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.student.findUnique({
      where: { studentId: newId }
    });
    
    if (!existing) {
      return newId;
    }
    
    // Replace last 2 digits with counter (01, 02, 03, etc.)
    const baseId = originalId.substring(0, 3);
    newId = `${baseId}${counter.toString().padStart(2, '0')}`;
    counter++;
    
    if (counter > 99) {
      // If we can't find a unique ID, generate a completely random one
      const randomNum = Math.floor(Math.random() * 90000) + 10000;
      newId = `S${randomNum}`;
    }
  }
}

// Function to generate unique phone number
async function generateUniquePhone(originalPhone) {
  let newPhone = originalPhone;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.student.findFirst({
      where: { phone: newPhone }
    });
    
    if (!existing) {
      return newPhone;
    }
    
    // Generate random Uzbek phone number
    const randomNum = Math.floor(Math.random() * 90000000) + 10000000;
    newPhone = `+9989${randomNum}`;
  }
}

async function main() {
  try {
    console.log('🌱 Starting Year 2-"V"Абдувохидова Азизахон Анварбек қизи class and students seeding...');

    // Find branch and academic year
    const branch = await prisma.branch.findFirst({
      where: { shortName: 'Suzuk' }
    });

    if (!branch) {
      throw new Error('Branch "Suzuk" not found');
    }
    console.log(`✅ Found branch: ${branch.legalName} (ID: ${branch.id})`);

    const academicYear = await prisma.academicYear.findFirst({
      where: { name: '2025-2026' }
    });

    if (!academicYear) {
      throw new Error('Academic year "2025-2026" not found');
    }
    console.log(`✅ Found academic year: ${academicYear.name} (ID: ${academicYear.id})`);

    // Create or find class
    const className = '2-"V"Абдувохидова Азизахон Анварбек қизи';
    let classRecord = await prisma.class.findFirst({
      where: {
        name: className,
        branchId: branch.id,
        academicYearId: academicYear.id
      }
    });

    if (!classRecord) {
      classRecord = await prisma.class.create({
        data: {
          name: className,
          branchId: branch.id,
          academicYearId: academicYear.id,
          capacity: studentsData.length,
          educationType: 'PRIMARY',
          language: 'UZBEK',
          status: 'ACTIVE'
        }
      });
      console.log(`✅ Created class: ${className} (ID: ${classRecord.id})`);
    } else {
      console.log(`✅ Found existing class: ${className} (ID: ${classRecord.id})`);
    }

    // Process students
    console.log(`📚 Processing ${studentsData.length} students...`);
    let createdCount = 0;
    let errorCount = 0;

    for (const studentData of studentsData) {
      try {
        // Generate unique student ID
        const uniqueStudentId = await generateUniqueStudentId(studentData.studentId);
        if (uniqueStudentId !== studentData.studentId) {
          console.log(`⚠️  Student ID changed: ${studentData.studentId} → ${uniqueStudentId}`);
        }

        // Generate unique phone number
        const uniquePhone = await generateUniquePhone(studentData.phone);
        if (uniquePhone !== studentData.phone) {
          console.log(`📱 Generated phone: ${uniquePhone} for ${studentData.firstName} ${studentData.lastName}`);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(studentData.password, 10);

        // Create student
        const student = await prisma.student.create({
          data: {
            id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            studentId: uniqueStudentId,
            lastName: studentData.lastName,
            firstName: studentData.firstName,
            dateOfBirth: new Date(studentData.dateOfBirth),
            phone: uniquePhone,
            password: hashedPassword,
            gender: studentData.gender,
            status: studentData.status,
            branchId: branch.id,
            classId: classRecord.id
          }
        });

        console.log(`✅ Created student: ${student.firstName} ${student.lastName} (${student.studentId})`);
        createdCount++;

      } catch (error) {
        console.error(`❌ Error creating student ${studentData.firstName} ${studentData.lastName}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Students created: ${createdCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📚 Total processed: ${studentsData.length}`);

    if (errorCount === 0) {
      console.log('\n🎉 All students created successfully!');
    } else {
      console.log(`\n⚠️  ${errorCount} students failed to create.`);
    }

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
