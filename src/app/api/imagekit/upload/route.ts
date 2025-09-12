import { NextRequest, NextResponse } from "next/server";
import imagekit from "@/lib/imagekit";
import jwt from "jsonwebtoken";
import { generateUniqueFileName, validateFileType, validateFileSize } from "@/lib/imagekit";

export async function POST(request: NextRequest) {
  // Verify JWT token
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.substring(7);
  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string || "homework";
    const fileType = formData.get("type") as string || "document";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type based on category
    let allowedTypes: string[] = [];
    let maxSizeMB = 10; // Default 10MB

    switch (fileType) {
      case "image":
        allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        maxSizeMB = 5; // 5MB for images
        break;
      case "document":
        allowedTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/plain"
        ];
        maxSizeMB = 25; // 25MB for documents
        break;
      case "audio":
        allowedTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"];
        maxSizeMB = 15; // 15MB for audio
        break;
      default:
        return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Validate file type
    if (!validateFileType(file, allowedTypes)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (!validateFileSize(file, maxSizeMB)) {
      return NextResponse.json(
        { error: `File size exceeds ${maxSizeMB}MB limit` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const uniqueFileName = generateUniqueFileName(file.name, `${decoded.role}_${decoded.id}`);

    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: uniqueFileName,
      folder: `/${folder}/${fileType}s`,
      tags: [fileType, folder, decoded.role, decoded.id],
      customMetadata: {
        uploadedBy: decoded.id,
        userRole: decoded.role,
        originalName: file.name,
        uploadDate: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      file: {
        id: uploadResponse.fileId,
        name: uploadResponse.name,
        url: uploadResponse.url,
        thumbnailUrl: uploadResponse.thumbnailUrl,
        filePath: uploadResponse.filePath,
        size: uploadResponse.size,
        fileType: uploadResponse.fileType,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("ImageKit upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
