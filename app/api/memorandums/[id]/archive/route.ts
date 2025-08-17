import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { params } = context;
    const { id } = await params;
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

    if (!id) {
        return NextResponse.json(
            { error: "Memorandum ID is required" },
            { status: 400 }
        );
    }

    try {
        // Using Prisma transaction for atomic operation
        const memorandum = await db.$transaction(async (tx) => {
            const currentMemorandum = await tx.memorandum.findUnique({
                where: { id },
                select: {
                    isArchived: true,
                },
            });

            if (!currentMemorandum) {
                throw new Error("Memorandum not found");
            }

            return tx.memorandum.update({
                where: { id },
                data: {
                    isArchived: !currentMemorandum.isArchived,
                },
                select: {
                    id: true,
                    isArchived: true,
                },
            });
        });

        return NextResponse.json(memorandum);
    } catch (error) {
        console.error("Failed to toggle archive status:", error);
        return NextResponse.json(
            { error: "Failed to update archive status" },
            { status: 500 }
        );
    }
}
