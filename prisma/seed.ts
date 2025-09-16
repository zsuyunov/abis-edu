
/* eslint-disable no-console */
import { PrismaClient, UserGender, UserPosition, UserStatus, ParentStatus, StudentStatus } from '@prisma/client';
import { AuthService } from '../src/lib/auth';

const prisma = new PrismaClient();

async function ensureDefaultBranch() {
  let branch = await prisma.branch.findFirst();
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        shortName: 'MAIN',
        legalName: 'Main School Branch',
        stir: '123456789',
        phone: '+998900000000',
        region: 'Tashkent',
        address: 'Main street 1',
        district: 'Tashkent',
        longitude: 69.2401,
        latitude: 41.2995,
        status: 'ACTIVE',
      },
    });
  }
  return branch;
}

async function upsertAdmin(phone: string, password: string) {
  const hashed = await AuthService.hashPassword(password);
  await prisma.admin.upsert({
    where: { phone },
    update: { password: hashed },
    create: {
      id: 'admin-1',
      phone,
      password: hashed,
    },
  });
}

async function upsertUser(position: UserPosition, phone: string, password: string, branchId: number) {
  const now = new Date('1990-01-01');
  const hashed = await AuthService.hashPassword(password);
  await prisma.user.upsert({
    where: { phone },
    update: { password: hashed, position, branchId },
    create: {
      firstName: position,
      lastName: 'User',
      gender: UserGender.MALE,
      dateOfBirth: now,
      phone,
      userId: `${position.toLowerCase()}-001`,
      status: UserStatus.ACTIVE,
      address: 'Address',
      position,
      branchId,
      password: hashed,
    },
  });
}


async function upsertParent(phone: string, password: string, branchId: number) {
  const hashed = await AuthService.hashPassword(password);
  await prisma.parent.upsert({
    where: { phone },
    update: { password: hashed, status: ParentStatus.ACTIVE },
    create: {
      id: 'parent-1',
      firstName: 'Parent',
      lastName: 'One',
      phone,
      parentId: 'P-001',
      password: hashed,
      status: ParentStatus.ACTIVE,
      branchId,
    },
  });
}

async function upsertStudent(phone: string, password: string, branchId: number) {
  // Need a class and parent to satisfy relations
  let parent = await prisma.parent.findUnique({ where: { phone } });
  if (!parent) {
    const hashed = await AuthService.hashPassword(password);
    parent = await prisma.parent.create({
      data: {
        id: 'parent-for-student',
        firstName: 'Parent',
        lastName: 'ForStudent',
        phone,
        parentId: 'P-STD-001',
        password: hashed,
        status: ParentStatus.ACTIVE,
        branchId,
      },
    });
  }

  // Ensure a minimal academic year and class
  let ay = await prisma.academicYear.findFirst();
  if (!ay) {
    ay = await prisma.academicYear.create({
      data: {
        name: '2024-2025',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-06-01'),
        isCurrent: true,
        status: 'ACTIVE',
      },
    });
  }

  let klass = await prisma.class.findFirst();
  if (!klass) {
    klass = await prisma.class.create({
      data: {
        name: '1-A',
        capacity: 30,
        branchId,
        academicYearId: ay.id,
        language: 'UZBEK',
        educationType: 'PRIMARY',
        status: 'ACTIVE',
      },
    });
  }

  const hashed = await AuthService.hashPassword(password);
  const student = await prisma.student.upsert({
    where: { studentId: 'S-001' },
    update: { password: hashed, branchId, classId: klass.id },
    create: {
      id: 'student-1',
      firstName: 'Student',
      lastName: 'One',
      dateOfBirth: new Date('2012-01-01'),
      phone,
      studentId: 'S-001',
      password: hashed,
      gender: 'MALE',
      status: StudentStatus.ACTIVE,
      branchId,
      classId: klass.id,
    },
  });

  // Create the student-parent relationship
  await prisma.studentParent.upsert({
    where: {
      studentId_parentId_relationship: {
        studentId: student.id,
        parentId: parent.id,
        relationship: 'Mother',
      },
    },
    update: {},
    create: {
      studentId: student.id,
      parentId: parent.id,
      relationship: 'Mother',
    },
  });
}

async function main() {
  const branch = await ensureDefaultBranch();

  // Core roles requested
  await upsertUser(UserPosition.CHIEF, '+998901234598', '123456', branch.id);
  await upsertUser(UserPosition.DOCTOR, '+998901234599', '123456', branch.id);

  // Optional: ensure the rest of roles exist for testing
  await upsertAdmin('+998901234500', '123456');
  await upsertUser(UserPosition.MAIN_DIRECTOR, '+998901234501', '123456', branch.id);
  await upsertUser(UserPosition.SUPPORT_DIRECTOR, '+998901234502', '123456', branch.id);
  await upsertUser(UserPosition.MAIN_HR, '+998901234503', '123456', branch.id);
  await upsertUser(UserPosition.SUPPORT_HR, '+998901234504', '123456', branch.id);
  await upsertUser(UserPosition.MAIN_ADMISSION, '+998901234505', '123456', branch.id);
  await upsertUser(UserPosition.SUPPORT_ADMISSION, '+998901234506', '123456', branch.id);

  // Parent / Student sample
  await upsertParent('+998901234508', '123456', branch.id);
  await upsertStudent('+998901234509', '123456', branch.id);

  // Create additional classes and students for testing
  const academicYear = await prisma.academicYear.findFirst();
  if (academicYear) {
    // Create class 2 (9-A)
    const class2 = await prisma.class.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: '9-A',
        capacity: 25,
        branchId: branch.id,
        academicYearId: academicYear.id,
        language: 'ENGLISH',
        educationType: 'SECONDARY',
        status: 'ACTIVE',
      },
    });

    // Create students for class 2
    const studentsData = [
      { id: 'student-2', firstName: 'Alice', lastName: 'Johnson', studentId: 'S-002', phone: '+998901234510' },
      { id: 'student-3', firstName: 'Bob', lastName: 'Smith', studentId: 'S-003', phone: '+998901234511' },
      { id: 'student-4', firstName: 'Carol', lastName: 'Davis', studentId: 'S-004', phone: '+998901234512' },
      { id: 'student-5', firstName: 'David', lastName: 'Wilson', studentId: 'S-005', phone: '+998901234513' },
      { id: 'student-6', firstName: 'Emma', lastName: 'Brown', studentId: 'S-006', phone: '+998901234514' },
    ];

    for (const studentData of studentsData) {
      const hashed = await AuthService.hashPassword('123456');
      await prisma.student.upsert({
        where: { studentId: studentData.studentId },
        update: { classId: class2.id },
        create: {
          id: studentData.id,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          dateOfBirth: new Date('2010-01-01'),
          phone: studentData.phone,
          studentId: studentData.studentId,
          password: hashed,
          gender: 'MALE',
          status: 'ACTIVE',
          branchId: branch.id,
          classId: class2.id,
        },
      });
    }
  }

  console.log('Seed completed.');
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


