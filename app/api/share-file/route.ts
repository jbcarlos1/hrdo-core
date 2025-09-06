import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { shareFileWithUser, getFilePermissions } from "@/lib/google-drive";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !currentUser.isApproved || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId, userEmail, role = "reader" } = await req.json();

    if (!fileId || !userEmail) {
      return NextResponse.json({ error: "File ID and user email are required" }, { status: 400 });
    }

    await shareFileWithUser(fileId, userEmail, role);

    return NextResponse.json({
      success: true,
      message: `File shared with ${userEmail} as ${role}`,
    });
  } catch (error: any) {
    console.error("File sharing error:", error);
    return NextResponse.json({ error: "Failed to share file" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !currentUser.isApproved || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    const permissions = await getFilePermissions(fileId);

    return NextResponse.json({ permissions });
  } catch (error: any) {
    console.error("Get permissions error:", error);
    return NextResponse.json({ error: "Failed to get file permissions" }, { status: 500 });
  }
}
