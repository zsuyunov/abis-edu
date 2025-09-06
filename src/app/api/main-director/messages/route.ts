import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    const userId = headersList.get("x-user-id");

    // Check if user is main director
    if (role !== "main_director") {
      return NextResponse.json(
        { error: "Unauthorized - Main Director access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";

    // Build query for messages sent by or to the main director
    const query: any = {
      OR: [
        { senderId: userId },
        { receiverId: userId },
      ],
    };

    if (search) {
      query.AND = [
        query,
        {
          OR: [
            { text: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const [messages, count] = await Promise.all([
      prisma.message.findMany({
        where: query,
        include: {
          sender: { select: { firstName: true, lastName: true } },
          receiver: { select: { firstName: true, lastName: true } },
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (page - 1),
        orderBy: { createdAt: "desc" },
      }),
      prisma.message.count({ where: query }),
    ]);

    return NextResponse.json({
      success: true,
      data: messages,
      pagination: {
        page,
        totalPages: Math.ceil(count / ITEM_PER_PAGE),
        totalItems: count,
        itemsPerPage: ITEM_PER_PAGE,
      },
    });
  } catch (error) {
    console.error("Main Director messages API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const role = headersList.get("x-user-role");
    const userId = headersList.get("x-user-id");

    // Check if user is main director
    if (role !== "main_director") {
      return NextResponse.json(
        { error: "Unauthorized - Main Director access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { text, receiverId } = body;

    // Validate required fields
    if (!text || !receiverId) {
      return NextResponse.json(
        { error: "Message text and receiver are required" },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        text,
        senderId: userId!,
        receiverId,
        createdAt: new Date(),
      },
      include: {
        sender: { select: { firstName: true, lastName: true } },
        receiver: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: message,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Main Director send message API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
