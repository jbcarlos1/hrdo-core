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
    const documentState = searchParams.get("documentState");
    const [sortField, sortOrder] = (
        searchParams.get("sort") || "createdAt:desc"
    ).split(":");

    try {
        let data: any[] = [];
        let headers: string[] = [];

        const documents = await db.document.findMany({
            where: {
                name: { contains: search, mode: "insensitive" },
                isArchived: documentState === "archived",
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
            "Document ID",
            "Document Name",
            "Available Quantity",
            "Reorder Point",
        ];

        data = documents.map((document) => ({
            "Document ID": document.id,
            "Document Name": document.name,
            "Available Quantity": document.quantity,
            "Reorder Point": document.reorderPoint,
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
