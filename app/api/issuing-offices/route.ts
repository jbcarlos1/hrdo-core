import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { issuingOfficeSchema } from "@/schemas";

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
        where: { id: session.user.id },
    });

    if (
        !currentUser ||
        !currentUser.isApproved ||
        currentUser.role !== "ADMIN"
    ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const issuingOffices = await db.issuingOffice.findMany({
            orderBy: {
                unitCode: "asc",
            },
        });

        return NextResponse.json({ issuingOffices });
    } catch (error) {
        console.error("Error fetching offices/agencies:", error);
        return NextResponse.json(
            { error: "Failed to fetch offices/agencies" },
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

    if (
        !currentUser ||
        !currentUser.isApproved ||
        currentUser.role !== "ADMIN"
    ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();

        const issuingOfficeData = {
            unitCode: formData.get("unitCode") as string,
            unit: formData.get("unit") as string,
        };

        const validatedData = issuingOfficeSchema.parse(issuingOfficeData);
        const issuingOffice = await db.issuingOffice.create({
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

        return NextResponse.json(issuingOffice, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json(
                { error: "Validation failed", details: error.message },
                { status: 400 }
            );
        }

        console.error("Error adding office/agency:", error);
        return NextResponse.json(
            { error: "Failed to add office/agency" },
            { status: 500 }
        );
    }
}
