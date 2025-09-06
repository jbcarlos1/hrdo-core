import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { uploadFile, getOrCreateDocumentsFolder } from "@/lib/google-drive";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

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

  if (!file || !file.name.endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
  }

  try {
    const folderId = await getOrCreateDocumentsFolder();

    const fileUrl = await uploadFile(file, folderId, {
      name: currentUser.name || undefined,
      email: currentUser.email || undefined,
    });

    return NextResponse.json({ url: fileUrl });
  } catch (error: any) {
    console.error("[UPLOAD ERROR]", error);

    if (error.message?.includes("Service Account credentials not configured")) {
      return NextResponse.json(
        {
          error: "Google Drive service not configured. Please contact administrator.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
