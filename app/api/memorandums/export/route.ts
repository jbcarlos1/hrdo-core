import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
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

  const searchParams = new URL(request.url).searchParams;
  const search = searchParams.get("search") || "";
  const memorandumState = searchParams.get("memorandumState");
  const issuingOfficeFilter = searchParams.get("issuingOffice") || "";
  const signatoryFilter = searchParams.get("signatory") || "";
  const divisionFilter = searchParams.get("division") || "";
  const sectionFilter = searchParams.get("section") || "";
  const [sortField, sortOrder] = (searchParams.get("sort") || "createdAt:desc").split(":");

  try {
    let data: any[] = [];
    let headers: string[] = [];

    const memorandums = await db.memorandum.findMany({
      where: {
        memoNumber: { contains: search, mode: "insensitive" },
        isArchived: memorandumState === "archived",
        ...(issuingOfficeFilter && { issuingOffice: issuingOfficeFilter }),
        ...(signatoryFilter && { signatory: signatoryFilter }),
        ...(divisionFilter && { division: divisionFilter }),
        ...(sectionFilter && { section: sectionFilter }),
      },
      orderBy: {
        [sortField]: sortOrder.toLowerCase() as Prisma.SortOrder,
      },
      select: {
        id: true,
        memoNumber: true,
        issuingOffice: true,
        signatory: true,
        subject: true,
        date: true,
      },
    });

    headers = ["Memo ID", "Memo Number", "Issuing Office/Agency", "Signatory", "Subject", "Date"];

    data = memorandums.map((memorandum) => ({
      "Memorandum ID": memorandum.id,
      "Memo Number": memorandum.memoNumber,
      "Issuing Office/Agency": memorandum.issuingOffice,
      Signatory: memorandum.signatory,
      Subject: memorandum.subject,
      Date: memorandum.date,
    }));

    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            return `"${String(value || "").replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="inventory report-${
          new Date().toISOString().split("T")[0]
        }.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
