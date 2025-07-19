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

    if (!currentUser || !currentUser.isApproved) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
        return NextResponse.json(
            { error: "Document ID is required" },
            { status: 400 }
        );
    }

    try {
        // Using Prisma transaction for atomic operation
        const document = await db.$transaction(async (tx) => {
            const currentDocument = await tx.document.findUnique({
                where: { id },
                select: {
                    quantity: true,
                    reorderPoint: true,
                    isArchived: true,
                },
            });

            if (!currentDocument) {
                throw new Error("Document not found");
            }

            return tx.document.update({
                where: { id },
                data: {
                    isArchived: !currentDocument.isArchived,
                },
                select: {
                    id: true,
                    isArchived: true,
                },
            });
        });

        return NextResponse.json(document);
    } catch (error) {
        console.error("Failed to toggle archive status:", error);
        return NextResponse.json(
            { error: "Failed to update archive status" },
            { status: 500 }
        );
    }
}
