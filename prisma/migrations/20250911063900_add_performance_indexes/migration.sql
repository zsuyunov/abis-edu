-- CreateIndex
-- Performance optimization indexes for frequently queried fields

-- Teacher table optimizations
CREATE INDEX IF NOT EXISTS "Teacher_branchId_status_idx" ON "Teacher"("branchId", "status");
CREATE INDEX IF NOT EXISTS "Teacher_firstName_lastName_idx" ON "Teacher"("firstName", "lastName");

-- TeacherAssignment table optimizations  
CREATE INDEX IF NOT EXISTS "TeacherAssignment_teacherId_branchId_idx" ON "TeacherAssignment"("teacherId", "branchId");
CREATE INDEX IF NOT EXISTS "TeacherAssignment_classId_subjectId_idx" ON "TeacherAssignment"("classId", "subjectId");
CREATE INDEX IF NOT EXISTS "TeacherAssignment_role_status_idx" ON "TeacherAssignment"("role", "status");

-- Attendance table optimizations
CREATE INDEX IF NOT EXISTS "Attendance_studentId_date_status_idx" ON "Attendance"("studentId", "date", "status");
CREATE INDEX IF NOT EXISTS "Attendance_classId_subjectId_date_idx" ON "Attendance"("classId", "subjectId", "date");
CREATE INDEX IF NOT EXISTS "Attendance_timetableId_status_idx" ON "Attendance"("timetableId", "status");

-- Grade table optimizations
CREATE INDEX IF NOT EXISTS "Grade_teacherId_classId_date_idx" ON "Grade"("teacherId", "classId", "date");
CREATE INDEX IF NOT EXISTS "Grade_branchId_academicYearId_idx" ON "Grade"("branchId", "academicYearId");
CREATE INDEX IF NOT EXISTS "Grade_status_type_idx" ON "Grade"("status", "type");

-- Timetable table optimizations
CREATE INDEX IF NOT EXISTS "Timetable_teacherIds_gin_idx" ON "Timetable" USING GIN ("teacherIds");
CREATE INDEX IF NOT EXISTS "Timetable_subjectId_isActive_idx" ON "Timetable"("subjectId", "isActive");
CREATE INDEX IF NOT EXISTS "Timetable_branchId_isActive_dayOfWeek_idx" ON "Timetable"("branchId", "isActive", "dayOfWeek");

-- Homework table optimizations
CREATE INDEX IF NOT EXISTS "Homework_classId_dueDate_idx" ON "Homework"("classId", "dueDate");
CREATE INDEX IF NOT EXISTS "Homework_branchId_status_assignedDate_idx" ON "Homework"("branchId", "status", "assignedDate");

-- HomeworkSubmission table optimizations
CREATE INDEX IF NOT EXISTS "HomeworkSubmission_studentId_submissionDate_idx" ON "HomeworkSubmission"("studentId", "submissionDate");
CREATE INDEX IF NOT EXISTS "HomeworkSubmission_grade_status_idx" ON "HomeworkSubmission"("grade", "status");

-- Exam table optimizations
CREATE INDEX IF NOT EXISTS "Exam_classId_date_startTime_idx" ON "Exam"("classId", "date", "startTime");
CREATE INDEX IF NOT EXISTS "Exam_branchId_status_date_idx" ON "Exam"("branchId", "status", "date");

-- ExamResult table optimizations
CREATE INDEX IF NOT EXISTS "ExamResult_marksObtained_status_idx" ON "ExamResult"("marksObtained", "status");
CREATE INDEX IF NOT EXISTS "ExamResult_createdAt_branchId_idx" ON "ExamResult"("createdAt", "branchId");

-- TimetableTopic table optimizations
CREATE INDEX IF NOT EXISTS "TimetableTopic_timetableId_date_idx" ON "TimetableTopic"("timetableId", "date");
CREATE INDEX IF NOT EXISTS "TimetableTopic_teacherId_branchId_idx" ON "TimetableTopic"("teacherId", "branchId");

-- Document table optimizations
CREATE INDEX IF NOT EXISTS "Document_branchId_type_createdAt_idx" ON "Document"("branchId", "type", "createdAt");
CREATE INDEX IF NOT EXISTS "Document_uploadedBy_status_idx" ON "Document"("uploadedBy", "status");

-- Event table optimizations
CREATE INDEX IF NOT EXISTS "Event_branchId_date_type_idx" ON "Event"("branchId", "date", "type");
CREATE INDEX IF NOT EXISTS "Event_startDate_endDate_idx" ON "Event"("startDate", "endDate");

-- Message table optimizations
CREATE INDEX IF NOT EXISTS "Message_senderId_recipientType_idx" ON "Message"("senderId", "recipientType");
CREATE INDEX IF NOT EXISTS "Message_isRead_createdAt_idx" ON "Message"("isRead", "createdAt");

-- Notification table optimizations
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "Notification_type_createdAt_idx" ON "Notification"("type", "createdAt");

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS "Student_branchId_classId_status_idx" ON "Student"("branchId", "classId", "status");
CREATE INDEX IF NOT EXISTS "Teacher_status_createdAt_idx" ON "Teacher"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Attendance_date_status_archived_idx" ON "Attendance"("date", "status", "archived");
CREATE INDEX IF NOT EXISTS "Grade_academicYearId_type_value_idx" ON "Grade"("academicYearId", "type", "value");
