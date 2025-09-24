const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function mergeDuplicateStudents() {
  try {
    console.log('🔄 Merging duplicate students and their related data...\n');

    // Find all duplicate groups by name, lastname, and dateOfBirth
    const duplicatesByNameAndBirth = await prisma.student.groupBy({
      by: ['firstName', 'lastName', 'dateOfBirth'],
      where: {
        dateOfBirth: { not: null },
        status: 'ACTIVE'
      },
      having: {
        id: {
          _count: {
            gt: 1
          }
        }
      },
      _count: {
        id: true
      }
    });

    let totalProcessed = 0;
    let totalMerged = 0;
    const mergedStudents = [];

    console.log(`Found ${duplicatesByNameAndBirth.length} duplicate groups to merge...\n`);

    for (const group of duplicatesByNameAndBirth) {
      console.log(`\n📋 Processing: ${group.firstName} ${group.lastName} (${group.dateOfBirth?.toISOString().split('T')[0]})`);
      console.log('=' * 80);
      
      // Get all records for this duplicate group, ordered by creation date
      const records = await prisma.student.findMany({
        where: {
          firstName: group.firstName,
          lastName: group.lastName,
          dateOfBirth: group.dateOfBirth,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          studentId: true,
          firstName: true,
          lastName: true,
          phone: true,
          dateOfBirth: true,
          createdAt: true,
          classId: true,
          branchId: true
        },
        orderBy: { createdAt: 'asc' }
      });

      if (records.length > 1) {
        // Keep the first record (oldest), merge others into it
        const keepStudent = records[0];
        const mergeStudents = records.slice(1);

        console.log(`   ✅ Keeping: ${keepStudent.studentId} (${keepStudent.firstName} ${keepStudent.lastName})`);
        console.log(`   📅 Created: ${keepStudent.createdAt.toISOString().split('T')[0]}`);
        
        for (const mergeStudent of mergeStudents) {
          console.log(`   🔄 Merging: ${mergeStudent.studentId} (${mergeStudent.firstName} ${mergeStudent.lastName})`);
          console.log(`   📅 Created: ${mergeStudent.createdAt.toISOString().split('T')[0]}`);
          
          // Merge related data from mergeStudent to keepStudent
          await mergeStudentData(keepStudent.id, mergeStudent.id);
          
          // Delete the duplicate student after merging data
          await prisma.student.delete({
            where: { id: mergeStudent.id }
          });
          
          console.log(`   ✅ Merged and deleted: ${mergeStudent.studentId}`);
          
          mergedStudents.push({
            kept: `${keepStudent.studentId} - ${keepStudent.firstName} ${keepStudent.lastName}`,
            merged: `${mergeStudent.studentId} - ${mergeStudent.firstName} ${mergeStudent.lastName}`,
            phone: mergeStudent.phone
          });
          
          totalMerged++;
        }

        totalProcessed += records.length;
      }
    }

    // Final summary
    console.log('\n' + '=' * 80);
    console.log('📊 MERGE SUMMARY:');
    console.log('=' * 80);
    console.log(`Total duplicate students processed: ${totalProcessed}`);
    console.log(`Students merged and deleted: ${totalMerged}`);
    
    if (mergedStudents.length > 0) {
      console.log('\n🔄 MERGED STUDENTS:');
      mergedStudents.forEach((merge, index) => {
        console.log(`${index + 1}. KEPT: ${merge.kept}`);
        console.log(`   MERGED: ${merge.merged} (${merge.phone})`);
        console.log('');
      });
    }

    // Check final counts
    const finalActiveCount = await prisma.student.count({
      where: { status: 'ACTIVE' }
    });

    console.log(`\n📈 FINAL ACTIVE STUDENT COUNT: ${finalActiveCount}`);
    console.log('✅ All duplicate students have been merged successfully!');

  } catch (error) {
    console.error('❌ Error merging duplicate students:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function mergeStudentData(keepStudentId, mergeStudentId) {
  try {
    console.log(`      🔄 Merging data from ${mergeStudentId} to ${keepStudentId}...`);
    
    // Update all related records to point to the kept student
    const updates = [
      // Update attendance records
      prisma.attendance.updateMany({
        where: { studentId: mergeStudentId },
        data: { studentId: keepStudentId }
      }),
      
      // Update exam results
      prisma.examResult.updateMany({
        where: { studentId: mergeStudentId },
        data: { studentId: keepStudentId }
      }),
      
      // Update grades
      prisma.grade.updateMany({
        where: { studentId: mergeStudentId },
        data: { studentId: keepStudentId }
      }),
      
      // Update homework submissions
      prisma.homeworkSubmission.updateMany({
        where: { studentId: mergeStudentId },
        data: { studentId: keepStudentId }
      }),
      
      // Update results
      prisma.result.updateMany({
        where: { studentId: mergeStudentId },
        data: { studentId: keepStudentId }
      }),
      
      // Update student parents
      prisma.studentParent.updateMany({
        where: { studentId: mergeStudentId },
        data: { studentId: keepStudentId }
      }),
      
      // Update student attachments
      prisma.studentAttachment.updateMany({
        where: { studentId: mergeStudentId },
        data: { studentId: keepStudentId }
      }),
      
      // Update complaints
      prisma.complaint.updateMany({
        where: { studentId: mergeStudentId },
        data: { studentId: keepStudentId }
      })
    ];

    // Execute all updates in parallel
    const results = await Promise.all(updates);
    
    // Count total records updated
    const totalUpdated = results.reduce((sum, result) => sum + result.count, 0);
    console.log(`      ✅ Updated ${totalUpdated} related records`);
    
  } catch (error) {
    console.error(`      ❌ Error merging data for student ${mergeStudentId}:`, error);
    throw error;
  }
}

mergeDuplicateStudents();
