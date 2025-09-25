const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Student data
const studentsData = [
  {
    studentId: 'S48297',
    lastName: 'Раимова',
    firstName: 'Махсумабегим Камолиддин кизи',
    dateOfBirth: '2001-03-28',
    phone: '+998951515220',
    password: 'Раимова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S71581',
    lastName: 'Азизова',
    firstName: 'Хабибахон Абдувохид кизи',
    dateOfBirth: '2001-03-29',
    phone: '+998951515221',
    password: 'Азизова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S24722',
    lastName: 'Ашурова',
    firstName: 'Робия Зиёдулло кизи',
    dateOfBirth: '2001-03-30',
    phone: '+998951515222',
    password: 'Ашурова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S85955',
    lastName: 'Жамолиддинова',
    firstName: 'Осие Камолиддиновна',
    dateOfBirth: '2001-03-31',
    phone: '+998951515223',
    password: 'Жамолиддинова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S50416',
    lastName: 'Зоирова',
    firstName: 'Мухсина Бахтиер кизи',
    dateOfBirth: '2001-04-01',
    phone: '+998951515224',
    password: 'Зоирова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S17470',
    lastName: 'Mухторова',
    firstName: 'Зайнаб Одиловна',
    dateOfBirth: '2001-04-02',
    phone: '+998951515225',
    password: 'Mухторова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S62937',
    lastName: 'Рахматуллаева',
    firstName: 'Сафия Каримулло кизи',
    dateOfBirth: '2001-04-03',
    phone: '+998951515226',
    password: 'Рахматуллаева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S39144',
    lastName: 'Тоирова',
    firstName: 'Самина Жасур кизи',
    dateOfBirth: '2001-04-04',
    phone: '+998951515227',
    password: 'Тоирова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S56828',
    lastName: 'Нематжонова',
    firstName: 'Лола Равшан кизи',
    dateOfBirth: '2001-04-05',
    phone: '+998951515228',
    password: 'Нематжонова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S48300',
    lastName: 'Islomjonova',
    firstName: 'Iymona Xurshidovna',
    dateOfBirth: '2001-04-06',
    phone: '+998951515229',
    password: 'Islomjonova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S71584',
    lastName: 'Абдурахмонова',
    firstName: 'Хадижа Темурмалик кизи',
    dateOfBirth: '2001-04-07',
    phone: '+998951515230',
    password: 'Абдурахмонова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S24725',
    lastName: 'Акбархожаева',
    firstName: 'Афрузахон Алишерхожа кизи',
    dateOfBirth: '2001-04-08',
    phone: '+998951515231',
    password: 'Акбархожаева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S85958',
    lastName: 'Бекпулатова',
    firstName: 'Фотима Санжарбек кизи',
    dateOfBirth: '2001-04-09',
    phone: '+998951515232',
    password: 'Бекпулатова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S50419',
    lastName: 'Миракбарова',
    firstName: 'Хадижа Миробид кизи',
    dateOfBirth: '2001-04-10',
    phone: '+998951515233',
    password: 'Миракбарова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S17473',
    lastName: 'Мирзабекова',
    firstName: 'Мубинахон Отабек кизи',
    dateOfBirth: '2001-04-11',
    phone: '+998951515234',
    password: 'Мирзабекова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S62940',
    lastName: 'Мухаммедова',
    firstName: 'Мадина Нозим кизи',
    dateOfBirth: '2001-04-12',
    phone: '+998951515235',
    password: 'Мухаммедова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S39147',
    lastName: 'Рустамова',
    firstName: 'Имона Даврон кизи',
    dateOfBirth: '2001-04-13',
    phone: '+998951515236',
    password: 'Рустамова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S56831',
    lastName: 'Худайберганова',
    firstName: 'Асия Дилшод кизи',
    dateOfBirth: '2001-04-14',
    phone: '+998951515237',
    password: 'Худайберганова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S48303',
    lastName: 'Хусанбоева',
    firstName: 'Сабинахон Улугбек кизи',
    dateOfBirth: '2001-04-15',
    phone: '+998951515238',
    password: 'Хусанбоева_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S71587',
    lastName: 'Назарова',
    firstName: 'Солиха Рахматжон кизи',
    dateOfBirth: '2001-04-16',
    phone: '+998951515239',
    password: 'Назарова_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S24728',
    lastName: 'Назарова',
    firstName: 'Дурдона Омонжон кизи',
    dateOfBirth: '2001-04-17',
    phone: '+998951515240',
    password: 'Назарова_suzuk',
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
    console.log('🌱 Starting Year 5-"А"Наджимова Гавхар Мадияровна class and students seeding...');

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
    const className = '5-"А"Наджимова Гавхар Мадияровна';
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
