import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma, Status } from "@prisma/client";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const itemState = searchParams.get("itemState");
    const [sortField, sortOrder] = (
        searchParams.get("sort") || "createdAt:desc"
    ).split(":");

    try {
        let data: any[] = [];
        let headers: string[] = [];

        const items = await db.item.findMany({
            where: {
                name: { contains: search, mode: "insensitive" },
                ...(status && { status: status as Status }),
                isArchived: itemState === "archived",
            },
            orderBy: {
                [sortField]: sortOrder.toLowerCase() as Prisma.SortOrder,
            },
            select: {
                id: true,
                name: true,
                quantity: true,
                unit: true,
                reorderPoint: true,
                status: true,
                location: true,
            },
        });

        headers = [
            "Item ID",
            "Item Name",
            "Available Quantity",
            "Unit",
            "Reorder Point",
            "Status",
            "Location",
        ];

        data = items.map((item) => ({
            "Item ID": item.id,
            "Item Name": item.name,
            "Available Quantity": item.quantity,
            Unit: item.unit,
            "Reorder Point": item.reorderPoint,
            Status: item.status,
            Location: item.location,
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
