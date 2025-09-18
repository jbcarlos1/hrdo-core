import { RiEditLine, RiDeleteBin6Line, RiEyeLine } from "react-icons/ri";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FileText } from "lucide-react";
import { useSession } from "next-auth/react";

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

interface TableComponentProps {
  memorandums: Memorandum[];
  handleEdit: (memorandum: Memorandum) => void;
  handleDelete: (id: string) => void;
  handleArchive: (id: string, currentState: boolean) => void;
  deleteLoading: boolean;
}

export const TableComponent = ({
  memorandums,
  handleEdit,
  handleDelete,
  handleArchive,
  deleteLoading,
}: TableComponentProps) => {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const divisionMap: Record<string, string> = {
    MANAGEMENT: "Management",
    RECRUITMENT: "Recruitment Division",
    PLANNING_RESEARCH: "Planning & Research Division",
    DEVELOPMENT_BENEFITS: "Development & Benefits Division",
  };

  const sectionMap: Record<string, string> = {
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
      <div className="border bg-white rounded-md h-full overflow-hidden">
        {memorandums.length !== 0 ? (
          <div className="overflow-auto h-full">
            <div className="min-w-max">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#e4e4e7] bg-gray-100">
                    {/* <TableHead className="px-4 text-center">PDF</TableHead>
                    <TableHead className="px-4">Reference Number</TableHead>
                    <TableHead className="px-4">Encoding Section</TableHead>
                    <TableHead className="px-4">Encoder</TableHead>
                    <TableHead className="px-4">Signatory</TableHead> */}
                    <TableHead className="px-4">Date</TableHead>
                    <TableHead className="px-4">Subject</TableHead>
                    <TableHead className="px-4">Issuing Office/Agency</TableHead>

                    {role === "ADMIN" && (
                      <>
                        <TableHead className="px-2 text-center">View</TableHead>
                        <TableHead className="px-2 text-center">Edit</TableHead>
                        <TableHead className="px-2 text-center">Delete</TableHead>
                      </>
                    )}

                    {/* <TableHead className="px-2 text-center">
                                            Archive
                                        </TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody className="overflow-auto">
                  {memorandums.map((memorandum, i) => (
                    <TableRow key={memorandum.id} className="hover:bg-gray-100 border-[#e4e4e7]">
                      {/* <TableCell>
                        <a
                          href={memorandum.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View PDF"
                          className="flex justify-center items-center"
                        >
                          <FileText size={22} className="text-[#D63F17]" />
                        </a>
                      </TableCell>

                      <TableCell
                        className="px-4 truncate max-w-[200px]"
                        title={memorandum.memoNumber}
                      >
                        {memorandum.memoNumber}
                      </TableCell>

                      <TableCell
                        className="px-4 truncate max-w-[150px]"
                        title={sectionMap[memorandum.section]}
                      >
                        {sectionMap[memorandum.section]}
                      </TableCell>
                      <TableCell className="px-4 truncate max-w-[150px]" title={memorandum.encoder}>
                        {memorandum.encoder}
                      </TableCell>
                      <TableCell
                        className="px-4 truncate max-w-[200px]"
                        title={memorandum.signatory}
                      >
                        {memorandum.signatory}
                      </TableCell> */}
                      <TableCell
                        className="px-4 truncate max-w-[120px]"
                        title={format(new Date(memorandum.date), "PP")}
                      >
                        {format(new Date(memorandum.date), "PP")}
                      </TableCell>
                      <TableCell
                        className="px-4 truncate max-w-[600px] hover:text-blue-500"
                        title={memorandum.subject}
                      >
                        <a href={memorandum.pdfUrl} target="_blank" rel="noopener noreferrer">
                          {memorandum.subject}
                        </a>
                      </TableCell>

                      <TableCell
                        className="px-4 truncate max-w-[200px]"
                        title={memorandum.issuingOffice}
                      >
                        {memorandum.issuingOffice}
                      </TableCell>

                      {role === "ADMIN" && (
                        <>
                          <TableCell className="px-2 text-center">
                            <Button
                              title="Edit memorandum"
                              className="mx-1"
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(memorandum)}
                              disabled={deleteLoading}
                            >
                              <RiEyeLine className="h-6 w-6 text-green-600" />
                            </Button>
                          </TableCell>
                          <TableCell className="px-2 text-center">
                            <Button
                              title="Edit memorandum"
                              className="mx-1"
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(memorandum)}
                              disabled={deleteLoading}
                            >
                              <RiEditLine className="h-6 w-6 text-[#273574]" />
                            </Button>
                          </TableCell>
                          <TableCell className="px-2 text-center">
                            <AlertDialog>
                              <AlertDialogTrigger>
                                <Button
                                  title="Delete memorandum"
                                  className="mx-1"
                                  variant="outline"
                                  size="icon"
                                  disabled={deleteLoading}
                                >
                                  <RiDeleteBin6Line className="h-6 w-6 text-[#731012]" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you sure you want to proceed?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. Deleting this memorandum will
                                    permanently remove it and its associated data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(memorandum.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </>
                      )}

                      {/* <TableCell className="px-2 text-center">
                                                <AlertDialog>
                                                    <AlertDialogTrigger
                                                        disabled={deleteLoading}
                                                        className={`pt-1 ${
                                                            deleteLoading
                                                                ? "opacity-50"
                                                                : ""
                                                        }`}
                                                    >
                                                        <Switch
                                                            checked={
                                                                memorandum.isArchived
                                                            }
                                                            disabled={
                                                                deleteLoading
                                                            }
                                                        />
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                Are you sure you
                                                                want to proceed?
                                                            </AlertDialogTitle>
                                                            {memorandum.isArchived ? (
                                                                <AlertDialogDescription>
                                                                    Unarchiving
                                                                    this
                                                                    memorandum
                                                                    will restore
                                                                    it to the
                                                                    active list,
                                                                    making it
                                                                    visible and
                                                                    accessible
                                                                    again.
                                                                </AlertDialogDescription>
                                                            ) : (
                                                                <AlertDialogDescription>
                                                                    Archiving
                                                                    this
                                                                    memorandum
                                                                    will remove
                                                                    it from the
                                                                    active list
                                                                    and store it
                                                                    for future
                                                                    reference.
                                                                </AlertDialogDescription>
                                                            )}
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                Cancel
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() =>
                                                                    handleArchive(
                                                                        memorandum.id,
                                                                        memorandum.isArchived
                                                                    )
                                                                }
                                                            >
                                                                {memorandum.isArchived
                                                                    ? "Unarchive"
                                                                    : "Archive"}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <p className="flex justify-center items-center h-full">No official references found.</p>
        )}
      </div>
    </>
  );
};
