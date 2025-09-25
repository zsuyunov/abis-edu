const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Student data
const studentsData = [
  {
    studentId: 'S39135',
    lastName: 'Баходирова',
    firstName: 'Моҳинур Абдужалил қизи',
    dateOfBirth: '2001-03-08',
    phone: '+998951515200',
    password: 'Баходирова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S56819',
    lastName: 'Усмонова',
    firstName: 'Самия Олимовна',
    dateOfBirth: '2001-03-09',
    phone: '+998951515201',
    password: 'Усмонова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S48291',
    lastName: 'Дониёрхўжаева',
    firstName: 'Маъфурахон Хожиакбархўжа қизи',
    dateOfBirth: '2001-03-10',
    phone: '+998951515202',
    password: 'Дониёрхўжаева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S71575',
    lastName: 'Жавлонова',
    firstName: 'Сабина Жамшид қизи',
    dateOfBirth: '2001-03-11',
    phone: '+998951515203',
    password: 'Жавлонова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S24716',
    lastName: 'Зиёвуддинова',
    firstName: 'Мубина Рамзиддин қизи',
    dateOfBirth: '2001-03-12',
    phone: '+998951515204',
    password: 'Зиёвуддинова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S85949',
    lastName: 'Маҳамаджонова',
    firstName: 'Ясмина Рустам қизи',
    dateOfBirth: '2001-03-13',
    phone: '+998951515205',
    password: 'Маҳамаджонова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S50410',
    lastName: 'Муродбекова',
    firstName: 'Муҳсина Санжарбек қизи',
    dateOfBirth: '2001-03-14',
    phone: '+998951515206',
    password: 'Муродбекова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S17464',
    lastName: 'Сайдахмедова',
    firstName: 'Маликахон Ахробек қизи',
    dateOfBirth: '2001-03-15',
    phone: '+998951515207',
    password: 'Сайдахмедова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S62931',
    lastName: 'Убайдуллаева',
    firstName: 'Мумтозабегим Шерзод қизи',
    dateOfBirth: '2001-03-16',
    phone: '+998951515208',
    password: 'Убайдуллаева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S39138',
    lastName: 'Уринова',
    firstName: 'Ҳадича Акмаловна',
    dateOfBirth: '2001-03-17',
    phone: '+998951515209',
    password: 'Уринова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S56822',
    lastName: 'Фурқатхўжаева',
    firstName: 'Раййонахон Дониёр қизи',
    dateOfBirth: '2001-03-18',
    phone: '+998951515210',
    password: 'Фурқатхўжаева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S48294',
    lastName: 'Хасанова',
    firstName: 'Асия Жамшид қизи',
    dateOfBirth: '2001-03-19',
    phone: '+998951515211',
    password: 'Хасанова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S71578',
    lastName: 'Холхўжаева',
    firstName: 'Омина Саидахад қизи',
    dateOfBirth: '2001-03-20',
    phone: '+998951515212',
    password: 'Холхўжаева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S24719',
    lastName: 'Шавкатова',
    firstName: 'Оиша Дониёр қизи',
    dateOfBirth: '2001-03-21',
    phone: '+998951515213',
    password: 'Шавкатова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S85952',
    lastName: 'Шухратова',
    firstName: 'Сакина Акмал қизи',
    dateOfBirth: '2001-03-22',
    phone: '+998951515214',
    password: 'Шухратова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S50413',
    lastName: 'Фахриддинова',
    firstName: 'Моҳинабону Фазлиддин қизи',
    dateOfBirth: '2001-03-23',
    phone: '+998951515215',
    password: 'Фахриддинова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S17467',
    lastName: 'Агзамова',
    firstName: 'Муаззам',
    dateOfBirth: '2001-03-24',
    phone: '+998951515216',
    password: 'Агзамова_suzuk',
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
    console.log('🌱 Starting Year 6-"А"Назарова Феруза Аббасовна class and students seeding...');

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
    const className = '6-"А"Назарова Феруза Аббасовна';
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
          educationType: 'SECONDARY',
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
