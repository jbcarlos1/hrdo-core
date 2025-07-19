"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HashLoader } from "react-spinners";
import { HiOutlineRefresh } from "react-icons/hi";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PackageCheck, Archive, Package } from "lucide-react";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import { PaginationComponent } from "@/components/crud/pagination";
import { TableComponent } from "@/components/crud/supply-in-table";
import useDebounce from "@/hooks/useDebounce";
import { CartProvider } from "@/contexts/restock-cart-context";
import { Cart } from "@/components/crud/restock-cart";
import { LuLayoutGrid, LuTable2 } from "react-icons/lu";
import CardView from "@/components/crud/supply-in-card-view";

interface Item {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    reorderPoint: number;
    status:
        | "OUT_OF_STOCK"
        | "FOR_REORDER"
        | "AVAILABLE"
        | "PHASED_OUT"
        | "DISCONTINUED";
    location: string;
    image: string;
    isArchived: boolean;
}

interface PaginatedItems {
    items: Item[];
    totalItems: number;
    currentPage: number;
    totalPages: number;
}

const fetchItems = async (
    page: number = 1,
    searchInput: string = "",
    status: string = "",
    sort: string = "name:asc",
    itemState: string = "active",
    signal?: AbortSignal
): Promise<PaginatedItems> => {
    try {
        const res = await fetch(
            `/api/items?page=${page}&search=${encodeURIComponent(
                searchInput
            )}&status=${encodeURIComponent(status)}&sort=${encodeURIComponent(
                sort
            )}&itemState=${encodeURIComponent(itemState)}`,
            { signal }
        );
        if (!res.ok) throw new Error("Failed to fetch items");
        return res.json();
    } catch (error: unknown) {
        if (error instanceof Error && error.name !== "AbortError") {
            console.error("Failed to load items:", error);
        }
        return {
            items: [],
            totalItems: 0,
            currentPage: page,
            totalPages: 1,
        };
    }
};

export default function SupplyInDashboard() {
    const [items, setItems] = useState<Item[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [sortOption, setSortOption] = useState<string>("name:asc");
    const debouncedSearchInput = useDebounce(searchInput, 250);
    const controllerRef = useRef<AbortController | null>(null);
    const [viewMode, setViewMode] = useState<"table" | "card">("card");
    const [itemState, setItemState] = useState<"active" | "archived">("active");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const sortOptions = useMemo(
        () => [
            { value: "createdAt:desc", label: "Newest First" },
            { value: "createdAt:asc", label: "Oldest First" },
            { value: "name:asc", label: "Name (A-Z)" },
            { value: "name:desc", label: "Name (Z-A)" },
        ],
        []
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
                const { items: fetchedItems, totalPages } = await fetchItems(
                    page,
                    debouncedSearchInput,
                    statusFilter,
                    sortOption,
                    itemState,
                    controller.signal
                );

                setItems(fetchedItems);
                setTotalPages(totalPages);
            } catch (error: unknown) {
                if (error instanceof Error && error.name !== "AbortError") {
                    console.error("Failed to load items:", error);
                }
            } finally {
                setLoading(false);
            }
        },
        [debouncedSearchInput, statusFilter, sortOption, itemState]
    );

    useEffect(() => {
        loadItems(page);
        return () => {
            controllerRef.current?.abort();
        };
    }, [page, loadItems]);

    const statusMap: { [key in Item["status"]]: string } = {
        OUT_OF_STOCK: "Out of stock",
        FOR_REORDER: "For reorder",
        AVAILABLE: "Available",
        PHASED_OUT: "Phased out",
        DISCONTINUED: "Discontinued",
    };

    return (
        <CartProvider>
            <div className="mx-auto mb-2 border bg-white rounded-md px-8 pt-8 pb-3 flex flex-col w-full shadow-md h-[calc(100vh-2rem)]">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-2xl font-semibold text-[#7b1113]">
                        Supply-In Dashboard
                    </h1>
                    <div className="flex gap-2">
                        <div className="flex items-center bg-gray-100 rounded-md p-1">
                            <Button
                                title="Active items"
                                variant={
                                    itemState === "active" ? "default" : "ghost"
                                }
                                size="sm"
                                onClick={() => {
                                    setItemState("active");
                                    setPage(1);
                                    setSearchInput("");
                                    setStatusFilter("");
                                    setSortOption("name:asc");
                                }}
                                className="px-2"
                            >
                                <Package className="h-5 w-5" />
                            </Button>
                            <Button
                                title="Archived Items"
                                variant={
                                    itemState === "archived"
                                        ? "default"
                                        : "ghost"
                                }
                                size="sm"
                                onClick={() => {
                                    setItemState("archived");
                                    setPage(1);
                                    setSearchInput("");
                                    setStatusFilter("");
                                    setSortOption("name:asc");
                                }}
                                className="px-2"
                            >
                                <Archive className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="flex items-center bg-gray-100 rounded-md p-1">
                            <Button
                                title="Card view"
                                variant={
                                    viewMode === "card" ? "default" : "ghost"
                                }
                                size="sm"
                                onClick={() => setViewMode("card")}
                                className="px-2"
                            >
                                <LuLayoutGrid className="h-5 w-5" />
                            </Button>
                            <Button
                                title="Tabular view"
                                variant={
                                    viewMode === "table" ? "default" : "ghost"
                                }
                                size="sm"
                                onClick={() => setViewMode("table")}
                                className="px-2"
                            >
                                <LuTable2 className="h-5 w-5" />
                            </Button>
                        </div>
                        <Cart />
                    </div>
                </div>

                <div className="flex pb-2">
                    <div className="flex-none w-1/2 pe-1">
                        <Input
                            placeholder="Search items..."
                            value={searchInput}
                            onChange={(e) => {
                                setSearchInput(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="flex w-1/2 ms-1">
                        <div className="flex flex-grow">
                            <div className="w-1/2 me-1">
                                <Select
                                    value={statusFilter}
                                    onValueChange={(value) => {
                                        setStatusFilter(
                                            value === "ALL" ? "" : value
                                        );
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All</SelectItem>
                                        {itemState === "archived" ? (
                                            <>
                                                <SelectItem value="PHASED_OUT">
                                                    Phased out
                                                </SelectItem>
                                                <SelectItem value="DISCONTINUED">
                                                    Discontinued
                                                </SelectItem>
                                            </>
                                        ) : (
                                            <>
                                                <SelectItem value="AVAILABLE">
                                                    Available
                                                </SelectItem>
                                                <SelectItem value="OUT_OF_STOCK">
                                                    Out of stock
                                                </SelectItem>
                                                <SelectItem value="FOR_REORDER">
                                                    For reorder
                                                </SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-1/2 mx-1">
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
                                setStatusFilter("");
                                setSortOption("name:asc");
                            }}
                            disabled={loading}
                        >
                            <HiOutlineRefresh size={20} />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 min-h-0">
                    {loading ? (
                        <div className="flex flex-grow justify-center items-center h-full">
                            <HashLoader size={36} color="#7b1113" />
                        </div>
                    ) : viewMode === "table" ? (
                        <TableComponent items={items} />
                    ) : (
                        <CardView
                            items={items}
                            selectedImage={selectedImage}
                            setSelectedImage={setSelectedImage}
                            statusMap={statusMap}
                        />
                    )}
                </div>

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
            <AlertDialog open={isDialogOpen}>
                <AlertDialogContent className="max-w-[500px] p-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#0f5132] to-[#187147] p-6">
                        <div className="flex items-center justify-center mb-4">
                            <PackageCheck className="h-12 w-12 text-white" />
                        </div>
                        <AlertDialogHeader className="text-center">
                            <AlertDialogTitle className="text-2xl font-bold text-white mb-2">
                                Welcome to Supply-In Dashboard!
                            </AlertDialogTitle>
                        </AlertDialogHeader>
                    </div>

                    <div className="p-6">
                        <AlertDialogDescription className="text-center text-base leading-relaxed text-gray-600 dark:text-gray-300">
                            This is the place where you can restock or return
                            supplies to the office inventory. Choose the items
                            you&apos;re returning or restocking and submit your
                            update for approval.
                        </AlertDialogDescription>
                    </div>

                    <AlertDialogFooter className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                        <AlertDialogAction
                            onClick={() => setIsDialogOpen(false)}
                            className="w-full bg-gradient-to-r from-[#0f5132] to-[#187147] hover:from-[#0d4429] hover:to-[#145e3b] text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
                        >
                            Get Started
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CartProvider>
    );
}
