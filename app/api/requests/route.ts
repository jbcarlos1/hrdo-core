import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { Prisma, RequestStatus, Division, Section } from "@prisma/client";
import { createDateFilter } from "@/lib/date-utils";
import { auth } from "@/auth";
import { createRequestSchema } from "@/schemas";

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
    const viewMode = searchParams.get("viewMode") || "request";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const [sortField, sortOrder] = (
        searchParams.get("sort") || "createdAt:desc"
    ).split(":");
    const limit = 10;

    const dateFilters = createDateFilter(dateFrom, dateTo);

    try {
        if (viewMode === "item") {
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
                    skip: (page - 1) * limit,
                    take: limit,
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
                        request: {
                            select: {
                                id: true,
                                user: true,
                                email: true,
                                division: true,
                                section: true,
                                status: true,
                                createdAt: true,
                                updatedAt: true,
                                isSupplyIn: true,
                            },
                        },
                        item: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                                unit: true,
                                quantity: true,
                            },
                        },
                    },
                    orderBy: [
                        {
                            request: {
                                [sortField]:
                                    sortOrder.toLowerCase() as Prisma.SortOrder,
                            },
                        },
                        {
                            item: {
                                name: "asc",
                            },
                        },
                    ],
                }),
            ]);

            const requests = requestItems.map((requestItem) => ({
                id: requestItem.request.id,
                user: requestItem.request.user,
                email: requestItem.request.email,
                division: requestItem.request.division,
                section: requestItem.request.section,
                status: requestItem.request.status,
                createdAt: requestItem.request.createdAt,
                updatedAt: requestItem.request.updatedAt,
                isSupplyIn: requestItem.request.isSupplyIn,
                items: [
                    {
                        id: requestItem.id,
                        quantity: requestItem.quantity,
                        item: requestItem.item,
                    },
                ],
            }));

            return NextResponse.json({
                requests,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page,
                totalItems,
            });
        } else {
            const [totalItems, requests] = await db.$transaction([
                db.request.count({
                    where: {
                        AND:
                            session?.user?.role === "USER"
                                ? [
                                      {
                                          email: {
                                              contains:
                                                  session?.user?.email ?? "",
                                              mode: "insensitive",
                                          },
                                      },
                                      {
                                          items: {
                                              some: {
                                                  item: {
                                                      name: {
                                                          contains: search,
                                                          mode: "insensitive",
                                                      },
                                                  },
                                              },
                                          },
                                      },

                                      ...(status
                                          ? [
                                                {
                                                    status: status as RequestStatus,
                                                },
                                            ]
                                          : []),
                                      ...(division
                                          ? [{ division: division as Division }]
                                          : []),
                                      ...(section
                                          ? [{ section: section as Section }]
                                          : []),
                                      ...(supplyType
                                          ? [
                                                {
                                                    isSupplyIn:
                                                        supplyType === "in",
                                                },
                                            ]
                                          : []),
                                      ...dateFilters,
                                  ]
                                : [
                                      {
                                          OR: [
                                              {
                                                  user: {
                                                      contains: search,
                                                      mode: "insensitive",
                                                  },
                                              },
                                              {
                                                  email: {
                                                      contains: search,
                                                      mode: "insensitive",
                                                  },
                                              },
                                              {
                                                  items: {
                                                      some: {
                                                          item: {
                                                              name: {
                                                                  contains:
                                                                      search,
                                                                  mode: "insensitive",
                                                              },
                                                          },
                                                      },
                                                  },
                                              },
                                          ],
                                      },
                                      ...(status
                                          ? [
                                                {
                                                    status: status as RequestStatus,
                                                },
                                            ]
                                          : []),
                                      ...(division
                                          ? [{ division: division as Division }]
                                          : []),
                                      ...(section
                                          ? [{ section: section as Section }]
                                          : []),
                                      ...(supplyType
                                          ? [
                                                {
                                                    isSupplyIn:
                                                        supplyType === "in",
                                                },
                                            ]
                                          : []),
                                      ...dateFilters,
                                  ],
                    },
                }),
                db.request.findMany({
                    skip: (page - 1) * limit,
                    take: limit,
                    where: {
                        AND:
                            session?.user?.role === "USER"
                                ? [
                                      {
                                          email: {
                                              contains:
                                                  session?.user?.email ?? "",
                                              mode: "insensitive",
                                          },
                                      },
                                      {
                                          items: {
                                              some: {
                                                  item: {
                                                      name: {
                                                          contains: search,
                                                          mode: "insensitive",
                                                      },
                                                  },
                                              },
                                          },
                                      },

                                      ...(status
                                          ? [
                                                {
                                                    status: status as RequestStatus,
                                                },
                                            ]
                                          : []),
                                      ...(division
                                          ? [{ division: division as Division }]
                                          : []),
                                      ...(section
                                          ? [{ section: section as Section }]
                                          : []),
                                      ...(supplyType
                                          ? [
                                                {
                                                    isSupplyIn:
                                                        supplyType === "in",
                                                },
                                            ]
                                          : []),
                                      ...dateFilters,
                                  ]
                                : [
                                      {
                                          OR: [
                                              {
                                                  user: {
                                                      contains: search,
                                                      mode: "insensitive",
                                                  },
                                              },
                                              {
                                                  email: {
                                                      contains: search,
                                                      mode: "insensitive",
                                                  },
                                              },
                                              {
                                                  items: {
                                                      some: {
                                                          item: {
                                                              name: {
                                                                  contains:
                                                                      search,
                                                                  mode: "insensitive",
                                                              },
                                                          },
                                                      },
                                                  },
                                              },
                                          ],
                                      },
                                      ...(status
                                          ? [
                                                {
                                                    status: status as RequestStatus,
                                                },
                                            ]
                                          : []),
                                      ...(division
                                          ? [{ division: division as Division }]
                                          : []),
                                      ...(section
                                          ? [{ section: section as Section }]
                                          : []),
                                      ...(supplyType
                                          ? [
                                                {
                                                    isSupplyIn:
                                                        supplyType === "in",
                                                },
                                            ]
                                          : []),
                                      ...dateFilters,
                                  ],
                    },
                    orderBy: {
                        [sortField]:
                            sortOrder.toLowerCase() as Prisma.SortOrder,
                    },
                    select: {
                        id: true,
                        user: true,
                        email: true,
                        division: true,
                        section: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true,
                        isSupplyIn: true,
                        isReceived: true,
                        approver: true,
                        additionalNotes: true,
                        items: {
                            include: {
                                item: {
                                    select: {
                                        id: true,
                                        name: true,
                                        image: true,
                                        unit: true,
                                        quantity: true,
                                    },
                                },
                            },
                            orderBy: {
                                item: {
                                    name: "asc",
                                },
                            },
                        },
                    },
                }),
            ]);

            return NextResponse.json({
                requests,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page,
                totalItems,
            });
        }
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

    if (
        !currentUser.name ||
        !currentUser.email ||
        !currentUser.division ||
        !currentUser.section
    ) {
        return NextResponse.json(
            { error: "Incomplete user profile" },
            { status: 400 }
        );
    }

    try {
        const body = await request.json();

        const validatedData = createRequestSchema.parse(body);
        const { items, isSupplyIn, additionalNotes } = validatedData;

        const newRequest = await db.request.create({
            data: {
                status: "PENDING",
                items: {
                    create: items.map((item) => ({
                        itemId: item.id,
                        quantity: item.quantity,
                    })),
                },
                user: currentUser.name,
                email: currentUser.email,
                division: currentUser.division,
                section: currentUser.section,
                isSupplyIn,
                additionalNotes,
            },
            include: {
                items: {
                    include: {
                        item: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                                unit: true,
                                quantity: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json(newRequest, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
            return NextResponse.json(
                { error: "Validation failed", details: error.message },
                { status: 400 }
            );
        }

        console.error("Failed to create request:", error);
        return NextResponse.json(
            { error: "Failed to create request" },
            { status: 500 }
        );
    }
}
