"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { memorandumSchema } from "@/schemas";
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

type MemorandumFormInputs = z.infer<typeof memorandumSchema>;

interface Memorandum {
    id: string;
    memoNumber: string;
    addressee: string;
    sender: string;
    senderOffice: string;
    subject: string;
    date: string;
    keywords: string;
    image: string;
    isArchived: boolean;
}

interface PaginatedMemorandums {
    memorandums: Memorandum[];
    totalMemorandums: number;
    currentPage: number;
    totalPages: number;
}

const fetchMemorandums = async (
    page: number = 1,
    searchInput: string = "",
    sort: string = "createdAt:desc",
    memorandumState: string = "active",
    signal?: AbortSignal
): Promise<PaginatedMemorandums> => {
    try {
        const res = await fetch(
            `/api/memorandums?page=${page}&search=${encodeURIComponent(
                searchInput
            )}&memorandumState=${encodeURIComponent(
                memorandumState
            )}&sort=${encodeURIComponent(sort)}`,
            { signal }
        );

        if (!res.ok) throw new Error("Failed to fetch memorandums");
        return res.json();
    } catch (error: unknown) {
        if (error instanceof Error && error.name !== "AbortError") {
            console.error("Failed to load memorandums:", error);
        }
        return {
            memorandums: [],
            totalMemorandums: 0,
            currentPage: page,
            totalPages: 1,
        };
    }
};

export default function AdminDashboard() {
    const [memorandums, setMemorandums] = useState<Memorandum[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [editingMemorandum, setEditingMemorandum] =
        useState<Memorandum | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [sortOption, setSortOption] = useState<string>("createdAt:desc");
    const [viewMode, setViewMode] = useState<"table" | "card">("card");
    const [memorandumState, setMemorandumState] = useState<
        "active" | "archived"
    >("active");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const debouncedSearchInput = useDebounce(searchInput, 250);
    const controllerRef = useRef<AbortController | null>(null);
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleteRestrictedDialogOpen, setIsDeleteRestrictedDialogOpen] =
        useState(false);
    const [deleteRestrictedMemorandumName, setDeleteRestrictedMemorandumName] =
        useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
        trigger,
    } = useForm<MemorandumFormInputs>({
        resolver: zodResolver(memorandumSchema),
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

    const loadMemorandums = useCallback(
        async (page = 1) => {
            setLoading(true);

            if (controllerRef.current) {
                controllerRef.current.abort();
            }

            const controller = new AbortController();
            controllerRef.current = controller;

            try {
                const { memorandums: fetchedMemorandums, totalPages } =
                    await fetchMemorandums(
                        page,
                        debouncedSearchInput,
                        sortOption,
                        memorandumState,
                        controller.signal
                    );

                setMemorandums(fetchedMemorandums);
                setTotalPages(totalPages);
            } catch (error: unknown) {
                if (error instanceof Error && error.name !== "AbortError") {
                    console.error("Failed to load memorandums:", error);
                }
            } finally {
                setLoading(false);
            }
        },
        [debouncedSearchInput, sortOption, memorandumState]
    );

    useEffect(() => {
        loadMemorandums(page);
        return () => {
            controllerRef.current?.abort();
        };
    }, [page, loadMemorandums]);

    const refreshMemorandums = useCallback(
        async (add = false) => {
            const updatedMemorandums = await fetchMemorandums(
                page,
                debouncedSearchInput,
                sortOption,
                memorandumState,
                controllerRef.current?.signal
            );

            if (updatedMemorandums.memorandums.length === 0 && page > 1) {
                setPage((prevPage) => prevPage - 1);
            } else {
                setMemorandums(updatedMemorandums.memorandums);
                setTotalPages(updatedMemorandums.totalPages);
                if (add) setPage(1);
            }
        },
        [page, debouncedSearchInput, sortOption, memorandumState]
    );

    const onSubmit = async (data: MemorandumFormInputs) => {
        setSubmitLoading(true);
        try {
            const formData = new FormData();
            const { ...restData } = data;
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

            const method = editingMemorandum ? "PUT" : "POST";
            const url = editingMemorandum
                ? `/api/memorandums/${editingMemorandum.id}`
                : `/api/memorandums`;

            const res = await fetch(url, {
                method,
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.error ||
                        (editingMemorandum
                            ? "Failed to update memorandum"
                            : "Failed to add memorandum")
                );
            }

            reset();
            setIsDialogOpen(false);
            await refreshMemorandums(method === "POST");
            toast({
                title: `Memorandum ${method === "POST" ? "Added" : "Updated"}`,
                description: `The memorandum has been successfully ${
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
            const res = await fetch(`/api/memorandums/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                throw new Error("Failed to delete memorandum");
            }

            await refreshMemorandums();
            toast({
                title: "Memorandum Deleted",
                description: "The memorandum has been successfully removed.",
            });
        } catch (error) {
            console.error("Delete failed", error);
            toast({
                title: "Error",
                description:
                    error instanceof Error
                        ? error.message
                        : "Failed to delete memorandum",
                variant: "destructive",
            });
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleArchive = async (id: string, currentState: boolean) => {
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/memorandums/${id}/archive`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (!res.ok) throw new Error("Failed to update archive status");
            await refreshMemorandums();
            toast({
                title: currentState
                    ? "Memorandum Unarchived"
                    : "Memorandum Archived",
                description: `The memorandum has been successfully ${
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
        (memorandum: Memorandum) => {
            setEditingMemorandum(memorandum);
            reset(memorandum);
            setIsDialogOpen(true);
        },
        [reset]
    );

    const openAddModal = useCallback(() => {
        setEditingMemorandum(null);
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
                `/api/memorandums/export?search=${encodeURIComponent(
                    debouncedSearchInput
                )}&memorandumState=${encodeURIComponent(
                    memorandumState
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
                                title="Active Memorandums"
                                variant={
                                    memorandumState === "active"
                                        ? "default"
                                        : "ghost"
                                }
                                size="sm"
                                onClick={() => {
                                    setMemorandumState("active");
                                    setPage(1);
                                    setSearchInput("");

                                    setSortOption("createdAt:desc");
                                }}
                                className="px-2"
                            >
                                <Package className="h-5 w-5" />
                            </Button>
                            <Button
                                title="Archived Memorandums"
                                variant={
                                    memorandumState === "archived"
                                        ? "default"
                                        : "ghost"
                                }
                                size="sm"
                                onClick={() => {
                                    setMemorandumState("archived");
                                    setPage(1);
                                    setSearchInput("");
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
                            Add New Memorandum
                        </Button>
                    </div>
                </div>

                <div className="flex pb-2">
                    <div className="flex-none w-1/2 pe-1">
                        <Input
                            placeholder="Search memorandums..."
                            value={searchInput}
                            onChange={(e) => {
                                setSearchInput(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="flex w-1/2 ms-1">
                        <div className="flex flex-grow">
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
                            memorandums={memorandums}
                            handleEdit={handleEdit}
                            deleteLoading={deleteLoading}
                            handleDelete={handleDelete}
                            handleArchive={handleArchive}
                            selectedImage={selectedImage}
                            setSelectedImage={setSelectedImage}
                        />
                    ) : (
                        <CardView
                            memorandums={memorandums}
                            handleEdit={handleEdit}
                            deleteLoading={deleteLoading}
                            handleDelete={handleDelete}
                            handleArchive={handleArchive}
                            selectedImage={selectedImage}
                            setSelectedImage={setSelectedImage}
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
                            {editingMemorandum
                                ? "Edit Memorandum"
                                : "Add Memorandum"}
                        </DialogTitle>
                    </DialogHeader>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <div>
                            <p className="text-sm my-2 text-gray-500">
                                Memo Number
                            </p>
                            <Input
                                {...register("memoNumber")}
                                className="w-full"
                            />
                            {errors.memoNumber && (
                                <p className="text-red-500 text-sm my-1">
                                    {errors.memoNumber.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm my-2 text-gray-500">
                                Addressee
                            </p>
                            <Input
                                {...register("addressee")}
                                className="w-full"
                            />
                            {errors.addressee && (
                                <p className="text-red-500 text-sm my-1">
                                    {errors.addressee.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm my-2 text-gray-500">Sender</p>
                            <Input {...register("sender")} className="w-full" />
                            {errors.sender && (
                                <p className="text-red-500 text-sm my-1">
                                    {errors.sender.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm my-2 text-gray-500">
                                Sender's Office
                            </p>
                            <Input
                                {...register("senderOffice")}
                                className="w-full"
                            />
                            {errors.senderOffice && (
                                <p className="text-red-500 text-sm my-1">
                                    {errors.senderOffice.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm my-2 text-gray-500">
                                Subject
                            </p>
                            <Input
                                {...register("subject")}
                                className="w-full"
                            />
                            {errors.subject && (
                                <p className="text-red-500 text-sm my-1">
                                    {errors.subject.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm my-2 text-gray-500">Date</p>
                            <Input {...register("date")} className="w-full" />
                            {errors.date && (
                                <p className="text-red-500 text-sm my-1">
                                    {errors.date.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm my-2 text-gray-500">
                                Keywords
                            </p>
                            <Input
                                {...register("keywords")}
                                className="w-full"
                            />
                            {errors.keywords && (
                                <p className="text-red-500 text-sm my-1">
                                    {errors.keywords.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <p className="text-sm my-2 text-gray-500">Image</p>
                            <div className="flex items-center gap-4">
                                {watch("image") && (
                                    <Image
                                        src={watch("image") || ""}
                                        alt="Memorandum preview"
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
                                {editingMemorandum
                                    ? "Update Memorandum"
                                    : "Add Memorandum"}
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
                            The memorandum &quot;
                            {deleteRestrictedMemorandumName}
                            &quot; cannot be deleted because it has associated
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
