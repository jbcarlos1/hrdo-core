import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Status } from "@prisma/client";
import { auth } from "@/auth";

interface RequestItem {
    id: string;
    quantity: number;
    item: {
        id: string;
        name: string;
        image: string;
        unit: string;
        quantity: number;
    };
}

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

export async function PUT(
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

    let action: string | null = null;
    let isSupplyIn: boolean;
    let user: string;
    let email: string;
    let items: RequestItem[];
    let requestDate: string;
    let additionalNotes: string;

    if (session?.user?.role !== "USER") {
        try {
            const existingRequest = await db.request.findUnique({
                where: { id },
                select: {
                    status: true,
                },
            });

            if (!existingRequest) {
                return NextResponse.json(
                    { error: "Request not found" },
                    { status: 404 }
                );
            }

            if (existingRequest.status !== "PENDING") {
                return NextResponse.json(
                    {
                        error: "This request has already been approved by another approver. Please refresh the page to view the updated status",
                    },
                    { status: 400 }
                );
            }

            const requestBody = await request.json();
            action = requestBody.action;
            isSupplyIn = requestBody.isSupplyIn;
            user = requestBody.user;
            email = requestBody.email;
            items = requestBody.items;
            requestDate = requestBody.requestDate;
            additionalNotes = requestBody.additionalNotes;

            if (action !== "APPROVE" && action !== "REJECT") {
                return NextResponse.json(
                    { error: "Invalid action" },
                    { status: 400 }
                );
            }

            let updatedRequest;

            // Check for stale data and update quantities
            if (action === "APPROVE") {
                const requestItems = await db.requestItem.findMany({
                    where: { requestId: id },
                    include: {
                        item: {
                            select: {
                                id: true,
                                name: true,
                                quantity: true,
                                reorderPoint: true,
                                isArchived: true,
                            },
                        },
                    },
                });

                // Calculate new quantities and validate
                const insufficientItems: {
                    id: string;
                    name: string;
                    requested: number;
                    available: number;
                }[] = [];
                const itemUpdates = requestItems.map((requestItem) => {
                    const currentItem = requestItem.item;
                    const newQuantity = isSupplyIn
                        ? currentItem.quantity + requestItem.quantity
                        : currentItem.quantity - requestItem.quantity;

                    if (newQuantity < 0 && !isSupplyIn) {
                        insufficientItems.push({
                            id: currentItem.id,
                            name: currentItem.name,
                            requested: requestItem.quantity,
                            available: currentItem.quantity,
                        });
                    }

                    return {
                        id: requestItem.itemId,
                        newQuantity,
                        reorderPoint: currentItem.reorderPoint,
                        isArchived: currentItem.isArchived,
                    };
                });

                if (insufficientItems.length > 0) {
                    const errorMessage =
                        insufficientItems.length === 1
                            ? `Insufficient quantity for "${insufficientItems[0].name}". Requested: ${insufficientItems[0].requested}, Available: ${insufficientItems[0].available}`
                            : `Insufficient quantities for multiple items:\n${insufficientItems
                                  .map(
                                      (item) =>
                                          `- "${item.name}": Requested ${item.requested}, Available ${item.available}`
                                  )
                                  .join("\n")}`;
                    throw new Error(errorMessage);
                }

                // Update quantities and status in transaction
                await db.$transaction([
                    ...itemUpdates.map((update) =>
                        db.item.update({
                            where: { id: update.id },
                            data: {
                                quantity: update.newQuantity,
                                status: determineStatus(
                                    update.newQuantity,
                                    update.reorderPoint,
                                    update.isArchived
                                ),
                            },
                        })
                    ),
                    db.request.update({
                        where: { id },
                        data: {
                            status: "APPROVED",
                            approver: session?.user.name,
                        },
                        select: {
                            id: true,
                            status: true,
                            approver: true,
                        },
                    }),
                ]);

                updatedRequest = await db.request.update({
                    where: { id },
                    data: { status: "APPROVED", approver: session?.user.name },
                    select: {
                        id: true,
                        status: true,
                        approver: true,
                    },
                });
            } else {
                // Reject the request
                updatedRequest = await db.request.update({
                    where: { id },
                    data: { status: "REJECTED", approver: session?.user.name },
                    select: {
                        id: true,
                        status: true,
                        approver: true,
                    },
                });
            }

            return NextResponse.json(updatedRequest);
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "An error occurred while processing the request";
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }
    }
}

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

    try {
        const existingRequest = await db.request.findUnique({
            where: { id },
            select: {
                id: true,
                status: true,
                isSupplyIn: true,
                user: true,
                email: true,
                approver: true,
            },
        });

        if (!existingRequest) {
            return NextResponse.json(
                { error: "Request not found" },
                { status: 404 }
            );
        }

        if (existingRequest.status !== "APPROVED") {
            return NextResponse.json(
                { error: "Only approved requests can be marked as received" },
                { status: 400 }
            );
        }

        if (!existingRequest.isSupplyIn) {
            if (existingRequest.email !== currentUser.email) {
                return NextResponse.json(
                    {
                        error: "Only the person who made the request can mark it as received",
                    },
                    { status: 403 }
                );
            }
        } else {
            if (existingRequest.approver !== currentUser.name) {
                return NextResponse.json(
                    {
                        error: "Only the approver of this request can mark it as received",
                    },
                    { status: 403 }
                );
            }
        }

        const updatedRequest = await db.request.update({
            where: { id },
            data: { isReceived: true },
            select: {
                id: true,
                isReceived: true,
            },
        });

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error("Error marking request as received:", error);
        const errorMessage =
            error instanceof Error
                ? error.message
                : "An error occurred while processing the request";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
