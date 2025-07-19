import Image from "next/image";
import { RiEditLine, RiDeleteBin6Line } from "react-icons/ri";
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

interface TableComponentProps {
    items: Item[];
    handleEdit: (item: Item) => void;
    handleDelete: (id: string) => void;
    handleArchive: (id: string, currentState: boolean) => void;
    deleteLoading: boolean;
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;
    statusMap: { [key in Item["status"]]: string };
    statusStyles: { [key in Item["status"]]: string };
}

export const TableComponent = ({
    items,
    handleEdit,
    handleDelete,
    handleArchive,
    deleteLoading,
    selectedImage,
    setSelectedImage,
    statusMap,
    statusStyles,
}: TableComponentProps) => {
    return (
        <>
            <div className="border bg-white rounded-md h-full overflow-hidden">
                {items.length !== 0 ? (
                    <div className="overflow-auto h-full">
                        <div className="min-w-max">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-[#e4e4e7] bg-gray-100">
                                        <TableHead className="px-4 text-center">
                                            Image
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Item name
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Qty
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Unit
                                        </TableHead>
                                        <TableHead
                                            className="px-4"
                                            title="Reorder Point"
                                        >
                                            Reorder Point
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Status
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Location
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
                                    {items.map((item, i) => (
                                        <TableRow
                                            key={item.id}
                                            className="hover:bg-gray-100 border-[#e4e4e7]"
                                        >
                                            <TableCell className="px-4">
                                                <div
                                                    onClick={() =>
                                                        setSelectedImage(
                                                            item.image
                                                        )
                                                    }
                                                    className="cursor-pointer hover:opacity-80 transition-opacity h-10 flex items-center justify-center"
                                                >
                                                    <Image
                                                        src={item.image}
                                                        width={40}
                                                        height={40}
                                                        alt={item.name}
                                                        className="rounded-md object-contain h-full max-h-full w-auto"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell
                                                className="px-4 truncate max-w-[200px]"
                                                title={item.name}
                                            >
                                                {item.name}
                                            </TableCell>
                                            <TableCell className="px-4">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="px-4">
                                                {item.unit}
                                            </TableCell>
                                            <TableCell className="px-4">
                                                {item.reorderPoint}
                                            </TableCell>
                                            <TableCell className="px-4">
                                                <span
                                                    className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 w-fit border ${
                                                        statusStyles[
                                                            item.status
                                                        ]
                                                    }`}
                                                >
                                                    {statusMap[item.status]}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-4">
                                                {item.location}
                                            </TableCell>
                                            <TableCell className="px-2 text-center">
                                                <Button
                                                    title="Edit item"
                                                    className="mx-1"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleEdit(item)
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
                                                            title="Delete item"
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
                                                                this item will
                                                                permanently
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
                                                                        item.id
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
                                                                item.isArchived
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
                                                            {item.isArchived ? (
                                                                <AlertDialogDescription>
                                                                    Unarchiving
                                                                    this item
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
                                                                    this item
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
                                                                        item.id,
                                                                        item.isArchived
                                                                    )
                                                                }
                                                            >
                                                                {item.isArchived
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
        </>
    );
};
