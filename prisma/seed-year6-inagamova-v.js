const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Student data
const studentsData = [
  {
    studentId: 'S71569',
    lastName: 'Abduraxmonova',
    firstName: 'Asal Bobir qizi',
    dateOfBirth: '2001-02-21',
    phone: '+998951515185',
    password: 'Abduraxmonova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S24710',
    lastName: 'Abduraximova',
    firstName: 'Odinaxon Anvar qizi',
    dateOfBirth: '2001-02-22',
    phone: '+998951515186',
    password: 'Abduraximova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S85943',
    lastName: 'Azimdjanova',
    firstName: 'Sakina Ulugbekovna',
    dateOfBirth: '2001-02-23',
    phone: '+998951515187',
    password: 'Azimdjanova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S50404',
    lastName: 'Baxromova',
    firstName: 'Ruxsatbegim Baxrom qizi',
    dateOfBirth: '2001-02-24',
    phone: '+998951515188',
    password: 'Baxromova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S17458',
    lastName: 'Ganisherova',
    firstName: 'Yasiyra Irisali qizi',
    dateOfBirth: '2001-02-25',
    phone: '+998951515189',
    password: 'Ganisherova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S62925',
    lastName: 'Ilyosova',
    firstName: 'Maryamxon Muxiddin qizi',
    dateOfBirth: '2001-02-26',
    phone: '+998951515190',
    password: 'Ilyosova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S39132',
    lastName: 'Mirkomilova',
    firstName: 'Omina Akrom qizi',
    dateOfBirth: '2001-02-27',
    phone: '+998951515191',
    password: 'Mirkomilova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S56816',
    lastName: 'Mirzaaxmedova',
    firstName: 'Muhsina Abdikarim qizi',
    dateOfBirth: '2001-02-28',
    phone: '+998951515192',
    password: 'Mirzaaxmedova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S48288',
    lastName: 'Raximxonova',
    firstName: 'Muzayyanaxon Akbarxon qizi',
    dateOfBirth: '2001-03-01',
    phone: '+998951515193',
    password: 'Raximxonova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S71572',
    lastName: 'Sultonmurodova',
    firstName: 'Madina Rustam qizi',
    dateOfBirth: '2001-03-02',
    phone: '+998951515194',
    password: 'Sultonmurodova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S24713',
    lastName: 'Xalilova',
    firstName: 'Mubiynaxon Rustam qizi',
    dateOfBirth: '2001-03-03',
    phone: '+998951515195',
    password: 'Xalilova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S85946',
    lastName: 'Yigitaliyeva',
    firstName: 'Omina Sultonovna',
    dateOfBirth: '2001-03-04',
    phone: '+998951515196',
    password: 'Yigitaliyeva_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S50407',
    lastName: 'Babamuhamedova',
    firstName: 'Laylo Bahtiyarovna',
    dateOfBirth: '2001-03-05',
    phone: '+998951515197',
    password: 'Babamuhamedova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S17461',
    lastName: 'Maxmudova',
    firstName: 'Zaxro Firdavs qizi',
    dateOfBirth: '2001-03-06',
    phone: '+998951515198',
    password: 'Maxmudova_suzuk',
    gender: 'FEMALE',
    status: 'ACTIVE'
  },
  {
    studentId: 'S62928',
    lastName: 'Achilova',
    firstName: 'Robiya Inomjon qizi',
    dateOfBirth: '2001-03-07',
    phone: '+998951515199',
    password: 'Achilova_suzuk',
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
    console.log('🌱 Starting Year 6-"V"Инагамова Ноиба Салахиддиновна class and students seeding...');

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
    const className = '6-"V"Инагамова Ноиба Салахиддиновна';
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
