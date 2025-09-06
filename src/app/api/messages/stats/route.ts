import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get message statistics
    const [
      totalSent,
      totalReceived,
      unreadReceived,
      readReceived,
    ] = await Promise.all([
      // Total messages sent by this user
      prisma.message.count({
        where: { senderId: userId },
      }),
      
      // Total messages received by this user
      prisma.message.count({
        where: { receiverId: userId },
      }),
      
      // Unread messages received
      prisma.message.count({
        where: {
          receiverId: userId,
          status: { in: ["SENT", "DELIVERED"] },
        },
      }),
      
      // Read messages received
      prisma.message.count({
        where: {
          receiverId: userId,
          status: "READ",
        },
      }),
    ]);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      recentSent,
      recentReceived,
    ] = await Promise.all([
      prisma.message.count({
        where: {
          senderId: userId,
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
      
      prisma.message.count({
        where: {
          receiverId: userId,
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
    ]);

    const stats = {
      total: {
        sent: totalSent,
        received: totalReceived,
        unread: unreadReceived,
        read: readReceived,
      },
      recent: {
        sent: recentSent,
        received: recentReceived,
      },
      unreadPercentage: totalReceived > 0 ? Math.round((unreadReceived / totalReceived) * 100) : 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching message statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch message statistics" },
      { status: 500 }
    );
  }
}
