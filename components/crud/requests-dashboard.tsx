"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HashLoader } from "react-spinners";
import { HiOutlineRefresh } from "react-icons/hi";
import { FiDownload } from "react-icons/fi";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import { PaginationComponent } from "@/components/crud/pagination";
import { TableComponent } from "@/components/crud/requests-table";
import useDebounce from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "../ui/date-picker";
import { useSession } from "next-auth/react";

interface RequestItem {
    id: string;
    quantity: number;
    item: {
        id: string;
        name: string;
        image: string;
        unit: string;
        quantity: number;
    };
}

interface Request {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    updatedAt: string;
    createdAt: string;
    items: RequestItem[];
    user: string;
    email: string;
    division: string;
    section: string;
    isSupplyIn: boolean;
    isReceived: boolean;
    approver: string | null;
    additionalNotes: string;
}

interface PaginatedItems {
    requests: Request[];
    totalItems: number;
    currentPage: number;
    totalPages: number;
}

interface ItemizedRequest {
    id: string;
    requestId: string;
    itemId: string;
    quantity: number;
    requestStatus: "PENDING" | "APPROVED" | "REJECTED";
    updatedAt: string;
    createdAt: string;
    user: string;
    email: string;
    division: string;
    section: string;
    isSupplyIn: boolean;
    item: {
        id: string;
        name: string;
        image: string;
        unit: string;
        quantity: number;
    };
}

const fetchItems = async (
    page: number = 1,
    searchInput: string = "",
    status: string = "",
    division: string = "",
    section: string = "",
    supplyType: string = "",
    sort: string = "createdAt:desc",
    viewMode: "request" | "item" | "summary" = "request",
    dateFrom: Date | null,
    dateTo: Date | null,
    signal?: AbortSignal
): Promise<PaginatedItems> => {
    try {
        const res = await fetch(
            `/api/${
                viewMode !== "summary" ? "requests" : "summary"
            }?page=${page}&search=${encodeURIComponent(
                searchInput
            )}&status=${encodeURIComponent(
                status
            )}&division=${encodeURIComponent(
                division
            )}&section=${encodeURIComponent(
                section
            )}&supplyType=${encodeURIComponent(
                supplyType
            )}&sort=${encodeURIComponent(
                sort
            )}&viewMode=${viewMode}&dateFrom=${dateFrom?.toISOString()}&dateTo=${dateTo?.toISOString()}`,
            { signal }
        );

        if (!res.ok) throw new Error("Failed to fetch items");
        return res.json();
    } catch (error: unknown) {
        if (error instanceof Error && error.name !== "AbortError") {
            console.error("Failed to load items:", error);
        }
        return {
            requests: [],
            totalItems: 0,
            currentPage: page,
            totalPages: 1,
        };
    }
};

export default function RequestDashboard() {
    const { data: session } = useSession();
    const role = session?.user?.role;
    const [requests, setRequests] = useState<Request[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(
        null
    );
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [sortOption, setSortOption] = useState<string>("createdAt:desc");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"request" | "item" | "summary">(
        "request"
    );
    const [divisionFilter, setDivisionFilter] = useState<string>("");
    const [sectionFilter, setSectionFilter] = useState<string>("");
    const [supplyTypeFilter, setSupplyTypeFilter] = useState<string>("");
    const [dateFrom, setDateFrom] = useState<Date | null>(null);
    const [dateTo, setDateTo] = useState<Date | null>(null);
    const debouncedSearchInput = useDebounce(searchInput, 250);
    const controllerRef = useRef<AbortController | null>(null);
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);

    const sortOptions = useMemo(
        () =>
            viewMode === "summary"
                ? [
                      { value: "name:asc", label: "Name (A-Z)" },
                      { value: "name:desc", label: "Name (Z-A)" },
                  ]
                : [
                      { value: "createdAt:desc", label: "Newest First" },
                      { value: "createdAt:asc", label: "Oldest First" },
                  ],
        [viewMode]
    );

    const loadItems = useCallback(
        async (page = 1) => {
            setLoading(true);

            if (controllerRef.current) {
                controllerRef.current.abort();
            }

            const controller = new AbortController();
            controllerRef.current = controller;

            try {
                const { requests: fetchedItems, totalPages } = await fetchItems(
                    page,
                    debouncedSearchInput,
                    statusFilter,
                    divisionFilter,
                    sectionFilter,
                    supplyTypeFilter,
                    sortOption,
                    viewMode,
                    dateFrom,
                    dateTo,
                    controller.signal
                );

                setRequests(fetchedItems);
                setTotalPages(totalPages);
            } catch (error: unknown) {
                if (error instanceof Error && error.name !== "AbortError") {
                    console.error("Failed to load items:", error);
                }
            } finally {
                setLoading(false);
            }
        },
        [
            debouncedSearchInput,
            statusFilter,
            divisionFilter,
            sectionFilter,
            supplyTypeFilter,
            sortOption,
            viewMode,
            dateFrom,
            dateTo,
        ]
    );

    useEffect(() => {
        loadItems(page);
        return () => {
            controllerRef.current?.abort();
        };
    }, [
        page,
        loadItems,
        viewMode,
        statusFilter,
        divisionFilter,
        sectionFilter,
        supplyTypeFilter,
        sortOption,
        dateFrom,
        dateTo,
    ]);

    const markAsReceived = async (requestId: string) => {
        try {
            setProcessingId(requestId);

            setRequests((prevRequests) =>
                prevRequests.map((request) =>
                    request.id === requestId
                        ? { ...request, isReceived: true }
                        : request
                )
            );

            setSelectedRequest((prev) =>
                prev?.id === requestId ? { ...prev, isReceived: true } : prev
            );

            const response = await fetch(`/api/requests/${requestId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || "Failed to mark as received"
                );
            }

            const updatedRequest = await response.json();

            setRequests((prevRequests) =>
                prevRequests.map((request) =>
                    request.id === requestId
                        ? { ...request, isReceived: updatedRequest.isReceived }
                        : request
                )
            );

            setSelectedRequest((prev) =>
                prev?.id === requestId
                    ? { ...prev, isReceived: updatedRequest.isReceived }
                    : prev
            );

            toast({
                title: "Success",
                description: "Request successfully marked as received",
            });

            setSelectedRequest(null);
        } catch (error) {
            setRequests((prevRequests) =>
                prevRequests.map((request) =>
                    request.id === requestId
                        ? { ...request, isReceived: false }
                        : request
                )
            );

            setSelectedRequest((prev) =>
                prev?.id === requestId ? { ...prev, isReceived: false } : prev
            );

            console.error("Error marking request as received:", error);
            toast({
                title: "Error",
                description:
                    error instanceof Error
                        ? error.message
                        : "Failed to mark as received. Please try again",
                variant: "destructive",
            });
        } finally {
            setProcessingId(null);
        }
    };

    const handleAction = async (
        requestId: string,
        action: "APPROVE" | "REJECT",
        isSupplyIn: boolean,
        user: string,
        email: string,
        items: RequestItem[],
        requestDate: string,
        additionalNotes: string
    ) => {
        if (role !== "USER") {
            try {
                setProcessingId(requestId);
                const response = await fetch(`/api/requests/${requestId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action,
                        isSupplyIn,
                        user,
                        email,
                        items,
                        requestDate,
                        additionalNotes,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();

                    throw new Error(
                        errorData.error ||
                            `Failed to ${action.toLowerCase()} request`
                    );
                }

                const updatedRequest = await response.json();

                setRequests((prevRequests) =>
                    prevRequests.map((request) =>
                        request.id === requestId
                            ? {
                                  ...request,
                                  status: updatedRequest.status,
                                  approver: updatedRequest.approver,
                              }
                            : request
                    )
                );

                setSelectedRequest((prev) =>
                    prev?.id === requestId
                        ? {
                              ...prev,
                              status: updatedRequest.status,
                              approver: updatedRequest.approver,
                          }
                        : prev
                );

                toast({
                    title: "Success",
                    description: `Request ${action.toLowerCase()}d successfully`,
                });

                setSelectedRequest(null);
            } catch (error: any) {
                let errorMessage =
                    "An error occurred while processing the request";

                if (error instanceof Error) {
                    errorMessage = error.message;
                } else if (error.error) {
                    errorMessage = error.error;
                } else if (typeof error === "string") {
                    errorMessage = error;
                }

                toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive",
                });
            } finally {
                setProcessingId(null);
            }
        }
    };

    const getItemizedRequests = useCallback((): ItemizedRequest[] => {
        return requests.flatMap((request) =>
            request.items.map((item) => ({
                id: item.id,
                requestId: request.id,
                itemId: item.item.id,
                quantity: item.quantity,
                requestStatus: request.status,
                updatedAt: request.updatedAt,
                createdAt: request.createdAt,
                user: request.user,
                email: request.email,
                division: request.division,
                section: request.section,
                isSupplyIn: request.isSupplyIn,
                item: item.item,
            }))
        );
    }, [requests]);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const response = await fetch(
                `/api/requests/export?search=${encodeURIComponent(
                    debouncedSearchInput
                )}&status=${encodeURIComponent(
                    statusFilter
                )}&division=${encodeURIComponent(
                    divisionFilter
                )}&section=${encodeURIComponent(
                    sectionFilter
                )}&supplyType=${encodeURIComponent(
                    supplyTypeFilter
                )}&sort=${encodeURIComponent(
                    sortOption
                )}&viewMode=${viewMode}&dateFrom=${dateFrom?.toISOString()}&dateTo=${dateTo?.toISOString()}`
            );

            if (!response.ok) throw new Error("Failed to export data");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `requests-${
                new Date().toISOString().split("T")[0]
            }.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                title: "Success",
                description: "Data exported successfully",
            });
        } catch (error) {
            console.error("Failed to export data:", error);
            toast({
                title: "Error",
                description: "Failed to export data",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };

    const divisionToSections: { [key in Request["division"]]: string[] } = {
        "": [
            "ALL",
            "EXECUTIVE",
            "ADMINISTRATIVE",
            "RECRUITMENT_SELECTION",
            "APPOINTMENT",
            "PLANNING_RESEARCH",
            "MONITORING_EVALUATION",
            "INFORMATION_MANAGEMENT",
            "PROJECTS",
            "SCHOLARSHIP",
            "TRAINING",
            "BENEFITS",
        ],
        MANAGEMENT: ["ALL", "EXECUTIVE", "ADMINISTRATIVE"],
        RECRUITMENT: ["ALL", "RECRUITMENT_SELECTION", "APPOINTMENT"],
        PLANNING_RESEARCH: [
            "ALL",
            "PLANNING_RESEARCH",
            "MONITORING_EVALUATION",
            "INFORMATION_MANAGEMENT",
            "PROJECTS",
        ],
        DEVELOPMENT_BENEFITS: ["ALL", "SCHOLARSHIP", "TRAINING", "BENEFITS"],
    };

    const sectionToDivision: { [key in Request["division"]]: string } = {
        ALL: divisionFilter,
        EXECUTIVE: "MANAGEMENT",
        ADMINISTRATIVE: "MANAGEMENT",
        RECRUITMENT_SELECTION: "RECRUITMENT",
        APPOINTMENT: "RECRUITMENT",
        PLANNING_RESEARCH: "PLANNING_RESEARCH",
        MONITORING_EVALUATION: "PLANNING_RESEARCH",
        INFORMATION_MANAGEMENT: "PLANNING_RESEARCH",
        PROJECTS: "PLANNING_RESEARCH",
        SCHOLARSHIP: "DEVELOPMENT_BENEFITS",
        TRAINING: "DEVELOPMENT_BENEFITS",
        BENEFITS: "DEVELOPMENT_BENEFITS",
    };

    const divisionMap: { [key in Request["division"]]: string } = {
        ALL: "",
        MANAGEMENT: "Management",
        RECRUITMENT: "Recruitment Division",
        PLANNING_RESEARCH: "Planning & Research Division",
        DEVELOPMENT_BENEFITS: "Development & Benefits Division",
    };

    const sectionMap: { [key in Request["section"]]: string } = {
        ALL: "All",
        EXECUTIVE: "Executive",
        ADMINISTRATIVE: "Administrative Section",
        RECRUITMENT_SELECTION: "Recruitment & Selection Section",
        APPOINTMENT: "Appointment Section",
        PLANNING_RESEARCH: "Planning & Research Section",
        MONITORING_EVALUATION: "Monitoring & Evaluation Section",
        INFORMATION_MANAGEMENT: "Information Management Section",
        PROJECTS: "Projects Section",
        SCHOLARSHIP: "Scholarship Section",
        TRAINING: "Training Section",
        BENEFITS: "Benefits Section",
    };

    const sectionOptions = divisionToSections[divisionFilter] || [];

    return (
        <div className="mx-auto mb-2 border bg-white rounded-md px-8 pt-8 pb-3 flex flex-col w-full shadow-md h-[calc(100vh-2rem)]">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-semibold text-[#7b1113]">
                    Transactions Dashboard
                </h1>
                <Button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center gap-2"
                >
                    <FiDownload className="h-4 w-4" />
                    {isExporting ? "Exporting..." : "Export CSV"}
                </Button>
            </div>

            <div className="flex pb-2">
                <div className="flex w-2/5 pe-1 gap-2">
                    <Input
                        placeholder={
                            role === "USER"
                                ? "Search items"
                                : "Search items, users, or email"
                        }
                        value={searchInput}
                        onChange={(e) => {
                            setSearchInput(e.target.value);
                            setPage(1);
                        }}
                    />
                    <DatePicker
                        date={dateFrom}
                        setDate={setDateFrom}
                        content="From"
                    />
                    <DatePicker
                        date={dateTo}
                        setDate={setDateTo}
                        content="To"
                    />
                </div>

                <div className="flex w-3/5 ms-1">
                    <div className="flex flex-grow">
                        <div
                            className={`${
                                role === "USER" ? "w-1/4" : "flex-1"
                            } me-1`}
                        >
                            <Select
                                value={viewMode}
                                onValueChange={(
                                    value: "request" | "item" | "summary"
                                ) => {
                                    setViewMode(value);
                                    setPage(1);
                                    setSearchInput("");
                                    setStatusFilter(
                                        value === "summary" ? "APPROVED" : ""
                                    );
                                    setDivisionFilter("");
                                    setSectionFilter("");
                                    setSupplyTypeFilter(
                                        value === "summary" ? "out" : ""
                                    );
                                    setSortOption(
                                        value === "summary"
                                            ? "name:asc"
                                            : "createdAt:desc"
                                    );
                                    setDateFrom(null);
                                    setDateTo(null);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="View mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="request">
                                        Per Transaction
                                    </SelectItem>
                                    <SelectItem value="item">
                                        Per Item
                                    </SelectItem>
                                    <SelectItem value="summary">
                                        Summary
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div
                            className={`${
                                role === "USER" ? "w-1/4" : "flex-1"
                            } mx-1`}
                        >
                            <Select
                                value={
                                    viewMode === "summary" &&
                                    statusFilter === ""
                                        ? "APPROVED"
                                        : statusFilter
                                }
                                onValueChange={(value) => {
                                    setStatusFilter(
                                        value === "ALL" ? "" : value
                                    );
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {viewMode !== "summary" && (
                                        <SelectItem value="ALL">All</SelectItem>
                                    )}
                                    <SelectItem value="APPROVED">
                                        Approved
                                    </SelectItem>
                                    <SelectItem value="REJECTED">
                                        Rejected
                                    </SelectItem>
                                    <SelectItem value="PENDING">
                                        Pending
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {role !== "USER" && (
                            <div
                                className="max-w-[150px] w-full flex-none mx-1"
                                title={divisionMap[divisionFilter]}
                            >
                                <Select
                                    value={divisionFilter}
                                    onValueChange={(value) => {
                                        setDivisionFilter(
                                            value === "ALL" ? "" : value
                                        );
                                        setSectionFilter("");
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Division" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(divisionMap).map(
                                            ([key, value]) => (
                                                <SelectItem
                                                    key={key}
                                                    value={key}
                                                >
                                                    {value === ""
                                                        ? "All"
                                                        : value}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {role !== "USER" && (
                            <div
                                className="max-w-[150px] w-full flex-none mx-1"
                                title={sectionMap[sectionFilter]}
                            >
                                <Select
                                    value={sectionFilter}
                                    onValueChange={(value) => {
                                        setSectionFilter(
                                            value === "ALL" ? "" : value
                                        );
                                        const correspondingDivision =
                                            sectionToDivision[value];
                                        if (
                                            divisionFilter !==
                                            correspondingDivision
                                        ) {
                                            setDivisionFilter(
                                                correspondingDivision
                                            );
                                        }
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sectionOptions.map((section) => (
                                            <SelectItem
                                                key={section}
                                                value={section}
                                            >
                                                {sectionMap[section]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div
                            className={`${
                                role === "USER" ? "w-1/4" : "flex-1"
                            } mx-1`}
                        >
                            <Select
                                value={
                                    viewMode === "summary" &&
                                    supplyTypeFilter === ""
                                        ? "out"
                                        : supplyTypeFilter
                                }
                                onValueChange={(value) => {
                                    setSupplyTypeFilter(
                                        value === "ALL" ? "" : value
                                    );
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Supply Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {viewMode !== "summary" && (
                                        <SelectItem value="ALL">All</SelectItem>
                                    )}
                                    <SelectItem value="in">
                                        Supply-In
                                    </SelectItem>
                                    <SelectItem value="out">
                                        Supply-Out
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div
                            className={`${
                                role === "USER" ? "w-1/4" : "flex-1"
                            } mx-1`}
                        >
                            <Select
                                value={sortOption}
                                onValueChange={(value) => {
                                    setSortOption(value);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sortOptions.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button
                        className={`ms-1 p-0 w-[38px] ${
                            loading ? "opacity-50" : ""
                        }`}
                        onClick={() => {
                            setPage(1);
                            setSearchInput("");
                            setStatusFilter(
                                viewMode === "summary" ? "APPROVED" : ""
                            );
                            setDivisionFilter("");
                            setSectionFilter("");
                            setSupplyTypeFilter(
                                viewMode === "summary" ? "out" : ""
                            );
                            setSortOption(
                                viewMode === "summary"
                                    ? "name:asc"
                                    : "createdAt:desc"
                            );
                            setDateFrom(null);
                            setDateTo(null);
                        }}
                        disabled={loading}
                    >
                        <HiOutlineRefresh size={20} />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-grow justify-center items-center">
                    <HashLoader size={36} color="#7b1113" />
                </div>
            ) : (
                <TableComponent
                    requests={requests}
                    itemizedRequests={getItemizedRequests()}
                    viewMode={viewMode}
                    handleAction={handleAction}
                    markAsReceived={markAsReceived}
                    selectedRequest={selectedRequest}
                    setSelectedRequest={setSelectedRequest}
                    processingId={processingId}
                    selectedImage={selectedImage}
                    setSelectedImage={setSelectedImage}
                    division={divisionFilter}
                    section={sectionFilter}
                />
            )}

            {totalPages > 0 ? (
                <PaginationComponent
                    page={page}
                    setPage={setPage}
                    totalPages={totalPages}
                    loading={loading}
                />
            ) : (
                <div className="h-6"></div>
            )}
        </div>
    );
}
