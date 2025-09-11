const { PrismaClient, UserSex, TeacherStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Helper function to generate a unique teacher ID
async function generateUniqueTeacherId() {
  let teacherId;
  let counter = 1;
  
  while (true) {
    const randomDigits = Math.floor(Math.random() * 90000) + 10000; // 5 digits
    teacherId = `T${randomDigits}`;
    
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: teacherId }
    });
    
    if (!existingTeacher) {
      return teacherId;
    }
    
    counter++;
    if (counter > 999) {
      throw new Error('Could not generate unique teacher ID after 999 attempts');
    }
  }
}

// Helper function to generate unique phone number
async function generateUniquePhone() {
  let phone;
  let counter = 1;
  
  while (true) {
    const randomDigits = Math.floor(Math.random() * 90000000) + 10000000; // 8 digits
    phone = `+9989${randomDigits}`;
    
    const existingTeacher = await prisma.teacher.findUnique({
      where: { phone }
    });
    
    if (!existingTeacher) {
      return phone;
    }
    
    counter++;
    if (counter > 999) {
      throw new Error('Could not generate unique phone number after 999 attempts');
    }
  }
}

// Helper function to determine gender from first name
function determineGender(firstName) {
  const maleNames = [
    'rathnamalar', 'essam', 'rajdeep', 'rakhmatjon', 'dilafruz', 'anora', 'nigina', 'milena',
    'marguba', 'nasiba', 'safie', 'dilnavoz', 'akmaljon', 'dilnozakhon', 'ugiloy', 'ozodbek',
    'barno', 'hulkar', 'diyora', 'zukhra', 'megina', 'yekaterina', 'madina', 'zukhra',
    'fazilyatkhon', 'dilshoda', 'farangiz', 'umeda', 'e\'zoza', 'dilya', 'shakhzod', 'dinora',
    'ma\'mura', 'mokhinur', 'odina', 'malika', 'komila', 'dilshoda', 'zarnigor', 'diyora',
    'sardor', 'feruz', 'farangiz', 'kakhramon', 'khusan', 'maryam', 'diyorbek', 'mamurjon',
    'mukhlisa', 'maftuna', 'parizodabonu', 'brent', 'husnura', 'solikha', 'yulduz', 'farangiz',
    'fazli', 'durdona', 'ibrakhim', 'maftuna', 'zulfiya', 'ahmed', 'munisakhon', 'sabina',
    'durdona', 'tolibjon', 'khondamir', 'munira'
  ];
  
  const name = firstName.toLowerCase().trim();
  return maleNames.includes(name) ? UserSex.MALE : UserSex.FEMALE;
}

// Helper function to generate password in format "firstname_abis"
function generatePassword(firstName) {
  const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '');
  return `${cleanFirstName}_abis`;
}

async function main() {
  console.log('🌱 Starting teachers seeding...');

  // Verify branch with short name "85" exists
  const branch = await prisma.branch.findFirst({
    where: { shortName: '85' },
  });

  if (!branch) {
    console.error('❌ Branch with shortName "85" not found. Please ensure it exists.');
    return;
  }
  console.log(`✅ Found branch: ${branch.shortName} (ID: ${branch.id})`);

  // Teacher data
  const teachersData = [
    { lastName: 'Elakkumanan', firstName: 'Rathnamalar' },
    { lastName: 'Abdurasulova', firstName: 'Mohlaroyim' },
    { lastName: 'Essam', firstName: '' },
    { lastName: 'Rajdeep', firstName: 'Dey' },
    { lastName: 'Madraimov', firstName: 'Rakhmatjon' },
    { lastName: 'Muhamedova', firstName: 'Dilafruz' },
    { lastName: 'Saidolimova', firstName: 'Anora' },
    { lastName: 'Mamatkulova', firstName: 'Nigina' },
    { lastName: 'Lin', firstName: 'Milena' },
    { lastName: 'Khamidjonova', firstName: 'Marguba' },
    { lastName: 'Gulomjonova', firstName: 'Nasiba' },
    { lastName: 'Khalilova', firstName: 'Safie' },
    { lastName: 'Muydinova', firstName: 'Dilnavoz' },
    { lastName: 'Abdukhlalilov', firstName: 'Akmaljon' },
    { lastName: 'Rustamjonova', firstName: 'Dilnozakhon' },
    { lastName: 'Kadilbayeva', firstName: 'Ugiloy' },
    { lastName: 'Abdurakhmonov', firstName: 'Ozodbek' },
    { lastName: 'Mahmadaminova', firstName: 'Barno' },
    { lastName: 'Payazova', firstName: 'Hulkar' },
    { lastName: 'Kamilova', firstName: 'Diyora' },
    { lastName: 'Ganiyeva', firstName: 'Zukhra' },
    { lastName: 'Aripova', firstName: 'Megina' },
    { lastName: 'Yekaterina', firstName: 'Altundal' },
    { lastName: 'Khabibullayeva', firstName: 'Madina' },
    { lastName: 'Qurbanbayeva', firstName: 'Zukhra' },
    { lastName: 'Kayumova', firstName: 'Fazilyatkhon' },
    { lastName: 'Xo\'shboqova', firstName: 'Dilshoda' },
    { lastName: 'Saydullayeva', firstName: 'Farangiz' },
    { lastName: 'Turaeva', firstName: 'Umeda' },
    { lastName: 'Sirojova', firstName: 'E\'zoza' },
    { lastName: 'Saricheva', firstName: 'Dilya' },
    { lastName: 'Urunov', firstName: 'Shakhzod' },
    { lastName: 'Nasrullayeva', firstName: 'Dinora' },
    { lastName: 'Umarkhodjayeva', firstName: 'Ma\'mura' },
    { lastName: 'Pirmukhamedova', firstName: 'Mokhinur' },
    { lastName: 'Karimova', firstName: 'Odina' },
    { lastName: 'Komiljonova', firstName: 'Malika' },
    { lastName: 'Khamidullayeva', firstName: 'Komila' },
    { lastName: 'Anvarkhonova', firstName: 'Dilshoda' },
    { lastName: 'Rustamova', firstName: 'Zarnigor' },
    { lastName: 'Ibrohimova', firstName: 'Diyora' },
    { lastName: 'Sardor', firstName: 'Jamolov' },
    { lastName: 'Nabijonov', firstName: 'Feruz' },
    { lastName: 'Fazliddinova', firstName: 'Farangiz' },
    { lastName: 'Kakhramon', firstName: 'Voisov' },
    { lastName: 'Mamirov', firstName: 'Khusan' },
    { lastName: 'Hakimjan', firstName: 'Maryam' },
    { lastName: 'Mashrabov', firstName: 'Diyorbek' },
    { lastName: 'Muydinov', firstName: 'Mamurjon' },
    { lastName: 'Gofurova', firstName: 'Mukhlisa' },
    { lastName: 'Boyturayeva', firstName: 'Maftuna' },
    { lastName: 'Alijonova', firstName: 'Parizodabonu' },
    { lastName: 'Brent', firstName: 'Young' },
    { lastName: 'O\'ralova', firstName: 'Husnura' },
    { lastName: 'Rashidova', firstName: 'Solikha' },
    { lastName: 'Gulyamova', firstName: 'Yulduz' },
    { lastName: 'Rayimova', firstName: 'Farangiz' },
    { lastName: 'Fazli', firstName: 'Haq' },
    { lastName: 'Imomnazarova', firstName: 'Durdona' },
    { lastName: 'Atakhanov', firstName: 'Ibrakhim' },
    { lastName: 'Shamansurova', firstName: 'Maftuna' },
    { lastName: 'Vakhobjonova', firstName: 'Zulfiya' },
    { lastName: 'Ahmed', firstName: 'Ammar' },
    { lastName: 'Sheraliyeva', firstName: 'Munisakhon' },
    { lastName: 'Abdualimova', firstName: 'Sabina Elyor qizi' },
    { lastName: 'Tilavova', firstName: 'Durdona' },
    { lastName: 'Ibrohimov', firstName: 'Tolibjon' },
    { lastName: 'Khalmedov', firstName: 'Khondamir' },
    { lastName: 'Yusupova', firstName: 'Munira' }
  ];

  // Create teachers
  let createdCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const teacherData of teachersData) {
    try {
      // Generate unique teacher ID and phone
      const teacherId = await generateUniqueTeacherId();
      const phone = await generateUniquePhone();
      const password = generatePassword(teacherData.firstName || teacherData.lastName);
      const gender = determineGender(teacherData.firstName || teacherData.lastName);
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create teacher
      const teacher = await prisma.teacher.create({
        data: {
          id: teacherId,
          teacherId: teacherId, // Use the same ID for teacherId
          firstName: teacherData.firstName || '',
          lastName: teacherData.lastName,
          phone: phone,
          password: hashedPassword,
          gender: gender,
          status: TeacherStatus.ACTIVE,
          address: 'Tashkent, Uzbekistan',
          dateOfBirth: new Date('1980-01-01') // Default date of birth
        }
      });

      createdCount++;
      console.log(`✅ Created teacher: ${teacher.firstName} ${teacher.lastName} (${teacherId}) - ${phone} - ${password}`);

    } catch (error) {
      const errorMsg = `Error processing teacher ${teacherData.lastName}: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   - Teachers created: ${createdCount}`);
  console.log(`   - Errors: ${errorCount}`);
  console.log(`   - Total processed: ${teachersData.length}`);

  if (errorCount > 0) {
    console.warn(`\n⚠️  ${errorCount} teachers could not be created due to errors.`);
    console.log('\nDetailed errors:');
    errors.forEach((err, index) => console.log(`   ${index + 1}. ${err}`));
  } else {
    console.log(`\n✅ Teachers seeding completed successfully!`);
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
