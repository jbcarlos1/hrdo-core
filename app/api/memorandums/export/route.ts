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

    if (!currentUser || !currentUser.isApproved) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const search = searchParams.get("search") || "";
    const memorandumState = searchParams.get("memorandumState");
    const [sortField, sortOrder] = (
        searchParams.get("sort") || "createdAt:desc"
    ).split(":");

    try {
        let data: any[] = [];
        let headers: string[] = [];

        const memorandums = await db.memorandum.findMany({
            where: {
                memoNumber: { contains: search, mode: "insensitive" },
                isArchived: memorandumState === "archived",
            },
            orderBy: {
                [sortField]: sortOrder.toLowerCase() as Prisma.SortOrder,
            },
            select: {
                id: true,
                memoNumber: true,
                sender: true,
                senderUnit: true,
                subject: true,
                date: true,
            },
        });

        headers = [
            "Memo ID",
            "Memo Number",
            "Sender",
            "Sender's Unit",
            "Subject",
            "Date",
        ];

        data = memorandums.map((memorandum) => ({
            "Memorandum ID": memorandum.id,
            "Memo Number": memorandum.memoNumber,
            Sender: memorandum.sender,
            "Sender's Unit": memorandum.senderUnit,
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
        return NextResponse.json(
            { error: "Failed to export data" },
            { status: 500 }
        );
    }
}
