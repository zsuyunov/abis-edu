import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
// Using Date.now() for unique IDs instead of uuid

export async function POST(request: NextRequest) {
  try {
    const teacherId = request.headers.get('x-user-id');
    if (!teacherId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('attachments') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedAttachments = [];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'homework');
    
    // Ensure upload directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    for (const file of files) {
      if (file.size === 0) continue;
      
      const bytes = await file.arrayBuffer();
      
      // Generate unique filename
      const fileExtension = path.extname(file.name);
      const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(2)}${fileExtension}`;
      const filePath = path.join(uploadDir, uniqueFilename);
      const publicPath = `/uploads/homework/${uniqueFilename}`;
      
      // Write file to disk
      await writeFile(filePath, new Uint8Array(bytes));
      
      // Map file type to attachment type
      let attachmentType = 'DOCUMENT';
      if (file.type.startsWith('image/')) {
        attachmentType = 'IMAGE';
      } else if (file.type.startsWith('audio/')) {
        attachmentType = 'AUDIO';
      } else if (file.type.startsWith('video/')) {
        attachmentType = 'VIDEO';
      }

      // Create attachment object
      const attachment = {
        fileName: uniqueFilename,
        originalName: file.name,
        fileType: attachmentType,
        mimeType: file.type,
        fileUrl: publicPath,
        filePath: publicPath,
        fileSize: file.size,
        duration: file.type.startsWith('audio/') ? null : null, // Could be enhanced to detect audio duration
      };
      
      console.log('📁 Upload attachment created:', {
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        fileType: attachment.fileType,
        originalName: attachment.originalName
      });
      
      uploadedAttachments.push(attachment);
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedAttachments.length} files uploaded successfully`,
      attachments: uploadedAttachments,
    });

  } catch (error) {
    console.error("Error uploading attachments:", error);
    return NextResponse.json(
      { error: "Failed to upload attachments" },
      { status: 500 }
    );
  }
}
