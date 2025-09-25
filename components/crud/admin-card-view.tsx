import { RiEditLine, RiDeleteBin6Line } from "react-icons/ri";
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
import { HiDotsHorizontal } from "react-icons/hi";

interface Memorandum {
  id: string;
  memoNumber: string;
  issuingOffices: string[];
  signatories: string[];
  subject: string;
  date: string;
  division: string;
  section: string;
  encoder: string;
  keywords: string[];
  documentType: string;
  pdfUrl: string;
  isArchived: boolean;
}

interface CardViewComponentProps {
  memorandums: Memorandum[];
  handleEdit: (memorandum: Memorandum) => void;
  handleDelete: (id: string) => void;
  handleArchive: (id: string, currentState: boolean) => void;
  deleteLoading: boolean;
}

const CardView = ({
  memorandums,
  handleEdit,
  handleDelete,
  handleArchive,
  deleteLoading,
}: CardViewComponentProps) => {
  return (
    <>
      <div className="border bg-white rounded-md h-full">
        {memorandums.length !== 0 ? (
          <div className="h-full overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 min-h-min">
              {memorandums.map((memorandum) => (
                <div
                  key={memorandum.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-200 hover:border-gray-300 group"
                >
                  <div className="aspect-square relative bg-white p-4 flex flex-col items-center justify-center">
                    <div className="absolute top-4 right-4 opacity-80 group-hover:opacity-0 transition-opacity duration-200 z-10">
                      <HiDotsHorizontal className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="absolute top-4 right-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1.5 z-20">
                      <Button
                        title="Edit memorandum"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(memorandum)}
                        disabled={deleteLoading}
                        className="shadow-md border border-gray-200"
                      >
                        <RiEditLine className="h-4 w-4 text-blue-600" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            title="Delete memorandum"
                            variant="ghost"
                            size="icon"
                            disabled={deleteLoading}
                            className="shadow-md border border-gray-200"
                          >
                            <RiDeleteBin6Line className="h-4 w-4 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to proceed?</AlertDialogTitle>
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
                      <div className="flex-1" />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <div className={deleteLoading ? "opacity-50" : ""}>
                            <Switch
                              title={
                                memorandum.isArchived
                                  ? "Unarchive memorandum"
                                  : "Archive memorandum"
                              }
                              checked={memorandum.isArchived}
                              disabled={deleteLoading}
                              className="bg-white/90 shadow-sm"
                            />
                          </div>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to proceed?</AlertDialogTitle>
                            {memorandum.isArchived ? (
                              <AlertDialogDescription>
                                Unarchiving this memorandum will restore it to the active list,
                                making it visible and accessible again.
                              </AlertDialogDescription>
                            ) : (
                              <AlertDialogDescription>
                                Archiving this memorandum will remove it from the active list and
                                store it for future reference.
                              </AlertDialogDescription>
                            )}
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleArchive(memorandum.id, memorandum.isArchived)}
                            >
                              {memorandum.isArchived ? "Unarchive" : "Archive"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <div className="flex flex-col items-center justify-center h-full w-full">
                      <a
                        href={memorandum.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        View PDF
                      </a>
                    </div>
                  </div>
                  <div className="p-4 space-y-3 border-t border-gray-100">
                    <h3
                      className="font-medium text-gray-900 truncate"
                      title={memorandum.memoNumber}
                    >
                      {memorandum.memoNumber}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="flex justify-center items-center h-full">No memos found.</p>
        )}
      </div>
    </>
  );
};

export default CardView;
