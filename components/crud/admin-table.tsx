import Image from "next/image";
import { RiEditLine, RiDeleteBin6Line } from "react-icons/ri";
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
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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

interface TableComponentProps {
    memorandums: Memorandum[];
    handleEdit: (memorandum: Memorandum) => void;
    handleDelete: (id: string) => void;
    handleArchive: (id: string, currentState: boolean) => void;
    deleteLoading: boolean;
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;
}

export const TableComponent = ({
    memorandums,
    handleEdit,
    handleDelete,
    handleArchive,
    deleteLoading,
    selectedImage,
    setSelectedImage,
}: TableComponentProps) => {
    return (
        <>
            <div className="border bg-white rounded-md h-full overflow-hidden">
                {memorandums.length !== 0 ? (
                    <div className="overflow-auto h-full">
                        <div className="min-w-max">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-[#e4e4e7] bg-gray-100">
                                        <TableHead className="px-4 text-center">
                                            Image
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Memo Number
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Addressee
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Sender
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Sender&apos;s Unit
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Date
                                        </TableHead>
                                        <TableHead className="px-2 text-center">
                                            Edit
                                        </TableHead>
                                        <TableHead className="px-2 text-center">
                                            Delete
                                        </TableHead>
                                        <TableHead className="px-2 text-center">
                                            Archive
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="overflow-auto">
                                    {memorandums.map((memorandum, i) => (
                                        <TableRow
                                            key={memorandum.id}
                                            className="hover:bg-gray-100 border-[#e4e4e7]"
                                        >
                                            <TableCell className="px-4">
                                                <div
                                                    onClick={() =>
                                                        setSelectedImage(
                                                            memorandum.image
                                                        )
                                                    }
                                                    className="cursor-pointer hover:opacity-80 transition-opacity h-10 flex items-center justify-center"
                                                >
                                                    <Image
                                                        src={memorandum.image}
                                                        width={40}
                                                        height={40}
                                                        alt={
                                                            memorandum.memoNumber
                                                        }
                                                        className="rounded-md object-contain h-full max-h-full w-auto"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell
                                                className="px-4 truncate max-w-[200px]"
                                                title={memorandum.memoNumber}
                                            >
                                                {memorandum.memoNumber}
                                            </TableCell>
                                            <TableCell
                                                className="px-4 truncate max-w-[200px]"
                                                title={memorandum.addressee}
                                            >
                                                {memorandum.addressee}
                                            </TableCell>
                                            <TableCell
                                                className="px-4 truncate max-w-[200px]"
                                                title={memorandum.sender}
                                            >
                                                {memorandum.sender}
                                            </TableCell>
                                            <TableCell
                                                className="px-4 truncate max-w-[200px]"
                                                title={memorandum.senderUnit}
                                            >
                                                {memorandum.senderUnit}
                                            </TableCell>
                                            <TableCell
                                                className="px-4 truncate max-w-[200px]"
                                                title={memorandum.date}
                                            >
                                                {format(
                                                    new Date(memorandum.date),
                                                    "PP"
                                                )}
                                            </TableCell>
                                            <TableCell className="px-2 text-center">
                                                <Button
                                                    title="Edit memorandum"
                                                    className="mx-1"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleEdit(memorandum)
                                                    }
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
                                                            disabled={
                                                                deleteLoading
                                                            }
                                                        >
                                                            <RiDeleteBin6Line className="h-6 w-6 text-[#731012]" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                Are you sure you
                                                                want to proceed?
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action
                                                                cannot be
                                                                undone. Deleting
                                                                this memorandum
                                                                will permanently
                                                                remove it and
                                                                its associated
                                                                data.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                Cancel
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        memorandum.id
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                            <TableCell className="px-2 text-center">
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
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ) : (
                    <p className="flex justify-center items-center h-full">
                        No memos found.
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
        </>
    );
};
