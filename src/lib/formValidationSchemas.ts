import { z } from "zod";

export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Class name is required!" }),
  capacity: z.coerce.number().min(1, { message: "Capacity is required!" }),
  branchId: z.coerce.number().min(1, { message: "Branch is required!" }),
  academicYearId: z.coerce.number().min(1, { message: "Academic year is required!" }),
  language: z.enum([
    "UZBEK", 
    "RUSSIAN", 
    "ENGLISH", 
    "CHINESE", 
    "ARABIC", 
    "KOREAN", 
    "JAPANESE", 
    "FRENCH", 
    "GERMAN"
  ], { message: "Language is required!" }),
  educationType: z.enum([
    "KINDERGARTEN", 
    "PRIMARY", 
    "SECONDARY", 
    "HIGH"
  ], { message: "Education type is required!" }),
  // Supervisor is assigned later via Teacher Assignments workflow
  supervisorId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"], { message: "Status is required!" }),
  createdAt: z.coerce.date().optional(),
});

export type ClassSchema = z.infer<typeof classSchema>;



// Legacy exam schema removed - see new exam schema below

export const timetableSchema = z.object({
  id: z.coerce.number().optional(),
  
  // Basic Information
  branchId: z.coerce.number().min(1, { message: "Branch is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  academicYearId: z.coerce.number().min(1, { message: "Academic year is required!" }),
  subjectId: z.coerce.number().min(1, { message: "Subject is required!" }),
  teacherId: z.string().min(1, { message: "Teacher is required!" }),
  
  // Date and Time Information
  fullDate: z.coerce.date({ message: "Date is required!" }),
  day: z.enum([
    "MONDAY", 
    "TUESDAY", 
    "WEDNESDAY", 
    "THURSDAY", 
    "FRIDAY", 
    "SATURDAY", 
    "SUNDAY"
  ], { message: "Day is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  
  // Location Information
  roomNumber: z.string().min(1, { message: "Room number is required!" }),
  buildingName: z.string().optional().or(z.literal("")),
  
  // Status
  status: z.enum(["ACTIVE", "INACTIVE"], { message: "Status is required!" }),
}).refine((data) => {
  // Validate that end time is after start time
  return data.endTime > data.startTime;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
}).refine((data) => {
  // Validate that the day matches the full date's day of week
  const dayOfWeek = data.fullDate.getDay();
  const dayMap = {
    0: "SUNDAY",
    1: "MONDAY", 
    2: "TUESDAY",
    3: "WEDNESDAY",
    4: "THURSDAY", 
    5: "FRIDAY",
    6: "SATURDAY"
  };
  return dayMap[dayOfWeek as keyof typeof dayMap] === data.day;
}, {
  message: "Selected day must match the date's day of the week",
  path: ["day"],
});

export type TimetableSchema = z.infer<typeof timetableSchema>;

export const timetableTopicSchema = z.object({
  id: z.coerce.number().optional(),
  
  // Topic Information
  title: z.string().min(1, { message: "Topic title is required!" }).max(200, { message: "Title too long!" }),
  description: z.string().optional().or(z.literal("")),
  attachments: z.array(z.string()).optional(),
  
  // Relations
  timetableId: z.coerce.number().min(1, { message: "Timetable is required!" }),
  teacherId: z.string().min(1, { message: "Teacher is required!" }),
  subjectId: z.coerce.number().min(1, { message: "Subject is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  branchId: z.coerce.number().min(1, { message: "Branch is required!" }),
  academicYearId: z.coerce.number().min(1, { message: "Academic year is required!" }),
  
  // Status Management
  status: z.enum(["DRAFT", "IN_PROGRESS", "COMPLETED", "CANCELLED"], { message: "Status is required!" }),
  
  // Progress Tracking
  progressPercentage: z.coerce.number().min(0).max(100, { message: "Progress must be between 0 and 100!" }),
  completedAt: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    try {
      return z.coerce.date().parse(v);
    } catch {
      return undefined;
    }
  }, z.date().optional()),
});

export type TimetableTopicSchema = z.infer<typeof timetableTopicSchema>;

export const attendanceSchema = z.object({
  id: z.coerce.number().optional(),
  
  // Student and timetable selection
  studentId: z.string().min(1, { message: "Student is required!" }),
  timetableId: z.coerce.number().min(1, { message: "Timetable is required!" }),
  
  // Date and status
  date: z.coerce.date({ message: "Date is required!" }),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"], { 
    message: "Attendance status is required!" 
  }),
  
  // Optional notes
  notes: z.string().optional().or(z.literal("")),
  
  // Archive management
  archived: z.boolean().default(false),
});

export type AttendanceSchema = z.infer<typeof attendanceSchema>;

// Attendance filtering schema for the main page
export const attendanceFilterSchema = z.object({
  // Required hierarchical filters
  branchId: z.coerce.number().min(1, { message: "Branch is required!" }),
  academicYearId: z.coerce.number().min(1, { message: "Academic year is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  subjectId: z.coerce.number().min(1, { message: "Subject is required!" }),
  
  // Optional date range filtering
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  
  // Optional status filtering
  statusFilter: z.enum(["ALL", "PRESENT", "ABSENT", "LATE", "EXCUSED"]).default("ALL"),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
});

export type AttendanceFilterSchema = z.infer<typeof attendanceFilterSchema>;

export const gradeSchema = z.object({
  id: z.coerce.number().optional(),
  
  // Grade Information
  value: z.coerce.number()
    .min(0, { message: "Grade value must be positive!" })
    .max(1000, { message: "Grade value cannot exceed 1000!" }),
  maxValue: z.coerce.number()
    .min(1, { message: "Maximum value must be at least 1!" })
    .default(100),
  type: z.enum(["DAILY", "WEEKLY", "MONTHLY", "TERMLY", "YEARLY", "EXAM_MIDTERM", "EXAM_FINAL", "EXAM_NATIONAL"], {
    message: "Grade type is required!"
  }),
  description: z.string().optional().or(z.literal("")),
  
  // Time Information
  date: z.coerce.date({ message: "Date is required!" }),
  week: z.coerce.number().min(1).max(53).optional(),
  month: z.coerce.number().min(1).max(12).optional(),
  term: z.coerce.number().min(1).max(4).optional(),
  year: z.coerce.number().min(2020).max(2050, { message: "Year must be between 2020 and 2050!" }),
  
  // Relations
  studentId: z.string().min(1, { message: "Student is required!" }),
  branchId: z.coerce.number().min(1, { message: "Branch is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  academicYearId: z.coerce.number().min(1, { message: "Academic year is required!" }),
  subjectId: z.coerce.number().min(1, { message: "Subject is required!" }),
  teacherId: z.string().min(1, { message: "Teacher is required!" }),
  timetableId: z.coerce.number().optional(),
  
  // Status
  status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE"),
}).refine((data) => {
  return data.value <= data.maxValue;
}, {
  message: "Grade value cannot exceed maximum value",
  path: ["value"],
});

export type GradeSchema = z.infer<typeof gradeSchema>;

// Gradebook filtering schema for the main page
export const gradebookFilterSchema = z.object({
  // Required hierarchical filters
  branchId: z.coerce.number().min(1, { message: "Branch is required!" }),
  academicYearId: z.coerce.number().min(1, { message: "Academic year is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  subjectId: z.coerce.number().min(1, { message: "Subject is required!" }),
  
  // Optional filtering
  gradeType: z.enum(["ALL", "DAILY", "WEEKLY", "MONTHLY", "TERMLY", "YEARLY", "EXAM_MIDTERM", "EXAM_FINAL", "EXAM_NATIONAL"]).default("ALL"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  studentId: z.string().optional(), // For individual student focus
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
});

export type GradebookFilterSchema = z.infer<typeof gradebookFilterSchema>;

export const complaintSchema = z.object({
  id: z.coerce.number().optional(),
  
  // Complaint Information
  title: z.string().min(5, { message: "Title must be at least 5 characters!" })
    .max(200, { message: "Title cannot exceed 200 characters!" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters!" })
    .max(2000, { message: "Description cannot exceed 2000 characters!" }),
  category: z.enum(["ACADEMIC", "DISCIPLINE", "FACILITIES", "TEACHER_BEHAVIOR", "STUDENT_BEHAVIOR", "ADMINISTRATIVE", "TECHNICAL", "OTHER"], {
    message: "Category is required!"
  }),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  status: z.enum(["PENDING", "IN_REVIEW", "RESOLVED", "REJECTED"]).default("PENDING"),
  
  // Sender Information
  senderType: z.enum(["STUDENT", "PARENT", "TEACHER"], { message: "Sender type is required!" }),
  studentId: z.string().optional(),
  parentId: z.string().optional(),
  teacherId: z.string().optional(),
  
  // Location Information
  branchId: z.coerce.number().min(1, { message: "Branch is required!" }),
  classId: z.coerce.number().optional(),
  subjectId: z.coerce.number().optional(),
}).refine((data) => {
  // Ensure exactly one sender ID is provided based on sender type
  if (data.senderType === "STUDENT" && !data.studentId) {
    return false;
  }
  if (data.senderType === "PARENT" && !data.parentId) {
    return false;
  }
  if (data.senderType === "TEACHER" && !data.teacherId) {
    return false;
  }
  return true;
}, {
  message: "Sender ID must match the sender type",
  path: ["studentId"],
});

export type ComplaintSchema = z.infer<typeof complaintSchema>;

// Complaint filtering schema for admin management
export const complaintFilterSchema = z.object({
  branchId: z.coerce.number().optional(),
  senderType: z.enum(["ALL", "STUDENT", "PARENT", "TEACHER"]).default("ALL"),
  classId: z.coerce.number().optional(),
  category: z.enum(["ALL", "ACADEMIC", "DISCIPLINE", "FACILITIES", "TEACHER_BEHAVIOR", "STUDENT_BEHAVIOR", "ADMINISTRATIVE", "TECHNICAL", "OTHER"]).default("ALL"),
  priority: z.enum(["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("ALL"),
  status: z.enum(["ALL", "PENDING", "IN_REVIEW", "RESOLVED", "REJECTED"]).default("ALL"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
});

export type ComplaintFilterSchema = z.infer<typeof complaintFilterSchema>;

// Status update schema
export const complaintStatusUpdateSchema = z.object({
  complaintId: z.coerce.number().min(1, { message: "Complaint ID is required!" }),
  newStatus: z.enum(["PENDING", "IN_REVIEW", "RESOLVED", "REJECTED"], { message: "Status is required!" }),
  comment: z.string().min(10, { message: "Comment must be at least 10 characters when changing status!" })
    .max(500, { message: "Comment cannot exceed 500 characters!" }),
  changedBy: z.string().min(1, { message: "Changed by is required!" }),
  changedByRole: z.string().min(1, { message: "Changed by role is required!" }),
});

export type ComplaintStatusUpdateSchema = z.infer<typeof complaintStatusUpdateSchema>;

export const documentSchema = z.object({
  id: z.coerce.number().optional(),
  
  // Document Information
  title: z.string().min(3, { message: "Title must be at least 3 characters!" })
    .max(200, { message: "Title cannot exceed 200 characters!" }),
  description: z.string().optional().or(z.literal("")),
  documentType: z.enum(["LESSON_PLAN", "EXAM_GUIDE", "HOMEWORK", "ASSIGNMENT", "NOTICE", "SYLLABUS", "STUDY_MATERIAL", "REFERENCE", "FORM", "POLICY", "OTHER"], {
    message: "Document type is required!"
  }),
  status: z.enum(["ACTIVE", "ARCHIVED", "EXPIRED"]).default("ACTIVE"),
  
  // File Information (handled separately in file upload)
  fileName: z.string().optional(),
  filePath: z.string().optional(),
  fileType: z.string().optional(),
  fileSize: z.coerce.number().optional(),
  
  // Targeting Information
  audienceType: z.enum(["TEACHERS", "STUDENTS", "MIXED"], { message: "Audience type is required!" }),
  branchId: z.coerce.number().optional(), // null for all branches
  classId: z.coerce.number().optional(),
  academicYearId: z.coerce.number().optional(),
  
  // Assignment targets (arrays of IDs)
  teacherIds: z.array(z.string()).optional(),
  studentIds: z.array(z.string()).optional(),
  assignToEntireClass: z.boolean().default(false),
  
  // Metadata
  tags: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  
  // Dates
  expiryDate: z.coerce.date().optional(),
  
  // System fields
  createdBy: z.string().min(1, { message: "Created by is required!" }),
}).refine((data) => {
  // Ensure valid audience and assignment combination
  if (data.audienceType === "STUDENTS" && data.assignToEntireClass && !data.classId) {
    return false;
  }
  if (data.audienceType === "STUDENTS" && !data.assignToEntireClass && (!data.studentIds || data.studentIds.length === 0)) {
    return false;
  }
  if (data.audienceType === "TEACHERS" && (!data.teacherIds || data.teacherIds.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Assignment targets must match the audience type",
  path: ["audienceType"],
});

export type DocumentSchema = z.infer<typeof documentSchema>;

// Document filtering schema for admin management
export const documentFilterSchema = z.object({
  branchId: z.coerce.number().optional(),
  audienceType: z.enum(["ALL", "TEACHERS", "STUDENTS", "MIXED"]).default("ALL"),
  classId: z.coerce.number().optional(),
  academicYearId: z.coerce.number().optional(),
  documentType: z.enum(["ALL", "LESSON_PLAN", "EXAM_GUIDE", "HOMEWORK", "ASSIGNMENT", "NOTICE", "SYLLABUS", "STUDY_MATERIAL", "REFERENCE", "FORM", "POLICY", "OTHER"]).default("ALL"),
  status: z.enum(["ALL", "ACTIVE", "ARCHIVED", "EXPIRED"]).default("ALL"),
  tags: z.array(z.string()).default([]),
  searchKeyword: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
});

export type DocumentFilterSchema = z.infer<typeof documentFilterSchema>;

// Document version schema
export const documentVersionSchema = z.object({
  documentId: z.coerce.number().min(1, { message: "Document ID is required!" }),
  fileName: z.string().min(1, { message: "File name is required!" }),
  filePath: z.string().min(1, { message: "File path is required!" }),
  fileType: z.string().min(1, { message: "File type is required!" }),
  fileSize: z.coerce.number().min(1, { message: "File size is required!" }),
  changeLog: z.string().optional().or(z.literal("")),
  createdBy: z.string().min(1, { message: "Created by is required!" }),
});

export type DocumentVersionSchema = z.infer<typeof documentVersionSchema>;

// Document archive schema
export const documentArchiveSchema = z.object({
  documentId: z.coerce.number().min(1, { message: "Document ID is required!" }),
  action: z.enum(["ARCHIVE", "RESTORE", "DELETE"], { message: "Action is required!" }),
  comment: z.string().min(10, { message: "Comment must be at least 10 characters!" })
    .max(500, { message: "Comment cannot exceed 500 characters!" }),
  createdBy: z.string().min(1, { message: "Created by is required!" }),
});

export type DocumentArchiveSchema = z.infer<typeof documentArchiveSchema>;

// Homework filtering schema for admin management
export const homeworkFilterSchema = z.object({
  branchId: z.coerce.number().min(1, { message: "Branch is required!" }),
  academicYearId: z.coerce.number().min(1, { message: "Academic Year is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  subjectId: z.coerce.number().min(1, { message: "Subject is required!" }),
  teacherId: z.string().optional(),
  status: z.enum(["ALL", "ACTIVE", "EXPIRED", "ARCHIVED"]).default("ALL"),
  dateRange: z.enum(["ALL", "TODAY", "WEEK", "MONTH", "TERM", "YEAR"]).default("ALL"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
});

export type HomeworkFilterSchema = z.infer<typeof homeworkFilterSchema>;

// Homework creation/update schema
export const homeworkSchema = z.object({
  id: z.coerce.number().optional(),
  
  // Basic Information
  title: z.string().min(3, { message: "Title must be at least 3 characters!" })
    .max(200, { message: "Title cannot exceed 200 characters!" }),
  description: z.string().optional().or(z.literal("")),
  instructions: z.string().optional().or(z.literal("")),
  assignedDate: z.coerce.date({ message: "Assigned date is required!" }),
  dueDate: z.coerce.date({ message: "Due date is required!" }),
  status: z.enum(["ACTIVE", "EXPIRED", "ARCHIVED"]).default("ACTIVE"),
  
  // Grading Configuration
  totalPoints: z.coerce.number().min(0).optional(),
  passingGrade: z.coerce.number().min(0).optional(),
  allowLateSubmission: z.boolean().default(true),
  latePenalty: z.coerce.number().min(0).max(100).optional(),
  
  // Relations
  branchId: z.coerce.number().min(1, { message: "Branch is required!" }),
  academicYearId: z.coerce.number().min(1, { message: "Academic Year is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  subjectId: z.coerce.number().min(1, { message: "Subject is required!" }),
  teacherId: z.string().min(1, { message: "Teacher is required!" }),
  
  // Attachments (handled separately in file upload)
  attachments: z.array(z.object({
    fileName: z.string(),
    originalName: z.string(),
    fileType: z.enum(["TEXT", "IMAGE", "DOCUMENT", "AUDIO", "VIDEO", "LINK", "OTHER"]),
    fileUrl: z.string(),
    filePath: z.string(),
    fileSize: z.number(),
    duration: z.number().optional(),
    mimeType: z.string(),
  })).optional().default([]),
}).refine((data) => {
  return data.dueDate >= data.assignedDate;
}, {
  message: "Due date must be after or equal to assigned date",
  path: ["dueDate"],
}).refine((data) => {
  if (data.passingGrade && data.totalPoints) {
    return data.passingGrade <= data.totalPoints;
  }
  return true;
}, {
  message: "Passing grade cannot be greater than total points",
  path: ["passingGrade"],
});

export type HomeworkSchema = z.infer<typeof homeworkSchema>;

// Homework submission schema
export const homeworkSubmissionSchema = z.object({
  id: z.coerce.number().optional(),
  homeworkId: z.coerce.number().min(1, { message: "Homework ID is required!" }),
  studentId: z.string().min(1, { message: "Student ID is required!" }),
  submissionDate: z.coerce.date().optional(),
  status: z.enum(["SUBMITTED", "LATE", "NOT_SUBMITTED", "GRADED"]).default("NOT_SUBMITTED"),
  content: z.string().optional().or(z.literal("")),
  grade: z.coerce.number().min(0).optional(),
  feedback: z.string().optional().or(z.literal("")),
  isLate: z.boolean().default(false),
  
  // Multimedia Attachments
  attachments: z.array(z.object({
    fileName: z.string(),
    originalName: z.string(),
    fileType: z.enum(["TEXT", "IMAGE", "DOCUMENT", "AUDIO", "VIDEO", "LINK", "OTHER"]),
    fileUrl: z.string(),
    filePath: z.string(),
    fileSize: z.number(),
    duration: z.number().optional(),
    mimeType: z.string(),
  })).optional().default([]),
});

export type HomeworkSubmissionSchema = z.infer<typeof homeworkSubmissionSchema>;

// Homework archive schema
export const homeworkArchiveSchema = z.object({
  homeworkId: z.coerce.number().min(1, { message: "Homework ID is required!" }),
  action: z.enum(["ARCHIVE", "RESTORE", "DELETE"], { message: "Action is required!" }),
  comment: z.string().min(10, { message: "Comment must be at least 10 characters!" })
    .max(500, { message: "Comment cannot exceed 500 characters!" }),
  createdBy: z.string().min(1, { message: "Created by is required!" }),
});

export type HomeworkArchiveSchema = z.infer<typeof homeworkArchiveSchema>;

// Teacher homework analytics schema
export const teacherHomeworkAnalyticsSchema = z.object({
  teacherId: z.string().min(1, { message: "Teacher ID is required!" }),
  branchId: z.coerce.number().min(1, { message: "Branch ID is required!" }),
  academicYearId: z.coerce.number().optional(),
  classId: z.coerce.number().optional(),
  subjectId: z.coerce.number().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  reportType: z.enum(["SUMMARY", "DETAILED", "SUBMISSION_RATES", "PERFORMANCE"]).default("SUMMARY"),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
});

export type TeacherHomeworkAnalyticsSchema = z.infer<typeof teacherHomeworkAnalyticsSchema>;

// Homework feedback and grading schema
export const homeworkFeedbackSchema = z.object({
  submissionId: z.coerce.number().min(1, { message: "Submission ID is required!" }),
  grade: z.coerce.number().min(0).optional(),
  feedback: z.string().optional().or(z.literal("")),
  status: z.enum(["SUBMITTED", "LATE", "NOT_SUBMITTED", "GRADED"]),
  teacherId: z.string().min(1, { message: "Teacher ID is required!" }),
}).refine((data) => {
  if (data.status === "GRADED" && data.grade === undefined) {
    return false;
  }
  return true;
}, {
  message: "Grade is required when status is GRADED",
  path: ["grade"],
});

export type HomeworkFeedbackSchema = z.infer<typeof homeworkFeedbackSchema>;

// Bulk homework feedback schema
export const bulkHomeworkFeedbackSchema = z.object({
  homeworkId: z.coerce.number().min(1, { message: "Homework ID is required!" }),
  teacherId: z.string().min(1, { message: "Teacher ID is required!" }),
  feedbacks: z.array(z.object({
    submissionId: z.coerce.number().min(1, { message: "Submission ID is required!" }),
    studentId: z.string().min(1, { message: "Student ID is required!" }),
    grade: z.coerce.number().min(0).optional(),
    feedback: z.string().optional().or(z.literal("")),
    status: z.enum(["SUBMITTED", "LATE", "NOT_SUBMITTED", "GRADED"]),
  })).min(1, { message: "At least one feedback is required!" }),
});

export type BulkHomeworkFeedbackSchema = z.infer<typeof bulkHomeworkFeedbackSchema>;

// Homework attachment schema
export const homeworkAttachmentSchema = z.object({
  id: z.coerce.number().optional(),
  fileName: z.string().min(1, { message: "File name is required!" }),
  originalName: z.string().min(1, { message: "Original name is required!" }),
  fileType: z.enum(["TEXT", "IMAGE", "DOCUMENT", "AUDIO", "VIDEO", "LINK", "OTHER"], { 
    message: "File type is required!" 
  }),
  fileUrl: z.string().min(1, { message: "File URL is required!" }),
  filePath: z.string().min(1, { message: "File path is required!" }),
  fileSize: z.coerce.number().min(1, { message: "File size is required!" }),
  duration: z.coerce.number().optional(),
  mimeType: z.string().min(1, { message: "MIME type is required!" }),
  homeworkId: z.coerce.number().optional(),
});

export type HomeworkAttachmentSchema = z.infer<typeof homeworkAttachmentSchema>;

// Submission attachment schema
export const submissionAttachmentSchema = z.object({
  id: z.coerce.number().optional(),
  fileName: z.string().min(1, { message: "File name is required!" }),
  originalName: z.string().min(1, { message: "Original name is required!" }),
  fileType: z.enum(["TEXT", "IMAGE", "DOCUMENT", "AUDIO", "VIDEO", "LINK", "OTHER"], { 
    message: "File type is required!" 
  }),
  fileUrl: z.string().min(1, { message: "File URL is required!" }),
  filePath: z.string().min(1, { message: "File path is required!" }),
  fileSize: z.coerce.number().min(1, { message: "File size is required!" }),
  duration: z.coerce.number().optional(),
  mimeType: z.string().min(1, { message: "MIME type is required!" }),
  submissionId: z.coerce.number().optional(),
});

export type SubmissionAttachmentSchema = z.infer<typeof submissionAttachmentSchema>;

// Exam filtering schema for admin management
export const examFilterSchema = z.object({
  branchId: z.coerce.number().optional(),
  academicYearId: z.coerce.number().optional(),
  classId: z.coerce.number().optional(),
  subjectId: z.coerce.number().optional(),
  teacherId: z.string().optional(),
  status: z.enum(["ALL", "SCHEDULED", "COMPLETED", "CANCELLED"]).default("ALL"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
});

export type ExamFilterSchema = z.infer<typeof examFilterSchema>;

// Exam creation/update schema
export const examSchema = z.object({
  id: z.coerce.number().optional(),
  
  // Basic Information
  name: z.string().min(3, { message: "Exam name must be at least 3 characters!" })
    .max(200, { message: "Exam name cannot exceed 200 characters!" }),
  date: z.coerce.date({ message: "Exam date is required!" }),
  startTime: z.string().min(1, { message: "Start time is required!" }),
  endTime: z.string().min(1, { message: "End time is required!" }),
  roomNumber: z.string().min(1, { message: "Room number is required!" })
    .max(50, { message: "Room number cannot exceed 50 characters!" }),
  fullMarks: z.coerce.number().min(1, { message: "Full marks must be at least 1!" })
    .max(1000, { message: "Full marks cannot exceed 1000!" }),
  passingMarks: z.coerce.number().min(0, { message: "Passing marks cannot be negative!" }),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).default("SCHEDULED"),
  
  // Relations
  branchId: z.coerce.number().min(1, { message: "Branch is required!" }),
  academicYearId: z.coerce.number().min(1, { message: "Academic Year is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  subjectId: z.coerce.number().min(1, { message: "Subject is required!" }),
  teacherId: z.string().min(1, { message: "Teacher is required!" }),
}).refine((data) => {
  return data.passingMarks <= data.fullMarks;
}, {
  message: "Passing marks cannot be greater than full marks",
  path: ["passingMarks"],
}).refine((data) => {
  // Basic time validation - start time should be before end time
  const startHour = parseInt(data.startTime.split(':')[0]);
  const endHour = parseInt(data.endTime.split(':')[0]);
  const startMinute = parseInt(data.startTime.split(':')[1]?.split(' ')[0] || '0');
  const endMinute = parseInt(data.endTime.split(':')[1]?.split(' ')[0] || '0');
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  return endTotalMinutes > startTotalMinutes;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export type ExamSchema = z.infer<typeof examSchema>;

// Exam result schema
export const examResultSchema = z.object({
  id: z.coerce.number().optional(),
  examId: z.coerce.number().min(1, { message: "Exam ID is required!" }),
  studentId: z.string().min(1, { message: "Student ID is required!" }),
  marksObtained: z.coerce.number().min(0, { message: "Marks cannot be negative!" }),
  status: z.enum(["PASS", "FAIL"]),
  feedback: z.string().optional().or(z.literal("")),
  teacherId: z.string().min(1, { message: "Teacher ID is required!" }),
});

export type ExamResultSchema = z.infer<typeof examResultSchema>;

// Bulk exam result schema
export const bulkExamResultSchema = z.object({
  examId: z.coerce.number().min(1, { message: "Exam ID is required!" }),
  teacherId: z.string().min(1, { message: "Teacher ID is required!" }),
  results: z.array(z.object({
    studentId: z.string().min(1, { message: "Student ID is required!" }),
    marksObtained: z.coerce.number().min(0, { message: "Marks cannot be negative!" }),
    feedback: z.string().optional().or(z.literal("")),
  })).min(1, { message: "At least one result is required!" }),
});

export type BulkExamResultSchema = z.infer<typeof bulkExamResultSchema>;



// Exam archive schema
export const examArchiveSchema = z.object({
  examId: z.coerce.number().min(1, { message: "Exam ID is required!" }),
  action: z.enum(["ARCHIVE", "RESTORE", "DELETE"], { message: "Action is required!" }),
  comment: z.string().min(10, { message: "Comment must be at least 10 characters!" })
    .max(500, { message: "Comment cannot exceed 500 characters!" }),
  createdBy: z.string().min(1, { message: "Created by is required!" }),
});

export type ExamArchiveSchema = z.infer<typeof examArchiveSchema>;

// Exam conflict detection schema
export const examConflictSchema = z.object({
  date: z.coerce.date(),
  startTime: z.string(),
  endTime: z.string(),
  classId: z.coerce.number(),
  roomNumber: z.string(),
  excludeExamId: z.coerce.number().optional(), // For update operations
});

export type ExamConflictSchema = z.infer<typeof examConflictSchema>;

export const directorSchema = z.object({
  id: z.coerce.number().optional(),
  firstName: z.string().min(1, { message: "First name is required!" }),
  lastName: z.string().min(1, { message: "Last name is required!" }),
  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits!" })
    .regex(/^\+998\d{9}$/, { message: "Phone must be in format +998XXXXXXXXX" }),
  passportNumber: z.string().min(1, { message: "Passport number is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
});

export type DirectorSchema = z.infer<typeof directorSchema>;

export const branchSchema = z.object({
  id: z.coerce.number().optional(),
  shortName: z.string().min(1, { message: "Short name is required!" }),
  legalName: z.string().min(1, { message: "Legal name is required!" }),
  stir: z.string().min(1, { message: "STIR (INN) is required!" }),
  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits!" })
    .regex(/^\+998\d{9}$/, { message: "Phone must be in format +998XXXXXXXXX" }),
  region: z.string().min(1, { message: "Region is required!" }),
  address: z.string().min(1, { message: "Address is required!" }),
  status: z.enum(["ACTIVE", "INACTIVE"], { message: "Status is required!" }),
  website: z
    .string()
    .url({ message: "Invalid website URL!" })
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  district: z.string().min(1, { message: "District (city) is required!" }),
  longitude: z.coerce.number({ message: "Longitude is required!" }),
  latitude: z.coerce.number({ message: "Latitude is required!" }),
});

export type BranchSchema = z.infer<typeof branchSchema>;

export const userPassportSchema = z.object({
  id: z.coerce.number().optional(),
  country: z.string().min(1, { message: "Country is required!" }),
  documentNumber: z.string().min(1, { message: "Document number is required!" }),
  issueDate: z.coerce.date({ message: "Issue date is required!" }),
  expiryDate: z.coerce.date({ message: "Expiry date is required!" }),
});

export type UserPassportSchema = z.infer<typeof userPassportSchema>;

export const userEducationSchema = z.object({
  id: z.coerce.number().optional(),
  institutionName: z.string().min(1, { message: "Institution name is required!" }),
  specialization: z.string().min(1, { message: "Specialization is required!" }),
  documentSeries: z.string().min(1, { message: "Document series is required!" }),
  graduationDate: z.coerce.date({ message: "Graduation date is required!" }),
  languageSkills: z.string().optional(),
});

export type UserEducationSchema = z.infer<typeof userEducationSchema>;

export const attachmentSchema = z.object({
  fileId: z.string(),
  name: z.string(),
  url: z.string(),
  filePath: z.string(),
  fileType: z.string(),
  size: z.number(),
});

export type AttachmentSchema = z.infer<typeof attachmentSchema>;

export const userSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, { message: "First name is required!" }),
  lastName: z.string().min(1, { message: "Last name is required!" }),
  gender: z.enum(["MALE", "FEMALE"], { message: "Gender is required!" }),
  dateOfBirth: z.coerce.date().optional(),
  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits!" })
    .regex(/^\+998\d{9}$/, { message: "Phone must be in format +998XXXXXXXXX" }),
  userId: z
    .string()
    .min(7, { message: "User ID is required!" })
    .regex(/^(MD|SD|MH|SH|MA|SA|D|C)\d{5}$/, { 
      message: "User ID must be in format: MD12345, SD12345, MH12345, SH12345, MA12345, SA12345, D12345, or C12345" 
    }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"], { message: "Status is required!" }),
  address: z.string().min(1, { message: "Address is required!" }),
  position: z.enum([
    "MAIN_DIRECTOR",
    "SUPPORT_DIRECTOR",
    "MAIN_HR",
    "SUPPORT_HR",
    "MAIN_ADMISSION",
    "SUPPORT_ADMISSION",
    "DOCTOR",
    "CHIEF"
  ], { message: "Position is required!" }),
  branchId: z.coerce.number().optional().nullable(),
  passport: userPassportSchema,
  education: userEducationSchema,
  attachments: z.object({
    passport: attachmentSchema.optional(),
    resume: attachmentSchema.optional(),
    photo: attachmentSchema.optional(),
  }).optional(),
});

export type UserSchema = z.infer<typeof userSchema>;

export const archiveCommentSchema = z.object({
  comment: z.string().min(10, { message: "Comment must be at least 10 characters!" }),
  action: z.enum(["ARCHIVE", "RESTORE", "DELETE"], { message: "Action is required!" }),
});

export const teacherPassportSchema = z.object({
  id: z.coerce.number().optional(),
  country: z.string().optional().or(z.literal("")),
  documentNumber: z.string().optional().or(z.literal("")),
  issueDate: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    try {
      return z.coerce.date().parse(v);
    } catch {
      return undefined;
    }
  }, z.date().optional()),
  expiryDate: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    try {
      return z.coerce.date().parse(v);
    } catch {
      return undefined;
    }
  }, z.date().optional()),
});

export type TeacherPassportSchema = z.infer<typeof teacherPassportSchema>;

export const teacherEducationSchema = z.object({
  id: z.coerce.number().optional(),
  institutionName: z.string().optional().or(z.literal("")),
  specialization: z.string().optional().or(z.literal("")),
  documentSeries: z.string().optional().or(z.literal("")),
  graduationDate: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    try {
      return z.coerce.date().parse(v);
    } catch {
      return undefined;
    }
  }, z.date().optional()),
  languageSkills: z.string().optional().or(z.literal("")),
});

export type TeacherEducationSchema = z.infer<typeof teacherEducationSchema>;

export const teacherSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, { message: "First name is required!" }),
  lastName: z.string().min(1, { message: "Last name is required!" }),
  gender: z.enum(["MALE", "FEMALE"], { message: "Gender is required!" }),
  dateOfBirth: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    try {
      return z.coerce.date().parse(v);
    } catch {
      return undefined;
    }
  }, z.date().optional()),
  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits!" })
    .regex(/^\+998\d{9}$/, { message: "Phone must be in format +998XXXXXXXXX" }),
  teacherId: z
    .string()
    .min(6, { message: "Teacher ID is required!" })
    .regex(/^T\d{5}$/, { message: "Teacher ID must be in format T12345" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"], { message: "Status is required!" }),
  // Removed branchId - teachers are now global and assigned during teacher assignments
  passport: teacherPassportSchema.optional(),
  education: teacherEducationSchema.optional(),
  attachments: z.object({
    passport: attachmentSchema.optional(),
    resume: attachmentSchema.optional(),
    photo: attachmentSchema.optional(),
  }).optional(),
});

export type TeacherSchema = z.infer<typeof teacherSchema>;

// Teacher Assignment Schema for the new flexible assignment system
export const teacherAssignmentSchema = z.object({
  id: z.string().optional(),
  teacherId: z.string().min(1, { message: "Teacher is required!" }),
  academicYearId: z.coerce.number().min(1, { message: "Academic year is required!" }),
  // Branch and Class are selected dynamically through assignment sections, so they are validated separately in the form logic
  branchId: z.coerce.number().optional().nullable(),
  classId: z.coerce.number().optional().nullable(),
  subjectId: z.coerce.number().optional().nullable(),
  assignSupervisor: z.boolean().optional().default(false),
  assignAsTeacher: z.boolean().optional().default(true),
  role: z.enum(["SUPERVISOR", "TEACHER"]).optional(),
  comment: z.string().optional(), // Required for delete operations
});

export type TeacherAssignmentSchema = z.infer<typeof teacherAssignmentSchema>;

// Student Assignment Schema for assigning students to academic year, branch, and class
export const studentAssignmentSchema = z.object({
  id: z.string().optional(),
  studentId: z.string().min(1, { message: "Student is required!" }),
  academicYearId: z.coerce.number().min(1, { message: "Academic year is required!" }),
  branchId: z.coerce.number().min(1, { message: "Branch is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  enrolledAt: z.coerce.date().optional(),
  comment: z.string().optional(), // Required for delete operations
});

export type StudentAssignmentSchema = z.infer<typeof studentAssignmentSchema>;

export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  status: z.enum(["ACTIVE", "INACTIVE"], { message: "Status is required!" }),
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

export type ArchiveCommentSchema = z.infer<typeof archiveCommentSchema>;

export const messageAttachmentSchema = z.object({
  id: z.coerce.number().optional(),
  fileName: z.string().min(1, { message: "File name is required!" }),
  originalName: z.string().min(1, { message: "Original name is required!" }),
  fileUrl: z.string().min(1, { message: "File URL is required!" }),
  fileType: z.enum(["file", "image", "voice"], { message: "File type is required!" }),
  fileSize: z.coerce.number().min(1, { message: "File size is required!" }),
  mimeType: z.string().min(1, { message: "MIME type is required!" }),
});

export type MessageAttachmentSchema = z.infer<typeof messageAttachmentSchema>;

export const adminMessageSchema = z.object({
  id: z.coerce.number().optional(),
  
  // Branch selection (required first step)
  isAllBranches: z.boolean().default(true),
  branchId: z.coerce.number().optional().nullable(),
  
  // Role selection (second step)
  role: z.enum([
    "MAIN_DIRECTOR",
    "SUPPORT_DIRECTOR", 
    "MAIN_HR",
    "SUPPORT_HR",
    "MAIN_ADMISSION",
    "SUPPORT_ADMISSION",
    "DOCTOR",
    "CHIEF",
    "TEACHER"
  ], { message: "Recipient role is required!" }),
  
  // Individual user selection (third step)
  receiverId: z.string().min(1, { message: "Recipient is required!" }),
  
  // Message content
  subject: z.string().min(1, { message: "Subject is required!" }),
  body: z.string().min(1, { message: "Message content is required!" }),
  
  // Optional attachments
  attachments: z.array(messageAttachmentSchema).default([]),
  
  senderId: z.string().min(1, { message: "Sender is required!" }),
}).refine((data) => {
  // If not all branches, must select a specific branch
  if (!data.isAllBranches && !data.branchId) {
    return false;
  }
  return true;
}, {
  message: "Please select a specific branch",
  path: ["branchId"],
});

export type AdminMessageSchema = z.infer<typeof adminMessageSchema>;

// Legacy message schema for backward compatibility
export const messageSchema = z.object({
  id: z.coerce.number().optional(),
  receiverId: z.string().min(1, { message: "Receiver is required!" }),
  subject: z.string().min(1, { message: "Subject is required!" }),
  content: z.string().min(1, { message: "Message content is required!" }),
});

export type MessageSchema = z.infer<typeof messageSchema>;

export const passwordResetSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required!" }),
  newPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" }),
  confirmPassword: z
    .string()
    .min(8, { message: "Confirm password is required!" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type PasswordResetSchema = z.infer<typeof passwordResetSchema>;

export const parentSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, { message: "First name is required!" }),
  lastName: z.string().min(1, { message: "Last name is required!" }),
  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits!" })
    .regex(/^\+998\d{9}$/, { message: "Phone must be in format +998XXXXXXXXX" }),
  parentId: z
    .string()
    .min(6, { message: "Parent ID is required!" })
    .regex(/^P\d{5}$/, { message: "Parent ID must be in format P12345" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" }),
  status: z.enum(["ACTIVE", "INACTIVE"], { message: "Status is required!" }),
  studentIds: z.array(z.string()).optional(),
  branchId: z.coerce.number().optional(),
});

export type ParentSchema = z.infer<typeof parentSchema>;

export const studentSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, { message: "First name is required!" }),
  lastName: z.string().min(1, { message: "Last name is required!" }),
  dateOfBirth: z.preprocess(
    (arg) => {
      if (typeof arg === 'string' && arg.trim() === '') return null;
      return arg;
    },
    z.coerce.date().optional().nullable()
  ),
  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits!" })
    .regex(/^\+998\d{9}$/, { message: "Phone must be in format +998XXXXXXXXX" }),
  studentId: z
    .string()
    .min(6, { message: "Student ID is required!" })
    .regex(/^S\d{5}$/, { message: "Student ID must be in format S12345" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" }),
  gender: z.enum(["MALE", "FEMALE"], { message: "Gender is required!" }),
  status: z.enum(["ACTIVE", "INACTIVE"], { message: "Status is required!" }),
  branchId: z.coerce.number().optional().nullable(), // Now handled in Student Assignments
  classId: z.coerce.number().optional().nullable(), // Now handled in Student Assignments
  parentId: z.string().optional(), // Made optional - students can be created without parents
  attachments: z.object({
    document1: attachmentSchema.optional(),
    document2: attachmentSchema.optional(),
    image1: attachmentSchema.optional(),
    image2: attachmentSchema.optional(),
  }).optional(),
});

export type StudentSchema = z.infer<typeof studentSchema>;

// Update schemas with optional passwords for edit operations
export const studentUpdateSchema = studentSchema.extend({
  password: z.string().optional().or(z.literal("")),
});

export const parentUpdateSchema = parentSchema.extend({
  password: z.string().optional().or(z.literal("")),
});

export const userUpdateSchema = userSchema.extend({
  password: z.string().optional().or(z.literal("")),
});

export type StudentUpdateSchema = z.infer<typeof studentUpdateSchema>;
export type ParentUpdateSchema = z.infer<typeof parentUpdateSchema>;
export type UserUpdateSchema = z.infer<typeof userUpdateSchema>;

export const transferStudentSchema = z.object({
  studentId: z.string().min(1, { message: "Student is required!" }),
  newBranchId: z.coerce.number({ message: "New branch is required!" }),
  newClassId: z.coerce.number({ message: "New class is required!" }),
  transferReason: z.string().min(10, { message: "Transfer reason must be at least 10 characters!" }),
});

export type TransferStudentSchema = z.infer<typeof transferStudentSchema>;

export const semesterSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Semester name is required!" }),
  startDate: z.coerce.date({ message: "Start date is required!" }),
  endDate: z.coerce.date({ message: "End date is required!" }),
  academicYearId: z.coerce.number().optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export type SemesterSchema = z.infer<typeof semesterSchema>;

export const academicYearSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Academic year name is required!" }),
  startDate: z.coerce.date({ message: "Start date is required!" }),
  endDate: z.coerce.date({ message: "End date is required!" }),
  status: z.enum(["ACTIVE", "INACTIVE"], { message: "Status is required!" }),
  semesters: z.array(semesterSchema).min(1, { message: "At least one semester is required!" }),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
}).refine((data) => {
  // Ensure academic year spans at least 6 months
  const monthsDiff = (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  return monthsDiff >= 6;
}, {
  message: "Academic year must span at least 6 months",
  path: ["endDate"],
});

export type AcademicYearSchema = z.infer<typeof academicYearSchema>;

export const eventSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Event title is required!" }),
  description: z.string().min(1, { message: "Event description is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  
  // Branch targeting (required first step)
  isAllBranches: z.boolean().default(true),
  branchIds: z.array(z.number()).default([]),
  
  // Audience targeting (second step)
  targetAudience: z.enum([
    "ALL_USERS",
    "ALL_STUDENTS", 
    "ALL_TEACHERS",
    "ALL_PARENTS",
    "SPECIFIC_BRANCHES",
    "SPECIFIC_CLASSES",
    "SPECIFIC_USERS"
  ], { message: "Target audience is required!" }),
  
  // Class filtering (optional third step for students/parents)
  classIds: z.array(z.number()).default([]),
  
  // Specific user targeting (optional)
  userIds: z.array(z.string()).default([]),
  studentIds: z.array(z.string()).default([]),
  teacherIds: z.array(z.string()).default([]),
  parentIds: z.array(z.string()).default([]),
  
  createdBy: z.string().min(1, { message: "Creator is required!" }),
}).refine((data) => data.endTime > data.startTime, {
  message: "End time must be after start time",
  path: ["endTime"],
}).refine((data) => {
  // If not all branches, must select at least one branch
  if (!data.isAllBranches && data.branchIds.length === 0) {
    return false;
  }
  return true;
}, {
  message: "Please select at least one branch",
  path: ["branchIds"],
}).refine((data) => {
  // If targeting students or parents, class filtering is optional but must be valid
  if ((data.targetAudience === "ALL_STUDENTS" || data.targetAudience === "ALL_PARENTS") && data.classIds.length > 0) {
    // If classes are selected, they must be from the selected branches
    return true; // This will be validated on the backend
  }
  return true;
}, {
  message: "Invalid class selection for target audience",
  path: ["classIds"],
});

export type EventSchema = z.infer<typeof eventSchema>;

export const announcementSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Announcement title is required!" }),
  description: z.string().min(1, { message: "Announcement description is required!" }),
  date: z.coerce.date({ message: "Date is required!" }),
  
  // Branch targeting (required first step)
  isAllBranches: z.boolean().default(true),
  branchIds: z.array(z.number()).default([]),
  
  // Audience targeting (second step)
  targetAudience: z.enum([
    "ALL_USERS",
    "ALL_STUDENTS", 
    "ALL_TEACHERS",
    "ALL_PARENTS",
    "SPECIFIC_BRANCHES",
    "SPECIFIC_CLASSES",
    "SPECIFIC_USERS"
  ], { message: "Target audience is required!" }),
  
  // Class filtering (optional third step for students/parents)
  classIds: z.array(z.number()).default([]),
  
  // Specific user targeting (optional)
  userIds: z.array(z.string()).default([]),
  studentIds: z.array(z.string()).default([]),
  teacherIds: z.array(z.string()).default([]),
  parentIds: z.array(z.string()).default([]),
  
  createdBy: z.string().min(1, { message: "Creator is required!" }),
}).refine((data) => {
  // If not all branches, must select at least one branch
  if (!data.isAllBranches && data.branchIds.length === 0) {
    return false;
  }
  return true;
}, {
  message: "Please select at least one branch",
  path: ["branchIds"],
}).refine((data) => {
  // If targeting students or parents, class filtering is optional but must be valid
  if ((data.targetAudience === "ALL_STUDENTS" || data.targetAudience === "ALL_PARENTS") && data.classIds.length > 0) {
    // If classes are selected, they must be from the selected branches
    return true; // This will be validated on the backend
  }
  return true;
}, {
  message: "Invalid class selection for target audience",
  path: ["classIds"],
});

export type AnnouncementSchema = z.infer<typeof announcementSchema>;

// Bulk attendance schema for teacher attendance
export const bulkAttendanceSchema = z.object({
  attendances: z.array(z.object({
    studentId: z.string().min(1, { message: "Student ID is required!" }),
    subjectId: z.coerce.number().min(1, { message: "Subject is required!" }),
    classId: z.coerce.number().min(1, { message: "Class is required!" }),
    date: z.coerce.date({ message: "Date is required!" }),
    status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"], { message: "Status is required!" }),
    notes: z.string().optional(),
  })),
  teacherId: z.string().min(1, { message: "Teacher ID is required!" }),
  branchId: z.coerce.number().min(1, { message: "Branch is required!" }),
});

export type BulkAttendanceSchema = z.infer<typeof bulkAttendanceSchema>;

// Bulk grade schema for teacher grades
export const bulkGradeSchema = z.object({
  grades: z.array(z.object({
    studentId: z.string().min(1, { message: "Student ID is required!" }),
    subjectId: z.coerce.number().min(1, { message: "Subject is required!" }),
    classId: z.coerce.number().min(1, { message: "Class is required!" }),
    examId: z.coerce.number().min(1, { message: "Exam is required!" }),
    score: z.coerce.number().min(0, { message: "Score must be 0 or greater!" }),
    maxScore: z.coerce.number().min(1, { message: "Max score is required!" }),
    notes: z.string().optional(),
  })),
  teacherId: z.string().min(1, { message: "Teacher ID is required!" }),
  branchId: z.coerce.number().min(1, { message: "Branch is required!" }),
});

export type BulkGradeSchema = z.infer<typeof bulkGradeSchema>;