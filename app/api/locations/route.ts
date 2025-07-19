import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const locations = await db.location.findMany({
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json({ locations });
    } catch (error) {
        console.error("Error fetching locations:", error);
        return NextResponse.json(
            { error: "Failed to fetch locations" },
            { status: 500 }
        );
    }
}
