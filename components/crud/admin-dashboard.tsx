"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { memorandumSchema, issuingOfficeSchema, signatorySchema } from "@/schemas";
import { HashLoader } from "react-spinners";
import { HiOutlineRefresh } from "react-icons/hi";
import { Plus } from "lucide-react";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";

type MemorandumFormInputs = z.infer<typeof memorandumSchema>;
type IssuingOfficeFormInputs = z.infer<typeof issuingOfficeSchema>;
type SignatoryFormInputs = z.infer<typeof signatorySchema>;

interface Memorandum {
  id: string;
  memoNumber: string;
  issuingOffice: string;
  signatory: string;
  subject: string;
  date: string;
  division: string;
  section: string;
  encoder: string;
  keywords: string;
  pdfUrl: string;
  isArchived: boolean;
}

interface IssuingOffice {
  id: string;
  unitCode: string;
  unit: string;
}

interface Signatory {
  id: string;
  fullName: string;
}

interface PaginatedMemorandums {
  memorandums: Memorandum[];
  totalMemorandums: number;
  currentPage: number;
  totalPages: number;
}

interface FetchedIssuingOffices {
  issuingOffices: IssuingOffice[];
}

interface FetchedSignatories {
  signatories: Signatory[];
}

const fetchMemorandums = async (
  page: number = 1,
  searchInput: string = "",
  sort: string = "createdAt:desc",
  memorandumState: string = "active",
  issuingOfficeFilter: string = "",
  signatoryFilter: string = "",
  divisionFilter: string = "",
  sectionFilter: string = "",
  signal?: AbortSignal
): Promise<PaginatedMemorandums> => {
  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (searchInput) params.set("search", searchInput.trim());
    if (memorandumState) params.set("memorandumState", memorandumState);
    if (sort) params.set("sort", sort);
    if (issuingOfficeFilter) params.set("issuingOffice", issuingOfficeFilter);
    if (signatoryFilter) params.set("signatory", signatoryFilter);
    if (divisionFilter) params.set("division", divisionFilter);
    if (sectionFilter) params.set("section", sectionFilter);

    const res = await fetch(`/api/memorandums?${params.toString()}`, { signal });

    if (!res.ok) throw new Error("Failed to fetch official references");
    return res.json();
  } catch (error: unknown) {
    if (error instanceof Error && error.name !== "AbortError") {
      console.error("Failed to load official references:", error);
    }
    return {
      memorandums: [],
      totalMemorandums: 0,
      currentPage: page,
      totalPages: 1,
    };
  }
};

const fetchIssuingOffices = async (): Promise<FetchedIssuingOffices> => {
  try {
    const res = await fetch("/api/issuing-offices");

    if (!res.ok) throw new Error("Failed to fetch offices/agencies");
    return res.json();
  } catch (error: unknown) {
    if (error instanceof Error && error.name !== "AbortError") {
      console.error("Failed to load offices/agencies:", error);
    }
    return {
      issuingOffices: [],
    };
  }
};

const fetchSignatories = async (): Promise<FetchedSignatories> => {
  try {
    const res = await fetch("/api/signatories");

    if (!res.ok) throw new Error("Failed to fetch signatories");
    return res.json();
  } catch (error: unknown) {
    if (error instanceof Error && error.name !== "AbortError") {
      console.error("Failed to load signatories:", error);
    }
    return {
      signatories: [],
    };
  }
};

export default function AdminDashboard() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const [_issuingOfficeOpen, _setIssuingOfficeOpen] = useState(false);
  const [_issuingOfficeValue, _setIssuingOfficeValue] = useState("");
  const [issuingOffices, setIssuingOffices] = useState<IssuingOffice[]>([]);
  const [isIssuingOfficeDialogOpen, setIsIssuingOfficeDialogOpen] = useState(false);

  const [_signatoryOpen, _setSignatoryOpen] = useState(false);
  const [_signatoryValue, _setSignatoryValue] = useState("");
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [isSignatoryDialogOpen, setIsSignatoryDialogOpen] = useState(false);

  const [issuingOfficeOpen, setIssuingOfficeOpen] = useState(false);
  const [signatoryOpen, setSignatoryOpen] = useState(false);
  const [divisionOpen, setDivisionOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const [date, setDate] = useState<Date | null>(null);
  const [memorandums, setMemorandums] = useState<Memorandum[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingMemorandum, setEditingMemorandum] = useState<Memorandum | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [sortOption, setSortOption] = useState<string>("createdAt:desc");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [memorandumState, setMemorandumState] = useState<"active" | "archived">("active");
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const debouncedSearchInput = useDebounce(searchInput, 250);
  const controllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleteRestrictedDialogOpen, setIsDeleteRestrictedDialogOpen] = useState(false);
  const [deleteRestrictedMemorandumName, setDeleteRestrictedMemorandumName] = useState("");

  const [issuingOfficeFilter, setIssuingOfficeFilter] = useState<string>("");
  const [signatoryFilter, setSignatoryFilter] = useState<string>("");
  const [divisionFilter, setDivisionFilter] = useState<string>("");
  const [sectionFilter, setSectionFilter] = useState<string>("");
  const requestIdRef = useRef<string>("");

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
    register: registerIssuingOffice,
    handleSubmit: handleSubmitIssuingOffice,
    formState: { errors: issuingOfficeErrors },
    reset: resetIssuingOffice,
  } = useForm<IssuingOfficeFormInputs>({
    resolver: zodResolver(issuingOfficeSchema),
    mode: "onChange",
  });

  const {
    register: registerSignatory,
    handleSubmit: handleSubmitSignatory,
    formState: { errors: signatoryErrors },
    reset: resetSignatory,
  } = useForm<SignatoryFormInputs>({
    resolver: zodResolver(signatorySchema),
    mode: "onChange",
  });

  const sortOptions = useMemo(
    () => [
      { value: "createdAt:desc", label: "Date Encoded (Newest)" },
      { value: "createdAt:asc", label: "Date Encoded (Oldest)" },
      { value: "date:desc", label: "Date Issued (Newest)" },
      { value: "date:asc", label: "Date Issued (Oldest)" },
    ],
    []
  );

  const divisionOptions = useMemo(
    () => [
      { value: "ALL", label: "All" },
      { value: "MANAGEMENT", label: "Management" },
      { value: "RECRUITMENT", label: "Recruitment Division" },
      { value: "PLANNING_RESEARCH", label: "Planning & Research Division" },
      { value: "DEVELOPMENT_BENEFITS", label: "Development & Benefits Division" },
    ],
    []
  );

  const sectionOptions = useMemo(
    () => [
      { value: "ALL", label: "All" },
      { value: "EXECUTIVE", label: "Executive" },
      { value: "ADMINISTRATIVE", label: "Administrative Section" },
      {
        value: "RECRUITMENT_SELECTION",
        label: "Recruitment & Selection Section",
      },
      { value: "APPOINTMENT", label: "Appointment Section" },
      {
        value: "PLANNING_RESEARCH",
        label: "Planning & Research Section",
      },
      {
        value: "MONITORING_EVALUATION",
        label: "Monitoring & Evaluation Section",
      },
      {
        value: "INFORMATION_MANAGEMENT",
        label: "Information Management Section",
      },
      { value: "PROJECTS", label: "Projects Section" },
      { value: "SCHOLARSHIP", label: "Scholarship Section" },
      { value: "TRAINING", label: "Training Section" },
      { value: "BENEFITS", label: "Benefits Section" },
    ],
    []
  );

  const loadMemorandums = useCallback(
    async (page = 1) => {
      const currentRequestId = `${page}-${debouncedSearchInput}-${sortOption}-${memorandumState}-${issuingOfficeFilter}-${signatoryFilter}-${divisionFilter}-${sectionFilter}-${Date.now()}`;
      requestIdRef.current = currentRequestId;
      setLoading(true);

      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const { memorandums: fetchedMemorandums, totalPages } = await fetchMemorandums(
          page,
          debouncedSearchInput,
          sortOption,
          memorandumState,
          issuingOfficeFilter,
          signatoryFilter,
          divisionFilter,
          sectionFilter,
          controller.signal
        );

        if (requestIdRef.current === currentRequestId) {
          setMemorandums(fetchedMemorandums);
          setTotalPages(totalPages);
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Failed to load official references:", error);
        }
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setLoading(false);
        }
      }
    },
    [
      debouncedSearchInput,
      sortOption,
      memorandumState,
      issuingOfficeFilter,
      signatoryFilter,
      divisionFilter,
      sectionFilter,
    ]
  );

  useEffect(() => {
    const fetchIssuingOffices = async () => {
      try {
        const res = await fetch("/api/issuing-offices");
        if (!res.ok) {
          throw new Error("Failed to fetch offices/agencies");
        }
        const data = await res.json();
        setIssuingOffices(data.issuingOffices);
      } catch (error) {
        console.error("Error fetching offices/agencies:", error);
      }
    };

    const fetchSignatories = async () => {
      try {
        const res = await fetch("/api/signatories");
        if (!res.ok) {
          throw new Error("Failed to fetch signatories");
        }
        const data = await res.json();
        setSignatories(data.signatories);
      } catch (error) {
        console.error("Error fetching signatories:", error);
      }
    };

    fetchIssuingOffices();
    fetchSignatories();
  }, []);

  useEffect(() => {
    loadMemorandums(page);
    return () => {
      controllerRef.current?.abort();
    };
  }, [page, loadMemorandums]);

  const refreshMemorandums = useCallback(
    async (add = false) => {
      const currentRequestId = `refresh-${page}-${debouncedSearchInput}-${sortOption}-${memorandumState}-${issuingOfficeFilter}-${signatoryFilter}-${divisionFilter}-${sectionFilter}-${Date.now()}`;
      requestIdRef.current = currentRequestId;

      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const updatedMemorandums = await fetchMemorandums(
          page,
          debouncedSearchInput,
          sortOption,
          memorandumState,
          issuingOfficeFilter,
          signatoryFilter,
          divisionFilter,
          sectionFilter,
          controller.signal
        );

        if (requestIdRef.current === currentRequestId) {
          if (updatedMemorandums.memorandums.length === 0 && page > 1) {
            setPage((prevPage) => prevPage - 1);
          } else {
            setMemorandums(updatedMemorandums.memorandums);
            setTotalPages(updatedMemorandums.totalPages);
            if (add) setPage(1);
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Failed to refresh memorandums:", error);
        }
      }
    },
    [
      page,
      debouncedSearchInput,
      sortOption,
      memorandumState,
      issuingOfficeFilter,
      signatoryFilter,
      divisionFilter,
      sectionFilter,
    ]
  );

  const refreshIssuingOffices = useCallback(async () => {
    const updatedIssuingOffices = await fetchIssuingOffices();

    setIssuingOffices(updatedIssuingOffices.issuingOffices);
  }, []);

  const refreshSignatories = useCallback(async () => {
    const updatedSignatories = await fetchSignatories();

    setSignatories(updatedSignatories.signatories);
  }, []);

  const handlePdfUpload = async (file: File) => {
    setPdfUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setPdfUrl(data.url);
    setMemoValue("pdfUrl", data.url);
    setPdfUploading(false);
  };

  const onMemoSubmit = async (data: MemorandumFormInputs) => {
    setSubmitLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      if (pdfUrl && pdfUrl !== "undefined") {
        formData.set("pdfUrl", pdfUrl);
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
              ? "Failed to update official reference"
              : "Failed to add official reference")
        );
      }
      resetMemo();
      setIsDialogOpen(false);
      setIsIssuingOfficeDialogOpen(false);
      setIsSignatoryDialogOpen(false);
      await refreshMemorandums(method === "POST");
      toast({
        title: `Official Reference ${method === "POST" ? "Added" : "Updated"}`,
        description: `The official reference has been successfully ${
          method === "POST" ? "added" : "updated"
        }.`,
      });
    } catch (error) {
      console.error("Submit failed", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const onIssuingOfficeSubmit = async (data: IssuingOfficeFormInputs) => {
    setSubmitLoading(true);
    try {
      const formData = new FormData();
      const { ...restData } = data;
      Object.entries(restData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      const res = await fetch("/api/issuing-offices", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add office/agency");
      }

      resetIssuingOffice();
      setIsIssuingOfficeDialogOpen(false);
      await refreshIssuingOffices();
      toast({
        title: "Office/Agency Added",
        description: "The Office/Agency has been successfully added",
      });
    } catch (error) {
      console.error("Submit failed", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const onSignatorySubmit = async (data: SignatoryFormInputs) => {
    setSubmitLoading(true);
    try {
      const formData = new FormData();
      const { ...restData } = data;
      Object.entries(restData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      const res = await fetch("/api/signatories", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add signatory");
      }

      resetSignatory();
      setIsSignatoryDialogOpen(false);
      await refreshSignatories();
      toast({
        title: "Signatory Added",
        description: "The signatory has been successfully added",
      });
    } catch (error) {
      console.error("Submit failed", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
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
        throw new Error("Failed to delete official reference");
      }

      await refreshMemorandums();
      toast({
        title: "Official Reference Deleted",
        description: "The official reference has been successfully removed.",
      });
    } catch (error) {
      console.error("Delete failed", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete official reference",
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
        title: currentState ? "Official Reference Unarchived" : "Official Reference Archived",
        description: `The official reference has been successfully ${
          currentState ? "unarchived" : "archived"
        }.`,
      });
    } catch (error) {
      console.error("Archive toggle failed", error);
      toast({
        title: "Error",
        description: "Failed to update archive status. Please try again.",
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
      _setIssuingOfficeValue(memorandum.issuingOffice ? memorandum.issuingOffice : "");
      _setSignatoryValue(memorandum.signatory ? memorandum.signatory : "");
      resetMemo(memorandum);
      setIsDialogOpen(true);
    },
    [resetMemo]
  );

  const openAddModal = useCallback(() => {
    setEditingMemorandum(null);
    setDate(null);
    _setIssuingOfficeValue("");
    _setSignatoryValue("");
    resetMemo({
      memoNumber: "",
      issuingOffice: "",
      signatory: "",
      subject: "",
      date: "",
      keywords: "",
      pdfUrl: "",
    });
    setIsDialogOpen(true);
  }, [resetMemo]);

  const openAddIssuingOfficeModal = useCallback(() => {
    resetIssuingOffice({
      unitCode: "",
      unit: "",
    });
    setIsIssuingOfficeDialogOpen(true);
  }, [resetIssuingOffice]);

  const openAddSignatoryModal = useCallback(() => {
    resetSignatory({
      fullName: "",
    });
    setIsSignatoryDialogOpen(true);
  }, [resetSignatory]);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const response = await fetch(
        `/api/memorandums/export?search=${encodeURIComponent(
          debouncedSearchInput
        )}&memorandumState=${encodeURIComponent(memorandumState)}&sort=${encodeURIComponent(
          sortOption
        )}&issuingOffice=${encodeURIComponent(issuingOfficeFilter)}&signatory=${encodeURIComponent(
          signatoryFilter
        )}&division=${encodeURIComponent(divisionFilter)}&section=${encodeURIComponent(
          sectionFilter
        )}`
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
      <div className="mx-auto mb-2 border bg-white px-8 pt-8 pb-3 flex flex-col w-full shadow-md h-full">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-semibold text-[#7b1113]">CORE Dashboard</h1>

          <div className="flex gap-2">
            {/* <div className="flex items-center bg-gray-100 rounded-md p-1">
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
                        </div> */}

            <div className="flex items-center bg-gray-200 rounded-md h-11">
              <Button
                title="Card view"
                variant={viewMode === "card" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("card")}
                className="mx-1 px-2 w-9 h-9"
              >
                <LuLayoutGrid className="h-7 w-7" />
              </Button>
              <Button
                title="Tabular view"
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="me-1 px-2 w-9 h-9"
              >
                <LuTable2 className="h-7 w-7" />
              </Button>
            </div>
            {/* <Button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="flex items-center gap-2"
                        >
                            <FiDownload className="h-4 w-4" />
                            {isExporting ? "Exporting..." : "Export CSV"}
                        </Button> */}
            {role === "ADMIN" && (
              <Button
                onClick={openAddModal}
                disabled={loading}
                className={loading ? "opacity-50 h-11 text-md" : "h-11 text-md"}
              >
                Add Official Reference
              </Button>
            )}
          </div>
        </div>

        <div className="flex w-full pb-2">
          <div className="flex-none w-[calc(100%-52px)]">
            <Input
              placeholder="Search official references..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              className="h-11 text-md border border-gray-300 border-2"
            />
          </div>
          <Button
            className={`ms-2 p-0 ${loading ? "opacity-50 w-11 h-11" : "w-11 h-11"}`}
            onClick={() => {
              setPage(1);
              setSearchInput("");
              setIssuingOfficeFilter("");
              setSignatoryFilter("");
              setDivisionFilter("");
              setSectionFilter("");
              setSortOption("createdAt:desc");
            }}
            disabled={loading}
          >
            <HiOutlineRefresh size={25} />
          </Button>
        </div>

        <div className="flex w-full pb-2 gap-2">
          <div className="w-1/4">
            <p className="text-sm my-1 text-gray-500">Division</p>
            <Popover open={divisionOpen} onOpenChange={setDivisionOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-between font-normal ${
                    divisionFilter ? "" : "text-gray-500"
                  }`}
                >
                  <span className="max-w-full truncate">
                    {divisionFilter
                      ? divisionOptions.find((option) => option.value === divisionFilter)?.label
                      : "Filter by division..."}
                  </span>
                  <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search division..." />
                  <CommandList>
                    <CommandEmpty>No division found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {divisionOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={(currentValue) => {
                            setDivisionFilter(
                              currentValue === "ALL" || currentValue === divisionFilter
                                ? ""
                                : currentValue
                            );
                            setPage(1);
                            setDivisionOpen(false);
                          }}
                        >
                          <CheckIcon
                            className={cn(
                              "mr-2 h-4 w-4",
                              divisionFilter === option.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="w-1/4">
            <p className="text-sm my-1 text-gray-500">Section</p>
            <Popover open={sectionOpen} onOpenChange={setSectionOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-between font-normal ${
                    sectionFilter ? "" : "text-gray-500"
                  }`}
                >
                  <span className="max-w-full truncate">
                    {sectionFilter
                      ? sectionOptions.find((option) => option.value === sectionFilter)?.label
                      : "Filter by section..."}
                  </span>
                  <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search section..." />
                  <CommandList>
                    <CommandEmpty>No section found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {sectionOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={(currentValue) => {
                            setSectionFilter(
                              currentValue === "ALL" || currentValue === sectionFilter
                                ? ""
                                : currentValue
                            );
                            setPage(1);
                            setSectionOpen(false);
                          }}
                        >
                          <CheckIcon
                            className={cn(
                              "mr-2 h-4 w-4",
                              sectionFilter === option.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="w-1/4">
            <Select
            // value={sectionFilter}
            // onValueChange={(value) => {
            //   setSectionFilter(value === "ALL" ? "" : value);
            //   setPage(1);
            // }}
            >
              <SelectTrigger className="h-11 text-md">
                <SelectValue placeholder="Filter by encoder" />
              </SelectTrigger>
              {/* <SelectContent>
                {sectionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="h-11 text-md">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent> */}
            </Select>
          </div>
          <div className="w-1/4">
            <Select
            // value={sectionFilter}
            // onValueChange={(value) => {
            //   setSectionFilter(value === "ALL" ? "" : value);
            //   setPage(1);
            // }}
            >
              <SelectTrigger className="h-11 text-md">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              {/* <SelectContent>
                {sectionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="h-11 text-md">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent> */}
            </Select>
          </div>
        </div>

        <div className="flex w-full pb-4 gap-2">
          <div className="w-1/4">
            <p className="text-sm my-1 text-gray-500">Issuing Office/Agency</p>
            <Popover open={issuingOfficeOpen} onOpenChange={setIssuingOfficeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-between font-normal ${
                    issuingOfficeFilter ? "" : "text-gray-500"
                  }`}
                >
                  <span className="max-w-full truncate">
                    {issuingOfficeFilter
                      ? `${
                          issuingOffices.find(
                            (issuingOffice) =>
                              `${issuingOffice.unitCode}-${issuingOffice.unit}` ===
                              issuingOfficeFilter
                          )?.unitCode
                        }-${
                          issuingOffices.find(
                            (issuingOffice) =>
                              `${issuingOffice.unitCode}-${issuingOffice.unit}` ===
                              issuingOfficeFilter
                          )?.unit
                        }`
                      : "Filter by issuing office..."}
                  </span>
                  <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search issuing office..." />
                  <CommandList>
                    <CommandEmpty>No issuing office found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      <CommandItem
                        key="ALL"
                        value="ALL"
                        onSelect={(currentValue) => {
                          setIssuingOfficeFilter(
                            currentValue === "ALL" || currentValue === issuingOfficeFilter
                              ? ""
                              : currentValue
                          );
                          setPage(1);
                          setIssuingOfficeOpen(false);
                        }}
                      >
                        <CheckIcon
                          className={cn(
                            "mr-2 h-4 w-4",
                            issuingOfficeFilter === "ALL" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        All
                      </CommandItem>
                      {issuingOffices.map((issuingOffice) => (
                        <CommandItem
                          key={`${issuingOffice.unitCode}-${issuingOffice.unit}`}
                          value={`${issuingOffice.unitCode}-${issuingOffice.unit}`}
                          onSelect={(currentValue) => {
                            setIssuingOfficeFilter(
                              currentValue === "ALL" || currentValue === issuingOfficeFilter
                                ? ""
                                : currentValue
                            );
                            setPage(1);
                            setIssuingOfficeOpen(false);
                          }}
                        >
                          <CheckIcon
                            className={cn(
                              "mr-2 h-4 w-4",
                              issuingOfficeFilter ===
                                `${issuingOffice.unitCode}-${issuingOffice.unit}`
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {`${issuingOffice.unitCode}-${issuingOffice.unit}`}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="w-1/4">
            <p className="text-sm my-1 text-gray-500">Signatory</p>
            <Popover open={signatoryOpen} onOpenChange={setSignatoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-between font-normal ${
                    signatoryFilter ? "" : "text-gray-500"
                  }`}
                >
                  <span className="max-w-full truncate">
                    {signatoryFilter
                      ? signatories.find((signatory) => signatory.fullName === signatoryFilter)
                          ?.fullName
                      : "Filter by signatory..."}
                  </span>
                  <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search signatory..." />
                  <CommandList>
                    <CommandEmpty>No signatory found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      <CommandItem
                        key="ALL"
                        value="ALL"
                        onSelect={(currentValue) => {
                          setSignatoryFilter(
                            currentValue === "ALL" || currentValue === signatoryFilter
                              ? ""
                              : currentValue
                          );
                          setPage(1);
                          setSignatoryOpen(false);
                        }}
                      >
                        <CheckIcon
                          className={cn(
                            "mr-2 h-4 w-4",
                            signatoryFilter === "ALL" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        All
                      </CommandItem>
                      {signatories.map((signatory) => (
                        <CommandItem
                          key={signatory.fullName}
                          value={signatory.fullName}
                          onSelect={(currentValue) => {
                            setSignatoryFilter(
                              currentValue === "ALL" || currentValue === signatoryFilter
                                ? ""
                                : currentValue
                            );
                            setPage(1);
                            setSignatoryOpen(false);
                          }}
                        >
                          <CheckIcon
                            className={cn(
                              "mr-2 h-4 w-4",
                              signatoryFilter === signatory.fullName ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {signatory.fullName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="w-1/4">
            <Select
            // value={sectionFilter}
            // onValueChange={(value) => {
            //   setSectionFilter(value === "ALL" ? "" : value);
            //   setPage(1);
            // }}
            >
              <SelectTrigger className="h-11 text-md">
                <SelectValue placeholder="Filter by keyword" />
              </SelectTrigger>
              {/* <SelectContent>
                {sectionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="h-11 text-md">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent> */}
            </Select>
          </div>
          <div className="w-1/4">
            <p className="text-sm my-1 text-gray-500">Sort Options</p>
            <Popover open={sortOpen} onOpenChange={setSortOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal">
                  <span className="max-w-full truncate">
                    {sortOptions.find((option) => option.value === sortOption)?.label}
                  </span>
                  <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandList>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {sortOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={(currentValue) => {
                            setSortOption(currentValue);
                            setPage(1);
                            setSortOpen(false);
                          }}
                        >
                          <CheckIcon
                            className={cn(
                              "mr-2 h-4 w-4",
                              sortOption === option.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
            />
          ) : (
            <CardView
              memorandums={memorandums}
              handleEdit={handleEdit}
              deleteLoading={deleteLoading}
              handleDelete={handleDelete}
              handleArchive={handleArchive}
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
        <DialogContent className="border-black/80 overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {editingMemorandum ? "Edit Official Reference" : "Add Official Reference"}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[90vh] flex-1 px-1">
            <form onSubmit={handleSubmitMemo(onMemoSubmit)} className="space-y-4">
              <div className="flex gap-2">
                <div>
                  <p className="text-sm my-2 text-gray-500">Reference Number</p>
                  <Input {...registerMemo("memoNumber")} className="w-full" />
                  {memoErrors.memoNumber && (
                    <p className="text-red-500 text-sm my-1">{memoErrors.memoNumber.message}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm my-2 text-gray-500">Date</p>
                  <DatePicker
                    date={date}
                    setDate={(d: Date | null) => {
                      setDate(d);
                      setMemoValue(
                        "date",
                        d
                          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
                              2,
                              "0"
                            )}-${String(d.getDate()).padStart(2, "0")}`
                          : ""
                      );
                      triggerMemo("date");
                    }}
                    content="Date"
                  />
                  {memoErrors.date && (
                    <p className="text-red-500 text-sm my-1">{memoErrors.date.message}</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm my-2 text-gray-500">Signatory</p>
                <div className="flex">
                  <Popover open={_signatoryOpen} onOpenChange={_setSignatoryOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={_signatoryOpen}
                        className={`w-full justify-between font-normal ${
                          signatories.find((signatory) => signatory.fullName === _signatoryValue)
                            ? ""
                            : "text-gray-500"
                        }`}
                      >
                        <span className="truncate max-w-[360px]">
                          {_signatoryValue
                            ? signatories.find(
                                (signatory) => signatory.fullName === _signatoryValue
                              )?.fullName
                            : "Select signatory..."}
                        </span>
                        <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent disablePortal className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search signatory..." />
                        <CommandList>
                          <CommandEmpty>No signatory found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-y-auto max-w-[420px]">
                            {signatories.map((signatory) => (
                              <CommandItem
                                key={signatory.fullName}
                                value={signatory.fullName}
                                onSelect={(currentValue) => {
                                  _setSignatoryValue(
                                    currentValue === _signatoryValue ? "" : currentValue
                                  );
                                  setMemoValue("signatory", signatory.fullName);
                                  _setSignatoryOpen(false);
                                }}
                              >
                                <CheckIcon
                                  className={cn(
                                    "h-4 w-4",
                                    _signatoryValue === signatory.fullName
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {signatory.fullName}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    className={`ms-1 p-0 w-[38px] h-9 ${submitLoading ? "opacity-50" : ""}`}
                    title="Add signatory"
                    onClick={openAddSignatoryModal}
                    disabled={submitLoading}
                  >
                    <Plus size={22} />
                  </Button>
                </div>
                {memoErrors.signatory && (
                  <p className="text-red-500 text-sm my-1">{memoErrors.signatory.message}</p>
                )}
              </div>

              <div>
                <p className="text-sm my-2 text-gray-500">Keywords</p>
                <div className="flex">
                  <MultiSelect>
                    <MultiSelectTrigger className="w-full">
                      <div className="max-h-[100px] overflow-y-auto flex-1 text-left">
                        <MultiSelectValue placeholder="Select one or more keywords..." />
                      </div>
                    </MultiSelectTrigger>
                    <MultiSelectContent>
                      <MultiSelectGroup>
                        {signatories.map((signatory) => (
                          <MultiSelectItem key={signatory.id} value={signatory.fullName}>
                            {signatory.fullName}
                          </MultiSelectItem>
                        ))}
                      </MultiSelectGroup>
                    </MultiSelectContent>
                  </MultiSelect>
                </div>
              </div>

              <div>
                <p className="text-sm my-2 text-gray-500">Issuing Office/Agency</p>
                <div className="flex">
                  <Popover open={_issuingOfficeOpen} onOpenChange={_setIssuingOfficeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={_issuingOfficeOpen}
                        className={`w-full justify-between font-normal ${
                          issuingOffices.find(
                            (issuingOffice) =>
                              `${issuingOffice.unitCode}-${issuingOffice.unit}` ===
                              _issuingOfficeValue
                          )
                            ? ""
                            : "text-gray-500"
                        }`}
                      >
                        <span className="truncate max-w-[360px]">
                          {_issuingOfficeValue
                            ? `${
                                issuingOffices.find(
                                  (issuingOffice) =>
                                    `${issuingOffice.unitCode}-${issuingOffice.unit}` ===
                                    _issuingOfficeValue
                                )?.unitCode
                              }-${
                                issuingOffices.find(
                                  (issuingOffice) =>
                                    `${issuingOffice.unitCode}-${issuingOffice.unit}` ===
                                    _issuingOfficeValue
                                )?.unit
                              }`
                            : "Select office/agency..."}
                        </span>
                        <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent disablePortal className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search office/agency..." />
                        <CommandList>
                          <CommandEmpty>No office/agency found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-y-auto max-w-[420px]">
                            {issuingOffices.map((issuingOffice) => (
                              <CommandItem
                                key={`${issuingOffice.unitCode}-${issuingOffice.unit}`}
                                value={`${issuingOffice.unitCode}-${issuingOffice.unit}`}
                                onSelect={(currentValue) => {
                                  _setIssuingOfficeValue(
                                    currentValue === _issuingOfficeValue ? "" : currentValue
                                  );
                                  setMemoValue(
                                    "issuingOffice",
                                    `${issuingOffice.unitCode}-${issuingOffice.unit}`
                                  );
                                  _setIssuingOfficeOpen(false);
                                }}
                              >
                                <CheckIcon
                                  className={cn(
                                    "h-4 w-4",
                                    _issuingOfficeValue ===
                                      `${issuingOffice.unitCode}-${issuingOffice.unit}`
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {`${issuingOffice.unitCode}-${issuingOffice.unit}`}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    className={`ms-1 p-0 w-[38px] h-9 ${submitLoading ? "opacity-50" : ""}`}
                    title="Add office/agency"
                    onClick={openAddIssuingOfficeModal}
                    disabled={submitLoading}
                  >
                    <Plus size={22} />
                  </Button>
                </div>
                {memoErrors.issuingOffice && (
                  <p className="text-red-500 text-sm my-1">{memoErrors.issuingOffice.message}</p>
                )}
              </div>
              <div>
                <p className="text-sm my-2 text-gray-500">Subject</p>
                <Input {...registerMemo("subject")} className="w-full" />
                {memoErrors.subject && (
                  <p className="text-red-500 text-sm my-1">{memoErrors.subject.message}</p>
                )}
              </div>

              <div>
                <p className="text-sm my-2 text-gray-500">Keywords</p>
                <Input {...registerMemo("keywords")} className="w-full" />
                {memoErrors.keywords && (
                  <p className="text-red-500 text-sm my-1">{memoErrors.keywords.message}</p>
                )}
              </div>

              <div>
                <p className="text-sm my-2 text-gray-500">PDF Document</p>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePdfUpload(file);
                  }}
                  disabled={pdfUploading}
                />
                {pdfUploading && <span>Uploading PDF...</span>}
                {pdfUrl && (
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    View PDF
                  </a>
                )}
                {memoErrors.pdfUrl && (
                  <p className="text-red-500 text-sm my-1">{memoErrors.pdfUrl.message}</p>
                )}
              </div>

              <DialogFooter>
                <Button type="submit" disabled={submitLoading || pdfUploading || !pdfUrl}>
                  {editingMemorandum ? "Update Official Reference" : "Add Official Reference"}
                </Button>
                <DialogClose asChild>
                  <Button variant="outline" disabled={submitLoading}>
                    Cancel
                  </Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isIssuingOfficeDialogOpen} onOpenChange={setIsIssuingOfficeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Office/Agency</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitIssuingOffice(onIssuingOfficeSubmit)} className="space-y-4">
            <div>
              <p className="text-sm my-2 text-gray-500">Office/Agency Code</p>
              <Input {...registerIssuingOffice("unitCode")} className="w-full" />
              {issuingOfficeErrors.unitCode && (
                <p className="text-red-500 text-sm my-1">{issuingOfficeErrors.unitCode.message}</p>
              )}
            </div>
            <div>
              <p className="text-sm my-2 text-gray-500">Office/Agency</p>
              <Input {...registerIssuingOffice("unit")} className="w-full" />
              {issuingOfficeErrors.unit && (
                <p className="text-red-500 text-sm my-1">{issuingOfficeErrors.unit.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={submitLoading}>
                Add Office/Agency
              </Button>
              <DialogClose asChild>
                <Button variant="outline" disabled={submitLoading}>
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSignatoryDialogOpen} onOpenChange={setIsSignatoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Signatory</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitSignatory(onSignatorySubmit)} className="space-y-4">
            <div>
              <p className="text-sm my-2 text-gray-500">Signatory</p>
              <Input {...registerSignatory("fullName")} className="w-full" />
              {signatoryErrors.fullName && (
                <p className="text-red-500 text-sm my-1">{signatoryErrors.fullName.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={submitLoading}>
                Add Signatory
              </Button>
              <DialogClose asChild>
                <Button variant="outline" disabled={submitLoading}>
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
              The official reference &quot;
              {deleteRestrictedMemorandumName}
              &quot; cannot be deleted because it has associated transactions.
            </AlertDialogDescription>
          </div>

          <AlertDialogFooter className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
            <AlertDialogAction
              onClick={() => setIsDeleteRestrictedDialogOpen(false)}
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
