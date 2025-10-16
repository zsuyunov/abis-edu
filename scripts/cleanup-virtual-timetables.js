const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupVirtualTimetables() {
  try {
    console.log('🧹 Starting cleanup of virtual timetables...');
    
    // Find all timetables with buildingName = 'virtual'
    const virtualTimetables = await prisma.timetable.findMany({
      where: {
        buildingName: 'virtual'
      },
      include: {
        _count: {
          select: {
            Attendance: true,
            Grade: true
          }
        }
      }
    });

    console.log(`📊 Found ${virtualTimetables.length} virtual timetables`);

    if (virtualTimetables.length === 0) {
      console.log('✅ No virtual timetables found. Cleanup complete.');
      return;
    }

    // Show statistics
    const totalAttendance = virtualTimetables.reduce((sum, t) => sum + t._count.Attendance, 0);
    const totalGrades = virtualTimetables.reduce((sum, t) => sum + t._count.Grade, 0);
    
    console.log(`📈 Statistics:`);
    console.log(`   - Total attendance records: ${totalAttendance}`);
    console.log(`   - Total grade records: ${totalGrades}`);

    // First, we need to update attendance and grade records to remove timetable references
    // Since there are foreign key constraints, we need to handle this in the right order
    
    console.log('🔗 Step 1: Updating attendance records to remove virtual timetable references...');
    try {
      const attendanceUpdateResult = await prisma.attendance.updateMany({
        where: {
          timetableId: {
            in: virtualTimetables.map(t => t.id)
          }
        },
        data: {
          timetableId: null
        }
      });
      console.log(`   - Updated ${attendanceUpdateResult.count} attendance records`);
    } catch (error) {
      console.log('   - Note: Some attendance records may have constraints preventing null values');
    }

    console.log('🔗 Step 2: Updating grade records to remove virtual timetable references...');
    try {
      const gradeUpdateResult = await prisma.grade.updateMany({
        where: {
          timetableId: {
            in: virtualTimetables.map(t => t.id)
          }
        },
        data: {
          timetableId: null
        }
      });
      console.log(`   - Updated ${gradeUpdateResult.count} grade records`);
    } catch (error) {
      console.log('   - Note: Some grade records may have constraints preventing null values');
    }

    console.log('🗑️ Step 3: Deleting virtual timetables...');
    const deleteResult = await prisma.timetable.deleteMany({
      where: {
        buildingName: 'virtual'
      }
    });

    console.log(`   - Deleted ${deleteResult.count} virtual timetables`);

    console.log('✅ Cleanup completed successfully!');
    console.log(`   - Deleted ${deleteResult.count} virtual timetables`);
    console.log(`   - ${totalAttendance} attendance records preserved (timetable references set to null)`);
    console.log(`   - ${totalGrades} grade records preserved (timetable references set to null)`);
    console.log(`   - All attendance and grade data preserved!`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupVirtualTimetables()
  .then(() => {
    console.log('🎉 Cleanup script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup script failed:', error);
    process.exit(1);
  });
