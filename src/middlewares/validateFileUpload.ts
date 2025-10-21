import { NextRequest, NextResponse } from 'next/server';
import type { RouteHandler } from './authenticateJWT';

type FileValidationOptions = {
  formField: string;
  maxSizeBytes: number;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
};

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
}

export function validateFileUpload(opts: FileValidationOptions) {
  const blockedExtensions = new Set(['.exe', '.html', '.htm', '.js', '.mjs', '.bat', '.sh', '.cmd', '.com', '.msi', '.dll', '.scr']);
  const allowedExt = new Set(opts.allowedExtensions.map(e => e.toLowerCase()));
  const allowedMime = new Set(opts.allowedMimeTypes.map(m => m.toLowerCase()));

  return function (handler: RouteHandler): RouteHandler {
    return async function (request: NextRequest, context?: any, locals?: any) {
      const contentType = request.headers.get('content-type') || '';
      if (!contentType.includes('multipart/form-data')) {
        return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 });
      }

      const formData = await request.formData();
      const files = formData.getAll(opts.formField) as File[];
      if (!files || files.length === 0) {
        return NextResponse.json({ error: 'No files provided' }, { status: 400 });
      }

      for (const file of files) {
        if (file.size === 0) continue;
        if (file.size > opts.maxSizeBytes) {
          return NextResponse.json({ error: 'File too large' }, { status: 400 });
        }
        const ext = getExtension(file.name);
        if (blockedExtensions.has(ext)) {
          return NextResponse.json({ error: 'File type blocked' }, { status: 400 });
        }
        if (!allowedExt.has(ext) && !allowedMime.has((file.type || '').toLowerCase())) {
          return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
        }
      }

      return handler(request, context, locals);
    };
  };
}


