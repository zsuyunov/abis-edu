const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Student data
const studentsData = [
  {
    studentId: 'S62970',
    lastName: 'Акбархожаева',
    firstName: 'Асилзодахон Алишерхужа кизи',
    dateOfBirth: '2001-07-11',
    phone: '+998951515325',
    password: 'Акбархожаева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S39177',
    lastName: 'Жураева',
    firstName: 'Махдия',
    dateOfBirth: '2001-07-12',
    phone: '+998951515326',
    password: 'Жураева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S56861',
    lastName: 'Абдугофур',
    firstName: 'Фотима Абдукаххор кизи',
    dateOfBirth: '2001-07-13',
    phone: '+998951515327',
    password: 'Абдугофур_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S48333',
    lastName: 'Мухамедова',
    firstName: 'Иймона Нозим кизи',
    dateOfBirth: '2001-07-14',
    phone: '+998951515328',
    password: 'Мухамедова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S71617',
    lastName: 'Хамидуллаева',
    firstName: 'Хабибахон',
    dateOfBirth: '2001-07-15',
    phone: '+998951515329',
    password: 'Хамидуллаева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S24758',
    lastName: 'Абдуганиева',
    firstName: 'Озода',
    dateOfBirth: '2001-07-16',
    phone: '+998951515330',
    password: 'Абдуганиева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S85991',
    lastName: 'Тохирова',
    firstName: 'Сора Исмоил кизи',
    dateOfBirth: '2001-07-17',
    phone: '+998951515331',
    password: 'Тохирова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S50452',
    lastName: 'Боймирзаева',
    firstName: 'Аиша Исломжон кизи',
    dateOfBirth: '2001-07-18',
    phone: '+998951515332',
    password: 'Боймирзаева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S17506',
    lastName: 'Садуллаева',
    firstName: 'Осиёхон Максудхожа кизи',
    dateOfBirth: '2001-07-19',
    phone: '+998951515333',
    password: 'Садуллаева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S62973',
    lastName: 'Шамсутдинова',
    firstName: 'Марям',
    dateOfBirth: '2001-07-20',
    phone: '+998951515334',
    password: 'Шамсутдинова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S39180',
    lastName: 'Абдуллаева',
    firstName: 'Хафизахон Азимхоновна',
    dateOfBirth: '2001-07-21',
    phone: '+998951515335',
    password: 'Абдуллаева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S56864',
    lastName: 'Назарова',
    firstName: 'Фазилат Рахматжон кизи',
    dateOfBirth: '2001-07-22',
    phone: '+998951515336',
    password: 'Назарова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S48336',
    lastName: 'Рахимхонова',
    firstName: 'Зубайрахон Аброрхон қизи',
    dateOfBirth: '2001-07-23',
    phone: '+998951515337',
    password: 'Рахимхонова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S71620',
    lastName: 'Ишмухамедова',
    firstName: 'Имона Абдулладжан кизи',
    dateOfBirth: '2001-07-24',
    phone: '+998951515338',
    password: 'Ишмухамедова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S24761',
    lastName: 'Шухратова',
    firstName: 'Марям',
    dateOfBirth: '2001-07-25',
    phone: '+998951515339',
    password: 'Шухратова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S85994',
    lastName: 'Эркинова',
    firstName: 'Мухсина Жавохир қизи',
    dateOfBirth: '2001-07-26',
    phone: '+998951515340',
    password: 'Эркинова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S50455',
    lastName: 'Хасанова',
    firstName: 'Фотитма Жамшид кизи',
    dateOfBirth: '2001-07-27',
    phone: '+998951515341',
    password: 'Хасанова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S17509',
    lastName: 'Боймухамедова',
    firstName: 'Мубина Отабепк кизи',
    dateOfBirth: '2001-07-28',
    phone: '+998951515342',
    password: 'Боймухамедова_suzuk',
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
    console.log('🌱 Starting Year 1"А"Жиянбаева Бекзода Аширбековна class and students seeding...');

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
    const className = '1"А"Жиянбаева Бекзода Аширбековна';
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
