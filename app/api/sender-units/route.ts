import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { senderUnitSchema } from "@/schemas";

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
        const senderUnits = await db.senderUnit.findMany({
            orderBy: {
                unitCode: "asc",
            },
        });

        return NextResponse.json({ senderUnits });
    } catch (error) {
        console.error("Error fetching units:", error);
        return NextResponse.json(
            { error: "Failed to fetch units" },
            { status: 500 }
        );
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

    if (!currentUser || !currentUser.isApproved) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();

        const senderUnitData = {
            unitCode: formData.get("unitCode") as string,
            unit: formData.get("unit") as string,
        };

        const validatedData = senderUnitSchema.parse(senderUnitData);
        const senderUnit = await db.senderUnit.create({
            data: {
                unitCode: validatedData.unitCode,
                unit: validatedData.unit,
            },
            select: {
                id: true,
                unitCode: true,
                unit: true,
            },
        });

        return NextResponse.json(senderUnit, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json(
                { error: "Validation failed", details: error.message },
                { status: 400 }
            );
        }

        console.error("Error adding unit:", error);
        return NextResponse.json(
            { error: "Failed to add unit" },
            { status: 500 }
        );
    }
}
