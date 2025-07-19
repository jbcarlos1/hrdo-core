import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { uploadImage } from "@/lib/cloudinary";
import { auth } from "@/auth";
import { documentSchema } from "@/schemas";

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
    const documentState = searchParams.get("documentState");
    const limit = 12;

    try {
        const [totalDocuments, documents] = await db.$transaction([
            db.document.count({
                where: {
                    name: { contains: search, mode: "insensitive" },

                    isArchived: documentState === "archived",
                },
            }),
            db.document.findMany({
                skip: (page - 1) * limit,
                take: limit,
                where: {
                    name: { contains: search, mode: "insensitive" },

                    isArchived: documentState === "archived",
                },
                orderBy: {
                    [sortField]: sortOrder.toLowerCase() as Prisma.SortOrder,
                },
                select: {
                    id: true,
                    name: true,
                    quantity: true,
                    reorderPoint: true,
                    image: true,
                    isArchived: true,
                },
            }),
        ]);

        return NextResponse.json({
            documents,
            totalPages: Math.ceil(totalDocuments / limit),
            currentPage: page,
            totalDocuments,
        });
    } catch (error) {
        console.error("Error fetching documents:", error);
        return NextResponse.json(
            { error: "Failed to fetch documents" },
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

        const documentData = {
            name: formData.get("name") as string,
            quantity: parseInt(formData.get("quantity") as string),
            reorderPoint: parseInt(formData.get("reorderPoint") as string),
            image: formData.get("image") as string,
        };

        const validatedData = documentSchema.parse(documentData);

        let imageUrl: string | undefined;
        const image = formData.get("image") as string;

        if (image?.startsWith("data:")) {
            const uploadResponse = await uploadImage(image);
            imageUrl = uploadResponse.secure_url;
        }

        const document = await db.document.create({
            data: {
                name: validatedData.name,
                quantity: validatedData.quantity,
                reorderPoint: validatedData.reorderPoint,
                ...(imageUrl && { image: imageUrl }),
            },
            select: {
                id: true,
                name: true,
                quantity: true,
                reorderPoint: true,
                image: true,
                isArchived: true,
            },
        });

        return NextResponse.json(document, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json(
                { error: "Validation failed", details: error.message },
                { status: 400 }
            );
        }

        console.error("Error creating document:", error);
        return NextResponse.json(
            { error: "Failed to create document" },
            { status: 500 }
        );
    }
}
