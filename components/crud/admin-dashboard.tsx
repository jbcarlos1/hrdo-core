"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { itemSchema } from "@/schemas";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { PaginationComponent } from "@/components/crud/pagination";
import { TableComponent } from "./admin-table";
import useDebounce from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/image-upload";
import Image from "next/image";
import { LuLayoutGrid, LuTable2 } from "react-icons/lu";
import CardView from "@/components/crud/admin-card-view";
import { AlertCircle, Archive, Package } from "lucide-react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";

type ItemFormInputs = z.infer<typeof itemSchema>;

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
    hasRequests?: boolean;
}

interface Unit {
    id: string;
    name: string;
}

interface Location {
    id: string;
    name: string;
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
    sort: string = "createdAt:desc",
    itemState: string = "active",
    signal?: AbortSignal
): Promise<PaginatedItems> => {
    try {
        const res = await fetch(
            `/api/items?page=${page}&search=${encodeURIComponent(
                searchInput
            )}&status=${encodeURIComponent(
                status
            )}&itemState=${encodeURIComponent(
                itemState
            )}&sort=${encodeURIComponent(sort)}`,
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

export default function AdminDashboard() {
    const [items, setItems] = useState<Item[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [sortOption, setSortOption] = useState<string>("createdAt:desc");
    const [viewMode, setViewMode] = useState<"table" | "card">("card");
    const [itemState, setItemState] = useState<"active" | "archived">("active");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const debouncedSearchInput = useDebounce(searchInput, 250);
    const controllerRef = useRef<AbortController | null>(null);
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleteRestrictedDialogOpen, setIsDeleteRestrictedDialogOpen] =
        useState(false);
    const [deleteRestrictedItemName, setDeleteRestrictedItemName] =
        useState("");

    const statusMap: { [key in Item["status"]]: string } = {
        OUT_OF_STOCK: "Out of stock",
        FOR_REORDER: "For reorder",
        AVAILABLE: "Available",
        PHASED_OUT: "Phased out",
        DISCONTINUED: "Discontinued",
    };

    const statusStyles = {
        AVAILABLE: "bg-green-100 text-green-800 border-green-200",
        OUT_OF_STOCK: "bg-red-100 text-red-800 border-red-200",
        FOR_REORDER: "bg-yellow-100 text-yellow-800 border-yellow-200",
        PHASED_OUT: "bg-gray-100 text-gray-800 border-gray-200",
        DISCONTINUED: "bg-purple-100 text-purple-800 border-purple-200",
    };

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
        trigger,
    } = useForm<ItemFormInputs>({
        resolver: zodResolver(itemSchema),
        mode: "onChange",
    });

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
        const fetchUnits = async () => {
            try {
                const res = await fetch("/api/units");
                if (!res.ok) {
                    throw new Error("Failed to fetch units");
                }
                const data = await res.json();
                setUnits(data.units);
            } catch (error) {
                console.error("Error fetching units:", error);
            }
        };

        const fetchLocations = async () => {
            try {
                const res = await fetch("/api/locations");
                if (!res.ok) {
                    throw new Error("Failed to fetch locations");
                }
                const data = await res.json();
                setLocations(data.locations);
            } catch (error) {
                console.error("Error fetching units:", error);
            }
        };

        fetchUnits();
        fetchLocations();
    }, []);

    useEffect(() => {
        loadItems(page);
        return () => {
            controllerRef.current?.abort();
        };
    }, [page, loadItems]);

    const refreshItems = useCallback(
        async (add = false) => {
            const updatedItems = await fetchItems(
                page,
                debouncedSearchInput,
                statusFilter,
                sortOption,
                itemState,
                controllerRef.current?.signal
            );

            if (updatedItems.items.length === 0 && page > 1) {
                setPage((prevPage) => prevPage - 1);
            } else {
                setItems(updatedItems.items);
                setTotalPages(updatedItems.totalPages);
                if (add) setPage(1);
            }
        },
        [page, debouncedSearchInput, statusFilter, sortOption, itemState]
    );

    const onSubmit = async (data: ItemFormInputs) => {
        setSubmitLoading(true);
        try {
            const formData = new FormData();
            const { status, ...restData } = data;
            Object.entries(restData).forEach(([key, value]) => {
                if (key !== "image") {
                    formData.append(key, String(value));
                }
            });

            const imageValue = watch("image");
            if (imageValue && imageValue.startsWith("data:")) {
                formData.append("image", imageValue);
            } else if (imageValue) {
                formData.append("image", imageValue);
            }

            const method = editingItem ? "PUT" : "POST";
            const url = editingItem
                ? `/api/items/${editingItem.id}`
                : `/api/items`;

            const res = await fetch(url, {
                method,
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.error ||
                        (editingItem
                            ? "Failed to update item"
                            : "Failed to add item")
                );
            }

            reset();
            setIsDialogOpen(false);
            await refreshItems(method === "POST");
            toast({
                title: `Item ${method === "POST" ? "Added" : "Updated"}`,
                description: `The item has been successfully ${
                    method === "POST" ? "added" : "updated"
                }.`,
            });
        } catch (error) {
            console.error("Submit failed", error);
            toast({
                title: "Error",
                description:
                    error instanceof Error
                        ? error.message
                        : "An error occurred",
                variant: "destructive",
            });
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/items/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                const errorData = await res.json();
                if (
                    errorData.error ===
                    "Cannot delete item with associated requests"
                ) {
                    const itemToDelete = items.find((item) => item.id === id);
                    if (itemToDelete) {
                        setDeleteRestrictedItemName(itemToDelete.name);
                        setIsDeleteRestrictedDialogOpen(true);
                    }
                    return;
                }
                throw new Error(errorData.error || "Failed to delete item");
            }

            await refreshItems();
            toast({
                title: "Item Deleted",
                description: "The item has been successfully removed.",
            });
        } catch (error) {
            console.error("Delete failed", error);
            toast({
                title: "Error",
                description:
                    error instanceof Error
                        ? error.message
                        : "Failed to delete item",
                variant: "destructive",
            });
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleArchive = async (id: string, currentState: boolean) => {
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/items/${id}/archive`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (!res.ok) throw new Error("Failed to update archive status");
            await refreshItems();
            toast({
                title: currentState ? "Item Unarchived" : "Item Archived",
                description: `The item has been successfully ${
                    currentState ? "unarchived" : "archived"
                }.`,
            });
        } catch (error) {
            console.error("Archive toggle failed", error);
            toast({
                title: "Error",
                description:
                    "Failed to update archive status. Please try again.",
                variant: "destructive",
            });
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleEdit = useCallback(
        (item: Item) => {
            setEditingItem(item);
            reset(item);
            setIsDialogOpen(true);
        },
        [reset]
    );

    const openAddModal = useCallback(() => {
        setEditingItem(null);
        reset({ status: "AVAILABLE" });
        setIsDialogOpen(true);
    }, [reset]);

    const handleLocalImageSelect = async (file: File) => {
        return new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                setValue("image", reader.result as string);
                trigger("image");
                resolve();
            };
            reader.readAsDataURL(file);
        });
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);

            const response = await fetch(
                `/api/items/export?search=${encodeURIComponent(
                    debouncedSearchInput
                )}&status=${encodeURIComponent(
                    statusFilter
                )}&itemState=${encodeURIComponent(
                    itemState
                )}&sort=${encodeURIComponent(sortOption)}`
            );

            if (!response.ok) throw new Error("Failed to export data");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `inventory report-${
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

    return (
        <>
            <div className="mx-auto mb-2 border bg-white rounded-md px-8 pt-8 pb-3 flex flex-col w-full shadow-md h-[calc(100vh-2rem)]">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-2xl font-semibold text-[#7b1113]">
                        Inventory Management
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
                                    setSortOption("createdAt:desc");
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
                                    setSortOption("createdAt:desc");
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
                        <Button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="flex items-center gap-2"
                        >
                            <FiDownload className="h-4 w-4" />
                            {isExporting ? "Exporting..." : "Export CSV"}
                        </Button>
                        <Button
                            onClick={openAddModal}
                            disabled={loading}
                            className={loading ? "opacity-50" : ""}
                        >
                            Add New Item
                        </Button>
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
                                setSortOption("createdAt:desc");
                            }}
                            disabled={loading}
                        >
                            <HiOutlineRefresh size={20} />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 min-h-0">
                    {loading || submitLoading ? (
                        <div className="flex flex-grow justify-center items-center h-full">
                            <HashLoader size={36} color="#7b1113" />
                        </div>
                    ) : viewMode === "table" ? (
                        <TableComponent
                            items={items}
                            handleEdit={handleEdit}
                            deleteLoading={deleteLoading}
                            handleDelete={handleDelete}
                            handleArchive={handleArchive}
                            selectedImage={selectedImage}
                            setSelectedImage={setSelectedImage}
                            statusMap={statusMap}
                            statusStyles={statusStyles}
                        />
                    ) : (
                        <CardView
                            items={items}
                            handleEdit={handleEdit}
                            deleteLoading={deleteLoading}
                            handleDelete={handleDelete}
                            handleArchive={handleArchive}
                            selectedImage={selectedImage}
                            setSelectedImage={setSelectedImage}
                            statusMap={statusMap}
                            statusStyles={statusStyles}
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingItem ? "Edit Item" : "Add Item"}
                        </DialogTitle>
                    </DialogHeader>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <div>
                            <p className="text-sm my-2 text-gray-500">Name</p>
                            <Input
                                {...register("name")}
                                className="w-full"
                                disabled={editingItem?.hasRequests}
                            />
                            {errors.name && (
                                <p className="text-red-500 text-sm my-1">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm my-2 text-gray-500">
                                Quantity
                            </p>
                            <Input
                                type="number"
                                {...register("quantity", {
                                    valueAsNumber: true,
                                })}
                                className="w-full"
                                disabled={editingItem?.hasRequests}
                            />
                            {errors.quantity && (
                                <p className="text-red-500 text-sm my-1">
                                    {errors.quantity.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm my-2 text-gray-500">
                                Unit of measurement
                            </p>
                            <Select
                                {...register("unit")}
                                value={watch("unit")}
                                onValueChange={(value) => {
                                    setValue("unit", value);
                                    trigger("unit");
                                }}
                                disabled={editingItem?.hasRequests}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {units.map((unit) => (
                                        <SelectItem
                                            key={unit.id}
                                            value={unit.name}
                                        >
                                            {unit.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {errors.unit && (
                                <p className="text-red-500 text-sm my-1">
                                    {errors.unit.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm my-2 text-gray-500">
                                Reorder point
                            </p>
                            <Input
                                type="number"
                                {...register("reorderPoint", {
                                    valueAsNumber: true,
                                })}
                                className="w-full"
                            />
                            {errors.reorderPoint && (
                                <p className="text-red-500 text-sm my-1">
                                    {errors.reorderPoint.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <p className="text-sm my-2 text-gray-500">
                                Location
                            </p>

                            <Select
                                {...register("location")}
                                value={watch("location")}
                                onValueChange={(value) => {
                                    setValue("location", value);
                                    trigger("location");
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map((location) => (
                                        <SelectItem
                                            key={location.id}
                                            value={location.name}
                                        >
                                            {location.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {errors.location && (
                                <p className="text-red-500 text-sm my-1">
                                    {errors.location.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <p className="text-sm my-2 text-gray-500">Image</p>
                            <div className="flex items-center gap-4">
                                {watch("image") && (
                                    <Image
                                        src={watch("image") || ""}
                                        alt="Item preview"
                                        className="w-20 h-20 object-cover rounded-md"
                                        width={80}
                                        height={80}
                                    />
                                )}
                                <ImageUpload
                                    onUpload={handleLocalImageSelect}
                                    loading={submitLoading}
                                />
                            </div>
                            {errors.image && (
                                <p className="text-red-500 text-sm my-1">
                                    {errors.image.message}
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={submitLoading}>
                                {editingItem ? "Update Item" : "Add Item"}
                            </Button>
                            <DialogClose asChild>
                                <Button
                                    variant="outline"
                                    disabled={submitLoading}
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={isDeleteRestrictedDialogOpen}
                onOpenChange={setIsDeleteRestrictedDialogOpen}
            >
                <AlertDialogContent className="max-w-[500px] p-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
                        <div className="flex items-center justify-center mb-4">
                            <AlertCircle className="h-12 w-12 text-white" />
                        </div>
                        <AlertDialogHeader className="text-center">
                            <AlertDialogTitle className="text-2xl font-bold text-white mb-2 text-center">
                                Delete Operation Restricted
                            </AlertDialogTitle>
                        </AlertDialogHeader>
                    </div>

                    <div className="p-6">
                        <AlertDialogDescription className="text-center text-base leading-relaxed text-gray-600 dark:text-gray-300">
                            The item &quot;{deleteRestrictedItemName}&quot;
                            cannot be deleted because it has associated
                            transactions. This restriction is in place to
                            maintain data integrity and prevent disruption to
                            existing supply transactions.
                        </AlertDialogDescription>
                    </div>

                    <AlertDialogFooter className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                        <AlertDialogAction
                            onClick={() =>
                                setIsDeleteRestrictedDialogOpen(false)
                            }
                            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
                        >
                            Acknowledge
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
