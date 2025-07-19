import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ids = request.nextUrl.searchParams.get("ids")?.split(",") || [];

    if (ids.length === 0) {
        return NextResponse.json(
            { error: "No document IDs provided" },
            { status: 400 }
        );
    }

    try {
        const documents = await db.document.findMany({
            where: {
                id: { in: ids },
            },
            select: {
                id: true,
                name: true,
                quantity: true,
                image: true,
            },
        });

        return NextResponse.json(documents);
    } catch (error) {
        console.error("Failed to fetch documents:", error);
        return NextResponse.json(
            { error: "Failed to fetch documents" },
            { status: 500 }
        );
    }
}
