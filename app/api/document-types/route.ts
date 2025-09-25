import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { documentTypeSchema } from "@/schemas";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
  });

  if (!currentUser || !currentUser.isApproved) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const documentTypes = await db.documentType.findMany({
      orderBy: {
        documentType: "asc",
      },
    });

    return NextResponse.json({ documentTypes });
  } catch (error) {
    console.error("Error fetching document types:", error);
    return NextResponse.json({ error: "Failed to fetch document types" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

  try {
    const formData = await request.formData();

    const documentTypeData = {
      documentType: formData.get("documentType") as string,
    };

    const validatedData = documentTypeSchema.parse(documentTypeData);
    const documentType = await db.documentType.create({
      data: {
        documentType: validatedData.documentType,
      },
      select: {
        id: true,
        documentType: true,
      },
    });

    return NextResponse.json(documentType, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.message },
        { status: 400 }
      );
    }

    console.error("Error adding document type:", error);
    return NextResponse.json({ error: "Failed to add document type" }, { status: 500 });
  }
}
