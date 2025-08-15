import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { signatorySchema } from "@/schemas";

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
        const signatories = await db.signatory.findMany({
            orderBy: {
                fullName: "asc",
            },
        });

        return NextResponse.json({ signatories });
    } catch (error) {
        console.error("Error fetching signatories:", error);
        return NextResponse.json(
            { error: "Failed to fetch signatories" },
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

        const signatoryData = {
            fullName: formData.get("fullName") as string,
        };

        const validatedData = signatorySchema.parse(signatoryData);
        const signatory = await db.signatory.create({
            data: {
                fullName: validatedData.fullName,
            },
            select: {
                id: true,
                fullName: true,
            },
        });

        return NextResponse.json(signatory, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json(
                { error: "Validation failed", details: error.message },
                { status: 400 }
            );
        }

        console.error("Error adding signatory:", error);
        return NextResponse.json(
            { error: "Failed to add signatory" },
            { status: 500 }
        );
    }
}
