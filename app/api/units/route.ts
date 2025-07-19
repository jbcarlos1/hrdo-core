import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const units = await db.unit.findMany({
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json({ units });
    } catch (error) {
        console.error("Error fetching units:", error);
        return NextResponse.json(
            { error: "Failed to fetch units" },
            { status: 500 }
        );
    }
}
