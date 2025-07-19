import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { X, Plus, Minus, Check } from "lucide-react";
import { useState } from "react";
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

interface CardViewProps {
    items: Item[];
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;
    statusMap: { [key in Item["status"]]: string };
}

const CardView = ({
    items,
    selectedImage,
    setSelectedImage,
    statusMap,
}: CardViewProps) => {
    const { dispatch } = useCart();
    const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

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
            resetQuantity(item.id);
        }
    };

    const statusStyles = {
        AVAILABLE: "bg-green-100 text-green-800 border-green-200",
        OUT_OF_STOCK: "bg-red-100 text-red-800 border-red-200",
        FOR_REORDER: "bg-yellow-100 text-yellow-800 border-yellow-200",
        PHASED_OUT: "bg-gray-100 text-gray-800 border-gray-200",
        DISCONTINUED: "bg-purple-100 text-purple-800 border-purple-200",
    };

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
                                                    Location
                                                </span>
                                                <span>{item.location}</span>
                                            </div>
                                        </div>

                                        <div className="pt-3 space-y-2 border-t border-gray-100">
                                            <div className="flex items-center justify-between gap-2">
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
                                                    className="shadow-sm border-gray-200"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <Input
                                                    type="number"
                                                    value={
                                                        quantities[item.id] || 0
                                                    }
                                                    onChange={(e) =>
                                                        handleQuantityChange(
                                                            item.id,
                                                            parseInt(
                                                                e.target.value
                                                            ) || 0
                                                        )
                                                    }
                                                    className="text-center shadow-sm border-gray-200"
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
                                                    className="shadow-sm border-gray-200"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Button
                                                className="w-full shadow-sm"
                                                onClick={() => addToCart(item)}
                                                disabled={
                                                    !(quantities[item.id] > 0)
                                                }
                                            >
                                                Add to Cart
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
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

export default CardView;
