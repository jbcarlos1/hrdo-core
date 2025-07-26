import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { addresseeSchema } from "@/schemas";

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const addressees = await db.addressee.findMany({
            orderBy: {
                recipient: "asc",
            },
        });

        return NextResponse.json({ addressees });
    } catch (error) {
        console.error("Error fetching addressees:", error);
        return NextResponse.json(
            { error: "Failed to fetch addressees" },
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

        const addresseeData = {
            recipient: formData.get("recipient") as string,
        };

        const validatedData = addresseeSchema.parse(addresseeData);
        const addressee = await db.addressee.create({
            data: {
                recipient: validatedData.recipient,
            },
            select: {
                id: true,
                recipient: true,
            },
        });

        return NextResponse.json(addressee, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json(
                { error: "Validation failed", details: error.message },
                { status: 400 }
            );
        }

        console.error("Error adding addressee:", error);
        return NextResponse.json(
            { error: "Failed to add addressee" },
            { status: 500 }
        );
    }
}
