"use server";

import { revalidatePath } from "next/cache";

// Helper function to safely extract form data
const safeGetFormData = (data: FormData | null | undefined, key: string): string => {
  if (!data) {
    console.error("Form data is missing in safeGetFormData");
    return "";
  }
  return (data.get(key) as string) || "";
};
import {
  AcademicYearSchema,
  ArchiveCommentSchema,
  AttendanceSchema,
  BranchSchema,
  ClassSchema,
  ComplaintSchema,
  ComplaintStatusUpdateSchema,
  DocumentSchema,
  DocumentArchiveSchema,
  DocumentVersionSchema,
  ExamSchema,
  ExamResultSchema,
  ExamArchiveSchema,
  ExamConflictSchema,
  GradeSchema,
  HomeworkSchema,
  HomeworkSubmissionSchema,
  HomeworkArchiveSchema,
  MessageSchema,
  AdminMessageSchema,
  ParentSchema,
  parentSchema,
  PasswordResetSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
  TeacherAssignmentSchema,
  TimetableSchema,
  TransferStudentSchema,
  UserSchema,
  UserUpdateSchema,
  StudentUpdateSchema,
  ParentUpdateSchema,
  parentUpdateSchema,
  TeacherUpdateSchema,
  teacherUpdateSchema,
  EventSchema,
  AnnouncementSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import type { Prisma } from "@prisma/client";
import { AuthService } from "@/lib/auth";

type CurrentState = { success: boolean; error: boolean; message?: string };

// Helper function to generate a unique teacher ID in format T + 5 digits
async function generateUniqueTeacherId(): Promise<string> {
  let teacherId: string;
  let counter = 1;
  
  while (true) {
    const randomDigits = Math.floor(Math.random() * 90000) + 10000; // 5 digits
    teacherId = `T${randomDigits}`;
    
    const existingTeacher = await prisma.teacher.findFirst({
      where: { teacherId: teacherId }
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

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    // Check if a subject with this name already exists
    const existingSubject = await prisma.subject.findFirst({
      where: { name: data.name }
    });

    if (existingSubject) {
      return { 
        success: false, 
        error: true, 
        message: `A subject with the name "${data.name}" already exists` 
      };
    }

    await prisma.subject.create({
      data: {
        name: data.name,
        status: data.status,
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false, message: "Subject created successfully" };
  } catch (err) {
    console.log(err);
    if (err instanceof Error && err.message.includes('Unique constraint')) {
      return { 
        success: false, 
        error: true, 
        message: `A subject with the name "${data.name}" already exists` 
      };
    }
    return { success: false, error: true, message: "Failed to create subject" };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    // First, get the current subject to check if name is actually changing
    const currentSubject = await prisma.subject.findUnique({
      where: { id: data.id },
      select: { name: true }
    });

    if (!currentSubject) {
      return { success: false, error: true, message: "Subject not found" };
    }

    // If the name is changing, check if the new name already exists
    if (currentSubject.name !== data.name) {
      const existingSubject = await prisma.subject.findFirst({
        where: {
          name: data.name,
          id: { not: data.id } // Exclude the current subject
        }
      });

      if (existingSubject) {
        return { 
          success: false, 
          error: true, 
          message: `A subject with the name "${data.name}" already exists` 
        };
      }
    }

    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        status: data.status,
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false, message: "Subject updated successfully" };
  } catch (err) {
    console.log(err);
    if (err instanceof Error && err.message.includes('Unique constraint')) {
      return { 
        success: false, 
        error: true, 
        message: `A subject with the name "${data.name}" already exists` 
      };
    }
    return { success: false, error: true, message: "Failed to update subject" };
  }
};

export const archiveSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const subjectId = data.get("subjectId") as string;
  const comment = data.get("comment") as string;
  const currentUserId = data.get("currentUserId") as string;

  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.subject.update({
        where: { id: parseInt(subjectId) },
        data: {
          status: "INACTIVE",
          archivedAt: new Date(),
        },
      });
      await tx.archiveComment.create({
        data: {
          subjectId: parseInt(subjectId),
          comment: comment,
          action: "ARCHIVE",
          createdBy: currentUserId,
        },
      });
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const restoreSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const subjectId = data.get("subjectId") as string;
  const comment = data.get("comment") as string;
  const currentUserId = data.get("currentUserId") as string;

  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.subject.update({
        where: { id: parseInt(subjectId) },
        data: {
          status: "ACTIVE",
          restoredAt: new Date(),
        },
      });
      await tx.archiveComment.create({
        data: {
          subjectId: parseInt(subjectId),
          comment: comment,
          action: "RESTORE",
          createdBy: currentUserId,
        },
      });
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const subjectId = data.get("subjectId") as string;
  const comment = data.get("comment") as string;
  const currentUserId = data.get("currentUserId") as string;

  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Add delete comment before deletion
      await tx.archiveComment.create({
        data: {
          subjectId: parseInt(subjectId),
          comment: comment,
          action: "DELETE",
          createdBy: currentUserId,
        },
      });

      // Delete subject and all related data (cascade delete)
      await tx.subject.delete({
        where: { id: parseInt(subjectId) },
      });
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createClass = async (
  currentState: CurrentState,
  formData: FormData
): Promise<CurrentState> => {
  // Extract data from FormData
  const data = {
    name: formData.get("name") as string,
    capacity: parseInt(formData.get("capacity") as string),
    branchId: parseInt(formData.get("branchId") as string),
    academicYearId: parseInt(formData.get("academicYearId") as string),
    language: formData.get("language") as string || null,
    educationType: formData.get("educationType") as string || null,
    status: formData.get("status") as string || "ACTIVE",
  };

  try {
    console.log("Creating class with formData:", formData);
    console.log("FormData entries:", Array.from(formData.entries()));
    
    console.log("Parsed data:", data);
    
    // Check if a class with this name already exists
    const existingClass = await prisma.class.findFirst({
      where: { name: data.name }
    });

    if (existingClass) {
      return { 
        success: false, 
        error: true, 
        message: `A class with the name "${data.name}" already exists` 
      };
    }

    const classData: any = {
      name: data.name,
      capacity: data.capacity,
      language: data.language || null,
      educationType: data.educationType || null,
      status: (data.status || "ACTIVE") as any,
      branch: { connect: { id: data.branchId } },
      academicYear: { connect: { id: data.academicYearId } },
    };

    await prisma.class.create({ data: classData as any });

    // revalidatePath("/list/classes");
    return { success: true, error: false, message: "Class created successfully" };
  } catch (err) {
    console.error("Class creation error:", err);
    if (err instanceof Error && err.message.includes('Unique constraint')) {
      return { 
        success: false, 
        error: true, 
        message: `A class with the name "${data.name || 'unknown'}" already exists` 
      };
    }
    return { 
      success: false, 
      error: true, 
      message: `Failed to create class: ${err instanceof Error ? err.message : 'Unknown error'}` 
    };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  formData: FormData
): Promise<CurrentState> => {
  // Extract data from FormData
  const data = {
    id: parseInt(formData.get("id") as string),
    name: formData.get("name") as string,
    capacity: parseInt(formData.get("capacity") as string),
    branchId: parseInt(formData.get("branchId") as string),
    academicYearId: parseInt(formData.get("academicYearId") as string),
    language: formData.get("language") as string || null,
    educationType: formData.get("educationType") as string || null,
    status: formData.get("status") as string || "ACTIVE",
  };
  
  if (!data.id) {
    return { success: false, error: true, message: "Class ID is required" };
  }

  try {
    // First, get the current class to check if name is actually changing
    const currentClass = await prisma.class.findUnique({
      where: { id: data.id },
      select: { name: true }
    });

    if (!currentClass) {
      return { success: false, error: true, message: "Class not found" };
    }

    // If the name is changing, check if the new name already exists
    if (currentClass.name !== data.name) {
      const existingClass = await prisma.class.findFirst({
        where: {
          name: data.name,
          id: { not: data.id } // Exclude the current class
        }
      });

      if (existingClass) {
        return { 
          success: false, 
          error: true, 
          message: `A class with the name "${data.name}" already exists` 
        };
      }
    }

    const updateData: any = {
      name: data.name,
      capacity: data.capacity,
      language: data.language || null,
      educationType: data.educationType || null,
      status: data.status as any,
      branch: { connect: { id: data.branchId } },
      academicYear: { connect: { id: data.academicYearId } },
    };

    await prisma.class.update({
      where: { id: data.id },
      data: updateData as any,
    });

    // revalidatePath("/list/classes");
    return { success: true, error: false, message: "Class updated successfully" };
  } catch (err) {
    console.log(err);
    if (err instanceof Error && err.message.includes('Unique constraint')) {
      return { 
        success: false, 
        error: true, 
        message: `A class with the name "${data.name}" already exists` 
      };
    }
    return { success: false, error: true, message: "Failed to update class" };
  }
};

export const archiveClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const classId = data.get("classId") as string;
  const comment = data.get("comment") as string;
  const currentUserId = data.get("currentUserId") as string;

  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.class.update({
        where: { id: parseInt(classId) },
        data: ({
          status: "INACTIVE",
          archivedAt: new Date(),
        } as any),
      });
      await tx.archiveComment.create({
        data: ({
          class: { connect: { id: parseInt(classId) } },
          comment: comment,
          action: "ARCHIVE",
          createdBy: currentUserId,
        } as any),
      });
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const restoreClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const classId = data.get("classId") as string;
  const comment = data.get("comment") as string;
  const currentUserId = data.get("currentUserId") as string;

  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.class.update({
        where: { id: parseInt(classId) },
        data: ({
          status: "ACTIVE",
          restoredAt: new Date(),
        } as any),
      });
      await tx.archiveComment.create({
        data: {
          classId: parseInt(classId),
          comment: comment,
          action: "RESTORE",
          createdBy: currentUserId,
        },
      });
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const classId = data.get("classId") as string;
  const comment = data.get("comment") as string;
  const currentUserId = data.get("currentUserId") as string;

  if (!comment || comment.length < 10) {
    return { success: false, error: true, message: "Comment is required (minimum 10 characters)" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Add delete comment before deletion
      await tx.archiveComment.create({
        data: {
          classId: parseInt(classId),
          comment: comment,
          action: "DELETE",
          createdBy: currentUserId,
        },
      });

      // Delete all related data first
      // Delete timetables
      await tx.timetable.deleteMany({
        where: { classId: parseInt(classId) },
      });

      // Delete teacher assignments (class-subject-teacher relationships)
      // Note: TeacherAssignment model doesn't exist, skipping this deletion

      // Delete students (set classId to null or delete them)
      // Note: classId is required in Student model, so we'll delete students instead
      await tx.student.deleteMany({
        where: { classId: parseInt(classId) },
      });

      // Delete attendance records
      await tx.attendance.deleteMany({
        where: { classId: parseInt(classId) },
      });

      // Delete exam results - ExamResult doesn't have classId, so we'll delete by student's class
      await tx.examResult.deleteMany({
        where: {
          student: {
            classId: parseInt(classId)
          }
        },
      });

      // Delete homework submissions - HomeworkSubmission doesn't have classId, so we'll delete by student's class
      await tx.homeworkSubmission.deleteMany({
        where: {
          student: {
            classId: parseInt(classId)
          }
        },
      });

      // Delete grades
      await tx.grade.deleteMany({
        where: { classId: parseInt(classId) },
      });

      // Finally delete the class
      await tx.class.delete({
        where: { id: parseInt(classId) },
      });
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { 
      success: false, 
      error: true, 
      message: "Failed to delete class. Please ensure there are no active students or related records." 
    };
  }
};








// Legacy createExam function removed - see new exam functions below

// Legacy updateExam function removed - see new exam functions below

// Legacy deleteExam function removed - see new exam functions below

// Timetable Actions
export const createTimetable = async (
  currentState: CurrentState,
  data: TimetableSchema
) => {
  try {
    await prisma.timetable.create({
      data: {
        branchId: data.branchId,
        classId: data.classId,
        academicYearId: data.academicYearId,
        subjectId: data.subjectId,
        teacherIds: [data.teacherId],
        dayOfWeek: data.day as any,
        startTime: data.startTime,
        endTime: data.endTime,
        roomNumber: data.roomNumber,
        buildingName: data.buildingName || null,
        isActive: data.status === "ACTIVE",
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateTimetable = async (
  currentState: CurrentState,
  data: TimetableSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }

  try {
    await prisma.timetable.update({
      where: { id: data.id },
      data: {
        branchId: data.branchId,
        classId: data.classId,
        academicYearId: data.academicYearId,
        subjectId: data.subjectId,
        teacherIds: [data.teacherId],
        dayOfWeek: data.day as any,
        startTime: data.startTime,
        endTime: data.endTime,
        roomNumber: data.roomNumber,
        buildingName: data.buildingName || null,
        isActive: data.status === "ACTIVE",
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const archiveTimetable = async (
  timetableId: string,
  comment: string,
  currentUserId: string
) => {
  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.timetable.update({
        where: { id: parseInt(timetableId) },
        data: {
          isActive: false,
        },
      });
      await tx.archiveComment.create({
        data: {
          timetableId: parseInt(timetableId),
          comment: comment,
          action: "ARCHIVE",
          createdBy: currentUserId,
        },
      });
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const restoreTimetable = async (
  timetableId: string,
  comment: string,
  currentUserId: string
) => {
  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.timetable.update({
        where: { id: parseInt(timetableId) },
        data: {
          isActive: true,
        },
      });
      await tx.archiveComment.create({
        data: {
          timetableId: parseInt(timetableId),
          comment: comment,
          action: "RESTORE",
          createdBy: currentUserId,
        },
      });
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTimetable = async (
  timetableId: string,
  comment: string,
  currentUserId: string
) => {
  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    // Check if timetable has related records
    const examsCount = await prisma.exam.count({
      where: { timetableId: parseInt(timetableId) },
    });

    const homeworkCount = await prisma.homework.count({
      where: { 
        class: {
          timetables: {
            some: { id: parseInt(timetableId) }
          }
        }
      },
    });

    const attendancesCount = await prisma.attendance.count({
      where: { timetableId: parseInt(timetableId) },
    });

    if (examsCount > 0 || homeworkCount > 0 || attendancesCount > 0) {
      return { success: false, error: true };
    }

    await prisma.$transaction(async (tx) => {
      await tx.archiveComment.create({
        data: {
          timetableId: parseInt(timetableId),
          comment: comment,
          action: "DELETE",
          createdBy: currentUserId,
        },
      });
      await tx.timetable.delete({
        where: { id: parseInt(timetableId) },
      });
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTimetableSimple = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.timetable.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Attendance Actions
export const createAttendance = async (
  currentState: CurrentState,
  data: AttendanceSchema
) => {
  try {
    // Get timetable data to extract required fields
    const timetable = await prisma.timetable.findUnique({
      where: { id: data.timetableId },
      select: {
        academicYearId: true,
        branchId: true,
        classId: true,
        subjectId: true,
        teacherIds: true,
      },
    });

    if (!timetable) {
      throw new Error("Timetable not found");
    }

    await prisma.attendance.create({
      data: {
        studentId: data.studentId,
        timetableId: data.timetableId,
        date: data.date,
        status: data.status as any,
        notes: data.notes || null,
        archived: data.archived || false,
        academicYearId: timetable.academicYearId,
        branchId: timetable.branchId,
        classId: timetable.classId,
        subjectId: timetable.subjectId!,
        teacherId: timetable.teacherIds && timetable.teacherIds.length > 0 ? timetable.teacherIds[0] : "",
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAttendance = async (
  currentState: CurrentState,
  data: AttendanceSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }

  try {
    await prisma.attendance.update({
      where: { id: data.id },
      data: {
        studentId: data.studentId,
        timetableId: data.timetableId,
        date: data.date,
        status: data.status as any,
        notes: data.notes || null,
        archived: data.archived || false,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const archiveAttendance = async (
  attendanceId: string,
  comment: string,
  currentUserId: string
) => {
  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.attendance.update({
        where: { id: parseInt(attendanceId) },
        data: {
          archived: true,
          archivedAt: new Date(),
        },
      });
      await tx.archiveComment.create({
        data: {
          attendanceId: parseInt(attendanceId),
          comment: comment,
          action: "ARCHIVE",
          createdBy: currentUserId,
        },
      });
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const restoreAttendance = async (
  attendanceId: string,
  comment: string,
  currentUserId: string
) => {
  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.attendance.update({
        where: { id: parseInt(attendanceId) },
        data: {
          archived: false,
          restoredAt: new Date(),
        },
      });
      await tx.archiveComment.create({
        data: {
          attendanceId: parseInt(attendanceId),
          comment: comment,
          action: "RESTORE",
          createdBy: currentUserId,
        },
      });
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAttendance = async (
  attendanceId: string,
  comment: string,
  currentUserId: string
) => {
  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.archiveComment.create({
        data: {
          attendanceId: parseInt(attendanceId),
          comment: comment,
          action: "DELETE",
          createdBy: currentUserId,
        },
      });
      await tx.attendance.delete({
        where: { id: parseInt(attendanceId) },
      });
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAttendanceSimple = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.attendance.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Attendance Statistics Helper Functions
export const getAttendanceStatistics = async (
  branchId: number,
  academicYearId: number,
  classId: number,
  subjectId: number,
  startDate?: Date,
  endDate?: Date
) => {
  try {
    // Get all students in the class
    const students = await prisma.student.findMany({
      where: {
        classId: classId,
        branchId: branchId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true,
      },
    });

    // Get timetables for the subject in the class
    const timetables = await prisma.timetable.findMany({
      where: {
        branchId: branchId,
        academicYearId: academicYearId,
        classId: classId,
        subjectId: subjectId,
        isActive: true,
        ...(startDate && endDate ? {
          startTime: {
            gte: startDate,
            lte: endDate,
          },
        } : {}),
      },
      select: {
        id: true,
        startTime: true,
        subject: { select: { name: true } },
      },
    });

    // Get attendance records for all students and timetables
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        timetableId: { in: timetables.map(t => t.id) },
        studentId: { in: students.map(s => s.id) },
        archived: false,
        ...(startDate && endDate ? {
          date: {
            gte: startDate,
            lte: endDate,
          },
        } : {}),
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
        timetable: { select: { id: true, startTime: true } },
      },
    });

    // Calculate statistics for each student
    const studentStats = students.map(student => {
      const studentAttendance = attendanceRecords.filter(record => record.studentId === student.id);
      const totalSessions = timetables.length;
      const presentCount = studentAttendance.filter(record => record.status === "PRESENT").length;
      const absentCount = studentAttendance.filter(record => record.status === "ABSENT").length;
      const lateCount = studentAttendance.filter(record => record.status === "LATE").length;
      const excusedCount = studentAttendance.filter(record => record.status === "EXCUSED").length;

      return {
        student,
        totalSessions,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        presentPercentage: totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0,
        absentPercentage: totalSessions > 0 ? Math.round((absentCount / totalSessions) * 100) : 0,
        latePercentage: totalSessions > 0 ? Math.round((lateCount / totalSessions) * 100) : 0,
        excusedPercentage: totalSessions > 0 ? Math.round((excusedCount / totalSessions) * 100) : 0,
        attendanceRecords: studentAttendance,
      };
    });

    // Calculate class summary
    const totalStudents = students.length;
    const totalPossibleSessions = totalStudents * timetables.length;
    const totalPresent = attendanceRecords.filter(record => record.status === "PRESENT").length;
    const totalAbsent = attendanceRecords.filter(record => record.status === "ABSENT").length;
    const totalLate = attendanceRecords.filter(record => record.status === "LATE").length;
    const totalExcused = attendanceRecords.filter(record => record.status === "EXCUSED").length;

    const classSummary = {
      totalStudents,
      totalSessions: timetables.length,
      totalPossibleSessions,
      totalPresent,
      totalAbsent,
      totalLate,
      totalExcused,
      presentPercentage: totalPossibleSessions > 0 ? Math.round((totalPresent / totalPossibleSessions) * 100) : 0,
      absentPercentage: totalPossibleSessions > 0 ? Math.round((totalAbsent / totalPossibleSessions) * 100) : 0,
      latePercentage: totalPossibleSessions > 0 ? Math.round((totalLate / totalPossibleSessions) * 100) : 0,
      excusedPercentage: totalPossibleSessions > 0 ? Math.round((totalExcused / totalPossibleSessions) * 100) : 0,
    };

    return {
      studentStats,
      classSummary,
      timetables,
    };
  } catch (err) {
    console.log(err);
    throw new Error("Failed to get attendance statistics");
  }
};

// Grade Actions
export const createGrade = async (
  currentState: CurrentState,
  data: GradeSchema
) => {
  try {
    await prisma.grade.create({
      data: {
        value: data.value,
        maxValue: data.maxValue,
        type: data.type as any,
        description: data.description || null,
        date: data.date,
        week: data.week || null,
        month: data.month || null,
        term: data.term || null,
        year: data.year,
        studentId: data.studentId,
        branchId: data.branchId,
        classId: data.classId,
        academicYearId: data.academicYearId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        timetableId: data.timetableId || null,
        status: data.status as any,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateGrade = async (
  currentState: CurrentState,
  data: GradeSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }

  try {
    await prisma.grade.update({
      where: { id: data.id },
      data: {
        value: data.value,
        maxValue: data.maxValue,
        type: data.type as any,
        description: data.description || null,
        date: data.date,
        week: data.week || null,
        month: data.month || null,
        term: data.term || null,
        year: data.year,
        studentId: data.studentId,
        branchId: data.branchId,
        classId: data.classId,
        academicYearId: data.academicYearId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        timetableId: data.timetableId || null,
        status: data.status as any,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const archiveGrade = async (
  gradeId: string,
  comment: string,
  currentUserId: string
) => {
  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.grade.update({
        where: { id: parseInt(gradeId) },
        data: {
          status: "ARCHIVED",
          archivedAt: new Date(),
        },
      });
      await tx.archiveComment.create({
        data: {
          gradeId: parseInt(gradeId),
          comment: comment,
          action: "ARCHIVE",
          createdBy: currentUserId,
        },
      });
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const restoreGrade = async (
  gradeId: string,
  comment: string,
  currentUserId: string
) => {
  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.grade.update({
        where: { id: parseInt(gradeId) },
        data: {
          status: "ACTIVE",
          restoredAt: new Date(),
        },
      });
      await tx.archiveComment.create({
        data: {
          gradeId: parseInt(gradeId),
          comment: comment,
          action: "RESTORE",
          createdBy: currentUserId,
        },
      });
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteGrade = async (
  gradeId: string,
  comment: string,
  currentUserId: string
) => {
  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.archiveComment.create({
        data: {
          gradeId: parseInt(gradeId),
          comment: comment,
          action: "DELETE",
          createdBy: currentUserId,
        },
      });
      await tx.grade.delete({
        where: { id: parseInt(gradeId) },
      });
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteGradeSimple = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.grade.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Gradebook Statistics Helper Functions
export const getGradebookStatistics = async (
  branchId: number,
  academicYearId: number,
  classId: number,
  subjectId: number,
  gradeType?: string,
  startDate?: Date,
  endDate?: Date
) => {
  try {
    // Get all students in the class
    const students = await prisma.student.findMany({
      where: {
        classId: classId,
        branchId: branchId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true,
      },
    });

    // Build grade query conditions
    const gradeWhere: any = {
      branchId: branchId,
      academicYearId: academicYearId,
      classId: classId,
      subjectId: subjectId,
      status: "ACTIVE",
      studentId: { in: students.map(s => s.id) },
    };

    if (gradeType && gradeType !== "ALL") {
      gradeWhere.type = gradeType;
    }

    if (startDate && endDate) {
      gradeWhere.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Get all grades for the filtered criteria
    const grades = await prisma.grade.findMany({
      where: gradeWhere,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
      },
      orderBy: { date: "asc" },
    });

    // Calculate statistics for each student
    const studentStats = students.map(student => {
      const studentGrades = grades.filter(grade => grade.studentId === student.id);
      
      // Group grades by type
      const gradesByType = {
        daily: studentGrades.filter(g => g.type === "DAILY"),
        weekly: studentGrades.filter(g => g.type === "WEEKLY"),
        monthly: studentGrades.filter(g => g.type === "MONTHLY"),
        termly: studentGrades.filter(g => g.type === "TERMLY"),
        yearly: studentGrades.filter(g => g.type === "YEARLY"),
        examMidterm: studentGrades.filter(g => g.type === "EXAM_MIDTERM"),
        examFinal: studentGrades.filter(g => g.type === "EXAM_FINAL"),
        examNational: studentGrades.filter(g => g.type === "EXAM_NATIONAL"),
      };

      // Calculate averages for each type
      const calculateAverage = (gradeList: any[]) => {
        if (gradeList.length === 0) return null;
        const total = gradeList.reduce((sum, grade) => sum + (grade.value / grade.maxValue * 100), 0);
        return Math.round(total / gradeList.length * 100) / 100;
      };

      const averages = {
        daily: calculateAverage(gradesByType.daily),
        weekly: calculateAverage(gradesByType.weekly),
        monthly: calculateAverage(gradesByType.monthly),
        termly: calculateAverage(gradesByType.termly),
        yearly: calculateAverage(gradesByType.yearly),
        examMidterm: calculateAverage(gradesByType.examMidterm),
        examFinal: calculateAverage(gradesByType.examFinal),
        examNational: calculateAverage(gradesByType.examNational),
      };

      // Overall average
      const allGrades = studentGrades.map(g => g.value / g.maxValue * 100);
      const overallAverage = allGrades.length > 0 
        ? Math.round(allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length * 100) / 100
        : null;

      return {
        student,
        totalGrades: studentGrades.length,
        averages,
        overallAverage,
        gradesByType,
        grades: studentGrades,
        // Trend calculation (simplified - last 5 grades)
        recentTrend: studentGrades.slice(-5).map(g => ({
          date: g.date,
          value: Math.round(g.value / g.maxValue * 100),
          type: g.type,
        })),
      };
    });

    // Calculate class summary statistics
    const allStudentGrades = grades.map(g => g.value / g.maxValue * 100);
    const classAverage = allStudentGrades.length > 0
      ? Math.round(allStudentGrades.reduce((sum, grade) => sum + grade, 0) / allStudentGrades.length * 100) / 100
      : 0;

    // Find highest and lowest performers based on overall average
    const studentsWithAverages = studentStats.filter(s => s.overallAverage !== null);
    const highestPerformer = studentsWithAverages.length > 0
      ? studentsWithAverages.reduce((max, student) => 
          (student.overallAverage || 0) > (max.overallAverage || 0) ? student : max
        )
      : null;

    const lowestPerformer = studentsWithAverages.length > 0
      ? studentsWithAverages.reduce((min, student) => 
          (student.overallAverage || 100) < (min.overallAverage || 100) ? student : min
        )
      : null;

    // Grade distribution for charts
    const gradeDistribution = {
      excellent: allStudentGrades.filter(g => g >= 90).length,
      good: allStudentGrades.filter(g => g >= 80 && g < 90).length,
      satisfactory: allStudentGrades.filter(g => g >= 70 && g < 80).length,
      needsImprovement: allStudentGrades.filter(g => g < 70).length,
    };

    const classSummary = {
      totalStudents: students.length,
      totalGrades: grades.length,
      classAverage,
      highestPerformer,
      lowestPerformer,
      gradeDistribution,
    };

    return {
      studentStats,
      classSummary,
      grades,
    };
  } catch (err) {
    console.log(err);
    throw new Error("Failed to get gradebook statistics");
  }
};

// Complaint Actions
export const createComplaint = async (
  currentState: CurrentState,
  data: ComplaintSchema
) => {
  try {
    await prisma.$transaction(async (tx) => {
      // Create the complaint
      const complaint = await tx.complaint.create({
        data: {
          title: data.title,
          description: data.description,
          category: data.category as any,
          priority: data.priority as any,
          status: data.status as any,
          senderType: data.senderType,
          studentId: data.studentId || null,
          parentId: data.parentId || null,
          teacherId: data.teacherId || null,
          branchId: data.branchId,
          classId: data.classId || null,
          subjectId: data.subjectId || null,
        },
      });

      // Create initial status history
      await tx.complaintStatusHistory.create({
        data: {
          complaintId: complaint.id,
          fromStatus: null,
          toStatus: data.status as any,
          comment: "Complaint submitted",
          changedBy: data.studentId || data.parentId || data.teacherId || "system",
          changedByRole: data.senderType,
        },
      });
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateComplaintStatus = async (
  data: ComplaintStatusUpdateSchema
) => {
  try {
    await prisma.$transaction(async (tx) => {
      // Get current complaint status
      const currentComplaint = await tx.complaint.findUnique({
        where: { id: data.complaintId },
        select: { status: true },
      });

      if (!currentComplaint) {
        throw new Error("Complaint not found");
      }

      // Update complaint status and resolved date if applicable
      const updateData: any = {
        status: data.newStatus as any,
      };

      if (data.newStatus === "RESOLVED") {
        updateData.resolvedAt = new Date();
      }

      await tx.complaint.update({
        where: { id: data.complaintId },
        data: updateData,
      });

      // Create status history entry
      await tx.complaintStatusHistory.create({
        data: {
          complaintId: data.complaintId,
          fromStatus: currentComplaint.status as any,
          toStatus: data.newStatus as any,
          comment: data.comment,
          changedBy: data.changedBy,
          changedByRole: data.changedByRole,
        },
      });
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteComplaint = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.complaint.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Complaint Statistics and Analytics
export const getComplaintAnalytics = async (
  branchId?: number,
  startDate?: Date,
  endDate?: Date
) => {
  try {
    const whereClause: any = {};
    
    if (branchId) {
      whereClause.branchId = branchId;
    }
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Get all complaints with the filter
    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: {
        student: { select: { firstName: true, lastName: true, studentId: true } },
        parent: { select: { firstName: true, lastName: true } },
        teacher: { select: { firstName: true, lastName: true } },
        branch: { select: { shortName: true } },
        class: { select: { name: true } },
        subject: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Analytics calculations
    const totalComplaints = complaints.length;

    // Category distribution
    const categoryStats = complaints.reduce((acc, complaint) => {
      acc[complaint.category] = (acc[complaint.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Status distribution
    const statusStats = complaints.reduce((acc, complaint) => {
      acc[complaint.status] = (acc[complaint.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Priority distribution
    const priorityStats = complaints.reduce((acc, complaint) => {
      acc[complaint.priority] = (acc[complaint.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sender type distribution
    const senderTypeStats = complaints.reduce((acc, complaint) => {
      acc[complaint.senderType] = (acc[complaint.senderType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Timeline data (grouped by date)
    const timelineData = complaints.reduce((acc, complaint) => {
      const date = complaint.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Resolution rate
    const resolvedComplaints = complaints.filter(c => c.status === "RESOLVED").length;
    const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

    // Average resolution time (for resolved complaints)
    const resolvedComplaintsWithTime = complaints.filter(c => c.status === "RESOLVED" && c.resolvedAt);
    const avgResolutionTime = resolvedComplaintsWithTime.length > 0 
      ? Math.round(
          resolvedComplaintsWithTime.reduce((sum, complaint) => {
            const resolutionTime = complaint.resolvedAt!.getTime() - complaint.createdAt.getTime();
            return sum + (resolutionTime / (1000 * 60 * 60 * 24)); // Convert to days
          }, 0) / resolvedComplaintsWithTime.length
        )
      : 0;

    return {
      totalComplaints,
      categoryStats,
      statusStats,
      priorityStats,
      senderTypeStats,
      timelineData,
      resolutionRate,
      avgResolutionTime,
      complaints,
    };
  } catch (err) {
    console.log(err);
    throw new Error("Failed to get complaint analytics");
  }
};

// Document Actions
export const createDocument = async (
  currentState: CurrentState,
  data: DocumentSchema
) => {
  try {
    await prisma.$transaction(async (tx) => {
      // Create the document
      const document = await tx.document.create({
        data: {
          title: data.title,
          description: data.description || null,
          documentType: data.documentType as any,
          status: data.status as any,
          fileName: data.fileName || "",
          filePath: data.filePath || "",
          fileType: data.fileType || "",
          fileSize: data.fileSize || 0,
          audienceType: data.audienceType as any,
          branchId: data.branchId || null,
          classId: data.classId || null,
          academicYearId: data.academicYearId || null,
          tags: data.tags || [],
          keywords: data.keywords || [],
          expiryDate: data.expiryDate || null,
          createdBy: data.createdBy,
        },
      });

      // Create assignments based on audience type
      if (data.audienceType === "TEACHERS" && data.teacherIds) {
        await Promise.all(
          data.teacherIds.map(teacherId =>
            tx.documentAssignment.create({
              data: {
                documentId: document.id,
                teacherId: teacherId,
              },
            })
          )
        );
      }

      if (data.audienceType === "STUDENTS") {
        if (data.assignToEntireClass && data.classId) {
          // Get all students in the class
          const students = await tx.student.findMany({
            where: { classId: data.classId, status: "ACTIVE" },
            select: { id: true },
          });

          await Promise.all(
            students.map(student =>
              tx.documentAssignment.create({
                data: {
                  documentId: document.id,
                  studentId: student.id,
                },
              })
            )
          );
        } else if (data.studentIds) {
          await Promise.all(
            data.studentIds.map(studentId =>
              tx.documentAssignment.create({
                data: {
                  documentId: document.id,
                  studentId: studentId,
                },
              })
            )
          );
        }
      }

      if (data.audienceType === "MIXED") {
        // Handle both teachers and students
        if (data.teacherIds) {
          await Promise.all(
            data.teacherIds.map(teacherId =>
              tx.documentAssignment.create({
                data: {
                  documentId: document.id,
                  teacherId: teacherId,
                },
              })
            )
          );
        }

        if (data.studentIds) {
          await Promise.all(
            data.studentIds.map(studentId =>
              tx.documentAssignment.create({
                data: {
                  documentId: document.id,
                  studentId: studentId,
                },
              })
            )
          );
        }
      }

      // Create initial version
      await tx.documentVersion.create({
        data: {
          documentId: document.id,
          versionNumber: 1,
          fileName: data.fileName || "",
          filePath: data.filePath || "",
          fileType: data.fileType || "",
          fileSize: data.fileSize || 0,
          changeLog: "Initial version",
          createdBy: data.createdBy,
        },
      });
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateDocument = async (
  currentState: CurrentState,
  data: DocumentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Update the document
      await tx.document.update({
        where: { id: data.id },
        data: {
          title: data.title,
          description: data.description || null,
          documentType: data.documentType as any,
          tags: data.tags || [],
          keywords: data.keywords || [],
          expiryDate: data.expiryDate || null,
        },
      });

      // Update assignments if targeting changed
      if (data.teacherIds || data.studentIds || data.assignToEntireClass) {
        // Remove existing assignments
        await tx.documentAssignment.deleteMany({
          where: { documentId: data.id },
        });

        // Recreate assignments (same logic as create)
        if (data.audienceType === "TEACHERS" && data.teacherIds) {
          await Promise.all(
            data.teacherIds.map(teacherId =>
              tx.documentAssignment.create({
                data: {
                  documentId: data.id!,
                  teacherId: teacherId,
                },
              })
            )
          );
        }

        if (data.audienceType === "STUDENTS") {
          if (data.assignToEntireClass && data.classId) {
            const students = await tx.student.findMany({
              where: { classId: data.classId, status: "ACTIVE" },
              select: { id: true },
            });

            await Promise.all(
              students.map(student =>
                tx.documentAssignment.create({
                  data: {
                    documentId: data.id!,
                    studentId: student.id,
                  },
                })
              )
            );
          } else if (data.studentIds) {
            await Promise.all(
              data.studentIds.map(studentId =>
                tx.documentAssignment.create({
                  data: {
                    documentId: data.id!,
                    studentId: studentId,
                  },
                })
              )
            );
          }
        }
      }
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createDocumentVersion = async (data: DocumentVersionSchema) => {
  try {
    // Get the latest version number
    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId: data.documentId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });

    const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    await prisma.$transaction(async (tx) => {
      // Update document with new file info
      await tx.document.update({
        where: { id: data.documentId },
        data: {
          fileName: data.fileName,
          filePath: data.filePath,
          fileType: data.fileType,
          fileSize: data.fileSize,
        },
      });

      // Create new version
      await tx.documentVersion.create({
        data: {
          documentId: data.documentId,
          versionNumber: newVersionNumber,
          fileName: data.fileName,
          filePath: data.filePath,
          fileType: data.fileType,
          fileSize: data.fileSize,
          changeLog: data.changeLog,
          createdBy: data.createdBy,
        },
      });
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const archiveDocument = async (data: DocumentArchiveSchema) => {
  try {
    await prisma.$transaction(async (tx) => {
      const updateData: any = {};

      if (data.action === "ARCHIVE") {
        updateData.status = "ARCHIVED";
        updateData.archivedAt = new Date();
      } else if (data.action === "RESTORE") {
        updateData.status = "ACTIVE";
        updateData.restoredAt = new Date();
      }

      if (data.action !== "DELETE") {
        await tx.document.update({
          where: { id: data.documentId },
          data: updateData,
        });
      }

      // Create archive comment
      await tx.archiveComment.create({
        data: {
          documentId: data.documentId,
          comment: data.comment,
          action: data.action,
          createdBy: data.createdBy,
        },
      });

      if (data.action === "DELETE") {
        await tx.document.delete({
          where: { id: data.documentId },
        });
      }
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteDocument = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.document.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const trackDocumentDownload = async (
  documentId: number,
  downloadedBy: string,
  userType: string,
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    await prisma.documentDownload.create({
      data: {
        documentId,
        downloadedBy,
        userType,
        ipAddress,
        userAgent,
      },
    });

    // Update assignment with first download time if not set
    if (userType === "STUDENT") {
      await prisma.documentAssignment.updateMany({
        where: {
          documentId,
          studentId: downloadedBy,
          downloadedAt: null,
        },
        data: {
          downloadedAt: new Date(),
        },
      });
    } else if (userType === "TEACHER") {
      await prisma.documentAssignment.updateMany({
        where: {
          documentId,
          teacherId: downloadedBy,
          downloadedAt: null,
        },
        data: {
          downloadedAt: new Date(),
        },
      });
    }

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Document Analytics and Statistics
export const getDocumentAnalytics = async (
  branchId?: number,
  startDate?: Date,
  endDate?: Date
) => {
  try {
    const whereClause: any = {
      status: { not: "ARCHIVED" },
    };
    
    if (branchId) {
      whereClause.branchId = branchId;
    }
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Get all documents with the filter
    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        assignments: {
          include: {
            student: { select: { firstName: true, lastName: true, studentId: true } },
            teacher: { select: { firstName: true, lastName: true, teacherId: true } },
          },
        },
        downloads: {
          select: {
            downloadedBy: true,
            userType: true,
            downloadedAt: true,
          },
        },
        versions: {
          select: {
            versionNumber: true,
            createdAt: true,
          },
        },
        branch: { select: { shortName: true } },
        class: { select: { name: true } },
        academicYear: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Analytics calculations
    const totalDocuments = documents.length;

    // Document type distribution
    const typeStats = documents.reduce((acc, doc) => {
      acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Audience type distribution
    const audienceStats = documents.reduce((acc, doc) => {
      acc[doc.audienceType] = (acc[doc.audienceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Status distribution
    const statusStats = documents.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Downloads over time
    const downloadsData = documents.reduce((acc, doc) => {
      doc.downloads.forEach(download => {
        const date = download.downloadedAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Most active users (by downloads)
    const userDownloads = documents.reduce((acc, doc) => {
      doc.downloads.forEach(download => {
        const key = `${download.downloadedBy}_${download.userType}`;
        acc[key] = (acc[key] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Upload timeline
    const uploadsData = documents.reduce((acc, doc) => {
      const date = doc.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Total file size
    const totalFileSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);

    // Average downloads per document
    const totalDownloads = documents.reduce((sum, doc) => sum + doc.downloads.length, 0);
    const avgDownloadsPerDoc = totalDocuments > 0 ? Math.round((totalDownloads / totalDocuments) * 100) / 100 : 0;

    return {
      totalDocuments,
      typeStats,
      audienceStats,
      statusStats,
      downloadsData,
      uploadsData,
      userDownloads,
      totalFileSize,
      totalDownloads,
      avgDownloadsPerDoc,
      documents,
    };
  } catch (err) {
    console.log(err);
    throw new Error("Failed to get document analytics");
  }
};

// Homework Actions
export const createHomework = async (
  currentState: CurrentState,
  data: HomeworkSchema
) => {
  try {
    await prisma.$transaction(async (tx) => {
      // Create the homework
      const homework = await tx.homework.create({
        data: {
          title: data.title,
          description: data.description || null,
          assignedDate: data.assignedDate,
          dueDate: data.dueDate,
          status: data.status as any,
          branchId: data.branchId,
          academicYearId: data.academicYearId,
          classId: data.classId,
          subjectId: data.subjectId,
          teacherId: data.teacherId,
        },
      });

      // Get all students in the class and create submissions
      const students = await tx.student.findMany({
        where: { 
          classId: data.classId,
          status: "ACTIVE"
        },
        select: { id: true },
      });

      // Create homework submissions for all students
      await Promise.all(
        students.map(student =>
          tx.homeworkSubmission.create({
            data: {
              homeworkId: homework.id,
              studentId: student.id,
              status: "NOT_SUBMITTED",
            },
          })
        )
      );
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateHomework = async (
  currentState: CurrentState,
  data: HomeworkSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }

  try {
    await prisma.homework.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description || null,
        assignedDate: data.assignedDate,
        dueDate: data.dueDate,
        status: data.status as any,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateHomeworkSubmission = async (data: HomeworkSubmissionSchema) => {
  try {
    const updateData: any = {
      status: data.status as any,
    };

    if (data.submissionDate) {
      updateData.submissionDate = data.submissionDate;
    }

    if (data.grade !== undefined) {
      updateData.grade = data.grade;
      updateData.status = "GRADED";
    }

    if (data.feedback) {
      updateData.feedback = data.feedback;
    }

    if (data.attachments && data.attachments.length > 0) {
      updateData.attachments = data.attachments;
    }

    await prisma.homeworkSubmission.update({
      where: {
        homeworkId_studentId: {
          homeworkId: data.homeworkId,
          studentId: data.studentId,
        },
      },
      data: updateData,
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const archiveHomework = async (data: HomeworkArchiveSchema) => {
  try {
    await prisma.$transaction(async (tx) => {
      const updateData: any = {};

      if (data.action === "ARCHIVE") {
        updateData.status = "ARCHIVED";
        updateData.archivedAt = new Date();
      } else if (data.action === "RESTORE") {
        updateData.status = "ACTIVE";
        updateData.restoredAt = new Date();
      }

      if (data.action !== "DELETE") {
        await tx.homework.update({
          where: { id: data.homeworkId },
          data: updateData,
        });
      }

      // Create archive comment
      await tx.archiveComment.create({
        data: {
          homeworkId: data.homeworkId,
          comment: data.comment,
          action: data.action,
          createdBy: data.createdBy,
        },
      });

      if (data.action === "DELETE") {
        await tx.homework.delete({
          where: { id: data.homeworkId },
        });
      }
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteHomework = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.homework.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Homework Analytics and Statistics
export const getHomeworkAnalytics = async (
  branchId: number,
  academicYearId: number,
  classId?: number,
  subjectId?: number,
  teacherId?: string,
  startDate?: Date,
  endDate?: Date
) => {
  try {
    const whereClause: any = {
      branchId,
      academicYearId,
      status: { not: "ARCHIVED" },
    };
    
    if (classId) {
      whereClause.classId = classId;
    }
    if (subjectId) {
      whereClause.subjectId = subjectId;
    }
    if (teacherId) {
      whereClause.teacherId = teacherId;
    }
    
    if (startDate && endDate) {
      whereClause.assignedDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Get all homework with submissions
    const homework = await prisma.homework.findMany({
      where: whereClause,
      include: {
        submissions: {
          include: {
            student: { 
              select: { 
                id: true,
                firstName: true, 
                lastName: true, 
                studentId: true 
              } 
            },
          },
        },
        teacher: { 
          select: { 
            firstName: true, 
            lastName: true, 
            teacherId: true 
          } 
        },
        subject: { select: { name: true } },
        class: { select: { name: true } },
        branch: { select: { shortName: true } },
        academicYear: { select: { name: true } },
      },
      orderBy: [
        { assignedDate: "desc" },
      ],
    });

    // Calculate analytics
    const totalHomework = homework.length;
    const totalSubmissions = homework.reduce((sum, hw) => sum + hw.submissions.length, 0);

    // Submission statistics
    const submissionStats = homework.reduce((acc, hw) => {
      hw.submissions.forEach(sub => {
        acc[sub.status] = (acc[sub.status] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Homework status distribution
    const homeworkStatusStats = homework.reduce((acc, hw) => {
      acc[hw.status] = (acc[hw.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Subject distribution
    const subjectStats = homework.reduce((acc, hw) => {
      const subjectName = hw.subject.name;
      acc[subjectName] = (acc[subjectName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Teacher distribution
    const teacherStats = homework.reduce((acc, hw) => {
      const teacherName = `${hw.teacher.firstName} ${hw.teacher.lastName}`;
      acc[teacherName] = (acc[teacherName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Submission trends over time
    const submissionTrends = homework.reduce((acc, hw) => {
      const date = hw.assignedDate.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Grade statistics
    const grades = homework.flatMap(hw => 
      hw.submissions
        .filter(sub => sub.grade !== null)
        .map(sub => sub.grade)
    ).filter(grade => grade !== null) as number[];

    const gradeStats = {
      averageGrade: grades.length > 0 ? Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length * 100) / 100 : 0,
      highestGrade: grades.length > 0 ? Math.max(...grades) : 0,
      lowestGrade: grades.length > 0 ? Math.min(...grades) : 0,
      totalGraded: grades.length,
    };

    // Submission rates
    const submissionRate = totalSubmissions > 0 
      ? Math.round(((submissionStats.SUBMITTED || 0) + (submissionStats.LATE || 0) + (submissionStats.GRADED || 0)) / totalSubmissions * 100)
      : 0;

    const lateSubmissionRate = totalSubmissions > 0 
      ? Math.round((submissionStats.LATE || 0) / totalSubmissions * 100)
      : 0;

    // Performance insights by student
    const studentPerformance = homework.reduce((acc, hw) => {
      hw.submissions.forEach(sub => {
        const studentKey = sub.student.studentId;
        if (!acc[studentKey]) {
          acc[studentKey] = {
            student: sub.student,
            totalAssigned: 0,
            submitted: 0,
            late: 0,
            notSubmitted: 0,
            graded: 0,
            totalGrade: 0,
            averageGrade: 0,
          };
        }
        
        acc[studentKey].totalAssigned++;
        
        if (sub.status === "SUBMITTED") acc[studentKey].submitted++;
        else if (sub.status === "LATE") acc[studentKey].late++;
        else if (sub.status === "NOT_SUBMITTED") acc[studentKey].notSubmitted++;
        else if (sub.status === "GRADED") {
          acc[studentKey].graded++;
          if (sub.grade) acc[studentKey].totalGrade += sub.grade;
        }
      });
      return acc;
    }, {} as Record<string, any>);

    // Calculate average grades for students
    Object.values(studentPerformance).forEach((student: any) => {
      if (student.graded > 0) {
        student.averageGrade = Math.round(student.totalGrade / student.graded * 100) / 100;
      }
    });

    return {
      totalHomework,
      totalSubmissions,
      submissionStats,
      homeworkStatusStats,
      subjectStats,
      teacherStats,
      submissionTrends,
      gradeStats,
      submissionRate,
      lateSubmissionRate,
      studentPerformance: Object.values(studentPerformance),
      homework,
    };
  } catch (err) {
    console.log(err);
    throw new Error("Failed to get homework analytics");
  }
};

// Exam Actions
export const checkExamConflicts = async (data: ExamConflictSchema) => {
  try {
    // Convert time strings to DateTime objects for Prisma comparison
    // data.startTime and data.endTime are in HH:MM:SS format
    const convertTimeStringToDateTime = (timeString: string) => {
      // For Prisma @db.Time fields, we need to create a DateTime object
      // that represents just the time. Using local time to avoid timezone conversion issues.
      const date = new Date(`1970-01-01T${timeString}`);
      return date;
    };
    
    const startTime = convertTimeStringToDateTime(data.startTime);
    const endTime = convertTimeStringToDateTime(data.endTime);
    
    const conflicts = await prisma.exam.findMany({
      where: {
        date: data.date,
        status: { not: "CANCELLED" },
        OR: [
          // Same class at overlapping times
          {
            classId: data.classId,
            OR: [
              {
                AND: [
                  { startTime: { lte: startTime } },
                  { endTime: { gt: startTime } }
                ]
              },
              {
                AND: [
                  { startTime: { lt: endTime } },
                  { endTime: { gte: endTime } }
                ]
              },
              {
                AND: [
                  { startTime: { gte: startTime } },
                  { endTime: { lte: endTime } }
                ]
              }
            ]
          },
          // Same room at overlapping times
          {
            roomNumber: data.roomNumber,
            OR: [
              {
                AND: [
                  { startTime: { lte: startTime } },
                  { endTime: { gt: startTime } }
                ]
              },
              {
                AND: [
                  { startTime: { lt: endTime } },
                  { endTime: { gte: endTime } }
                ]
              },
              {
                AND: [
                  { startTime: { gte: startTime } },
                  { endTime: { lte: endTime } }
                ]
              }
            ]
          }
        ],
        ...(data.excludeExamId ? { id: { not: data.excludeExamId } } : {})
      },
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true } },
        teacher: { select: { firstName: true, lastName: true } },
      }
    });

    return {
      hasConflicts: conflicts.length > 0,
      conflicts: conflicts.map(exam => ({
        id: exam.id,
        name: exam.name,
        className: exam.class.name,
        subjectName: exam.subject?.name || 'Unknown Subject',
        teacherName: exam.teacher ? `${exam.teacher.firstName} ${exam.teacher.lastName}` : 'Unknown Teacher',
        startTime: exam.startTime,
        endTime: exam.endTime,
        roomNumber: exam.roomNumber,
        conflictType: exam.classId === data.classId ? 'class' : 'room'
      }))
    };
  } catch (err) {
    console.log(err);
    return { hasConflicts: false, conflicts: [] };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  try {
    // Convert time strings to DateTime objects for Prisma
    const convertTimeStringToDateTime = (timeString: string) => {
      // For Prisma @db.Time fields, we need to create a DateTime object
      // that represents just the time. Using local time to avoid timezone conversion issues.
      const date = new Date(`1970-01-01T${timeString}`);
      return date;
    };

    // Check for conflicts before creating
    const conflictCheck = await checkExamConflicts({
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      classId: data.classId,
      roomNumber: data.roomNumber || '',
    });

    if (conflictCheck.hasConflicts) {
      return { 
        success: false, 
        error: true, 
        conflicts: conflictCheck.conflicts 
      };
    }

    // Create the exam first (outside transaction to avoid timeout)
    const exam = await prisma.exam.create({
        data: {
          name: data.name,
          date: data.date,
          examDay: data.examDay,
          startTime: convertTimeStringToDateTime(data.startTime),
          endTime: convertTimeStringToDateTime(data.endTime),
        roomNumber: data.roomNumber || '',
          fullMarks: data.fullMarks,
          passingMarks: data.passingMarks,
          status: data.status as any,
          branchId: data.branchId,
          academicYearId: data.academicYearId,
          classId: data.classId,
          subjectId: data.subjectId || undefined,
          teacherId: data.teacherId || undefined,
        },
      });

    // Create exam results asynchronously to avoid blocking the main operation
    // This runs in the background and won't block the exam creation
    setImmediate(async () => {
      try {
        const students = await prisma.student.findMany({
        where: { 
          classId: data.classId,
          status: "ACTIVE"
        },
        select: { id: true },
      });

        console.log(`Creating exam results for ${students.length} students...`);

        // Create exam results in batches of 100 to avoid timeout
        const batchSize = 100;
        for (let i = 0; i < students.length; i += batchSize) {
          const batch = students.slice(i, i + batchSize);
          
          await prisma.examResult.createMany({
            data: batch.map(student => ({
              examId: exam.id,
              studentId: student.id,
              marksObtained: 0,
              status: "FAIL", // Default until marks are entered
              branchId: data.branchId,
            })),
          });
          
          console.log(`Created exam results for batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(students.length / batchSize)}`);
        }
        
        console.log(`Successfully created exam results for all ${students.length} students`);
      } catch (error) {
        console.error("Error creating exam results:", error);
        // Exam results can be created later manually if needed
      }
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }

  try {
    // Convert time strings to DateTime objects for Prisma
    const convertTimeStringToDateTime = (timeString: string) => {
      // For Prisma @db.Time fields, we need to create a DateTime object
      // that represents just the time. Using local time to avoid timezone conversion issues.
      const date = new Date(`1970-01-01T${timeString}`);
      return date;
    };

    // Check for conflicts before updating
    const conflictCheck = await checkExamConflicts({
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      classId: data.classId,
      roomNumber: data.roomNumber || '',
      excludeExamId: data.id,
    });

    if (conflictCheck.hasConflicts) {
      return { 
        success: false, 
        error: true, 
        conflicts: conflictCheck.conflicts 
      };
    }

    await prisma.exam.update({
      where: { id: data.id },
      data: {
        name: data.name,
        date: data.date,
        examDay: data.examDay,
        startTime: convertTimeStringToDateTime(data.startTime),
        endTime: convertTimeStringToDateTime(data.endTime),
        roomNumber: data.roomNumber,
        fullMarks: data.fullMarks,
        passingMarks: data.passingMarks,
        status: data.status as any,
        branchId: data.branchId,
        academicYearId: data.academicYearId,
        classId: data.classId,
        subjectId: data.subjectId || undefined,
        teacherId: data.teacherId || undefined,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExamResult = async (data: ExamResultSchema) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: data.examId },
      select: { passingMarks: true }
    });

    if (!exam) {
      return { success: false, error: true };
    }

    const status = data.marksObtained >= exam.passingMarks ? "PASS" : "FAIL";

    await prisma.examResult.update({
      where: {
        examId_studentId: {
          examId: data.examId,
          studentId: data.studentId,
        },
      },
      data: {
        marksObtained: data.marksObtained,
        status: status,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const archiveExam = async (data: ExamArchiveSchema) => {
  try {
    await prisma.$transaction(async (tx) => {
      const updateData: any = {};

      if (data.action === "ARCHIVE") {
        updateData.status = "CANCELLED";
        updateData.archivedAt = new Date();
      } else if (data.action === "RESTORE") {
        updateData.status = "SCHEDULED";
        updateData.restoredAt = new Date();
      }

      if (data.action !== "DELETE") {
        await tx.exam.update({
          where: { id: data.examId },
          data: updateData,
        });
      }

      // Create archive comment
      await tx.archiveComment.create({
        data: {
          examId: data.examId,
          comment: data.comment,
          action: data.action,
          createdBy: data.createdBy,
        },
      });

      if (data.action === "DELETE") {
        await tx.exam.delete({
          where: { id: data.examId },
        });
      }
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.exam.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Exam Analytics and Statistics
export const getExamAnalytics = async (
  branchId?: number,
  academicYearId?: number,
  classId?: number,
  subjectId?: number,
  teacherId?: string,
  startDate?: Date,
  endDate?: Date
) => {
  try {
    const whereClause: any = {
      status: { not: "CANCELLED" },
    };
    
    if (branchId) {
      whereClause.branchId = branchId;
    }
    if (academicYearId) {
      whereClause.academicYearId = academicYearId;
    }
    if (classId) {
      whereClause.classId = classId;
    }
    if (subjectId) {
      whereClause.subjectId = subjectId;
    }
    if (teacherId) {
      whereClause.teacherId = teacherId;
    }
    
    if (startDate && endDate) {
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Get all exams with results
    const exams = await prisma.exam.findMany({
      where: whereClause,
      include: {
        examResults: {
          include: {
            student: { 
              select: { 
                id: true,
                firstName: true, 
                lastName: true, 
                studentId: true 
              } 
            },
          },
        },
        teacher: { 
          select: { 
            firstName: true, 
            lastName: true, 
            teacherId: true 
          } 
        },
        subject: { select: { name: true } },
        class: { select: { name: true } },
        branch: { select: { shortName: true } },
        academicYear: { select: { name: true } },
      },
      orderBy: [
        { date: "desc" },
      ],
    });

    // Calculate analytics
    const totalExams = exams.length;
    const completedExams = exams.filter(exam => exam.status === "COMPLETED").length;
    const scheduledExams = exams.filter(exam => exam.status === "SCHEDULED").length;

    // Status distribution
    const statusStats = exams.reduce((acc, exam) => {
      acc[exam.status] = (acc[exam.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Subject distribution
    const subjectStats = exams.reduce((acc, exam) => {
        const subjectName = exam.subject?.name || 'Unknown Subject';
      acc[subjectName] = (acc[subjectName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Teacher distribution
    const teacherStats = exams.reduce((acc, exam) => {
        const teacherName = exam.teacher ? `${exam.teacher.firstName} ${exam.teacher.lastName}` : 'Unknown Teacher';
      acc[teacherName] = (acc[teacherName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Room utilization
    const roomStats = exams.reduce((acc, exam) => {
      acc[exam.roomNumber] = (acc[exam.roomNumber] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Exam trends over time
    const examTrends = exams.reduce((acc, exam) => {
      const date = exam.date.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Performance statistics (for completed exams with results)
    const completedExamsWithResults = exams.filter(exam => 
      exam.status === "COMPLETED" && exam.examResults.length > 0
    );

    const allResults = completedExamsWithResults.flatMap(exam => exam.examResults);
    const passResults = allResults.filter(result => result.status === "PASS");
    const failResults = allResults.filter(result => result.status === "FAIL");

    const averageMarks = allResults.length > 0 
      ? Math.round(allResults.reduce((sum, result) => sum + result.marksObtained, 0) / allResults.length * 100) / 100
      : 0;

    const passRate = allResults.length > 0 
      ? Math.round((passResults.length / allResults.length) * 100)
      : 0;

    // Grade distribution
    const gradeDistribution = allResults.reduce((acc, result) => {
      const percentage = (result.marksObtained / 100) * 100; // Assuming full marks is 100 for calculation
      if (percentage >= 90) acc.A = (acc.A || 0) + 1;
      else if (percentage >= 80) acc.B = (acc.B || 0) + 1;
      else if (percentage >= 70) acc.C = (acc.C || 0) + 1;
      else if (percentage >= 60) acc.D = (acc.D || 0) + 1;
      else acc.F = (acc.F || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Upcoming exams (scheduled in next 7 days)
    const upcomingExams = exams.filter(exam => {
      if (exam.status !== "SCHEDULED") return false;
      const examDate = new Date(exam.date);
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return examDate >= today && examDate <= nextWeek;
    }).length;

    return {
      totalExams,
      completedExams,
      scheduledExams,
      upcomingExams,
      statusStats,
      subjectStats,
      teacherStats,
      roomStats,
      examTrends,
      averageMarks,
      passRate,
      gradeDistribution,
      totalStudentResults: allResults.length,
      passCount: passResults.length,
      failCount: failResults.length,
      exams,
    };
  } catch (err) {
    console.log(err);
    throw new Error("Failed to get exam analytics");
  }
};

// Branch Actions
export const createBranch = async (
  currentState: CurrentState,
  data: BranchSchema
) => {
  try {
    // Check if STIR number already exists
    const existingBranchByStir = await prisma.branch.findFirst({
      where: { stir: data.stir }
    });

    if (existingBranchByStir) {
      return { 
        success: false, 
        error: true, 
        message: "This STIR number is already registered. Please use a different STIR number." 
      };
    }

    // Check if shortName already exists
    const existingBranchByShortName = await prisma.branch.findFirst({
      where: { shortName: data.shortName }
    });

    if (existingBranchByShortName) {
      return { 
        success: false, 
        error: true, 
        message: `A branch with the short name "${data.shortName}" already exists` 
      };
    }

    const branchData = {
      shortName: data.shortName,
      legalName: data.legalName,
      stir: data.stir,
      phone: data.phone,
      region: data.region,
      address: data.address,
      status: data.status,
      website: data.website || null,
      email: data.email || null,
      district: data.district,
      longitude: data.longitude,
      latitude: data.latitude,
    };

    await prisma.branch.create({
      data: branchData,
    });

    return { success: true, error: false, message: "Branch created successfully" };
  } catch (err) {
    console.log(err);
    if (err instanceof Error && err.message.includes('Unique constraint')) {
      return { 
        success: false, 
        error: true, 
        message: "A branch with this name or STIR number already exists" 
      };
    }
    return { success: false, error: true, message: "Failed to create branch" };
  }
};

export const updateBranch = async (
  currentState: CurrentState,
  data: BranchSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }

  try {
    const branchData = {
      shortName: data.shortName,
      legalName: data.legalName,
      stir: data.stir,
      phone: data.phone,
      region: data.region,
      address: data.address,
      status: data.status,
      website: data.website || null,
      email: data.email || null,
      district: data.district,
      longitude: data.longitude,
      latitude: data.latitude,
    };

    await prisma.branch.update({
      where: { id: data.id },
      data: branchData,
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const archiveBranch = async (
  currentState: CurrentState,
  data: FormData
) => {
  const branchId = data.get("branchId") as string;
  const comment = data.get("comment") as string;
  const currentUserId = data.get("currentUserId") as string;

  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Update branch status to inactive and set archived date
      await tx.branch.update({
        where: { id: parseInt(branchId) },
        data: {
          status: "INACTIVE",
          archivedAt: new Date(),
        },
      });

      // Add archive comment
      await tx.archiveComment.create({
        data: {
          branchId: parseInt(branchId),
          comment: comment,
          action: "ARCHIVE",
          createdBy: currentUserId,
        },
      });
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const restoreBranch = async (
  currentState: CurrentState,
  data: FormData
) => {
  const branchId = data.get("branchId") as string;
  const comment = data.get("comment") as string;
  const currentUserId = data.get("currentUserId") as string;

  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Update branch status to active and set restored date
      await tx.branch.update({
        where: { id: parseInt(branchId) },
        data: {
          status: "ACTIVE",
          restoredAt: new Date(),
        },
      });

      // Add restore comment
      await tx.archiveComment.create({
        data: {
          branchId: parseInt(branchId),
          comment: comment,
          action: "RESTORE",
          createdBy: currentUserId,
        },
      });
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteBranch = async (
  currentState: CurrentState,
  data: FormData
) => {
  const branchId = data.get("branchId") as string;
  const comment = data.get("comment") as string;
  const currentUserId = data.get("currentUserId") as string;

  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    // Delete in transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // First get the branch to check if it has users
      const branch = await tx.branch.findUnique({
        where: { id: parseInt(branchId) },
      });

      if (!branch) {
        return { success: false, error: true };
      }

      // Check if branch has active users by querying users table
      const userCount = await tx.user.count({
        where: { branchId: parseInt(branchId) }
      });
      
      if (userCount > 0) {
        throw new Error("Cannot delete branch with associated users");
      }

      // Add delete comment before deletion
      await tx.archiveComment.create({
        data: {
          branchId: parseInt(branchId),
          comment: comment,
          action: "DELETE",
          createdBy: currentUserId,
        },
      });

      // Director functionality removed - not part of current schema

      // Then delete the branch
      await tx.branch.delete({
        where: { id: parseInt(branchId) },
      });
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// User Actions
export const createUser = async (
  currentState: CurrentState,
  data: UserSchema
) => {
  try {
    // Check if userId is already taken by any user type
    const [existingUser, existingTeacher, existingParent, existingStudent] = await Promise.all([
      prisma.user.findFirst({ where: { userId: data.userId } as any }),
      prisma.teacher.findFirst({ where: { teacherId: data.userId } as any }),
      prisma.parent.findFirst({ where: { parentId: data.userId } as any }),
      prisma.student.findFirst({ where: { studentId: data.userId } as any }),
    ]);

    if (existingUser || existingTeacher || existingParent || existingStudent) {
      return { 
        success: false, 
        error: true, 
        message: "This ID is already taken. Please use a different ID." 
      };
    }

    // Hash the password
    const hashedPassword = await AuthService.hashPassword(data.password);

    // Generate a unique ID for the user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare user data
    const userData = {
      id: userId,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth || new Date(),
      phone: data.phone,
      userId: data.userId,
      email: data.email || null,
      status: data.status,
      address: data.address || "",
      position: data.position,
      branchId: data.branchId || null,
      password: hashedPassword,
    };

    // Create user with related data in transaction
    await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: userData,
      });

      // Create passport if provided
      if (data.passport && data.passport.country && data.passport.documentNumber) {
        await tx.userPassport.create({
          data: {
            userId: user.id,
            country: data.passport.country,
            documentNumber: data.passport.documentNumber,
            issueDate: data.passport.issueDate,
            expiryDate: data.passport.expiryDate,
          },
        });
      }

      // Create education if provided
      if (data.education && data.education.institutionName && data.education.specialization) {
        await tx.userEducation.create({
          data: {
            userId: user.id,
            institutionName: data.education.institutionName,
            specialization: data.education.specialization,
            documentSeries: data.education.documentSeries,
            graduationDate: data.education.graduationDate,
            languageSkills: data.education.languageSkills || null,
          },
        });
      }

      // Director functionality removed - not part of current schema

      // Create attachments if provided
      if (data.attachments) {
        const attachmentsToCreate = [];
        
        if (data.attachments.passport) {
          attachmentsToCreate.push({
            userId: user.id,
            fileType: "passport",
            fileName: data.attachments.passport.name,
            originalName: data.attachments.passport.name,
            fileUrl: data.attachments.passport.url,
            fileSize: data.attachments.passport.size,
            mimeType: "application/pdf",
          });
        }
        
        if (data.attachments.resume) {
          attachmentsToCreate.push({
            userId: user.id,
            fileType: "resume",
            fileName: data.attachments.resume.name,
            originalName: data.attachments.resume.name,
            fileUrl: data.attachments.resume.url,
            fileSize: data.attachments.resume.size,
            mimeType: "application/pdf",
          });
        }
        
        if (data.attachments.photo) {
          attachmentsToCreate.push({
            userId: user.id,
            fileType: "photo",
            fileName: data.attachments.photo.name,
            originalName: data.attachments.photo.name,
            fileUrl: data.attachments.photo.url,
            fileSize: data.attachments.photo.size,
            mimeType: "image/jpeg",
          });
        }

        if (attachmentsToCreate.length > 0) {
          await tx.userAttachment.createMany({
            data: attachmentsToCreate,
          });
        }
      }
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateUser = async (
  currentState: CurrentState,
  data: UserUpdateSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }

  try {
    // Prepare user data
    const userData = {
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      phone: data.phone,
      email: data.email || null,
      status: data.status,
      address: data.address,
      position: data.position,
      branchId: data.branchId || null,
      ...(data.password && data.password !== "" && { 
        password: await AuthService.hashPassword(data.password) 
      }),
    };

    // Update user with related data in transaction
    await prisma.$transaction(async (tx) => {
      // Update the user
      await tx.user.update({
        where: { id: data.id },
        data: userData,
      });

      // Update or create passport
      if (data.passport && data.passport.country && data.passport.documentNumber && data.id) {
        await tx.userPassport.upsert({
          where: { userId: data.id },
          update: {
            country: data.passport.country,
            documentNumber: data.passport.documentNumber,
            issueDate: data.passport.issueDate,
            expiryDate: data.passport.expiryDate,
          },
          create: {
            userId: data.id,
            country: data.passport.country,
            documentNumber: data.passport.documentNumber,
            issueDate: data.passport.issueDate,
            expiryDate: data.passport.expiryDate,
          },
        });
      }

      // Update or create education
      if (data.education && data.education.institutionName && data.education.specialization && data.id) {
        await tx.userEducation.upsert({
          where: { userId: data.id },
          update: {
            institutionName: data.education.institutionName,
            specialization: data.education.specialization,
            documentSeries: data.education.documentSeries,
            graduationDate: data.education.graduationDate,
            languageSkills: data.education.languageSkills || null,
          },
          create: {
            userId: data.id,
            institutionName: data.education.institutionName,
            specialization: data.education.specialization,
            documentSeries: data.education.documentSeries,
            graduationDate: data.education.graduationDate,
            languageSkills: data.education.languageSkills || null,
          },
        });
      }

      // Director functionality removed - not part of current schema

      // Handle attachments for updates
      if (data.attachments && data.id) {
        // Delete existing attachments first (to avoid duplicates)
        await tx.userAttachment.deleteMany({
          where: { userId: data.id },
        });

        const attachmentsToCreate = [];
        
        if (data.attachments.passport) {
          attachmentsToCreate.push({
            userId: data.id,
            fileType: "passport",
            fileName: data.attachments.passport.name,
            originalName: data.attachments.passport.name,
            fileUrl: data.attachments.passport.url,
            fileSize: data.attachments.passport.size,
            mimeType: "application/pdf",
          });
        }
        
        if (data.attachments.resume) {
          attachmentsToCreate.push({
            userId: data.id,
            fileType: "resume",
            fileName: data.attachments.resume.name,
            originalName: data.attachments.resume.name,
            fileUrl: data.attachments.resume.url,
            fileSize: data.attachments.resume.size,
            mimeType: "application/pdf",
          });
        }
        
        if (data.attachments.photo) {
          attachmentsToCreate.push({
            userId: data.id,
            fileType: "photo",
            fileName: data.attachments.photo.name,
            originalName: data.attachments.photo.name,
            fileUrl: data.attachments.photo.url,
            fileSize: data.attachments.photo.size,
            mimeType: "image/jpeg",
          });
        }

        if (attachmentsToCreate.length > 0) {
          await tx.userAttachment.createMany({
            data: attachmentsToCreate,
          });
        }
      }
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Teacher Actions
export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    // Check if phone number is already taken by any teacher
    const existingTeacherByPhone = await prisma.teacher.findFirst({ 
      where: { phone: data.phone } 
    });

    if (existingTeacherByPhone) {
      return { 
        success: false, 
        error: true, 
        message: "A teacher with this phone number already exists. Please use a different phone number." 
      };
    }

    // Hash the password
    const hashedPassword = await AuthService.hashPassword(data.password);

    // Generate a unique teacher ID in format T + 5 digits
    const teacherId = await generateUniqueTeacherId();

    // Prepare teacher data
    const teacherData = {
      id: teacherId,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth || new Date('1990-01-01'), // Provide default date if none provided
      phone: data.phone,
      teacherId: teacherId, // Use the generated teacherId
      password: hashedPassword,
      email: data.email || null,
      address: data.address || "",
      status: data.status,
    };

    // Create teacher with related data in transaction
    await prisma.$transaction(async (tx) => {
      // Create the teacher
      const teacher = await tx.teacher.create({
        data: teacherData,
      });

      // Create passport only if all required fields are provided
      if (data.passport && data.passport.country && data.passport.documentNumber && data.passport.issueDate && data.passport.expiryDate) {
        await tx.teacherPassport.create({
          data: {
            teacherId: teacher.id,
            country: data.passport.country,
            documentNumber: data.passport.documentNumber,
            issueDate: data.passport.issueDate,
            expiryDate: data.passport.expiryDate,
          },
        });
      }

      // Create education only if all required fields are provided
      if (data.education && data.education.institutionName && data.education.specialization && data.education.documentSeries && data.education.graduationDate) {
        await tx.teacherEducation.create({
          data: {
            teacherId: teacher.id,
            institutionName: data.education.institutionName,
            specialization: data.education.specialization,
            documentSeries: data.education.documentSeries,
            graduationDate: data.education.graduationDate,
            languageSkills: data.education.languageSkills || null,
          },
        });
      }


      // Create attachments if provided
      if (data.attachments) {
        const attachmentsToCreate = [];
        
        if (data.attachments.passport) {
          attachmentsToCreate.push({
            teacherId: teacher.id,
            fileType: "passport",
            fileName: data.attachments.passport.name,
            originalName: data.attachments.passport.name,
            fileUrl: data.attachments.passport.url,
            filePath: data.attachments.passport.filePath,
            fileSize: data.attachments.passport.size,
          });
        }
        
        if (data.attachments.resume) {
          attachmentsToCreate.push({
            teacherId: teacher.id,
            fileType: "resume",
            fileName: data.attachments.resume.name,
            originalName: data.attachments.resume.name,
            fileUrl: data.attachments.resume.url,
            filePath: data.attachments.resume.filePath,
            fileSize: data.attachments.resume.size,
          });
        }
        
        if (data.attachments.photo) {
          attachmentsToCreate.push({
            teacherId: teacher.id,
            fileType: "photo",
            fileName: data.attachments.photo.name,
            originalName: data.attachments.photo.name,
            fileUrl: data.attachments.photo.url,
            filePath: data.attachments.photo.filePath,
            fileSize: data.attachments.photo.size,
          });
        }

        if (attachmentsToCreate.length > 0) {
          await tx.teacherAttachment.createMany({
            data: attachmentsToCreate,
          });
        }
      }
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Teacher Assignment Actions
export const createTeacherAssignment = async (
  currentState: CurrentState,
  data: TeacherAssignmentSchema
) => {
  try {
    console.log("🚀 [Action Start] createTeacherAssignment", { data });

    // Validate required fields
    if (!data.teacherId || !data.classId || !data.academicYearId || !data.branchId) {
      const message = "Teacher, branch, class and academic year are required";
      console.error("❌ [Validation Error]", message);
      return { success: false, error: true, message };
    }

    // For subject teachers, subject is required
    if (data.assignAsTeacher && !data.assignSupervisor && !data.subjectId) {
      const message = "Subject is required for subject teachers";
      console.error("❌ [Validation Error]", message);
      return { success: false, error: true, message };
    }

    // Determine role
    const role = data.assignSupervisor ? "SUPERVISOR" : "TEACHER";
    console.log("ℹ️ [Role Determined]", { role });

    // Prepare data for Prisma
    const assignmentData = {
      teacherId: data.teacherId,
      classId: parseInt(data.classId.toString()),
      academicYearId: parseInt(data.academicYearId.toString()),
      branchId: parseInt(data.branchId.toString()),
      subjectId: data.subjectId ? parseInt(data.subjectId.toString()) : null,
      role: role as any,
      status: "ACTIVE",
      assignedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    console.log("ℹ️ [Prisma Data Ready]", { assignmentData });

    // Check if assignment already exists
    const whereClause: any = {
      teacherId: assignmentData.teacherId,
      classId: assignmentData.classId,
      academicYearId: assignmentData.academicYearId,
    };
    if (assignmentData.subjectId) {
      whereClause.subjectId = assignmentData.subjectId;
    }
    console.log("ℹ️ [Checking Existing Assignment]", { whereClause });

    const existingAssignment = await prisma.teacherAssignment.findFirst({
      where: whereClause,
    });

    if (existingAssignment) {
      const message = "This teacher assignment already exists";
      console.error("❌ [Duplicate Error]", message, { existingAssignment });
      return { success: false, error: true, message };
    }
    console.log("✅ [No Duplicate Found]");

    // For supervisors, check for existing supervision roles
    if (data.assignSupervisor) {
      console.log("ℹ️ [Checking Existing Supervisor Role]");
      
      // Check if teacher is already a supervisor for another class
      const existingTeacherSupervisor = await prisma.teacherAssignment.findFirst({
        where: {
          teacherId: assignmentData.teacherId,
          academicYearId: assignmentData.academicYearId,
          role: "SUPERVISOR",
          status: "ACTIVE",
        },
      });

      if (existingTeacherSupervisor) {
        const message = "This teacher already supervises a class in the selected academic year. One teacher can only supervise one class per academic year.";
        console.error("❌ [Supervisor Exists Error]", message, { existingTeacherSupervisor });
        return { success: false, error: true, message };
      }
      console.log("✅ [No Existing Teacher Supervisor Role Found]");

      // Check if the class already has a supervisor
      const existingClassSupervisor = await prisma.teacherAssignment.findFirst({
        where: {
          classId: assignmentData.classId,
          academicYearId: assignmentData.academicYearId,
          role: "SUPERVISOR",
          status: "ACTIVE",
        },
      });

      if (existingClassSupervisor) {
        const message = "This class already has a supervisor assigned. Only one supervisor is allowed per class per academic year.";
        console.error("❌ [Class Supervisor Exists Error]", message, { existingClassSupervisor });
        return { success: false, error: true, message };
      }
      console.log("✅ [No Existing Class Supervisor Found]");
    }

    // Create the assignment
    console.log("ℹ️ [Creating Assignment in DB]");
    const newAssignment = await prisma.teacherAssignment.create({
      data: assignmentData,
    });
    console.log("✅ [Assignment Created Successfully]", { newAssignment });

    // Revalidate the teacher assignments page
    console.log("ℹ️ [Revalidating Path]: /admin/teacher-assignments");
    revalidatePath("/admin/teacher-assignments");
    
    return { 
      success: true, 
      error: false, 
      message: "Teacher assignment created successfully!" 
    };
  } catch (error) {
    console.error("❌ [Action Error] createTeacherAssignment failed:", error);
    return {
      success: false,
      error: true,
      message: error instanceof Error ? error.message : "Failed to create teacher assignment",
    };
  }
};

export const updateTeacherAssignment = async (
  currentState: CurrentState,
  data: TeacherAssignmentSchema
) => {
  try {
    if (!data.id) {
      return {
        success: false,
        error: true,
        message: "Assignment ID is required for update",
      };
    }

    // Validate required fields
    if (!data.teacherId || !data.classId || !data.academicYearId || !data.branchId) {
      return {
        success: false,
        error: true,
        message: "Teacher, branch, class and academic year are required",
      };
    }

    // Validate role selection
    if (!data.assignSupervisor && !data.assignAsTeacher) {
      return {
        success: false,
        error: true,
        message: "Please select either Supervisor or Subject Teacher role",
      };
    }

    // For subject teachers, subject is required
    if (data.assignAsTeacher && !data.assignSupervisor && !data.subjectId) {
      return {
        success: false,
        error: true,
        message: "Subject is required for subject teachers",
      };
    }

    // Convert basic IDs first
    const academicYearId = parseInt(data.academicYearId.toString());
    const classId = parseInt(data.classId.toString());

    // Check if the teacher is already a supervisor for another class in the same academic year
    // Note: Supervisor role is now managed via TeacherAssignment.role, not Class.supervisorId
    const existingSupervisorAssignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: data.teacherId,
        role: "SUPERVISOR",
        academicYearId: academicYearId,
        status: "ACTIVE",
        classId: { not: classId }, // Exclude current class if updating
      },
    });

    if (existingSupervisorAssignment) {
      return {
        success: false,
        error: true,
        message: "This teacher is already a supervisor for another class in this academic year. One teacher can only supervise one class per academic year.",
      };
    }

    // Convert remaining IDs to integers for Prisma
    const branchId = parseInt(data.branchId.toString());
    const subjectId = data.subjectId ? parseInt(data.subjectId.toString()) : null;

    // Check if the class already has a supervisor (if assigning as supervisor)
    if (data.assignSupervisor) {
      const existingClassSupervisor = await prisma.teacherAssignment.findFirst({
        where: {
          classId: classId,
          academicYearId: academicYearId,
          role: "SUPERVISOR",
          status: "ACTIVE",
          ...(data.id ? { id: { not: parseInt(data.id) } } : {}), // Exclude current assignment if updating
        },
      });

      if (existingClassSupervisor) {
        return {
          success: false,
          error: true,
          message: "This class already has a supervisor assigned. Only one supervisor is allowed per class per academic year.",
        };
      }
    }

    // Check if new assignment already exists (exclude current assignment for updates)
    const existingAssignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: data.teacherId,
        classId: classId,
        academicYearId: academicYearId,
        ...(subjectId ? { subjectId: subjectId } : {}),
        status: "ACTIVE",
        ...(data.id ? { id: { not: parseInt(data.id) } } : {}), // Exclude current assignment if updating
      },
    });

    if (existingAssignment) {
      return {
        success: false,
        error: true,
        message: "This teacher-class-subject assignment already exists",
      };
    }

    // Update the assignment by updating the TeacherAssignment record
    await prisma.teacherAssignment.update({
      where: { id: parseInt(data.id) },
      data: {
        teacherId: data.teacherId,
        classId: classId,
        branchId: branchId,
        academicYearId: academicYearId,
        subjectId: subjectId,
        role: data.assignSupervisor ? "SUPERVISOR" : "TEACHER",
        status: "ACTIVE",
      },
    });

    revalidatePath("/admin/teacher-assignments");
    return { 
      success: true, 
      error: false, 
      message: "Teacher assignment updated successfully!" 
    };
  } catch (error) {
    console.error("Error updating teacher assignment:", error);
    return {
      success: false,
      error: true,
      message: "Failed to update teacher assignment",
    };
  }
};

export const deleteTeacherAssignment = async (
  currentState: CurrentState,
  data: FormData
) => {
  try {
    console.log("=== deleteTeacherAssignment called ===");
    console.log("Current state:", currentState);
    console.log("Data type:", typeof data);
    console.log("Is FormData:", data instanceof FormData);

    // Check if data is undefined or null
    if (!data) {
      console.error("deleteTeacherAssignment: Form data is missing");
      return { success: false, error: true, message: "Form data is missing" };
    }

    console.log("deleteTeacherAssignment: Form data received:", {
      hasData: !!data,
      dataType: typeof data,
      isFormData: data instanceof FormData,
      entries: data ? Array.from(data.entries()) : "no data"
    });

    // Debug: Check if FormData is empty
    if (data instanceof FormData) {
      const entries = Array.from(data.entries());
      console.log("FormData entries:", entries);
      if (entries.length === 0) {
        console.error("FormData is empty - no entries found");
        return { success: false, error: true, message: "Form data is empty" };
      }
    } else {
      console.error("Data is not FormData instance:", typeof data, data);
      return { success: false, error: true, message: "Invalid form data type" };
    }

    const teacherId = safeGetFormData(data, "teacherId");
    const classId = safeGetFormData(data, "classId");
    const subjectId = safeGetFormData(data, "subjectId");
    const comment = safeGetFormData(data, "comment");
    const currentUserId = safeGetFormData(data, "currentUserId");

    console.log("deleteTeacherAssignment: Extracted values:", {
      teacherId,
      classId,
      subjectId,
      comment: comment ? `${comment.substring(0, 20)}...` : "empty",
      currentUserId
    });

    // Validate required fields
    if (!teacherId || !classId) {
      return { success: false, error: true, message: "Missing required fields: teacherId or classId" };
    }

    if (!comment || comment.length < 10) {
      return { success: false, error: true, message: "Comment is required (minimum 10 characters)" };
    }
    // Find the teacher assignment to delete
    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: teacherId,
        classId: parseInt(classId),
        subjectId: subjectId ? parseInt(subjectId) : null,
        status: "ACTIVE",
      },
    });

    if (!assignment) {
      return {
        success: false,
        error: true,
        message: "Teacher assignment not found",
      };
    }

    // Remove the assignment and add archive comment
    await prisma.$transaction(async (tx) => {
      // Add archive comment
      await tx.archiveComment.create({
        data: {
          teacher: { connect: { id: teacherId } },
          comment: comment,
          action: "DELETE_ASSIGNMENT",
          createdBy: currentUserId || "admin",
        },
      });

      // Delete the teacher assignment
      await tx.teacherAssignment.delete({
        where: { id: assignment.id },
      });
    });

    return { 
      success: true, 
      error: false, 
      message: "Teacher assignment removed successfully!" 
    };
  } catch (error) {
    console.error("Error deleting teacher assignment:", error);
    return {
      success: false,
      error: true,
      message: error instanceof Error ? error.message : "Failed to delete teacher assignment",
    };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherUpdateSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }

  try {
    // Prepare teacher data
    const teacherData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      phone: data.phone,
      email: data.email || null,
      address: data.address || "",
      status: data.status,
    };

    // Only update password if provided
    if (data.password && data.password.trim()) {
      teacherData.password = await AuthService.hashPassword(data.password);
    }

    // Update teacher with related data in transaction
    await prisma.$transaction(async (tx) => {
      // Update the teacher
      await tx.teacher.update({
        where: { id: data.id },
        data: teacherData,
      });

      // Update or create passport only if all required fields are provided
      if (data.passport && data.id && data.passport.country && data.passport.documentNumber && data.passport.issueDate && data.passport.expiryDate) {
        await tx.teacherPassport.upsert({
          where: { teacherId: data.id },
          update: {
            country: data.passport.country,
            documentNumber: data.passport.documentNumber,
            issueDate: data.passport.issueDate,
            expiryDate: data.passport.expiryDate,
          },
          create: {
            teacherId: data.id,
            country: data.passport.country,
            documentNumber: data.passport.documentNumber,
            issueDate: data.passport.issueDate,
            expiryDate: data.passport.expiryDate,
          },
        });
      } else if (data.passport && data.id) {
        // If passport data is incomplete, delete any existing passport record
        await tx.teacherPassport.deleteMany({
          where: { teacherId: data.id },
        });
      }

      // Update or create education only if all required fields are provided
      if (data.education && data.id && data.education.institutionName && data.education.specialization && data.education.documentSeries && data.education.graduationDate) {
        await tx.teacherEducation.upsert({
          where: { teacherId: data.id },
          update: {
            institutionName: data.education.institutionName,
            specialization: data.education.specialization,
            documentSeries: data.education.documentSeries,
            graduationDate: data.education.graduationDate,
            languageSkills: data.education.languageSkills || null,
          },
          create: {
            teacherId: data.id,
            institutionName: data.education.institutionName,
            specialization: data.education.specialization,
            documentSeries: data.education.documentSeries,
            graduationDate: data.education.graduationDate,
            languageSkills: data.education.languageSkills || null,
          },
        });
      } else if (data.education && data.id) {
        // If education data is incomplete, delete any existing education record
        await tx.teacherEducation.deleteMany({
          where: { teacherId: data.id },
        });
      }

      // Note: Subject and class assignments are managed through the separate Teacher Assignments section
      // Teachers start unassigned and get assigned subjects/classes through that workflow

      // Handle attachments for updates
      if (data.attachments && data.id) {
        // Delete existing attachments first (to avoid duplicates)
        await tx.teacherAttachment.deleteMany({
          where: { teacherId: data.id },
        });

        const attachmentsToCreate = [];
        
        if (data.attachments.passport) {
          attachmentsToCreate.push({
            teacherId: data.id,
            fileType: "passport",
            fileName: data.attachments.passport.name,
            originalName: data.attachments.passport.name,
            fileUrl: data.attachments.passport.url,
            filePath: data.attachments.passport.filePath,
            fileSize: data.attachments.passport.size,
          });
        }
        
        if (data.attachments.resume) {
          attachmentsToCreate.push({
            teacherId: data.id,
            fileType: "resume",
            fileName: data.attachments.resume.name,
            originalName: data.attachments.resume.name,
            fileUrl: data.attachments.resume.url,
            filePath: data.attachments.resume.filePath,
            fileSize: data.attachments.resume.size,
          });
        }
        
        if (data.attachments.photo) {
          attachmentsToCreate.push({
            teacherId: data.id,
            fileType: "photo",
            fileName: data.attachments.photo.name,
            originalName: data.attachments.photo.name,
            fileUrl: data.attachments.photo.url,
            filePath: data.attachments.photo.filePath,
            fileSize: data.attachments.photo.size,
          });
        }

        if (attachmentsToCreate.length > 0) {
          await tx.teacherAttachment.createMany({
            data: attachmentsToCreate,
          });
        }
      }
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const archiveTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const teacherId = data.get("teacherId") as string;
  const comment = data.get("comment") as string;
  const currentUserId = data.get("currentUserId") as string;

  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.teacher.update({
        where: { id: teacherId },
        data: {
          status: "INACTIVE",
          archivedAt: new Date(),
        },
      });
      await tx.archiveComment.create({
        data: {
          teacherId: teacherId,
          comment: comment,
          action: "ARCHIVE",
          createdBy: currentUserId,
        },
      });
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const restoreTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const teacherId = data.get("teacherId") as string;
  const comment = data.get("comment") as string;
  const currentUserId = data.get("currentUserId") as string;

  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.teacher.update({
        where: { id: teacherId },
        data: {
          status: "ACTIVE",
          restoredAt: new Date(),
        },
      });
      await tx.archiveComment.create({
        data: {
          teacherId: teacherId,
          comment: comment,
          action: "RESTORE",
          createdBy: currentUserId,
        },
      });
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const teacherId = data.get("teacherId") as string;
  const comment = data.get("comment") as string;
  const currentUserId = data.get("currentUserId") as string;

  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Add delete comment before deletion
      await tx.archiveComment.create({
        data: {
          teacherId: teacherId,
          comment: comment,
          action: "DELETE",
          createdBy: currentUserId,
        },
      });

      // Delete teacher and all related data (cascade delete)
      await tx.teacher.delete({
        where: { id: teacherId },
      });
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteUser = async (
  currentState: CurrentState,
  data: FormData
) => {
  const userId = data.get("userId") as string;
  const comment = data.get("comment") as string;
  const currentUserId = data.get("currentUserId") as string;

  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Add delete comment before deletion
      await tx.archiveComment.create({
        data: {
          userId: userId,
          comment: comment,
          action: "DELETE",
          createdBy: currentUserId,
        },
      });

      // Delete user and all related data (cascade delete)
      await tx.user.delete({
        where: { id: userId },
      });
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const archiveUser = async (
  currentState: CurrentState,
  data: FormData
) => {
  const userId = data.get("userId") as string;
  const comment = data.get("comment") as string;
  const currentUserId = data.get("currentUserId") as string;

  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Update user status to inactive and set archived date
      await tx.user.update({
        where: { id: userId },
        data: {
          status: "INACTIVE",
          archivedAt: new Date(),
        },
      });

      // Add archive comment
      await tx.archiveComment.create({
        data: {
          userId: userId,
          comment: comment,
          action: "ARCHIVE",
          createdBy: currentUserId,
        },
      });
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const restoreUser = async (
  currentState: CurrentState,
  data: FormData
) => {
  const userId = data.get("userId") as string;
  const comment = data.get("comment") as string;
  const currentUserId = data.get("currentUserId") as string;

  if (!comment || comment.length < 10) {
    return { success: false, error: true };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Update user status to active, clear archived date, and set restored date
      await tx.user.update({
        where: { id: userId },
        data: {
          status: "ACTIVE",
          archivedAt: null,
          restoredAt: new Date(),
        },
      });

      // Add restore comment
      await tx.archiveComment.create({
        data: {
          userId: userId,
          comment: comment,
          action: "RESTORE",
          createdBy: currentUserId,
        },
      });
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const resetUserPassword = async (
  currentState: CurrentState,
  data: PasswordResetSchema
) => {
  try {
    const hashedPassword = await AuthService.hashPassword(data.newPassword);

    await prisma.user.update({
      where: { id: data.userId },
      data: { password: hashedPassword },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// ADMIN MESSAGE ACTIONS

export const sendAdminMessage = async (
  currentState: CurrentState,
  data: AdminMessageSchema
) => {
  try {
    await prisma.$transaction(async (tx) => {
      // Create the message
      const message = await tx.message.create({
        data: {
          senderId: data.senderId,
          receiverId: data.receiverId,
          branchId: data.branchId,
          role: data.role,
          subject: data.subject,
          body: data.body,
          status: "SENT",
        },
      });

      // Create attachments if any
      if (data.attachments && data.attachments.length > 0) {
        await tx.messageAttachment.createMany({
          data: data.attachments.map((attachment) => ({
            messageId: message.id,
            fileName: attachment.fileName,
            originalName: attachment.originalName,
            fileUrl: attachment.fileUrl,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
            mimeType: attachment.mimeType,
          })),
        });
      }
    });

    revalidatePath("/admin/messages");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const markMessageAsRead = async (
  currentState: CurrentState,
  data: FormData
) => {
  const messageId = data.get("messageId") as string;
  
  try {
    await prisma.message.update({
      where: { id: parseInt(messageId) },
      data: { 
        status: "READ",
        readAt: new Date(),
      },
    });

    revalidatePath("/admin/messages");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteMessage = async (
  currentState: CurrentState,
  data: FormData
) => {
  const messageId = data.get("messageId") as string;
  
  try {
    await prisma.$transaction(async (tx) => {
      // Delete attachments first
      await tx.messageAttachment.deleteMany({
        where: { messageId: parseInt(messageId) }
      });
      
      // Delete the message
      await tx.message.delete({
        where: { id: parseInt(messageId) },
      });
    });

    revalidatePath("/admin/messages");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Get users by branch and role for message targeting
export const getUsersByBranchAndRole = async (
  branchId: number | null,
  role: string
) => {
  try {
    const whereClause: any = {
      status: "ACTIVE",
      position: role,
    };

    // If not all branches, filter by specific branch
    if (branchId !== null) {
      whereClause.branchId = branchId;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userId: true,
        position: true,
        branchId: true,
        branch: {
          select: {
            shortName: true,
          },
        },
      },
      orderBy: [
        { firstName: "asc" },
        { lastName: "asc" },
      ],
    });

    return { success: true, data: users };
  } catch (err) {
    console.log(err);
    return { success: false, error: true, data: [] };
  }
};

// Get teachers by branch for message targeting
export const getTeachersByBranch = async (branchId: number | null) => {
  try {
    const whereClause: any = {
      status: "ACTIVE",
    };

    // If not all branches, filter by specific branch
    if (branchId !== null) {
      whereClause.branchId = branchId;
    }

    const teachers = await prisma.teacher.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        teacherId: true,
      },
      orderBy: [
        { firstName: "asc" },
        { lastName: "asc" },
      ],
    });

    return { success: true, data: teachers };
  } catch (err) {
    console.log(err);
    return { success: false, error: true, data: [] };
  }
};

// Parent Actions
export const createParent = async (
  currentState: CurrentState,
  formData: FormData
) => {
  const data = Object.fromEntries(formData.entries());
  const studentIds = formData.getAll('studentIds[]');

  // For parent creation from student context, we need to handle the case where branchId might not be available
  const validationData = {
    ...data,
    branchId: data.branchId ? Number(data.branchId) : undefined,
    studentIds: studentIds.length > 0 ? studentIds : undefined,
  };

  const validatedData = parentSchema.safeParse(validationData);

  if (!validatedData.success) {
    console.error("Validation error:", validatedData.error);
    console.error("Validation data:", validationData);
    return {
      success: false,
      error: true,
      message: `Validation error: ${validatedData.error.errors.map(e => e.message).join(', ')}`,
    };
  }
  
  const { password, parentId, ...parentData } = validatedData.data;

  try {
    // Check if parentId is already taken
    const existingParent = await prisma.parent.findFirst({ where: { parentId } });
    if (existingParent) {
      return { 
        success: false, 
        error: true, 
        message: "This Parent ID is already taken. Please use a different ID." 
      };
    }
    
    // One student can be assigned to only one parent
    if (studentIds && studentIds.length > 0) {
      const studentId = studentIds[0] as string;
      const existingLink = await prisma.studentParent.findFirst({
        where: { studentId: studentId },
      });

      if (existingLink) {
      return { 
        success: false, 
        error: true, 
          message:
            "This student is already assigned to a parent. Please assign another student.",
      };
      }
    }


    const hashedPassword = await AuthService.hashPassword(password);
    const newParentId = `parent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await prisma.$transaction(async (tx) => {
      const { studentIds, ...parentCreateData } = parentData;
      
      // If branchId is not provided, fetch it from the first student or use default
      let finalBranchId = parentCreateData.branchId;
      
      if (!finalBranchId && studentIds && studentIds.length > 0) {
        const firstStudent = await tx.student.findUnique({
          where: { id: studentIds[0] as string },
          select: { branchId: true },
        });
        finalBranchId = firstStudent?.branchId || 1; // Default to branch 1 if student has no branch
      }
      
      if (!finalBranchId) {
        finalBranchId = 1; // Default branch if no student provided
      }
      
      const parent = await tx.parent.create({
        data: {
          ...parentCreateData,
          id: newParentId,
          password: hashedPassword,
          parentId,
          branchId: finalBranchId,
        } as any,
      });

      if (studentIds && studentIds.length > 0) {
        const studentParentData = studentIds.map(studentId => ({
          studentId: studentId as string,
          parentId: parent.id,
          relationship: "Father" as any, 
        }));

        await tx.studentParent.createMany({
          data: studentParentData,
          skipDuplicates: true,
        });
      }
    });

    return { success: true, error: false, message: "Parent created successfully!" };
  } catch (err) {
    console.log(err);
    return { success: false, error: true, message: "An unexpected error occurred." };
  }
};

export const updateParent = async (
  currentState: CurrentState,
  formData: FormData
) => {
  const data = Object.fromEntries(formData.entries());
  const studentIds = formData.getAll('studentIds[]');

  const validatedData = parentUpdateSchema.safeParse({
    ...data,
    branchId: data.branchId ? Number(data.branchId) : undefined,
    studentIds,
  });

  if (!validatedData.success) {
    return {
      success: false,
      error: true,
      message: `Validation error: ${validatedData.error.errors.map((e: any) => e.message).join(', ')}`,
    };
  }

  const { password, parentId, ...parentData } = validatedData.data;

  if (!data.id) {
    return { success: false, error: true, message: "Parent ID is required" };
  }

  try {
    const { studentIds, ...updateData } = parentData;

    // Only update password if provided
    if (password && password.trim()) {
      (updateData as any).password = await AuthService.hashPassword(password);
    }

    await prisma.$transaction(async (tx) => {
      // Update the parent
      await tx.parent.update({
        where: { id: data.id as string },
      data: updateData,
    });

      // Update student assignments if provided
      if (studentIds && studentIds.length > 0) {
        // Remove existing assignments
        await tx.studentParent.deleteMany({
          where: { parentId: data.id as string },
        });

        // Add new assignments
        const studentParentData = studentIds.map((studentId: any) => ({
          studentId: studentId as string,
          parentId: data.id as string,
          relationship: "Father" as any,
        }));

        await tx.studentParent.createMany({
          data: studentParentData,
          skipDuplicates: true,
        });
      }
    });

    return { success: true, error: false, message: "Parent updated successfully!" };
  } catch (err) {
    console.log(err);
    return { success: false, error: true, message: "Failed to update parent" };
  }
};

export const archiveParent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const parentId = data.get("parentId") as string;
  const comment = data.get("comment") as string;
  const createdBy = data.get("createdBy") as string;

  try {
    await prisma.$transaction(async (tx) => {
      // Archive the parent
      await tx.parent.update({
        where: { id: parentId },
        data: ({
          status: "INACTIVE",
          archivedAt: new Date(),
        } as unknown) as Prisma.ParentUpdateInput,
      });

      // Log the archive action
      await tx.archiveComment.create({
        data: {
          parentId: parentId,
          comment: comment,
          action: "ARCHIVE",
          createdBy: createdBy,
        } as any,
      });
    });

    return { success: true, error: false, message: "Parent archived successfully!" };
  } catch (err) {
    console.log(err);
    return { success: false, error: true, message: "Failed to archive parent" };
  }
};

export const restoreParent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const parentId = data.get("parentId") as string;
  const comment = data.get("comment") as string;
  const createdBy = data.get("createdBy") as string;

  try {
    await prisma.$transaction(async (tx) => {
      // Restore the parent
      await tx.parent.update({
        where: { id: parentId },
        data: ({
          status: "ACTIVE",
          restoredAt: new Date(),
        } as unknown) as Prisma.ParentUpdateInput,
      });

      // Log the restore action
      await tx.archiveComment.create({
        data: {
          parentId: parentId,
          comment: comment,
          action: "RESTORE",
          createdBy: createdBy,
        } as any,
      });
    });

    return { success: true, error: false, message: "Parent restored successfully!" };
  } catch (err) {
    console.log(err);
    return { success: false, error: true, message: "Failed to restore parent" };
  }
};

export const deleteParent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const parentId = data.get("parentId") as string;
  const comment = data.get("comment") as string;
  const createdBy = data.get("createdBy") as string;

  try {
    await prisma.$transaction(async (tx) => {
      // Log the delete action before deletion
      await tx.archiveComment.create({
        data: {
          parentId: parentId,
          comment: comment,
          action: "DELETE",
          createdBy: createdBy,
        } as any,
      });

      // Delete the parent
      await tx.parent.delete({
        where: { id: parentId },
      });
    });

    return { success: true, error: false, message: "Parent deleted successfully!" };
  } catch (err) {
    console.log(err);
    return { success: false, error: true, message: "Failed to delete parent" };
  }
};

export const unassignParent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const parentId = data.get("parentId") as string;
  const comment = data.get("comment") as string;
  const currentUserId = data.get("currentUserId") as string;

  if (!comment || comment.length < 10) {
    return { success: false, error: true, message: "Comment is required (minimum 10 characters)" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Add archive comment
      await tx.archiveComment.create({
        data: {
          parentId: parentId,
          comment: comment,
          action: "DELETE",
          createdBy: currentUserId || "admin",
        } as any,
      });

      // Delete all student-parent relationships
      await tx.studentParent.deleteMany({
        where: { parentId: parentId },
      });

      // Delete the parent
      await tx.parent.delete({
        where: { id: parentId },
      });
    });

    return { success: true, error: false, message: "Parent unassigned and deleted successfully!" };
  } catch (error) {
    console.error("Error unassigning parent:", error);
    return { success: false, error: true, message: "Failed to unassign parent" };
  }
};

export const assignStudentToParent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const studentId = data.get("studentId") as string;
  const parentId = data.get("parentId") as string;
  const currentUserId = data.get("currentUserId") as string;

  if (!studentId || !parentId) {
    return { success: false, error: true, message: "Student ID and Parent ID are required" };
  }

  try {
    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return { success: false, error: true, message: "Student not found" };
    }

    // Check if parent exists
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      return { success: false, error: true, message: "Parent not found" };
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.studentParent.findFirst({
      where: {
        studentId: studentId,
        parentId: parentId,
      },
    });

    if (existingAssignment) {
      return { success: false, error: true, message: "Student is already assigned to this parent" };
    }

    // Create the assignment
    await prisma.studentParent.create({
      data: {
        studentId: studentId,
        parentId: parentId,
        relationship: "Father", // Default relationship
      },
    });

    return { success: true, error: false, message: "Student assigned to parent successfully!" };
  } catch (error) {
    console.error("Error assigning student to parent:", error);
    return { success: false, error: true, message: "Failed to assign student to parent" };
  }
};

export const resetParentPassword = async (
  currentState: CurrentState,
  data: FormData
) => {
  const parentId = data.get("parentId") as string;
  const newPassword = data.get("newPassword") as string;

  try {
    const hashedPassword = await AuthService.hashPassword(newPassword);
    
    await prisma.parent.update({
      where: { id: parentId },
      data: { password: hashedPassword },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Student Actions
export const createStudent = async (
  currentState: CurrentState,
  formData: FormData
): Promise<CurrentState> => {
  try {
    console.log("Creating student with formData:", formData);
    console.log("FormData entries:", Array.from(formData.entries()));
    
    // Extract data from FormData
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      dateOfBirth: formData.get("dateOfBirth") ? new Date(formData.get("dateOfBirth") as string) : undefined,
      phone: formData.get("phone") as string,
      studentId: formData.get("studentId") as string,
      password: formData.get("password") as string,
      gender: formData.get("gender") as string,
      status: formData.get("status") as string || "ACTIVE",
      branchId: formData.get("branchId") ? parseInt(formData.get("branchId") as string) : undefined,
      classId: formData.get("classId") ? parseInt(formData.get("classId") as string) : undefined,
      parentId: formData.get("parentId") as string || undefined,
      attachments: {
        document1: formData.get("document1") ? JSON.parse(formData.get("document1") as string) : undefined,
        document2: formData.get("document2") ? JSON.parse(formData.get("document2") as string) : undefined,
        image1: formData.get("image1") ? JSON.parse(formData.get("image1") as string) : undefined,
        image2: formData.get("image2") ? JSON.parse(formData.get("image2") as string) : undefined,
      }
    };
    
    console.log("Parsed student data:", data);
    
    // Check if studentId is already taken by any user type
    const [existingStudent, existingUser, existingTeacher, existingParent] = await Promise.all([
      prisma.student.findFirst({ where: { studentId: data.studentId } as any }),
      prisma.user.findFirst({ where: { userId: data.studentId } as any }),
      prisma.teacher.findFirst({ where: { teacherId: data.studentId } as any }),
      prisma.parent.findFirst({ where: { parentId: data.studentId } as any }),
    ]);

    if (existingStudent || existingUser || existingTeacher || existingParent) {
      return { 
        success: false, 
        error: true, 
        message: "This ID is already taken. Please use a different ID." 
      };
    }

    // Hash the password
    const hashedPassword = await AuthService.hashPassword(data.password);

    // Generate a unique ID for the student
    const studentId = `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const studentData: any = {
      id: studentId,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      phone: data.phone,
      studentId: data.studentId,
      password: hashedPassword,
      gender: data.gender,
      status: data.status,
    };

    // Only include branchId and classId if they are provided
    if (data.branchId) {
      studentData.branchId = data.branchId;
    }
    if (data.classId) {
      studentData.classId = data.classId;
    }

    // Only include parentId if provided
    if (data.parentId) {
      studentData.parentId = data.parentId;
    }

    const created = await prisma.student.create({
      data: studentData,
    });

    // Persist attachments if provided
    const rawAttachments: any[] = [
      (data as any)?.attachments?.document1,
      (data as any)?.attachments?.document2,
      (data as any)?.attachments?.image1,
      (data as any)?.attachments?.image2,
    ].filter(Boolean);

    if (rawAttachments.length > 0) {
      const attachmentsToCreate = rawAttachments.map((att: any) => ({
        studentId: created.id,
        fileType: att.fileType || (att.type ?? "file"),
        fileName: att.name || att.fileName || `file_${Date.now()}`,
        originalName: att.name || att.originalName || "uploaded-file",
        fileUrl: att.url || att.fileUrl || "",
        filePath: att.filePath || att.url || "",
        fileSize: att.size || att.fileSize || 0,
      }));
      await prisma.studentAttachment.createMany({ data: attachmentsToCreate });
    }

    return { success: true, error: false, message: "Student created successfully" };
  } catch (err) {
    console.error("Student creation error:", err);
    return { 
      success: false, 
      error: true, 
      message: `Failed to create student: ${err instanceof Error ? err.message : 'Unknown error'}` 
    };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  formData: FormData
): Promise<CurrentState> => {
  // Extract data from FormData
  const data = {
    id: formData.get("id") as string,
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    dateOfBirth: formData.get("dateOfBirth") ? new Date(formData.get("dateOfBirth") as string) : undefined,
    phone: formData.get("phone") as string,
    studentId: formData.get("studentId") as string,
    password: formData.get("password") as string,
    gender: formData.get("gender") as string,
    status: formData.get("status") as string || "ACTIVE",
    branchId: formData.get("branchId") ? parseInt(formData.get("branchId") as string) : undefined,
    classId: formData.get("classId") ? parseInt(formData.get("classId") as string) : undefined,
    parentId: formData.get("parentId") as string || undefined,
    attachments: {
      document1: formData.get("document1") ? JSON.parse(formData.get("document1") as string) : undefined,
      document2: formData.get("document2") ? JSON.parse(formData.get("document2") as string) : undefined,
      image1: formData.get("image1") ? JSON.parse(formData.get("image1") as string) : undefined,
      image2: formData.get("image2") ? JSON.parse(formData.get("image2") as string) : undefined,
    }
  };
  
  if (!data.id) {
    return { success: false, error: true, message: "Student ID is required" };
  }

  try {
    const updateData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      phone: data.phone,
      gender: data.gender,
      status: data.status,
    };

    // Only include optional fields if they are provided
    if (data.branchId !== undefined) {
      updateData.branchId = data.branchId;
    }
    if (data.classId !== undefined) {
      updateData.classId = data.classId;
    }
    if (data.parentId !== undefined) {
      updateData.parentId = data.parentId;
    }

    // Only update password if provided
    if (data.password && data.password.trim()) {
      updateData.password = await AuthService.hashPassword(data.password);
    }

    const updated = await prisma.student.update({
      where: {
        id: data.id,
      },
      data: updateData as any,
    });

    // Append newly uploaded attachments if any
    const rawAttachments: any[] = [
      (data as any)?.attachments?.document1,
      (data as any)?.attachments?.document2,
      (data as any)?.attachments?.image1,
      (data as any)?.attachments?.image2,
    ].filter(Boolean);

    if (rawAttachments.length > 0) {
      const attachmentsToCreate = rawAttachments.map((att: any) => ({
        studentId: updated.id,
        fileType: att.fileType || (att.type ?? "file"),
        fileName: att.name || att.fileName || `file_${Date.now()}`,
        originalName: att.name || att.originalName || "uploaded-file",
        fileUrl: att.url || att.fileUrl || "",
        filePath: att.filePath || att.url || "",
        fileSize: att.size || att.fileSize || 0,
      }));
      await prisma.studentAttachment.createMany({ data: attachmentsToCreate });
    }

    return { success: true, error: false, message: "Student updated successfully" };
  } catch (err) {
    console.error("Student update error:", err);
    return { 
      success: false, 
      error: true, 
      message: `Failed to update student: ${err instanceof Error ? err.message : 'Unknown error'}` 
    };
  }
};

export const archiveStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const studentId = data.get("studentId") as string;
  const comment = data.get("comment") as string;
  const createdBy = data.get("createdBy") as string;

  try {
    await prisma.$transaction(async (tx) => {
      // Archive the student
      await tx.student.update({
        where: { id: studentId },
        data: ({
          status: "INACTIVE",
          archivedAt: new Date(),
        } as unknown) as Prisma.StudentUpdateInput,
      });

      // Log the archive action
      await tx.archiveComment.create({
        data: {
          studentId: studentId,
          comment: comment,
          action: "ARCHIVE",
          createdBy: createdBy,
        },
      });
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const restoreStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const studentId = data.get("studentId") as string;
  const comment = data.get("comment") as string;
  const createdBy = data.get("createdBy") as string;

  try {
    await prisma.$transaction(async (tx) => {
      // Restore the student
      await tx.student.update({
        where: { id: studentId },
        data: ({
          status: "ACTIVE",
          restoredAt: new Date(),
        } as unknown) as Prisma.StudentUpdateInput,
      });

      // Log the restore action
      await tx.archiveComment.create({
        data: {
          studentId: studentId,
          comment: comment,
          action: "RESTORE",
          createdBy: createdBy,
        },
      });
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const studentId = data.get("studentId") as string;
  const comment = data.get("comment") as string;
  const createdBy = data.get("createdBy") as string;

  try {
    await prisma.$transaction(async (tx) => {
      // Log the delete action before deletion
      await tx.archiveComment.create({
        data: {
          studentId: studentId,
          comment: comment,
          action: "DELETE",
          createdBy: createdBy,
        },
      });

      // Delete the student
      await tx.student.delete({
        where: { id: studentId },
      });
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const transferStudent = async (
  currentState: CurrentState,
  data: TransferStudentSchema
) => {
  try {
    await prisma.student.update({
      where: { id: data.studentId },
      data: {
        branchId: data.newBranchId,
        classId: data.newClassId,
      } as any,
    });

    // Log the transfer action
    await prisma.archiveComment.create({
      data: {
        studentId: data.studentId,
        comment: `Student transferred to new branch/class. Reason: ${data.transferReason}`,
        action: "TRANSFER",
        createdBy: "system", // This should be the current user ID
      } as any,
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const resetStudentPassword = async (
  currentState: CurrentState,
  data: FormData
) => {
  const studentId = data.get("studentId") as string;
  const newPassword = data.get("newPassword") as string;

  try {
    const hashedPassword = await AuthService.hashPassword(newPassword);
    
    await prisma.student.update({
      where: { id: studentId },
      data: { password: hashedPassword },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const getActiveClassesByBranch = async (branchId: number) => {
  try {
    const classes = await prisma.class.findMany({
      where: ({
        branchId: branchId,
        status: "ACTIVE",
      } as unknown) as Prisma.ClassWhereInput,

      orderBy: {
        name: "asc",
      },
    });

    return { success: true, data: classes };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const exportClassStudents = async (
  currentState: CurrentState,
  data: FormData
) => {
  const classId = data.get("classId") as string;

  try {
    const classData = await prisma.class.findUnique({
      where: { id: parseInt(classId) },
      include: {
        students: {
          include: {
            studentParents: {
              include: {
                parent: true
              }
            },
          },
        },
      },
    });

    if (!classData) {
      return { success: false, error: true, message: "Class not found" };
    }

    // Format data for export
    const exportData = {
      class: {
        name: classData.name,
        capacity: classData.capacity,
        totalStudents: classData.students.length,
      },
      students: classData.students.map((student: any) => ({
        id: student.id,
        studentId: student.id,
        name: `${student.name} ${student.surname}`,
        phone: student.phone,
        email: student.email,
        address: student.address,
        bloodType: student.bloodType,
        gender: student.sex,
        birthday: student.birthday.toISOString().split('T')[0],
        parentName: student.studentParents[0] ? `${student.studentParents[0].parent.name} ${student.studentParents[0].parent.surname}` : 'N/A',
        parentPhone: student.studentParents[0]?.parent.phone || 'N/A',
        parentEmail: student.studentParents[0]?.parent.email || 'N/A',
        enrollmentDate: student.createdAt.toISOString().split('T')[0],
      })),
    };

    return { 
      success: true, 
      error: false, 
      data: exportData 
    };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Academic Year Actions
export const createAcademicYear = async (
  currentState: CurrentState,
  data: AcademicYearSchema
) => {
  try {
    // Check if there's already an ACTIVE academic year
    const existingActiveYear = await prisma.academicYear.findFirst({
      where: { status: "ACTIVE" }
    });

    if (existingActiveYear && data.status === "ACTIVE") {
      return { 
        success: false, 
        error: true, 
        message: "Cannot create another active academic year. There is already an active academic year. Please archive the current one first." 
      };
    }

    // Check for overlapping academic years (regardless of status)
    const overlappingYear = await prisma.academicYear.findFirst({
      where: {
        OR: [
          // New year starts during existing year
          {
            startDate: { lte: data.startDate },
            endDate: { gte: data.startDate }
          },
          // New year ends during existing year
          {
            startDate: { lte: data.endDate },
            endDate: { gte: data.endDate }
          },
          // New year completely contains existing year
          {
            startDate: { gte: data.startDate },
            endDate: { lte: data.endDate }
          }
        ]
      }
    });

    if (overlappingYear) {
      return { 
        success: false, 
        error: true, 
        message: `Cannot create academic year with overlapping dates. There is already an academic year (${overlappingYear.name}) that overlaps with the specified period.` 
      };
    }

    // Enforce only one ACTIVE academic year
    if (data.status === "ACTIVE") {
      await prisma.academicYear.updateMany({
        where: { status: "ACTIVE" },
        data: { status: "INACTIVE" },
      });
    }

    await prisma.academicYear.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        semesters: {
          create: data.semesters.map((semester) => ({
            name: semester.name,
            startDate: semester.startDate,
            endDate: semester.endDate
          }))
        }
      }
    });

    revalidatePath("/list/academic-years");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAcademicYear = async (
  currentState: CurrentState,
  data: AcademicYearSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }

  try {
    // Enforce only one ACTIVE academic year
    if (data.status === "ACTIVE") {
      await prisma.academicYear.updateMany({
        where: { status: "ACTIVE", NOT: { id: data.id } },
        data: { status: "INACTIVE" },
      });
    }

    // Delete existing semesters and recreate them
    await prisma.semester.deleteMany({
      where: { academicYearId: data.id }
    });

    await prisma.academicYear.update({
      where: { id: data.id },
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        semesters: {
          create: data.semesters.map((semester) => ({
            name: semester.name,
            startDate: semester.startDate,
            endDate: semester.endDate
          }))
        }
      }
    });

    revalidatePath("/list/academic-years");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const archiveAcademicYear = async (
  currentState: CurrentState,
  data: ArchiveCommentSchema & { id: number; createdBy: string }
) => {
  try {
    // Create archive comment
    await prisma.archiveComment.create({
      data: {
        academicYear: { connect: { id: data.id } },
        comment: data.comment,
        action: data.action,
        createdBy: data.createdBy
      }
    });

    // Archive the academic year
    await prisma.academicYear.update({
      where: { id: data.id },
      data: {
        status: "INACTIVE",
        isCurrent: false,
        archivedAt: new Date()
      }
    });

    revalidatePath("/list/academic-years");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const restoreAcademicYear = async (
  currentState: CurrentState,
  data: ArchiveCommentSchema & { id: number; createdBy: string }
) => {
  try {
    // Create archive comment
    await prisma.archiveComment.create({
      data: {
        academicYear: { connect: { id: data.id } },
        comment: data.comment,
        action: data.action,
        createdBy: data.createdBy
      }
    });

    // Restore the academic year
    await prisma.academicYear.update({
      where: { id: data.id },
      data: {
        status: "ACTIVE",
        restoredAt: new Date()
      }
    });

    revalidatePath("/list/academic-years");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAcademicYear = async (
  currentState: CurrentState,
  data: ArchiveCommentSchema & { id: number; createdBy: string }
) => {
  try {
    // Check if academic year is being used by classes
    const classCount = await prisma.class.count({
      where: { academicYearId: data.id }
    });

    if (classCount > 0) {
      return { 
        success: false, 
        error: true, 
        message: "Cannot delete academic year that is being used by classes" 
      };
    }

    // Create archive comment
    await prisma.archiveComment.create({
      data: {
        academicYear: { connect: { id: data.id } },
        comment: data.comment,
        action: data.action,
        createdBy: data.createdBy
      }
    });

    // Delete the academic year (will cascade delete semesters)
    await prisma.academicYear.delete({
      where: { id: data.id }
    });

    revalidatePath("/list/academic-years");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// EVENT ACTIONS

export const createEvent = async (
  currentState: { success: boolean; error: boolean },
  data: EventSchema
) => {
  try {
    await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        targetAudience: data.targetAudience,
        isAllBranches: data.isAllBranches ?? true,
        branchIds: data.branchIds || [],
        classIds: data.classIds || [],
        userIds: data.userIds || [],
        studentIds: data.studentIds || [],
        teacherIds: data.teacherIds || [],
        parentIds: data.parentIds || [],
        createdBy: data.createdBy || "system"
      },
    });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateEvent = async (
  currentState: { success: boolean; error: boolean },
  data: EventSchema
) => {
  try {
    await prisma.event.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        targetAudience: data.targetAudience,
        isAllBranches: data.isAllBranches ?? true,
        branchIds: data.branchIds || [],
        classIds: data.classIds || [],
        userIds: data.userIds || [],
        studentIds: data.studentIds || [],
        teacherIds: data.teacherIds || [],
        parentIds: data.parentIds || []
      },
    });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteEvent = async (
  currentState: { success: boolean; error: boolean },
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    // Delete associated participations first
    await prisma.eventParticipation.deleteMany({
      where: { eventId: parseInt(id) }
    });
    
    // Delete the event
    await prisma.event.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// ANNOUNCEMENT ACTIONS

export const createAnnouncement = async (
  currentState: { success: boolean; error: boolean },
  data: AnnouncementSchema
) => {
  try {
    await prisma.announcement.create({
      data: {
        title: data.title,
        description: data.description,
        date: new Date(data.date),
        targetAudience: data.targetAudience,
        isAllBranches: data.isAllBranches ?? true,
        branchIds: data.branchIds || [],
        classIds: data.classIds || [],
        userIds: data.userIds || [],
        studentIds: data.studentIds || [],
        teacherIds: data.teacherIds || [],
        parentIds: data.parentIds || [],
        createdBy: data.createdBy || "system"
      },
    });

    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAnnouncement = async (
  currentState: { success: boolean; error: boolean },
  data: AnnouncementSchema
) => {
  try {
    await prisma.announcement.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        description: data.description,
        date: new Date(data.date),
        targetAudience: data.targetAudience,
        isAllBranches: data.isAllBranches ?? true,
        branchIds: data.branchIds || [],
        classIds: data.classIds || [],
        userIds: data.userIds || [],
        studentIds: data.studentIds || [],
        teacherIds: data.teacherIds || [],
        parentIds: data.parentIds || []
      },
    });

    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAnnouncement = async (
  currentState: { success: boolean; error: boolean },
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.announcement.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// Legacy message action for backward compatibility
export const sendMessage = async (
  currentState: CurrentState,
  data: MessageSchema & { senderId: string }
) => {
  try {
    await prisma.message.create({
      data: {
        senderId: data.senderId,
        receiverId: data.receiverId,
        subject: data.subject,
        body: data.content, // Map content to body field
        status: "SENT",
        role: "USER", // Default role
      },
    });

    revalidatePath("/admin/messages");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const resetTeacherPassword = async (
  currentState: { success: boolean; error: boolean; message: string },
  formData: FormData
) => {
  const data = Object.fromEntries(formData.entries());

  if (!data.userId || !data.newPassword) {
    return { success: false, error: true, message: "Invalid data" };
  }

  try {
    const hashedPassword = await AuthService.hashPassword(String(data.newPassword));

    await prisma.teacher.update({
      where: { teacherId: String(data.userId) },
      data: { password: hashedPassword },
    });

    // Log the action
    await prisma.archiveComment.create({
      data: {
        comment: `Password reset for teacher ID: ${data.userId}`,
        action: 'PASSWORD_RESET',
        createdBy: String(data.currentUserId),
        teacherId: String(data.userId),
      },
    });

    revalidatePath("/admin/list/teachers");
    return { success: true, error: false, message: "Password has been reset successfully!" };
  } catch (err) {
    console.error("Error resetting teacher password:", err);
    return { success: false, error: true, message: "Failed to reset password." };
  }
};
