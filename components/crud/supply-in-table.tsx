import Image from "next/image";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Plus, Minus, Check } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/restock-cart-context";

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
}

export const TableComponent = ({ items }: TableComponentProps) => {
    const { dispatch } = useCart();
    const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

    const resetQuantity = (itemId: string) => {
        setQuantities({ ...quantities, [itemId]: 0 });
    };

    const handleQuantityChange = (itemId: string, newQuantity: number) => {
        setQuantities({ ...quantities, [itemId]: Math.max(0, newQuantity) });
    };

    const addToCart = (item: Item) => {
        const quantity = quantities[item.id] || 0;
        if (quantity > 0) {
            dispatch({
                type: "ADD_ITEM",
                payload: {
                    id: item.id,
                    name: item.name,
                    quantity,
                    unit: item.unit,
                    image: item.image,
                },
            });
            setQuantities({ ...quantities, [item.id]: 0 });
        }
    };

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
                                        <TableHead className="px-4">
                                            Status
                                        </TableHead>
                                        <TableHead className="px-4">
                                            Location
                                        </TableHead>
                                        <TableHead className="px-4 text-center">
                                            Cart
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
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
                                            <TableCell className="px-4 flex items-center justify-center min-h-[64px]">
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleQuantityChange(
                                                                item.id,
                                                                (quantities[
                                                                    item.id
                                                                ] || 0) - 1
                                                            )
                                                        }
                                                        disabled={
                                                            !quantities[item.id]
                                                        }
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <Input
                                                        type="number"
                                                        value={
                                                            quantities[
                                                                item.id
                                                            ] || 0
                                                        }
                                                        onChange={(e) =>
                                                            handleQuantityChange(
                                                                item.id,
                                                                parseInt(
                                                                    e.target
                                                                        .value
                                                                ) || 0
                                                            )
                                                        }
                                                        className="w-20 text-center"
                                                        min="0"
                                                        max={item.quantity}
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleQuantityChange(
                                                                item.id,
                                                                (quantities[
                                                                    item.id
                                                                ] || 0) + 1
                                                            )
                                                        }
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                    {quantities[item.id] ? (
                                                        <>
                                                            <Button
                                                                title="Add to cart"
                                                                className="mx-1"
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() =>
                                                                    addToCart(
                                                                        item
                                                                    )
                                                                }
                                                                disabled={
                                                                    !quantities[
                                                                        item.id
                                                                    ]
                                                                }
                                                            >
                                                                <Check className="h-6 w-6 text-green-500" />
                                                            </Button>
                                                            <Button
                                                                title="Add to cart"
                                                                className="mx-1"
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() =>
                                                                    resetQuantity(
                                                                        item.id
                                                                    )
                                                                }
                                                                disabled={
                                                                    !quantities[
                                                                        item.id
                                                                    ]
                                                                }
                                                            >
                                                                <X className="h-6 w-6 text-red-500" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                className="mx-1 invisible"
                                                                variant="outline"
                                                                size="icon"
                                                            ></Button>
                                                            <Button
                                                                className="mx-1 invisible"
                                                                variant="outline"
                                                                size="icon"
                                                            ></Button>
                                                        </>
                                                    )}
                                                </div>
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
