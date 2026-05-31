import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const DIST_DIR = "/Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os/projects/brilliantier-web/dist";

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html": return "text/html; charset=utf-8";
    case ".css": return "text/css; charset=utf-8";
    case ".js": case ".mjs": return "application/javascript; charset=utf-8";
    case ".json": return "application/json; charset=utf-8";
    case ".png": return "image/png";
    case ".jpg": case ".jpeg": return "image/jpeg";
    case ".gif": return "image/gif";
    case ".svg": return "image/svg+xml; charset=utf-8";
    case ".ico": return "image/x-icon";
    case ".woff": return "font/woff";
    case ".woff2": return "font/woff2";
    default: return "application/octet-stream";
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path || [];
    let relativePath = pathSegments.join("/");

    // Default to index.html for root or directories
    if (!relativePath || relativePath === "") {
      relativePath = "index.html";
    }

    let filePath = path.join(DIST_DIR, relativePath);

    // Prevent directory traversal attacks
    if (!filePath.startsWith(DIST_DIR)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    try {
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }
    } catch {
      // Check clean URL fallback (adding .html)
      try {
        const withHtml = filePath + ".html";
        await fs.stat(withHtml);
        filePath = withHtml;
      } catch {
        return new NextResponse("Not Found", { status: 404 });
      }
    }

    const data = await fs.readFile(filePath);
    const contentType = getMimeType(filePath);

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (err: any) {
    return new NextResponse(`Error: ${err.message}`, { status: 500 });
  }
}
