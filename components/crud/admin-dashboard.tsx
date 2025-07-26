"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { memorandumSchema, senderUnitSchema } from "@/schemas";
import { HashLoader } from "react-spinners";
import { HiOutlineRefresh } from "react-icons/hi";
import { FiDownload } from "react-icons/fi";
import { Plus } from "lucide-react";
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
import { DatePicker } from "@/components/ui/date-picker";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

type MemorandumFormInputs = z.infer<typeof memorandumSchema>;
type SenderUnitFormInputs = z.infer<typeof senderUnitSchema>;

interface Memorandum {
    id: string;
    memoNumber: string;
    addressee: string;
    sender: string;
    senderUnit: string;
    subject: string;
    date: string;
    keywords: string;
    image: string;
    isArchived: boolean;
}

interface SenderUnit {
    id: string;
    unitCode: string;
    unit: string;
}

interface PaginatedMemorandums {
    memorandums: Memorandum[];
    totalMemorandums: number;
    currentPage: number;
    totalPages: number;
}

interface PaginatedSenderUnits {
    senderUnits: SenderUnit[];
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

        if (!res.ok) throw new Error("Failed to fetch memos");
        return res.json();
    } catch (error: unknown) {
        if (error instanceof Error && error.name !== "AbortError") {
            console.error("Failed to load memos:", error);
        }
        return {
            memorandums: [],
            totalMemorandums: 0,
            currentPage: page,
            totalPages: 1,
        };
    }
};

const fetchSenderUnits = async (): Promise<PaginatedSenderUnits> => {
    try {
        const res = await fetch("/api/sender-units");

        if (!res.ok) throw new Error("Failed to fetch units");
        return res.json();
    } catch (error: unknown) {
        if (error instanceof Error && error.name !== "AbortError") {
            console.error("Failed to load units:", error);
        }
        return {
            senderUnits: [],
        };
    }
};

export default function AdminDashboard() {
    const [senderUnitOpen, setSenderUnitOpen] = useState(false);
    const [_senderUnitValue, _setSenderUnitValue] = useState("");
    const [date, setDate] = useState<Date | null>(null);
    const [memorandums, setMemorandums] = useState<Memorandum[]>([]);
    const [senderUnits, setSenderUnits] = useState<SenderUnit[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [editingMemorandum, setEditingMemorandum] =
        useState<Memorandum | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSenderUnitDialogOpen, setIsSenderUnitDialogOpen] = useState(false);
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
        register: registerMemo,
        handleSubmit: handleSubmitMemo,
        formState: { errors: memoErrors },
        reset: resetMemo,
        setValue: setMemoValue,
        watch: watchMemo,
        trigger: triggerMemo,
    } = useForm<MemorandumFormInputs>({
        resolver: zodResolver(memorandumSchema),
        mode: "onChange",
    });

    const {
        register: registerSenderUnit,
        handleSubmit: handleSubmitSenderUnit,
        formState: { errors: senderUnitErrors },
        reset: resetSenderUnit,
        setValue: setSenderUnitValue,
        watch: watchSenderUnit,
        trigger: triggerSenderUnit,
    } = useForm<SenderUnitFormInputs>({
        resolver: zodResolver(senderUnitSchema),
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
                    console.error("Failed to load memos:", error);
                }
            } finally {
                setLoading(false);
            }
        },
        [debouncedSearchInput, sortOption, memorandumState]
    );

    useEffect(() => {
        const fetchSenderUnits = async () => {
            try {
                const res = await fetch("/api/sender-units");
                if (!res.ok) {
                    throw new Error("Failed to fetch units");
                }
                const data = await res.json();
                setSenderUnits(data.senderUnits);
            } catch (error) {
                console.error("Error fetching units:", error);
            }
        };

        fetchSenderUnits();
    }, []);

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

    const refreshSenderUnits = useCallback(async () => {
        const updatedSenderUnits = await fetchSenderUnits();

        setSenderUnits(updatedSenderUnits.senderUnits);
    }, []);

    const onMemoSubmit = async (data: MemorandumFormInputs) => {
        setSubmitLoading(true);
        try {
            const formData = new FormData();
            const { ...restData } = data;
            Object.entries(restData).forEach(([key, value]) => {
                if (key !== "image") {
                    formData.append(key, String(value));
                }
            });

            const imageValue = watchMemo("image");
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
                            ? "Failed to update memo"
                            : "Failed to add memo")
                );
            }

            resetMemo();
            setIsDialogOpen(false);
            setIsSenderUnitDialogOpen(false);
            await refreshMemorandums(method === "POST");
            toast({
                title: `Memo ${method === "POST" ? "Added" : "Updated"}`,
                description: `The memo has been successfully ${
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

    const onSenderUnitSubmit = async (data: SenderUnitFormInputs) => {
        // setSubmitLoading(true);
        try {
            const formData = new FormData();
            const { ...restData } = data;
            Object.entries(restData).forEach(([key, value]) => {
                formData.append(key, String(value));
            });

            const res = await fetch("/api/sender-units", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to add unit");
            }

            resetSenderUnit();
            setIsSenderUnitDialogOpen(false);
            await refreshSenderUnits();
            toast({
                title: "Unit Added",
                description: "The memo has been successfully added",
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
            // setSubmitLoading(false);
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
                throw new Error("Failed to delete memo");
            }

            await refreshMemorandums();
            toast({
                title: "Memo Deleted",
                description: "The memo has been successfully removed.",
            });
        } catch (error) {
            console.error("Delete failed", error);
            toast({
                title: "Error",
                description:
                    error instanceof Error
                        ? error.message
                        : "Failed to delete memo",
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
                title: currentState ? "Memo Unarchived" : "Memo Archived",
                description: `The memo has been successfully ${
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
            setDate(memorandum.date ? new Date(memorandum.date) : null);
            _setSenderUnitValue(
                memorandum.senderUnit ? memorandum.senderUnit : ""
            );
            resetMemo(memorandum);
            setIsDialogOpen(true);
        },
        [resetMemo]
    );

    const openAddModal = useCallback(() => {
        setEditingMemorandum(null);
        setDate(null);
        _setSenderUnitValue("");
        resetMemo({
            memoNumber: "",
            addressee: "",
            sender: "",
            senderUnit: "",
            subject: "",
            date: "",
            keywords: "",
            image: "",
        });
        setIsDialogOpen(true);
    }, [resetMemo]);

    const openAddUnitModal = useCallback(() => {
        setIsSenderUnitDialogOpen(true);
    }, [resetMemo]);

    const handleLocalImageSelect = async (file: File) => {
        return new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                setMemoValue("image", reader.result as string);
                triggerMemo("image");
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
            a.download = `report-${new Date().toISOString().split("T")[0]}.csv`;
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
                        Memo Dashboard
                    </h1>

                    <div className="flex gap-2">
                        <div className="flex items-center bg-gray-100 rounded-md p-1">
                            <Button
                                title="Active Memos"
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
                                title="Archived Memos"
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
                            Add New Memo
                        </Button>
                    </div>
                </div>

                <div className="flex pb-2">
                    <div className="flex-none w-1/2 pe-1">
                        <Input
                            placeholder="Search memos..."
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

            {/* {isDialogOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 transition-opacity"
                    aria-hidden="true"
                />
            )} */}

            <Dialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                // modal={false}
            >
                <DialogContent className="border-black/80 overflow-hidden">
                    {/* {isSenderUnitDialogOpen && (
                        <div
                            className="fixed inset-0 z-50 bg-black/80 transition-opacity"
                            aria-hidden="true"
                        />
                    )} */}
                    <DialogHeader>
                        <DialogTitle>
                            {editingMemorandum ? "Edit Memo" : "Add Memo"}
                        </DialogTitle>
                    </DialogHeader>

                    <form
                        onSubmit={handleSubmitMemo(onMemoSubmit)}
                        className="space-y-4"
                    >
                        <div className="flex gap-2">
                            <div>
                                <p className="text-sm my-2 text-gray-500">
                                    Memo Number
                                </p>
                                <Input
                                    {...registerMemo("memoNumber")}
                                    className="w-full"
                                />
                                {memoErrors.memoNumber && (
                                    <p className="text-red-500 text-sm my-1">
                                        {memoErrors.memoNumber.message}
                                    </p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm my-2 text-gray-500">
                                    Date
                                </p>
                                <DatePicker
                                    date={date}
                                    setDate={(d: Date | null) => {
                                        setDate(d);
                                        setMemoValue(
                                            "date",
                                            d
                                                ? `${d.getFullYear()}-${String(
                                                      d.getMonth() + 1
                                                  ).padStart(2, "0")}-${String(
                                                      d.getDate()
                                                  ).padStart(2, "0")}`
                                                : ""
                                        );
                                        triggerMemo("date");
                                    }}
                                    content="Date"
                                />
                                {memoErrors.date && (
                                    <p className="text-red-500 text-sm my-1">
                                        {memoErrors.date.message}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm my-2 text-gray-500">
                                Addressee
                            </p>
                            <Input
                                {...registerMemo("addressee")}
                                className="w-full"
                            />
                            {memoErrors.addressee && (
                                <p className="text-red-500 text-sm my-1">
                                    {memoErrors.addressee.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm my-2 text-gray-500">Sender</p>
                            <Input
                                {...registerMemo("sender")}
                                className="w-full"
                            />
                            {memoErrors.sender && (
                                <p className="text-red-500 text-sm my-1">
                                    {memoErrors.sender.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm my-2 text-gray-500">
                                Sender&apos;s Unit
                            </p>
                            <div className="flex">
                                <Popover
                                    open={senderUnitOpen}
                                    onOpenChange={setSenderUnitOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={senderUnitOpen}
                                            className={`w-full justify-between  ${
                                                senderUnits.find(
                                                    (senderUnit) =>
                                                        `${senderUnit.unitCode}-${senderUnit.unit}` ===
                                                        _senderUnitValue
                                                )
                                                    ? ""
                                                    : "text-gray-500"
                                            }`}
                                        >
                                            {_senderUnitValue
                                                ? `${
                                                      senderUnits.find(
                                                          (senderUnit) =>
                                                              `${senderUnit.unitCode}-${senderUnit.unit}` ===
                                                              _senderUnitValue
                                                      )?.unitCode
                                                  }-${
                                                      senderUnits.find(
                                                          (senderUnit) =>
                                                              `${senderUnit.unitCode}-${senderUnit.unit}` ===
                                                              _senderUnitValue
                                                      )?.unit
                                                  }`
                                                : "Select unit..."}
                                            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        disablePortal
                                        className="w-full p-0"
                                    >
                                        <Command>
                                            <CommandInput placeholder="Search unit..." />
                                            <CommandList>
                                                <CommandEmpty>
                                                    No unit found.
                                                </CommandEmpty>
                                                <CommandGroup className="max-h-64 overflow-y-auto max-w-[420px]">
                                                    {senderUnits.map(
                                                        (senderUnit) => (
                                                            <CommandItem
                                                                key={`${senderUnit.unitCode}-${senderUnit.unit}`}
                                                                value={`${senderUnit.unitCode}-${senderUnit.unit}`}
                                                                onSelect={(
                                                                    currentValue
                                                                ) => {
                                                                    _setSenderUnitValue(
                                                                        currentValue ===
                                                                            _senderUnitValue
                                                                            ? ""
                                                                            : currentValue
                                                                    );
                                                                    setMemoValue(
                                                                        "senderUnit",
                                                                        `${senderUnit.unitCode}-${senderUnit.unit}`
                                                                    );
                                                                    setSenderUnitOpen(
                                                                        false
                                                                    );
                                                                }}
                                                            >
                                                                <CheckIcon
                                                                    className={cn(
                                                                        "h-4 w-4",
                                                                        _senderUnitValue ===
                                                                            `${senderUnit.unitCode}-${senderUnit.unit}`
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {`${senderUnit.unitCode}-${senderUnit.unit}`}
                                                            </CommandItem>
                                                        )
                                                    )}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <Button
                                    type="button"
                                    className={`ms-1 p-0 w-[38px] h-9 ${
                                        submitLoading ? "opacity-50" : ""
                                    }`}
                                    title="Add unit"
                                    onClick={openAddUnitModal}
                                    disabled={submitLoading}
                                >
                                    <Plus size={22} />
                                </Button>
                            </div>
                            {memoErrors.senderUnit && (
                                <p className="text-red-500 text-sm my-1">
                                    {memoErrors.senderUnit.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm my-2 text-gray-500">
                                Subject
                            </p>
                            <Input
                                {...registerMemo("subject")}
                                className="w-full"
                            />
                            {memoErrors.subject && (
                                <p className="text-red-500 text-sm my-1">
                                    {memoErrors.subject.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <p className="text-sm my-2 text-gray-500">
                                Keywords
                            </p>
                            <Input
                                {...registerMemo("keywords")}
                                className="w-full"
                            />
                            {memoErrors.keywords && (
                                <p className="text-red-500 text-sm my-1">
                                    {memoErrors.keywords.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <p className="text-sm my-2 text-gray-500">Image</p>
                            <div className="flex items-center gap-4">
                                {watchMemo("image") && (
                                    <Image
                                        src={watchMemo("image") || ""}
                                        alt="Memo preview"
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
                            {memoErrors.image && (
                                <p className="text-red-500 text-sm my-1">
                                    {memoErrors.image.message}
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={submitLoading}>
                                {editingMemorandum ? "Update Memo" : "Add Memo"}
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
            <Dialog
                open={isSenderUnitDialogOpen}
                onOpenChange={setIsSenderUnitDialogOpen}
                // modal={false}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Unit</DialogTitle>
                    </DialogHeader>

                    <form
                        onSubmit={handleSubmitSenderUnit(onSenderUnitSubmit)}
                        className="space-y-4"
                    >
                        <div>
                            <p className="text-sm my-2 text-gray-500">
                                Unit Code
                            </p>
                            <Input
                                {...registerSenderUnit("unitCode")}
                                className="w-full"
                            />
                            {senderUnitErrors.unitCode && (
                                <p className="text-red-500 text-sm my-1">
                                    {senderUnitErrors.unitCode.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm my-2 text-gray-500">Unit</p>
                            <Input
                                {...registerSenderUnit("unit")}
                                className="w-full"
                            />
                            {senderUnitErrors.unit && (
                                <p className="text-red-500 text-sm my-1">
                                    {senderUnitErrors.unit.message}
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={submitLoading}>
                                Add Unit
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
                            The memo &quot;
                            {deleteRestrictedMemorandumName}
                            &quot; cannot be deleted because it has associated
                            transactions.
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
