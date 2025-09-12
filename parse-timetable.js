const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Teacher name normalization function
function normalizeTeacherName(name) {
  return name
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[^\w\s']/g, '')
    .trim();
}

// Fuzzy matching function
function fuzzyMatch(str1, str2, threshold = 0.8) {
  const s1 = normalizeTeacherName(str1);
  const s2 = normalizeTeacherName(str2);
  
  if (s1 === s2) return 1.0;
  
  // Simple Levenshtein distance based similarity
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Generate unique teacher ID
async function generateUniqueTeacherId() {
  let teacherId;
  let exists = true;
  
  while (exists) {
    teacherId = 'T' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const existing = await prisma.teacher.findUnique({
      where: { teacherId: teacherId }
    });
    exists = !!existing;
  }
  
  return teacherId;
}

// Generate unique phone number
async function generateUniquePhone() {
  let phone;
  let exists = true;
  
  while (exists) {
    phone = '+9989' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    const existing = await prisma.teacher.findUnique({
      where: { phone: phone }
    });
    exists = !!existing;
  }
  
  return phone;
}

// Determine gender from name
function determineGender(name) {
  const femaleNames = ['madina', 'dilafruz', 'dilshoda', 'farangiz', 'maftuna', 'durdona', 'yekaterina', 'altundal', 'jamolova', 'hulkar', 'diyora', 'zukhra', 'megina', 'nigina', 'marguba', 'nasiba', 'safie', 'dilnavoz', 'dilnozakhon', 'ugiloy', 'barno', 'hulkar', 'diyora', 'zukhra', 'megina', 'anora', 'milena', 'mokhinur', 'odina', 'malika', 'komila', 'zarnigor', 'diyora', 'farangiz', 'maryam', 'mukhlisa', 'parizodabonu', 'husnura', 'solikha', 'yulduz', 'farangiz', 'durdona', 'maftuna', 'zulfiya', 'munisakhon', 'sabina', 'munira'];
  
  const firstName = name.toLowerCase().split(' ')[0];
  return femaleNames.includes(firstName) ? 'FEMALE' : 'MALE';
}

// Generate password
function generatePassword(name) {
  const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
  return `${cleanName}_abis`;
}

// Parse timetable data from the image description
const timetableData = {
  className: "Year 2 KS 1 - Zakiy Valid",
  branchId: 1,
  academicYearId: 1,
  periods: [
    // Special periods
    { period: 0, time: "8:00-8:25", type: "special", name: "BREAKFAST", note: "BREAKFAST" },
    { period: 0, time: "12:15-12:55", type: "special", name: "LUNCH", note: "LUNCH" },
    { period: 0, time: "13:00-13:40", type: "special", name: "REST TIME", note: "REST TIME" },
    { period: 0, time: "15:10-15:25", type: "special", name: "SNACK", note: "SNACK" },
    
    // Regular periods
    { period: 1, time: "8:30-9:10", monday: { subject: "Math", teacher: "Komiljonova M." }, tuesday: { subject: "IT/ICT", teacher: "Tilavova D." }, wednesday: { subject: "ART", teacher: "Xo'shboqova D." }, thursday: { subject: "Science", teacher: "Elakkumanan R." }, friday: { subject: "CHESS", teacher: "" } },
    { period: 2, time: "9:15-9:55", monday: { subject: "ROBOTICS", teacher: "Robotics" }, tuesday: { subject: "Math", teacher: "Komiljonova M." }, wednesday: { subject: "English non-fiction", teacher: "Khabibullayeva M." }, thursday: { subject: "Calligraphy and Penm", teacher: "Khabibullayeva M." }, friday: { subject: "CHESS", teacher: "" } },
    { period: 3, time: "10:00-10:40", monday: { subject: "Math", teacher: "Komiljonova M." }, tuesday: { subject: "DRAMA/MUSIC", teacher: "Muxamedova Dilafruz" }, wednesday: { subject: "Math", teacher: "Komiljonova M." }, thursday: { subject: "English non-fiction", teacher: "Khabibullayeva M." }, friday: { subject: "ART", teacher: "Xo'shboqova D." } },
    { period: 4, time: "10:45-11:25", monday: { subject: "English fiction", teacher: "Khabibullayeva M." }, tuesday: { subject: "Critical thinking&An", teacher: "Yekaterina Altundal" }, wednesday: { subject: "English fiction", teacher: "Khabibullayeva M." }, thursday: { subject: "Math", teacher: "Komiljonova M." }, friday: { subject: "Science", teacher: "Elakkumanan R." } },
    { period: 5, time: "11:30-12:10", monday: { subject: "Science", teacher: "Elakkumanan R." }, tuesday: { subject: "Calligraphy and Penm", teacher: "Khabibullayeva M." }, wednesday: { subject: "CHESS", teacher: "" }, thursday: { subject: "Critical thinking&An", teacher: "Yekaterina Altundal" }, friday: { subject: "IT/ICT", teacher: "Tilavova D." } },
    { period: 7, time: "13:45-14:25", monday: { subject: "DRAMA/MUSIC", teacher: "Muxamedova Dilafruz" }, tuesday: { subject: "Rhythmic gymnastics | Taekwondo/Karate", teacher: "O'ralova H. | Imomnazarova D." }, wednesday: { subject: "Calligraphy and Penm", teacher: "Khabibullayeva M." }, thursday: { subject: "Rhythmic gymnastics | Taekwondo/Karate", teacher: "O'ralova H. | Imomnazarova D." }, friday: { subject: "Math", teacher: "Komiljonova M." } },
    { period: 8, time: "14:30-15:10", monday: { subject: "Choreography", teacher: "Jamolova Maftuna" }, tuesday: { subject: "Rhythmic gymnastics | Taekwondo/Karate", teacher: "O'ralova H. | Imomnazarova D." }, wednesday: { subject: "Reading techniques", teacher: "Jamolova Maftuna" }, thursday: { subject: "Education", teacher: "Khabibullayeva M." }, friday: { subject: "ROBOTICS", teacher: "Robotics" } },
    { period: 9, time: "15:25-16:05", monday: { subject: "Homework", teacher: "Jamolova Maftuna" }, tuesday: { subject: "Reading techniques", teacher: "Jamolova Maftuna" }, wednesday: { subject: "Choreography", teacher: "Jamolova Maftuna" }, thursday: { subject: "Homework", teacher: "Jamolova Maftuna" }, friday: { subject: "English fiction", teacher: "Khabibullayeva M." } },
    { period: 10, time: "16:10-16:50", monday: { subject: "Calligraphy and Penm", teacher: "Khabibullayeva M." }, tuesday: { subject: "Homework", teacher: "Jamolova Maftuna" }, wednesday: { subject: "Homework", teacher: "Jamolova Maftuna" }, thursday: { subject: "English fiction", teacher: "Khabibullayeva M." }, friday: { subject: "Homework", teacher: "Jamolova Maftuna" } }
  ]
};

// Teacher mapping from timetable to database
const teacherMappings = {
  "Komiljonova M.": "Malika Komiljonova",
  "Tilavova D.": "Durdona Tilavova", 
  "Xo'shboqova D.": "Dilshoda Xo'shboqova",
  "Elakkumanan R.": "Rathnamalar Elakkumanan",
  "Robotics": "Instructor Robotics",
  "Khabibullayeva M.": "Madina Khabibullayeva",
  "Muxamedova Dilafruz": "Dilafruz Muxamedova",
  "Yekaterina Altundal": "Altundal Yekaterina",
  "O'ralova H.": "Husnura O'ralova",
  "Imomnazarova D.": "Durdona Imomnazarova",
  "Jamolova Maftuna": "Maftuna Shamansurova" // This might need adjustment
};

// Subject mapping from timetable to database
const subjectMappings = {
  "Math": "math",
  "IT/ICT": "IT\\ICT", 
  "ART": "art",
  "Science": "science",
  "CHESS": "CHESS",
  "ROBOTICS": "ROBOTICS",
  "English non-fiction": "English non-fiction",
  "Calligraphy and Penm": "Calligraphy and Penm",
  "DRAMA/MUSIC": "DRAMA/MUSIC",
  "English fiction": "English fiction",
  "Critical thinking&An": "Critical thinking&An",
  "Rhythmic gymnastics | Taekwondo/Karate": "Rhythmic gymnastics | Taekwondo/Karate",
  "Choreography": "Choreography",
  "Reading techniques": "Reading techniques",
  "Education": "Education",
  "Homework": "Homework"
};

async function main() {
  console.log('🚀 Starting timetable parsing and matching...\n');
  
  const mappingLog = [];
  const createdTeachers = [];
  const createdSubjects = [];
  
  try {
    // Get existing teachers and subjects
    const existingTeachers = await prisma.teacher.findMany({
      select: { id: true, firstName: true, lastName: true, teacherId: true }
    });
    
    const existingSubjects = await prisma.subject.findMany({
      select: { id: true, name: true }
    });
    
    console.log(`📚 Found ${existingTeachers.length} existing teachers`);
    console.log(`📖 Found ${existingSubjects.length} existing subjects\n`);
    
    // Process teachers
    const teacherMap = new Map();
    const uniqueTeachers = new Set();
    
    // Collect all unique teachers from timetable
    timetableData.periods.forEach(period => {
      if (period.type === 'special') return;
      
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
        if (period[day] && period[day].teacher) {
          const teacherName = period[day].teacher;
          if (teacherName && teacherName !== '') {
            uniqueTeachers.add(teacherName);
          }
        }
      });
    });
    
    console.log(`👥 Found ${uniqueTeachers.size} unique teachers in timetable:`);
    uniqueTeachers.forEach(teacher => console.log(`  - ${teacher}`));
    console.log('');
    
    // Match teachers
    for (const timetableTeacher of uniqueTeachers) {
      let bestMatch = null;
      let bestScore = 0;
      
      // Try exact mapping first
      const mappedName = teacherMappings[timetableTeacher];
      if (mappedName) {
        const exactMatch = existingTeachers.find(t => 
          `${t.firstName} ${t.lastName}`.trim() === mappedName.trim()
        );
        if (exactMatch) {
          bestMatch = exactMatch;
          bestScore = 1.0;
        }
      }
      
      // If no exact match, try fuzzy matching
      if (!bestMatch) {
        for (const dbTeacher of existingTeachers) {
          const fullName = `${dbTeacher.firstName} ${dbTeacher.lastName}`.trim();
          const score = Math.max(
            fuzzyMatch(timetableTeacher, fullName),
            fuzzyMatch(timetableTeacher, dbTeacher.lastName),
            fuzzyMatch(timetableTeacher, dbTeacher.firstName)
          );
          
          if (score > bestScore && score > 0.7) {
            bestScore = score;
            bestMatch = dbTeacher;
          }
        }
      }
      
      if (bestMatch) {
        teacherMap.set(timetableTeacher, bestMatch);
        mappingLog.push({
          timetableTeacher,
          matchedTeacher: `${bestMatch.firstName} ${bestMatch.lastName}`,
          teacherId: bestMatch.id,
          matchType: 'existing',
          score: bestScore
        });
        console.log(`✅ Matched: ${timetableTeacher} → ${bestMatch.firstName} ${bestMatch.lastName} (${bestMatch.teacherId})`);
      } else {
        // Create new teacher
        const teacherId = await generateUniqueTeacherId();
        const phone = await generateUniquePhone();
        const password = generatePassword(timetableTeacher);
        const gender = determineGender(timetableTeacher);
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Parse name (first word = last name, rest = first name)
        const nameParts = timetableTeacher.split(' ');
        const lastName = nameParts[0];
        const firstName = nameParts.slice(1).join(' ') || '';
        
        const newTeacher = await prisma.teacher.create({
          data: {
            id: teacherId,
            teacherId: teacherId,
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            password: hashedPassword,
            gender: gender,
            status: 'ACTIVE',
            address: 'Tashkent, Uzbekistan',
            dateOfBirth: new Date('1980-01-01')
          }
        });
        
        teacherMap.set(timetableTeacher, newTeacher);
        createdTeachers.push(newTeacher);
        mappingLog.push({
          timetableTeacher,
          matchedTeacher: `${newTeacher.firstName} ${newTeacher.lastName}`,
          teacherId: newTeacher.id,
          matchType: 'created',
          score: 1.0
        });
        console.log(`🆕 Created: ${timetableTeacher} → ${newTeacher.firstName} ${newTeacher.lastName} (${newTeacher.teacherId}) - ${phone} - ${password}`);
      }
    }
    
    console.log(`\n📖 Processing subjects...`);
    
    // Process subjects
    const subjectMap = new Map();
    const uniqueSubjects = new Set();
    
    // Collect all unique subjects from timetable
    timetableData.periods.forEach(period => {
      if (period.type === 'special') return;
      
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
        if (period[day] && period[day].subject) {
          const subjectName = period[day].subject;
          if (subjectName && subjectName !== '') {
            uniqueSubjects.add(subjectName);
          }
        }
      });
    });
    
    console.log(`📚 Found ${uniqueSubjects.size} unique subjects in timetable:`);
    uniqueSubjects.forEach(subject => console.log(`  - ${subject}`));
    console.log('');
    
    // Match subjects
    for (const timetableSubject of uniqueSubjects) {
      let matchedSubject = null;
      
      // Try exact mapping first
      const mappedName = subjectMappings[timetableSubject];
      if (mappedName) {
        matchedSubject = existingSubjects.find(s => s.name === mappedName);
      }
      
      // If no exact match, try case-insensitive matching
      if (!matchedSubject) {
        matchedSubject = existingSubjects.find(s => 
          s.name.toLowerCase() === timetableSubject.toLowerCase()
        );
      }
      
      if (matchedSubject) {
        subjectMap.set(timetableSubject, matchedSubject);
        console.log(`✅ Matched: ${timetableSubject} → ${matchedSubject.name}`);
      } else {
        // Create new subject
        const newSubject = await prisma.subject.create({
          data: {
            name: timetableSubject
          }
        });
        
        subjectMap.set(timetableSubject, newSubject);
        createdSubjects.push(newSubject);
        console.log(`🆕 Created: ${timetableSubject} → ${newSubject.name}`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Teachers matched: ${teacherMap.size - createdTeachers.length}`);
    console.log(`   - Teachers created: ${createdTeachers.length}`);
    console.log(`   - Subjects matched: ${subjectMap.size - createdSubjects.length}`);
    console.log(`   - Subjects created: ${createdSubjects.length}`);
    
    // Save mapping log
    const fs = require('fs');
    const csvContent = [
      'Timetable Teacher,Matched Teacher,Teacher ID,Match Type,Score',
      ...mappingLog.map(log => 
        `"${log.timetableTeacher}","${log.matchedTeacher}","${log.teacherId}","${log.matchType}","${log.score}"`
      )
    ].join('\n');
    
    fs.writeFileSync('mapping_log.csv', csvContent);
    console.log(`\n📝 Mapping log saved to mapping_log.csv`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();


