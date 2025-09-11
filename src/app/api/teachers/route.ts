import { NextRequest, NextResponse } from "next/server";

// Temporary API with mock data until database migration is applied

export async function GET(request: NextRequest) {
  try {
    // Return mock teachers data
    const teachers = [
      { id: "1", firstName: "John", lastName: "Smith", teacherId: "T001", status: "ACTIVE" },
      { id: "2", firstName: "Sarah", lastName: "Johnson", teacherId: "T002", status: "ACTIVE" },
      { id: "3", firstName: "Michael", lastName: "Brown", teacherId: "T003", status: "ACTIVE" },
      { id: "4", firstName: "Emily", lastName: "Davis", teacherId: "T004", status: "ACTIVE" },
      { id: "5", firstName: "David", lastName: "Wilson", teacherId: "T005", status: "ACTIVE" },
      { id: "6", firstName: "Lisa", lastName: "Anderson", teacherId: "T006", status: "ACTIVE" },
      { id: "7", firstName: "Robert", lastName: "Taylor", teacherId: "T007", status: "ACTIVE" },
      { id: "8", firstName: "Jennifer", lastName: "Thomas", teacherId: "T008", status: "ACTIVE" },
      { id: "9", firstName: "William", lastName: "Jackson", teacherId: "T009", status: "ACTIVE" },
      { id: "10", firstName: "Amanda", lastName: "White", teacherId: "T010", status: "ACTIVE" },
      { id: "11", firstName: "Christopher", lastName: "Harris", teacherId: "T011", status: "ACTIVE" },
      { id: "12", firstName: "Michelle", lastName: "Martin", teacherId: "T012", status: "ACTIVE" },
      { id: "13", firstName: "Daniel", lastName: "Thompson", teacherId: "T013", status: "ACTIVE" },
      { id: "14", firstName: "Jessica", lastName: "Garcia", teacherId: "T014", status: "ACTIVE" },
      { id: "15", firstName: "Matthew", lastName: "Martinez", teacherId: "T015", status: "ACTIVE" }
    ];

    return NextResponse.json(teachers);
  } catch (error) {
    console.error("Teachers API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch teachers",
      },
      { status: 500 }
    );
  }
}