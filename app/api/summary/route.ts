import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma, RequestStatus, Division, Section } from "@prisma/client";
import { createDateFilter } from "@/lib/date-utils";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const division = searchParams.get("division") || "";
    const section = searchParams.get("section") || "";
    const supplyType = searchParams.get("supplyType") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const [sortField, sortOrder] = (
        searchParams.get("sort") || "name:asc"
    ).split(":");
    const limit = 10;

    const dateFilters = createDateFilter(dateFrom, dateTo);

    try {
        const [totalItems, requestItems] = await db.$transaction([
            db.requestItem.count({
                where: {
                    [session?.user?.role === "USER" ? "AND" : "OR"]: [
                        {
                            item: {
                                name: {
                                    contains: search,
                                    mode: "insensitive",
                                },
                            },
                        },
                        session?.user?.role === "USER"
                            ? {}
                            : {
                                  request: {
                                      user: {
                                          contains: search,
                                          mode: "insensitive",
                                      },
                                  },
                              },

                        {
                            request: {
                                email: {
                                    contains:
                                        session?.user?.role === "USER"
                                            ? session?.user?.email ?? ""
                                            : search,
                                    mode: "insensitive",
                                },
                            },
                        },
                    ],
                    request: {
                        AND: [
                            ...(status
                                ? [{ status: status as RequestStatus }]
                                : []),
                            ...(division
                                ? [{ division: division as Division }]
                                : []),
                            ...(section
                                ? [{ section: section as Section }]
                                : []),
                            ...(supplyType
                                ? [{ isSupplyIn: supplyType === "in" }]
                                : []),
                            ...dateFilters,
                        ],
                    },
                },
            }),
            db.requestItem.findMany({
                where: {
                    [session?.user?.role === "USER" ? "AND" : "OR"]: [
                        {
                            item: {
                                name: {
                                    contains: search,
                                    mode: "insensitive",
                                },
                            },
                        },
                        session?.user?.role === "USER"
                            ? {}
                            : {
                                  request: {
                                      user: {
                                          contains: search,
                                          mode: "insensitive",
                                      },
                                  },
                              },

                        {
                            request: {
                                email: {
                                    contains:
                                        session?.user?.role === "USER"
                                            ? session?.user?.email ?? ""
                                            : search,
                                    mode: "insensitive",
                                },
                            },
                        },
                    ],
                    request: {
                        AND: [
                            ...(status
                                ? [{ status: status as RequestStatus }]
                                : []),
                            ...(division
                                ? [{ division: division as Division }]
                                : []),
                            ...(section
                                ? [{ section: section as Section }]
                                : []),
                            ...(supplyType
                                ? [{ isSupplyIn: supplyType === "in" }]
                                : []),
                            ...dateFilters,
                        ],
                    },
                },
                include: {
                    item: true,
                    request: {
                        select: {
                            id: true,
                            status: true,
                            createdAt: true,
                            updatedAt: true,
                            user: true,
                            email: true,
                            division: true,
                            section: true,
                            isSupplyIn: true,
                        },
                    },
                },
                orderBy: [
                    {
                        item: {
                            [sortField]:
                                sortOrder.toLowerCase() as Prisma.SortOrder,
                        },
                    },
                ],
            }),
        ]);

        const itemGroups = requestItems.reduce((groups, requestItem) => {
            const itemId = requestItem.item.id;
            if (!groups[itemId]) {
                groups[itemId] = {
                    item: requestItem.item,
                    totalQuantity: 0,
                    request: requestItem.request,
                };
            }
            groups[itemId].totalQuantity += requestItem.quantity;
            return groups;
        }, {} as Record<string, { item: any; totalQuantity: number; request: any }>);

        const aggregatedItems = Object.entries(itemGroups)
            .map(([itemId, { item, totalQuantity, request }]) => ({
                id: request.id,
                status: request.status,
                updatedAt: request.updatedAt,
                createdAt: request.createdAt,
                user: request.user,
                email: request.email,
                division: request.division,
                section: request.section,
                isSupplyIn: request.isSupplyIn,
                items: [
                    {
                        id: itemId,
                        quantity: totalQuantity,
                        item: item,
                    },
                ],
            }))
            .slice((page - 1) * limit, page * limit);

        return NextResponse.json({
            requests: aggregatedItems,
            totalPages: Math.ceil(Object.keys(itemGroups).length / limit),
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
