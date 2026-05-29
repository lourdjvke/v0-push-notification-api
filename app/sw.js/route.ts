import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { addCorsHeaders } from '@/lib/cors';

/**
 * GET /sw.js
 * Serves the service worker with CORS headers
 */
export async function GET(request: NextRequest) {
  try {
    // Read sw.js from public directory
    const filePath = path.join(process.cwd(), 'public', 'sw.js');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Create response with JavaScript content type
    const response = new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Service-Worker-Allowed': '/',
        'Cache-Control': 'public, max-age=3600',
      },
    });

    // Add CORS headers
    return addCorsHeaders(response);
  } catch (error) {
    console.error('[v0] Error serving sw.js:', error);
    const response = new NextResponse('console.error("Failed to load service worker")', {
      status: 500,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
      },
    });
    return addCorsHeaders(response);
  }
}

/**
 * Handle OPTIONS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response);
}
