import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma, RequestStatus, Division, Section } from "@prisma/client";
import { createDateFilter } from "@/lib/date-utils";
import { format } from "date-fns";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
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

    const dateFilters = createDateFilter(dateFrom, dateTo);

    try {
        let data: any[] = [];
        let headers: string[] = [];

        if (viewMode === "request") {
            const requests = await db.request.findMany({
                where: {
                    AND:
                        session?.user?.role === "USER"
                            ? [
                                  {
                                      email: {
                                          contains: session?.user?.email ?? "",
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
                                                isSupplyIn: supplyType === "in",
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
                                                              contains: search,
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
                                                isSupplyIn: supplyType === "in",
                                            },
                                        ]
                                      : []),
                                  ...dateFilters,
                              ],
                },
                orderBy: {
                    [sortField]: sortOrder.toLowerCase() as Prisma.SortOrder,
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
                    },
                },
            });

            headers = [
                "Transaction ID",
                "User",
                "Email",
                "Division",
                "Section",
                "Status",
                "Created At",
                "Updated At",
                "Type",
                "Approver",
                "Additional Notes",
                "Items",
                "Items Count",
            ];

            data = requests.map((request) => ({
                "Transaction ID": request.id,
                User: request.user,
                Email: request.email,
                Division: request.division,
                Section: request.section,
                Status: request.status,
                "Created At": format(new Date(request.createdAt), "PPp"),
                "Updated At": format(new Date(request.updatedAt), "PPp"),
                Type: request.isSupplyIn ? "Supply In" : "Supply Out",
                Approver: request.approver || "",
                "Additional Notes": request.additionalNotes || "",
                Items: request.items
                    .map(
                        (item) =>
                            `${item.item.name} (${item.quantity} ${item.item.unit})`
                    )
                    .join("; "),
                "Items Count": request.items.length,
            }));
        } else if (viewMode === "item") {
            const requestItems = await db.requestItem.findMany({
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
            });

            headers = [
                "Transaction ID",
                "User",
                "Email",
                "Division",
                "Section",
                "Status",
                "Created At",
                "Updated At",
                "Type",
                "Item Name",
                "Quantity",
                "Unit",
                "Available Quantity",
            ];

            data = requestItems.map((requestItem) => ({
                "Transaction ID": requestItem.request.id,
                User: requestItem.request.user,
                Email: requestItem.request.email,
                Division: requestItem.request.division,
                Section: requestItem.request.section,
                Status: requestItem.request.status,
                "Created At": format(
                    new Date(requestItem.request.createdAt),
                    "PPp"
                ),
                "Updated At": format(
                    new Date(requestItem.request.updatedAt),
                    "PPp"
                ),
                Type: requestItem.request.isSupplyIn
                    ? "Supply In"
                    : "Supply Out",
                "Item Name": requestItem.item.name,
                Quantity: requestItem.quantity,
                Unit: requestItem.item.unit,
                "Available Quantity": requestItem.item.quantity,
            }));
        } else if (viewMode === "summary") {
            const requestItems = await db.requestItem.findMany({
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
            });

            // Group items by item ID and calculate total quantities
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

            headers = [
                "Item Name",
                "Total Quantity",
                "Unit",
                "Available Quantity",
                "Status",
                "Division",
                "Section",
                "Type",
                "Last Transaction Date",
                "Last Transaction User",
                "Last Transaction Email",
            ];

            data = Object.entries(itemGroups).map(
                ([itemId, { item, totalQuantity, request }]) => ({
                    "Item Name": item.name,
                    "Total Quantity": totalQuantity,
                    Unit: item.unit,
                    "Available Quantity": item.quantity,
                    Status: request.status,
                    Division: request.division,
                    Section: request.section,
                    Type: request.isSupplyIn ? "Supply In" : "Supply Out",
                    "Last Transaction Date": format(
                        new Date(request.createdAt),
                        "PPp"
                    ),
                    "Last Transaction User": request.user,
                    "Last Transaction Email": request.email,
                })
            );
        }

        // Convert data to CSV
        const csvContent = [
            headers.join(","),
            ...data.map((row) =>
                headers
                    .map((header) => {
                        const value = row[header];
                        // Escape commas and quotes in the value
                        return `"${String(value || "").replace(/"/g, '""')}"`;
                    })
                    .join(",")
            ),
        ].join("\n");

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="requests-${
                    new Date().toISOString().split("T")[0]
                }.csv"`,
            },
        });
    } catch (error) {
        console.error("Error exporting data:", error);
        return NextResponse.json(
            { error: "Failed to export data" },
            { status: 500 }
        );
    }
}
