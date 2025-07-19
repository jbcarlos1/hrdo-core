import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Status } from "@prisma/client";
import { uploadImage, deleteImage } from "@/lib/cloudinary";
import { auth } from "@/auth";
import { itemSchema } from "@/schemas";

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

    if (!id) {
        return NextResponse.json(
            { error: "Item ID is required" },
            { status: 400 }
        );
    }

    try {
        const formData = await request.formData();

        const itemWithRequests = await db.item.findUnique({
            where: { id },
            include: {
                RequestItem: true,
            },
        });

        if (!itemWithRequests) {
            return NextResponse.json(
                { error: "Item not found" },
                { status: 404 }
            );
        }

        const hasRequests = itemWithRequests.RequestItem.length > 0;

        const itemData = {
            name: formData.get("name") as string,
            quantity: parseInt(formData.get("quantity") as string),
            unit: formData.get("unit") as string,
            reorderPoint: parseInt(formData.get("reorderPoint") as string),
            status: determineStatus(
                parseInt(formData.get("quantity") as string),
                parseInt(formData.get("reorderPoint") as string),
                itemWithRequests.isArchived
            ),
            location: formData.get("location") as string,
            image: formData.get("image") as string,
        };

        const validatedData = itemSchema.parse(itemData);

        // Using transaction for atomic operations
        const updatedItem = await db.$transaction(async (tx) => {
            const currentItem = await tx.item.findUnique({
                where: { id },
                select: {
                    image: true,
                    isArchived: true,
                },
            });

            if (!currentItem) {
                throw new Error("Item not found");
            }

            let imageUrl: string | undefined;
            const newImage = formData.get("image") as string;

            // Only process image if it's a new data URL
            if (newImage?.startsWith("data:")) {
                if (currentItem.image) {
                    await deleteImage(currentItem.image);
                }
                const uploadResponse = await uploadImage(newImage);
                imageUrl = uploadResponse.secure_url;
            }

            const updateData = hasRequests
                ? {
                      reorderPoint: validatedData.reorderPoint,
                      location: validatedData.location,
                      status: validatedData.status,
                      ...(imageUrl && { image: imageUrl }),
                  }
                : {
                      name: validatedData.name,
                      quantity: validatedData.quantity,
                      unit: validatedData.unit,
                      reorderPoint: validatedData.reorderPoint,
                      status: validatedData.status,
                      location: validatedData.location,
                      ...(imageUrl && { image: imageUrl }),
                  };

            return tx.item.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    name: true,
                    quantity: true,
                    unit: true,
                    reorderPoint: true,
                    status: true,
                    location: true,
                    image: true,
                    isArchived: true,
                },
            });
        });

        return NextResponse.json(updatedItem);
    } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json(
                { error: "Validation failed", details: error.message },
                { status: 400 }
            );
        }

        console.error("Failed to update item:", error);
        return NextResponse.json(
            { error: "Failed to update item" },
            { status: 500 }
        );
    }
}

export async function DELETE(
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
        const itemWithRequests = await db.item.findUnique({
            where: { id },
            include: {
                RequestItem: true,
            },
        });

        if (!itemWithRequests) {
            return NextResponse.json(
                { error: "Item not found" },
                { status: 404 }
            );
        }

        if (itemWithRequests.RequestItem.length > 0) {
            return NextResponse.json(
                { error: "Cannot delete item with associated requests" },
                { status: 400 }
            );
        }

        await db.$transaction(async (tx) => {
            const item = await tx.item.findUnique({
                where: { id },
                select: { image: true },
            });

            if (item?.image) {
                await deleteImage(item.image);
            }

            await tx.item.delete({
                where: { id },
            });
        });

        return NextResponse.json({ message: "Item deleted successfully" });
    } catch (error) {
        console.error("Failed to delete item:", error);
        return NextResponse.json(
            { error: "Failed to delete item" },
            { status: 500 }
        );
    }
}
