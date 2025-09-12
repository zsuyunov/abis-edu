import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/');
    const fullPath = join(process.cwd(), 'public', 'uploads', filePath);

    console.log('File serving request:', {
      requestedPath: filePath,
      fullPath: fullPath,
      exists: existsSync(fullPath)
    });

    // Check if file exists
    if (!existsSync(fullPath)) {
      console.log('File not found:', fullPath);
      return new NextResponse('File not found', { status: 404 });
    }

    // Read the file
    const fileBuffer = await readFile(fullPath);
    
    // Determine content type based on file extension
    const extension = filePath.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'webm': 'audio/webm',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
      'mp4': 'video/mp4',
      'txt': 'text/plain'
    };

    if (extension && mimeTypes[extension]) {
      contentType = mimeTypes[extension];
    }

    // Set headers for proper file serving
    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Length': fileBuffer.length.toString(),
      'Cache-Control': 'public, max-age=31536000',
    });

    // For audio files, add range support for better playback
    if (contentType.startsWith('audio/')) {
      headers.set('Accept-Ranges', 'bytes');
    }

    return new NextResponse(fileBuffer, { headers });

  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
