const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Student data
const studentsData = [
  {
    studentId: 'S50431',
    lastName: 'Qobiljonova',
    firstName: 'Yasina Saidjonovna',
    dateOfBirth: '2001-05-16',
    phone: '+998951515269',
    password: 'Qobiljonova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S17485',
    lastName: 'Xuseynova',
    firstName: 'Ansora Zayniddin qizi',
    dateOfBirth: '2001-05-17',
    phone: '+998951515270',
    password: 'Xuseynova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S62952',
    lastName: 'Shuxratova',
    firstName: 'Hadicha Sherzodovna',
    dateOfBirth: '2001-05-18',
    phone: '+998951515271',
    password: 'Shuxratova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S39159',
    lastName: 'Maxmudova',
    firstName: 'Madina Ikrom qizi',
    dateOfBirth: '2001-05-19',
    phone: '+998951515272',
    password: 'Maxmudova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S56843',
    lastName: 'Mannopjonova',
    firstName: 'Soliha Dilmurod qizi',
    dateOfBirth: '2001-05-20',
    phone: '+998951515273',
    password: 'Mannopjonova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S48315',
    lastName: 'Lutfullayeva',
    firstName: 'Shukronaxon Shukrulla qizi',
    dateOfBirth: '2001-05-21',
    phone: '+998951515274',
    password: 'Lutfullayeva_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S71599',
    lastName: 'Rasulova',
    firstName: 'Xumayro Akbarxo\'ja qizi',
    dateOfBirth: '2001-05-22',
    phone: '+998951515275',
    password: 'Rasulova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S24740',
    lastName: 'Babamuhamedova',
    firstName: 'Soliha Bahtiyarovna',
    dateOfBirth: '2001-05-23',
    phone: '+998951515276',
    password: 'Babamuhamedova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S85973',
    lastName: 'Gulyamova',
    firstName: 'Odinaxon Bunyodovna',
    dateOfBirth: '2001-05-24',
    phone: '+998951515277',
    password: 'Gulyamova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S50434',
    lastName: 'Maxmudjonova',
    firstName: 'Lobar',
    dateOfBirth: '2001-05-25',
    phone: '+998951515278',
    password: 'Maxmudjonova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S17488',
    lastName: 'Maxmudjonova',
    firstName: 'Mubina',
    dateOfBirth: '2001-05-26',
    phone: '+998951515279',
    password: 'Maxmudjonova_suzuk',
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
    console.log('🌱 Starting Year 3-"V"Зуфарова Муқаддас Мирхакимовна class and students seeding...');

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
    const className = '3-"V"Зуфарова Муқаддас Мирхакимовна';
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
