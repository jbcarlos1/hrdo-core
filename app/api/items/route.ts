import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma, Status } from "@prisma/client";
import { uploadImage } from "@/lib/cloudinary";
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

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const [sortField, sortOrder] = (
        searchParams.get("sort") || "createdAt:desc"
    ).split(":");
    const itemState = searchParams.get("itemState");
    const limit = 12;

    try {
        const [totalItems, items] = await db.$transaction([
            db.item.count({
                where: {
                    name: { contains: search, mode: "insensitive" },
                    ...(status && { status: status as Status }),
                    isArchived: itemState === "archived",
                },
            }),
            db.item.findMany({
                skip: (page - 1) * limit,
                take: limit,
                where: {
                    name: { contains: search, mode: "insensitive" },
                    ...(status && { status: status as Status }),
                    isArchived: itemState === "archived",
                },
                orderBy: {
                    [sortField]: sortOrder.toLowerCase() as Prisma.SortOrder,
                },
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
                    RequestItem: {
                        select: {
                            id: true,
                        },
                    },
                },
            }),
        ]);

        const transformedItems = items.map((item) => ({
            ...item,
            hasRequests: item.RequestItem.length > 0,
        }));

        return NextResponse.json({
            items: transformedItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            totalItems,
        });
    } catch (error) {
        console.error("Error fetching items:", error);
        return NextResponse.json(
            { error: "Failed to fetch items" },
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

        const itemData = {
            name: formData.get("name") as string,
            quantity: parseInt(formData.get("quantity") as string),
            unit: formData.get("unit") as string,
            reorderPoint: parseInt(formData.get("reorderPoint") as string),
            status: determineStatus(
                parseInt(formData.get("quantity") as string),
                parseInt(formData.get("reorderPoint") as string),
                false
            ),
            location: formData.get("location") as string,
            image: formData.get("image") as string,
        };

        const validatedData = itemSchema.parse(itemData);

        let imageUrl: string | undefined;
        const image = formData.get("image") as string;

        if (image?.startsWith("data:")) {
            const uploadResponse = await uploadImage(image);
            imageUrl = uploadResponse.secure_url;
        }

        const item = await db.item.create({
            data: {
                name: validatedData.name,
                quantity: validatedData.quantity,
                unit: validatedData.unit,
                reorderPoint: validatedData.reorderPoint,
                status: validatedData.status,
                location: validatedData.location,
                ...(imageUrl && { image: imageUrl }),
            },
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

        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json(
                { error: "Validation failed", details: error.message },
                { status: 400 }
            );
        }

        console.error("Error creating item:", error);
        return NextResponse.json(
            { error: "Failed to create item" },
            { status: 500 }
        );
    }
}
