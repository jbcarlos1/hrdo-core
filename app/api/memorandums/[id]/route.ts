import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { memorandumSchema } from "@/schemas";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
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

  if (!currentUser.name || !currentUser.division || !currentUser.section) {
    return NextResponse.json({ error: "Incomplete user profile" }, { status: 400 });
  }

  if (!id) {
    return NextResponse.json({ error: "Memorandum ID is required" }, { status: 400 });
  }

  try {
    const formData = await request.formData();

    const MemorandumData = {
      memoNumber: formData.get("memoNumber") as string,
      issuingOffice: formData.get("issuingOffice") as string,
      signatory: formData.get("signatory") as string,
      subject: formData.get("subject") as string,
      date: formData.get("date") as string,
      keywords: formData.get("keywords") as string,
      pdfUrl: formData.get("pdfUrl") as string,
    };

    const validatedData = memorandumSchema.parse(MemorandumData);

    if (!validatedData.date) {
      throw new Error("Date is required");
    }
    const dateObj = new Date(validatedData.date);

    const updateData = {
      memoNumber: validatedData.memoNumber,
      issuingOffice: validatedData.issuingOffice,
      signatory: validatedData.signatory,
      subject: validatedData.subject,
      date: dateObj,
      keywords: validatedData.keywords,
      pdfUrl: validatedData.pdfUrl,
      encoder: currentUser.name,
      division: currentUser.division,
      section: currentUser.section,
    };

    const updatedMemorandum = await db.memorandum.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        memoNumber: true,
        issuingOffice: true,
        signatory: true,
        subject: true,
        date: true,
        keywords: true,
        pdfUrl: true,
        isArchived: true,
        encoder: true,
        division: true,
        section: true,
      },
    });

    return NextResponse.json(updatedMemorandum);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.message },
        { status: 400 }
      );
    }

    console.error("Failed to update memorandum:", error);
    return NextResponse.json({ error: "Failed to update memorandum" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
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

  if (!id) {
    return NextResponse.json({ error: "Memorandum ID is required" }, { status: 400 });
  }

  try {
    await db.memorandum.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Memorandum deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete memorandum:", error);
    return NextResponse.json({ error: "Failed to delete memorandum" }, { status: 500 });
  }
}
