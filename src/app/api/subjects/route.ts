import { NextResponse } from "next/server";

// Temporary API with mock data until database migration is applied

export async function GET() {
  try {
    // Return mock subjects data
    const subjects = [
      { id: 1, name: "Mathematics", status: "ACTIVE" },
      { id: 2, name: "English Language", status: "ACTIVE" },
      { id: 3, name: "Science", status: "ACTIVE" },
      { id: 4, name: "History", status: "ACTIVE" },
      { id: 5, name: "Geography", status: "ACTIVE" },
      { id: 6, name: "Physical Education", status: "ACTIVE" },
      { id: 7, name: "Art", status: "ACTIVE" },
      { id: 8, name: "Music", status: "ACTIVE" },
      { id: 9, name: "Computer Science", status: "ACTIVE" },
      { id: 10, name: "Biology", status: "ACTIVE" },
      { id: 11, name: "Chemistry", status: "ACTIVE" },
      { id: 12, name: "Physics", status: "ACTIVE" },
      { id: 13, name: "French", status: "ACTIVE" },
      { id: 14, name: "Spanish", status: "ACTIVE" },
      { id: 15, name: "Drama", status: "ACTIVE" }
    ];
    
    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Failed to fetch subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}
