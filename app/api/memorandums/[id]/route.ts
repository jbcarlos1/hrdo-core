import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadImage, deleteImage } from "@/lib/cloudinary";
import { auth } from "@/auth";
import { memorandumSchema } from "@/schemas";

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
            { error: "Memorandum ID is required" },
            { status: 400 }
        );
    }

    try {
        const formData = await request.formData();

        const MemorandumData = {
            memoNumber: formData.get("memoNumber") as string,
            addressee: formData.get("addressee") as string,
            sender: formData.get("sender") as string,
            senderOffice: formData.get("senderOffice") as string,
            subject: formData.get("subject") as string,
            date: formData.get("date") as string,
            keywords: formData.get("keywords") as string,
            image: formData.get("image") as string,
        };

        const validatedData = memorandumSchema.parse(MemorandumData);

        // Using transaction for atomic operations
        const updatedMemorandum = await db.$transaction(async (tx) => {
            const currentMemorandum = await tx.memorandum.findUnique({
                where: { id },
                select: {
                    image: true,
                    isArchived: true,
                },
            });

            if (!currentMemorandum) {
                throw new Error("Memorandum not found");
            }

            let imageUrl: string | undefined;
            const newImage = formData.get("image") as string;

            // Only process image if it's a new data URL
            if (newImage?.startsWith("data:")) {
                if (currentMemorandum.image) {
                    await deleteImage(currentMemorandum.image);
                }
                const uploadResponse = await uploadImage(newImage);
                imageUrl = uploadResponse.secure_url;
            }

            if (!validatedData.date) {
                throw new Error("Date is required");
            }
            const dateObj = new Date(validatedData.date);

            const updateData = {
                memoNumber: validatedData.memoNumber,
                addressee: validatedData.addressee,
                sender: validatedData.sender,
                senderOffice: validatedData.senderOffice,
                subject: validatedData.subject,
                date: dateObj,
                keywords: validatedData.keywords,
                ...(imageUrl && { image: imageUrl }),
            };

            return tx.memorandum.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    memoNumber: true,
                    addressee: true,
                    sender: true,
                    senderOffice: true,
                    subject: true,
                    date: true,
                    keywords: true,
                    image: true,
                    isArchived: true,
                },
            });
        });

        return NextResponse.json(updatedMemorandum);
    } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json(
                { error: "Validation failed", details: error.message },
                { status: 400 }
            );
        }

        console.error("Failed to update memorandum:", error);
        return NextResponse.json(
            { error: "Failed to update memorandum" },
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
            { error: "Memorandum ID is required" },
            { status: 400 }
        );
    }

    try {
        await db.$transaction(async (tx) => {
            const memorandum = await tx.memorandum.findUnique({
                where: { id },
                select: { image: true },
            });

            if (memorandum?.image) {
                await deleteImage(memorandum.image);
            }

            await tx.memorandum.delete({
                where: { id },
            });
        });

        return NextResponse.json({
            message: "Memorandum deleted successfully",
        });
    } catch (error) {
        console.error("Failed to delete memorandum:", error);
        return NextResponse.json(
            { error: "Failed to delete memorandum" },
            { status: 500 }
        );
    }
}
