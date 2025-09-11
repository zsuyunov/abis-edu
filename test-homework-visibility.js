// Test script to verify homework visibility from teacher to student
const fetch = require('node-fetch');

async function testHomeworkVisibility() {
  const baseUrl = 'http://localhost:3000';
  
  // Test student homework API with a sample student ID
  const studentId = 'student-1'; // Replace with actual student ID from your database
  
  try {
    console.log('Testing student homework API...');
    
    const response = await fetch(`${baseUrl}/api/student-homework?studentId=${studentId}`, {
      headers: {
        'x-user-id': studentId,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Student homework API response:');
      console.log('Student:', data.student);
      console.log('Homework count:', data.homework?.length || 0);
      console.log('Available subjects:', data.availableSubjects?.length || 0);
      
      if (data.homework && data.homework.length > 0) {
        console.log('\n📚 Homework assignments:');
        data.homework.forEach((hw, index) => {
          console.log(`${index + 1}. ${hw.title}`);
          console.log(`   Subject: ${hw.subject?.name}`);
          console.log(`   Due: ${hw.dueDate}`);
          console.log(`   Status: ${hw.submissionStatus}`);
          console.log('');
        });
      } else {
        console.log('❌ No homework found for student');
        console.log('Student branch ID:', data.student?.branchId);
        console.log('Student class ID:', data.student?.classId);
      }
    } else {
      const error = await response.json();
      console.error('❌ API Error:', error);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

testHomeworkVisibility();
