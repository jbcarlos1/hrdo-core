import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { memorandumSchema } from "@/schemas";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
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

    const searchParams = new URL(request.url).searchParams;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const search = searchParams.get("search") || "";
    const [sortField, sortOrder] = (
        searchParams.get("sort") || "createdAt:desc"
    ).split(":");
    const memorandumState = searchParams.get("memorandumState");
    const sectionFilter = searchParams.get("section") || "";
    const limit = 12;

    try {
        const [totalMemorandums, memorandums] = await db.$transaction([
            db.memorandum.count({
                where: {
                    memoNumber: { contains: search, mode: "insensitive" },
                    isArchived: memorandumState === "archived",
                    ...(sectionFilter && { section: sectionFilter }),
                },
            }),
            db.memorandum.findMany({
                skip: (page - 1) * limit,
                take: limit,
                where: {
                    OR: [
                        {
                            memoNumber: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                        {
                            subject: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                        {
                            signatory: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                        {
                            issuingOffice: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                        {
                            section: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                        {
                            encoder: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                    ],

                    isArchived: memorandumState === "archived",
                    ...(sectionFilter && { section: sectionFilter }),
                },
                orderBy: {
                    [sortField]: sortOrder.toLowerCase() as Prisma.SortOrder,
                },
                select: {
                    id: true,
                    memoNumber: true,
                    signatory: true,
                    issuingOffice: true,
                    subject: true,
                    date: true,
                    encoder: true,
                    section: true,
                    keywords: true,
                    pdfUrl: true,
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

    if (
        !currentUser ||
        !currentUser.isApproved ||
        currentUser.role !== "ADMIN"
    ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!currentUser.name || !currentUser.division || !currentUser.section) {
        return NextResponse.json(
            { error: "Incomplete user profile" },
            { status: 400 }
        );
    }

    try {
        const formData = await request.formData();

        const memorandumData = {
            memoNumber: formData.get("memoNumber") as string,
            signatory: formData.get("signatory") as string,
            issuingOffice: formData.get("issuingOffice") as string,
            subject: formData.get("subject") as string,
            date: formData.get("date") as string,
            keywords: formData.get("keywords") as string,
            pdfUrl: formData.get("pdfUrl") as string,
        };

        const validatedData = memorandumSchema.parse(memorandumData);

        if (!validatedData.date) {
            return NextResponse.json(
                { error: "Date is required" },
                { status: 400 }
            );
        }
        const dateObj = new Date(validatedData.date);

        const memorandum = await db.memorandum.create({
            data: {
                memoNumber: validatedData.memoNumber,
                signatory: validatedData.signatory,
                issuingOffice: validatedData.issuingOffice,
                subject: validatedData.subject,
                date: dateObj,
                keywords: validatedData.keywords,
                pdfUrl: validatedData.pdfUrl,
                encoder: currentUser.name,
                division: currentUser.division,
                section: currentUser.section,
            },
            select: {
                id: true,
                memoNumber: true,
                signatory: true,
                issuingOffice: true,
                subject: true,
                date: true,
                keywords: true,
                pdfUrl: true,
                encoder: true,
                division: true,
                section: true,
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
