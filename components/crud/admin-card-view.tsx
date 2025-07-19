import Image from "next/image";
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
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HiDotsHorizontal } from "react-icons/hi";

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

interface CardViewComponentProps {
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

const CardView = ({
    items,
    handleEdit,
    handleDelete,
    handleArchive,
    deleteLoading,
    selectedImage,
    setSelectedImage,
    statusMap,
    statusStyles,
}: CardViewComponentProps) => {
    return (
        <>
            <div className="border bg-white rounded-md h-full">
                {items.length !== 0 ? (
                    <div className="h-full overflow-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 min-h-min">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-200 hover:border-gray-300 group"
                                >
                                    <div className="aspect-square relative bg-white p-4">
                                        <div className="absolute top-4 right-4 opacity-80 group-hover:opacity-0 transition-opacity duration-200 z-10">
                                            <HiDotsHorizontal className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div className="absolute top-4 right-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1.5 z-20">
                                            <Button
                                                title="Edit item"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(item)}
                                                disabled={deleteLoading}
                                                className="shadow-md border border-gray-200"
                                            >
                                                <RiEditLine className="h-4 w-4 text-blue-600" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        title="Delete item"
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
                                                        <AlertDialogTitle>
                                                            Are you sure you
                                                            want to proceed?
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot
                                                            be undone. Deleting
                                                            this item will
                                                            permanently remove
                                                            it and its
                                                            associated data.
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
                                            <div className="flex-1" />
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <div
                                                        className={
                                                            deleteLoading
                                                                ? "opacity-50"
                                                                : ""
                                                        }
                                                    >
                                                        <Switch
                                                            title={
                                                                item.isArchived
                                                                    ? "Unarchive item"
                                                                    : "Archive item"
                                                            }
                                                            checked={
                                                                item.isArchived
                                                            }
                                                            disabled={
                                                                deleteLoading
                                                            }
                                                            className="bg-white/90 shadow-sm"
                                                        />
                                                    </div>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            Are you sure you
                                                            want to proceed?
                                                        </AlertDialogTitle>
                                                        {item.isArchived ? (
                                                            <AlertDialogDescription>
                                                                Unarchiving this
                                                                item will
                                                                restore it to
                                                                the active list,
                                                                making it
                                                                visible and
                                                                accessible
                                                                again.
                                                            </AlertDialogDescription>
                                                        ) : (
                                                            <AlertDialogDescription>
                                                                Archiving this
                                                                item will remove
                                                                it from the
                                                                active list and
                                                                store it for
                                                                future
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
                                        </div>

                                        <div
                                            className="absolute inset-0 cursor-zoom-in p-4 bg-white"
                                            onClick={() =>
                                                setSelectedImage(item.image)
                                            }
                                        >
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                className="object-contain p-14 hover:p-12 transition-all duration-200"
                                            />
                                        </div>
                                        <div className="absolute bottom-4 left-4">
                                            <span
                                                className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${
                                                    statusStyles[item.status]
                                                }`}
                                            >
                                                {statusMap[item.status]}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-3 border-t border-gray-100">
                                        <h3
                                            className="font-medium text-gray-900 truncate"
                                            title={item.name}
                                        >
                                            {item.name}
                                        </h3>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">
                                                    Quantity
                                                </span>
                                                <span>{item.quantity}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">
                                                    Unit
                                                </span>
                                                <span>{item.unit}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">
                                                    Reorder Point
                                                </span>
                                                <span>{item.reorderPoint}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">
                                                    Location
                                                </span>
                                                <span>{item.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                    </div>
                ) : (
                    <p className="flex justify-center items-center h-full">
                        No items found.
                    </p>
                )}
            </div>
        </>
    );
};

export default CardView;
