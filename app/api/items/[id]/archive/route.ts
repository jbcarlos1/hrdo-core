import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Status } from "@prisma/client";
import { auth } from "@/auth";

const determineStatus = (
    quantity: number,
    reorderPoint: number,
    isArchived: boolean
): Status =>
    isArchived
        ? quantity === 0
            ? Status.DISCONTINUED
            : Status.PHASED_OUT
        : quantity === 0
        ? Status.OUT_OF_STOCK
        : quantity <= reorderPoint
        ? Status.FOR_REORDER
        : Status.AVAILABLE;

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
            { error: "Item ID is required" },
            { status: 400 }
        );
    }

    try {
        // Using Prisma transaction for atomic operation
        const item = await db.$transaction(async (tx) => {
            const currentItem = await tx.item.findUnique({
                where: { id },
                select: {
                    quantity: true,
                    reorderPoint: true,
                    isArchived: true,
                },
            });

            if (!currentItem) {
                throw new Error("Item not found");
            }

            return tx.item.update({
                where: { id },
                data: {
                    isArchived: !currentItem.isArchived,
                    status: determineStatus(
                        currentItem.quantity,
                        currentItem.reorderPoint,
                        !currentItem.isArchived
                    ),
                },
                select: {
                    id: true,
                    isArchived: true,
                    status: true,
                },
            });
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("Failed to toggle archive status:", error);
        return NextResponse.json(
            { error: "Failed to update archive status" },
            { status: 500 }
        );
    }
}
