"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { StudentAssignmentSchema } from "@/lib/formValidationSchemas";

type CurrentState = { success: boolean; error: boolean; message?: string };

export const createStudentAssignment = async (
  currentState: CurrentState,
  data: StudentAssignmentSchema
) => {
  try {
    console.log("🚀 [Action Start] createStudentAssignment", { data });

    // Validate required fields
    if (!data.studentId || !data.classId || !data.academicYearId || !data.branchId) {
      const message = "Student, branch, class and academic year are required";
      console.error("❌ [Validation Error]", message);
      return { success: false, error: true, message };
    }

    // First, check if the student exists
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      select: { id: true, classId: true, firstName: true, lastName: true, studentId: true }
    });

    if (!student) {
      const message = `Student with ID ${data.studentId} not found in database. The student may have been deleted.`;
      console.error("❌ [Student Not Found]", message);
      return { success: false, error: true, message };
    }

    // Check if student is already assigned to a class
    if (student.classId !== null) {
      const message = `${student.firstName} ${student.lastName} (${student.studentId}) is already assigned to a class`;
      console.error("❌ [Duplicate Error]", message);
      return { success: false, error: true, message };
    }

    // Update the student with class and branch assignment
    await prisma.student.update({
      where: { id: data.studentId },
      data: {
        classId: parseInt(data.classId.toString()),
        branchId: parseInt(data.branchId.toString()),
      },
    });

    console.log(`✅ Student assignment created successfully for ${student.firstName} ${student.lastName}`);
    
    revalidatePath("/admin/student-assignments");
    revalidatePath("/admin/list/students");
    return { success: true, error: false, message: "Student assigned successfully!" };
  } catch (error) {
    console.error("❌ Error creating student assignment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { 
      success: false, 
      error: true, 
      message: `Failed to create student assignment: ${errorMessage}` 
    };
  }
};

export const updateStudentAssignment = async (
  currentState: CurrentState,
  data: StudentAssignmentSchema
) => {
  try {
    console.log("🚀 [Action Start] updateStudentAssignment", { data });

    // Validate required fields
    if (!data.studentId || !data.classId || !data.academicYearId || !data.branchId) {
      const message = "Student, branch, class and academic year are required";
      console.error("❌ [Validation Error]", message);
      return { success: false, error: true, message };
    }

    // First, check if the student exists
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      select: { id: true, firstName: true, lastName: true, studentId: true }
    });

    if (!student) {
      const message = `Student with ID ${data.studentId} not found in database. The student may have been deleted.`;
      console.error("❌ [Student Not Found]", message);
      return { success: false, error: true, message };
    }

    // Update the student assignment
    await prisma.student.update({
      where: { id: data.studentId },
      data: {
        classId: parseInt(data.classId.toString()),
        branchId: parseInt(data.branchId.toString()),
      },
    });

    console.log(`✅ Student assignment updated successfully for ${student.firstName} ${student.lastName}`);
    
    revalidatePath("/admin/student-assignments");
    revalidatePath("/admin/list/students");
    return { success: true, error: false, message: "Student assignment updated successfully!" };
  } catch (error) {
    console.error("❌ Error updating student assignment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { 
      success: false, 
      error: true, 
      message: `Failed to update student assignment: ${errorMessage}` 
    };
  }
};

export const deleteStudentAssignment = async (
  currentState: CurrentState,
  data: FormData
) => {
  try {
    if (!data) {
      return { 
        success: false, 
        error: true, 
        message: "No data provided" 
      };
    }

    const studentId = data.get("studentId") as string;
    const comment = data.get("comment") as string;
    const currentUserId = data.get("currentUserId") as string;

    console.log("🚀 [Action Start] deleteStudentAssignment", { 
      studentId, 
      comment 
    });

    if (!studentId) {
      return { 
        success: false, 
        error: true, 
        message: "Student ID is required" 
      };
    }

    if (!comment || comment.length < 10) {
      return { 
        success: false, 
        error: true, 
        message: "Please provide a reason for deletion (minimum 10 characters)" 
      };
    }

    // Find the student
    const student = await prisma.student.findFirst({
      where: { id: studentId },
    });

    if (!student) {
      return { 
        success: false, 
        error: true, 
        message: "Student not found" 
      };
    }

    // Remove the assignment and add archive comment
    await prisma.$transaction(async (tx) => {
      // Add archive comment
      await tx.archiveComment.create({
        data: {
          student: { connect: { id: studentId } },
          comment: comment,
          action: "DELETE_ASSIGNMENT",
          createdBy: currentUserId || "admin",
        },
      });

      // Remove the assignment by setting classId and branchId to null
      await tx.student.update({
        where: { id: studentId },
        data: {
          classId: null,
          branchId: null,
        },
      });
    });

    console.log("✅ Student assignment deleted successfully");
    
    revalidatePath("/admin/student-assignments");
    console.log("✅ Student assignment deleted successfully, returning success response");
    return { 
      success: true, 
      error: false, 
      message: "Student unassigned successfully!" 
    };
  } catch (error) {
    console.error("❌ Error deleting student assignment:", error);
    return { 
      success: false, 
      error: true, 
      message: "Failed to delete student assignment. Please try again." 
    };
  }
};
