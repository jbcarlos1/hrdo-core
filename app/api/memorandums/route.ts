import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { uploadImage } from "@/lib/cloudinary";
import { auth } from "@/auth";
import { memorandumSchema } from "@/schemas";

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const searchParams = new URL(request.url).searchParams;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const search = searchParams.get("search") || "";
    const [sortField, sortOrder] = (
        searchParams.get("sort") || "createdAt:desc"
    ).split(":");
    const memorandumState = searchParams.get("memorandumState");
    const limit = 12;

    try {
        const [totalMemorandums, memorandums] = await db.$transaction([
            db.memorandum.count({
                where: {
                    memoNumber: { contains: search, mode: "insensitive" },

                    isArchived: memorandumState === "archived",
                },
            }),
            db.memorandum.findMany({
                skip: (page - 1) * limit,
                take: limit,
                where: {
                    memoNumber: { contains: search, mode: "insensitive" },

                    isArchived: memorandumState === "archived",
                },
                orderBy: {
                    [sortField]: sortOrder.toLowerCase() as Prisma.SortOrder,
                },
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
            }),
        ]);

        return NextResponse.json({
            memorandums,
            totalPages: Math.ceil(totalMemorandums / limit),
            currentPage: page,
            totalMemorandums,
        });
    } catch (error) {
        console.error("Error fetching memorandums:", error);
        return NextResponse.json(
            { error: "Failed to fetch memorandums" },
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

        const memorandumData = {
            memoNumber: formData.get("memoNumber") as string,
            addressee: formData.get("addressee") as string,
            sender: formData.get("sender") as string,
            senderOffice: formData.get("senderOffice") as string,
            subject: formData.get("subject") as string,
            date: formData.get("date") as string,
            keywords: formData.get("keywords") as string,
            image: formData.get("image") as string,
        };

        const validatedData = memorandumSchema.parse(memorandumData);

        let imageUrl: string | undefined;
        const image = formData.get("image") as string;

        if (image?.startsWith("data:")) {
            const uploadResponse = await uploadImage(image);
            imageUrl = uploadResponse.secure_url;
        }

        const memorandum = await db.memorandum.create({
            data: {
                memoNumber: validatedData.memoNumber,
                addressee: validatedData.addressee,
                sender: validatedData.sender,
                senderOffice: validatedData.senderOffice,
                subject: validatedData.subject,
                date: validatedData.date,
                keywords: validatedData.keywords,
                ...(imageUrl && { image: imageUrl }),
            },
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

        return NextResponse.json(memorandum, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json(
                { error: "Validation failed", details: error.message },
                { status: 400 }
            );
        }

        console.error("Error creating memorandum:", error);
        return NextResponse.json(
            { error: "Failed to create memorandum" },
            { status: 500 }
        );
    }
}
