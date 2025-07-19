import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import Image from "next/image";
import { format } from "date-fns";
import { Button } from "../ui/button";
import {
    X,
    Check,
    Search,
    ArrowDownToLine,
    ArrowUpFromLine,
    Clock,
    CheckCircle2,
    XCircle,
    PackageCheck,
    HandCoins,
    PackageX,
} from "lucide-react";
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

interface TableComponentProps {
    requests: Request[];
    itemizedRequests: ItemizedRequest[];
    viewMode: "request" | "item" | "summary";
    handleAction: (
        id: string,
        action: "APPROVE" | "REJECT",
        isSupplyIn: boolean,
        user: string,
        email: string,
        items: RequestItem[],
        requestDate: string,
        additionalNotes: string
    ) => void;
    markAsReceived: (id: string) => void;
    selectedRequest: Request | null;
    setSelectedRequest: (request: Request | null) => void;
    processingId: string | null;
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;
    division: string;
    section: string;
}

const formatName = (name: string) => {
    return name
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

export const TableComponent = ({
    requests,
    itemizedRequests,
    viewMode,
    handleAction,
    markAsReceived,
    selectedRequest,
    setSelectedRequest,
    processingId,
    selectedImage,
    setSelectedImage,
    division,
    section,
}: TableComponentProps) => {
    const { data: session } = useSession();
    const role = session?.user?.role;
    const currentUser = session?.user;

    const divisionMap: { [key in Request["division"]]: string } = {
        MANAGEMENT: "Management",
        RECRUITMENT: "Recruitment Division",
        PLANNING_RESEARCH: "Planning & Research Division",
        DEVELOPMENT_BENEFITS: "Development & Benefits Division",
    };

    const sectionMap: { [key in Request["section"]]: string } = {
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

    return (
        <>
            <div className="border bg-white rounded-md flex-grow overflow-auto">
                {(viewMode === "request" ? requests : itemizedRequests)
                    .length !== 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow className="border-[#e4e4e7] bg-gray-100">
                                {viewMode === "request" ? (
                                    <>
                                        <TableHead className="px-4">
                                            User
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Email
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Division
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Section
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Type
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Date
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Status
                                        </TableHead>
                                        <TableHead className="px-4 text-nowrap">
                                            Items Count
                                        </TableHead>
                                        <TableHead className="px-4 text-nowrap">
                                            Approver
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Action
                                        </TableHead>
                                    </>
                                ) : (
                                    <>
                                        <TableHead className="px-4 text-center">
                                            Image
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Item name
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Quantity
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Unit
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Type
                                        </TableHead>
                                        {viewMode === "item" && (
                                            <>
                                                <TableHead className="px-4">
                                                    User
                                                </TableHead>
                                                <TableHead className="px-4">
                                                    Date
                                                </TableHead>
                                            </>
                                        )}
                                        <TableHead className="px-4">
                                            Division
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Section
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Status
                                        </TableHead>
                                    </>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {viewMode === "request"
                                ? requests.map((request) => (
                                      <TableRow
                                          key={request.id}
                                          className="hover:bg-gray-100 border-[#e4e4e7]"
                                      >
                                          <TableCell className="px-4">
                                              {formatName(request.user)}
                                          </TableCell>
                                          <TableCell
                                              className="px-4 truncate max-w-[200px]"
                                              title={request.email}
                                          >
                                              {request.email}
                                          </TableCell>
                                          <TableCell
                                              className="px-4 truncate max-w-[150px]"
                                              title={
                                                  divisionMap[request.division]
                                              }
                                          >
                                              {divisionMap[request.division]}
                                          </TableCell>

                                          <TableCell
                                              className="px-4 truncate max-w-[150px]"
                                              title={
                                                  sectionMap[request.section]
                                              }
                                          >
                                              {sectionMap[request.section]}
                                          </TableCell>

                                          <TableCell className="px-4 text-nowrap">
                                              <span
                                                  className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 w-fit ${
                                                      request.isSupplyIn
                                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                          : "bg-amber-50 text-amber-700 border border-amber-200"
                                                  }`}
                                              >
                                                  {request.isSupplyIn ? (
                                                      <>
                                                          <ArrowDownToLine className="h-4 w-4" />
                                                          Supply-In
                                                      </>
                                                  ) : (
                                                      <>
                                                          <ArrowUpFromLine className="h-4 w-4" />
                                                          Supply-Out
                                                      </>
                                                  )}
                                              </span>
                                          </TableCell>
                                          <TableCell className="px-4 text-nowrap">
                                              {format(
                                                  new Date(request.createdAt),
                                                  "PPp"
                                              )}
                                          </TableCell>
                                          <TableCell className="px-4 text-nowrap">
                                              <span
                                                  className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 w-fit ${
                                                      request.status ===
                                                      "PENDING"
                                                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                          : request.status ===
                                                            "APPROVED"
                                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                          : "bg-rose-50 text-rose-700 border border-rose-200"
                                                  }`}
                                              >
                                                  {request.status ===
                                                  "PENDING" ? (
                                                      <>
                                                          <Clock className="h-4 w-4" />
                                                          Pending
                                                      </>
                                                  ) : request.status ===
                                                    "APPROVED" ? (
                                                      <>
                                                          <CheckCircle2 className="h-4 w-4" />
                                                          Approved
                                                      </>
                                                  ) : (
                                                      <>
                                                          <XCircle className="h-4 w-4" />
                                                          Rejected
                                                      </>
                                                  )}
                                              </span>
                                          </TableCell>
                                          <TableCell className="px-4 text-nowrap">{`${
                                              request.items.length
                                          } ${
                                              request.items.length > 1
                                                  ? "items"
                                                  : "item"
                                          }`}</TableCell>
                                          <TableCell className="px-4">
                                              {request.approver &&
                                                  formatName(request.approver)}
                                          </TableCell>
                                          <TableCell className="px-4 flex">
                                              <Button
                                                  title="View Details"
                                                  className="mx-1"
                                                  variant="outline"
                                                  size="icon"
                                                  onClick={() =>
                                                      setSelectedRequest(
                                                          request
                                                      )
                                                  }
                                              >
                                                  <Search className="h-6 w-6" />
                                              </Button>
                                              {request.status === "PENDING" ? (
                                                  <>
                                                      {role !== "USER" ? (
                                                          <>
                                                              <Button
                                                                  title="Approve"
                                                                  className="mx-1"
                                                                  variant="outline"
                                                                  size="icon"
                                                                  onClick={() =>
                                                                      handleAction(
                                                                          request.id,
                                                                          "APPROVE",
                                                                          request.isSupplyIn,
                                                                          request.user,
                                                                          request.email,
                                                                          request.items,
                                                                          new Date(
                                                                              request.createdAt
                                                                          ).toISOString(),
                                                                          request.additionalNotes
                                                                      )
                                                                  }
                                                                  disabled={
                                                                      !!processingId
                                                                  }
                                                              >
                                                                  <Check className="h-6 w-6 text-green-500" />
                                                              </Button>

                                                              <Button
                                                                  title="Reject"
                                                                  className="mx-1"
                                                                  variant="outline"
                                                                  size="icon"
                                                                  onClick={() =>
                                                                      handleAction(
                                                                          request.id,
                                                                          "REJECT",
                                                                          request.isSupplyIn,
                                                                          request.user,
                                                                          request.email,
                                                                          request.items,
                                                                          new Date(
                                                                              request.createdAt
                                                                          ).toISOString(),
                                                                          request.additionalNotes
                                                                      )
                                                                  }
                                                                  disabled={
                                                                      !!processingId
                                                                  }
                                                              >
                                                                  <X className="h-6 w-6 text-red-500" />
                                                              </Button>
                                                          </>
                                                      ) : (
                                                          <>
                                                              <div
                                                                  title="Pending"
                                                                  className="h-9 w-9 flex items-center justify-center mx-1"
                                                              >
                                                                  <Clock className="h-6 w-6 text-yellow-500" />
                                                              </div>
                                                              <Button
                                                                  className="mx-1 invisible"
                                                                  variant="outline"
                                                                  size="icon"
                                                              ></Button>
                                                          </>
                                                      )}
                                                  </>
                                              ) : (
                                                  <>
                                                      {request.status ===
                                                      "REJECTED" ? (
                                                          <>
                                                              <div
                                                                  title="Rejected"
                                                                  className="h-9 w-9 flex items-center justify-center mx-1"
                                                              >
                                                                  <PackageX className="h-6 w-6 text-red-400" />
                                                              </div>
                                                          </>
                                                      ) : (
                                                          <>
                                                              {request.isReceived ? (
                                                                  <div
                                                                      title="Received"
                                                                      className="h-9 w-9 flex items-center justify-center mx-1"
                                                                  >
                                                                      <PackageCheck className="h-6 w-6 text-green-500" />
                                                                  </div>
                                                              ) : (
                                                                  <>
                                                                      {!request.isSupplyIn ? (
                                                                          <>
                                                                              {request.email ===
                                                                              currentUser?.email ? (
                                                                                  <Button
                                                                                      title="Mark as received"
                                                                                      className="h-9 w-9 p-0 mx-1"
                                                                                      variant="outline"
                                                                                      size="icon"
                                                                                      onClick={() => {
                                                                                          markAsReceived(
                                                                                              request.id
                                                                                          );
                                                                                      }}
                                                                                  >
                                                                                      <HandCoins className="h-6 w-6 text-blue-500" />
                                                                                  </Button>
                                                                              ) : (
                                                                                  <div
                                                                                      title="Awaiting Receipt"
                                                                                      className="h-9 w-9 flex items-center justify-center mx-1"
                                                                                  >
                                                                                      <Clock className="h-6 w-6 text-yellow-500" />
                                                                                  </div>
                                                                              )}
                                                                          </>
                                                                      ) : (
                                                                          <>
                                                                              {request.approver !==
                                                                              currentUser?.name ? (
                                                                                  <div
                                                                                      title="Awaiting Receipt"
                                                                                      className="h-9 w-9 flex items-center justify-center mx-1"
                                                                                  >
                                                                                      <Clock className="h-6 w-6 text-yellow-500" />
                                                                                  </div>
                                                                              ) : (
                                                                                  <Button
                                                                                      title="Mark as received"
                                                                                      className="h-9 w-9 p-0 mx-1"
                                                                                      variant="outline"
                                                                                      size="icon"
                                                                                      onClick={() => {
                                                                                          markAsReceived(
                                                                                              request.id
                                                                                          );
                                                                                      }}
                                                                                  >
                                                                                      <HandCoins className="h-6 w-6 text-blue-500" />
                                                                                  </Button>
                                                                              )}
                                                                          </>
                                                                      )}
                                                                  </>
                                                              )}
                                                          </>
                                                      )}
                                                      <Button
                                                          className="mx-1 invisible"
                                                          variant="outline"
                                                          size="icon"
                                                      ></Button>
                                                  </>
                                              )}
                                          </TableCell>
                                      </TableRow>
                                  ))
                                : itemizedRequests.map((item) => (
                                      <TableRow
                                          key={item.id}
                                          className="hover:bg-gray-100 border-[#e4e4e7]"
                                      >
                                          <TableCell className="px-4">
                                              <div
                                                  className="cursor-pointer hover:opacity-80 transition-opacity h-10 flex items-center justify-center"
                                                  onClick={() =>
                                                      setSelectedImage(
                                                          item.item.image
                                                      )
                                                  }
                                              >
                                                  <Image
                                                      src={item.item.image}
                                                      alt={item.item.name}
                                                      width={40}
                                                      height={40}
                                                      className="rounded-md"
                                                  />
                                              </div>
                                          </TableCell>
                                          <TableCell
                                              className="px-4 truncate max-w-[200px]"
                                              title={item.item.name}
                                          >
                                              {item.item.name}
                                          </TableCell>

                                          <TableCell className="px-4">
                                              {item.quantity}
                                          </TableCell>
                                          <TableCell className="px-4">
                                              {item.item.unit}
                                          </TableCell>
                                          <TableCell className="px-4 text-nowrap">
                                              <span
                                                  className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 w-fit ${
                                                      item.isSupplyIn
                                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                          : "bg-amber-50 text-amber-700 border border-amber-200"
                                                  }`}
                                              >
                                                  {item.isSupplyIn ? (
                                                      <>
                                                          <ArrowDownToLine className="h-4 w-4" />
                                                          Supply-In
                                                      </>
                                                  ) : (
                                                      <>
                                                          <ArrowUpFromLine className="h-4 w-4" />
                                                          Supply-Out
                                                      </>
                                                  )}
                                              </span>
                                          </TableCell>
                                          {viewMode === "item" && (
                                              <>
                                                  <TableCell className="px-4">
                                                      {formatName(item.user)}
                                                  </TableCell>
                                                  <TableCell className="px-4 text-nowrap">
                                                      {format(
                                                          new Date(
                                                              item.createdAt
                                                          ),
                                                          "PPp"
                                                      )}
                                                  </TableCell>
                                              </>
                                          )}

                                          <TableCell className="px-4">
                                              {viewMode !== "summary"
                                                  ? divisionMap[item.division]
                                                  : division
                                                  ? divisionMap[division]
                                                  : "All"}
                                          </TableCell>

                                          <TableCell className="px-4">
                                              {viewMode !== "summary"
                                                  ? sectionMap[item.section]
                                                  : section
                                                  ? sectionMap[section]
                                                  : "All"}
                                          </TableCell>

                                          <TableCell className="px-4 text-nowrap">
                                              <span
                                                  className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 w-fit ${
                                                      item.requestStatus ===
                                                      "PENDING"
                                                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                          : item.requestStatus ===
                                                            "APPROVED"
                                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                          : "bg-rose-50 text-rose-700 border border-rose-200"
                                                  }`}
                                              >
                                                  {item.requestStatus ===
                                                  "PENDING" ? (
                                                      <>
                                                          <Clock className="h-4 w-4" />
                                                          Pending
                                                      </>
                                                  ) : item.requestStatus ===
                                                    "APPROVED" ? (
                                                      <>
                                                          <CheckCircle2 className="h-4 w-4" />
                                                          Approved
                                                      </>
                                                  ) : (
                                                      <>
                                                          <XCircle className="h-4 w-4" />
                                                          Rejected
                                                      </>
                                                  )}
                                              </span>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="flex justify-center items-center h-full">
                        No items found.
                    </p>
                )}
            </div>

            <Dialog
                open={!!selectedImage}
                onOpenChange={() => setSelectedImage(null)}
            >
                <DialogContent className="max-w-[90vw] md:max-w-[60vw] lg:max-w-[30vw] h-[80vh] p-0 overflow-hidden">
                    <DialogClose className="absolute right-3 top-3 z-10">
                        <Button
                            variant="outline"
                            size="icon"
                            className="bg-none"
                        >
                            <X className="h-4 w-4 text-red-500" />
                        </Button>
                    </DialogClose>
                    {selectedImage && (
                        <div className="relative w-full h-full">
                            <Image
                                src={selectedImage}
                                alt="Enlarged view"
                                className="object-contain"
                                fill
                                sizes="(max-width: 768px) 90vw, (max-width: 1200px) 80vw, 70vw"
                                priority
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!selectedRequest}
                onOpenChange={() => setSelectedRequest(null)}
            >
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Transaction Details</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Date
                                    </p>
                                    <p>
                                        {format(
                                            new Date(selectedRequest.createdAt),
                                            "PPp"
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Transaction ID
                                    </p>
                                    <p>{selectedRequest.id}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">
                                        User
                                    </p>
                                    <p>{formatName(selectedRequest.user)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Email
                                    </p>
                                    <p>{selectedRequest.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Division
                                    </p>
                                    <p>
                                        {divisionMap[selectedRequest.division]}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Section
                                    </p>
                                    <p>{sectionMap[selectedRequest.section]}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Items Count
                                    </p>
                                    <p>{selectedRequest.items.length}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Status
                                    </p>
                                    <p className="capitalize">
                                        {selectedRequest.status.toLocaleLowerCase()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Type
                                    </p>
                                    <p>
                                        {selectedRequest.isSupplyIn
                                            ? "Supply-In"
                                            : "Supply-Out"}
                                    </p>
                                </div>
                            </div>
                            {selectedRequest.additionalNotes && (
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Additional Notes
                                    </p>
                                    <p>{selectedRequest.additionalNotes}</p>
                                </div>
                            )}

                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-4">
                                    Items
                                </h3>
                                <div className="border rounded-md max-h-[400px] overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="bg-gray-100 px-4 text-center">
                                                    Image
                                                </TableHead>
                                                <TableHead className="bg-gray-100 px-4 ">
                                                    Item Name
                                                </TableHead>
                                                <TableHead className="bg-gray-100 px-4 ">
                                                    Quantity
                                                </TableHead>
                                                <TableHead className="bg-gray-100 px-4 ">
                                                    Available Quantity
                                                </TableHead>
                                                <TableHead className="bg-gray-100 px-4 ">
                                                    Unit
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {selectedRequest.items.map(
                                                (item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="px-4">
                                                            <div className="h-10 flex items-center justify-center">
                                                                <Image
                                                                    src={
                                                                        item
                                                                            .item
                                                                            .image
                                                                    }
                                                                    alt={
                                                                        item
                                                                            .item
                                                                            .name
                                                                    }
                                                                    width={40}
                                                                    height={40}
                                                                    className="rounded-md object-contain h-full max-h-full w-auto"
                                                                />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell
                                                            className="px-4 truncate max-w-[200px]"
                                                            title={
                                                                item.item.name
                                                            }
                                                        >
                                                            {item.item.name}
                                                        </TableCell>
                                                        <TableCell className="px-4">
                                                            {item.quantity}
                                                        </TableCell>
                                                        <TableCell className="px-4">
                                                            {item.item.quantity}
                                                        </TableCell>
                                                        <TableCell className="px-4">
                                                            {item.item.unit}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {selectedRequest.status === "PENDING" &&
                                role !== "USER" && (
                                    <div className="mt-6 flex justify-end space-x-2">
                                        <Button
                                            variant="default"
                                            onClick={() =>
                                                handleAction(
                                                    selectedRequest.id,
                                                    "APPROVE",
                                                    selectedRequest.isSupplyIn,
                                                    selectedRequest.user,
                                                    selectedRequest.email,
                                                    selectedRequest.items,
                                                    new Date(
                                                        selectedRequest.createdAt
                                                    ).toISOString(),
                                                    selectedRequest.additionalNotes
                                                )
                                            }
                                            disabled={!!processingId}
                                        >
                                            Approve Request
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={() =>
                                                handleAction(
                                                    selectedRequest.id,
                                                    "REJECT",
                                                    selectedRequest.isSupplyIn,
                                                    selectedRequest.user,
                                                    selectedRequest.email,
                                                    selectedRequest.items,
                                                    new Date(
                                                        selectedRequest.createdAt
                                                    ).toISOString(),
                                                    selectedRequest.additionalNotes
                                                )
                                            }
                                            disabled={!!processingId}
                                        >
                                            Reject Request
                                        </Button>
                                    </div>
                                )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};
