import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session) {
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
                name: { contains: search, mode: "insensitive" },
                isArchived: memorandumState === "archived",
            },
            orderBy: {
                [sortField]: sortOrder.toLowerCase() as Prisma.SortOrder,
            },
            select: {
                id: true,
                name: true,
                quantity: true,
                reorderPoint: true,
            },
        });

        headers = [
            "Memorandum ID",
            "Memorandum Name",
            "Available Quantity",
            "Reorder Point",
        ];

        data = memorandums.map((memorandum) => ({
            "Memorandum ID": memorandum.id,
            "Memorandum Name": memorandum.name,
            "Available Quantity": memorandum.quantity,
            "Reorder Point": memorandum.reorderPoint,
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
