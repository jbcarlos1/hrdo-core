import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadImage, deleteImage } from "@/lib/cloudinary";
import { auth } from "@/auth";
import { documentSchema } from "@/schemas";

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
            { error: "Document ID is required" },
            { status: 400 }
        );
    }

    try {
        const formData = await request.formData();

        const DocumentData = {
            name: formData.get("name") as string,
            quantity: parseInt(formData.get("quantity") as string),
            reorderPoint: parseInt(formData.get("reorderPoint") as string),
            image: formData.get("image") as string,
        };

        const validatedData = documentSchema.parse(DocumentData);

        // Using transaction for atomic operations
        const updatedDocument = await db.$transaction(async (tx) => {
            const currentDocument = await tx.document.findUnique({
                where: { id },
                select: {
                    image: true,
                    isArchived: true,
                },
            });

            if (!currentDocument) {
                throw new Error("Document not found");
            }

            let imageUrl: string | undefined;
            const newImage = formData.get("image") as string;

            // Only process image if it's a new data URL
            if (newImage?.startsWith("data:")) {
                if (currentDocument.image) {
                    await deleteImage(currentDocument.image);
                }
                const uploadResponse = await uploadImage(newImage);
                imageUrl = uploadResponse.secure_url;
            }

            const updateData = {
                name: validatedData.name,
                quantity: validatedData.quantity,
                reorderPoint: validatedData.reorderPoint,
                ...(imageUrl && { image: imageUrl }),
            };

            return tx.document.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    name: true,
                    quantity: true,
                    reorderPoint: true,
                    image: true,
                    isArchived: true,
                },
            });
        });

        return NextResponse.json(updatedDocument);
    } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json(
                { error: "Validation failed", details: error.message },
                { status: 400 }
            );
        }

        console.error("Failed to update document:", error);
        return NextResponse.json(
            { error: "Failed to update document" },
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
            { error: "Document ID is required" },
            { status: 400 }
        );
    }

    try {
        await db.$transaction(async (tx) => {
            const document = await tx.document.findUnique({
                where: { id },
                select: { image: true },
            });

            if (document?.image) {
                await deleteImage(document.image);
            }

            await tx.document.delete({
                where: { id },
            });
        });

        return NextResponse.json({ message: "Document deleted successfully" });
    } catch (error) {
        console.error("Failed to delete document:", error);
        return NextResponse.json(
            { error: "Failed to delete document" },
            { status: 500 }
        );
    }
}
