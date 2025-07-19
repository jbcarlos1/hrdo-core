"use client";

import { useCart } from "@/contexts/restock-cart-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
    DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image";
import { X, Minus, Plus, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Cart = () => {
    const { state, dispatch } = useCart();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const [dialogState, setDialogState] = useState<{
        isOpen: boolean;
        item: { id: string; name: string } | null;
    }>({
        isOpen: false,
        item: null,
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    const removeFromCart = (id: string, name: string) => {
        dispatch({ type: "REMOVE_ITEM", payload: id });
        toast({
            title: "Item Removed",
            description: `${name} removed from cart`,
        });
    };

    const updateQuantity = (id: string, quantity: number, name: string) => {
        if (quantity <= 0) {
            setDialogState({
                isOpen: true,
                item: { id, name },
            });
            return;
        }

        dispatch({
            type: "UPDATE_QUANTITY",
            payload: { id, quantity },
        });
    };

    const handleSubmitRequest = async () => {
        try {
            setIsSubmitting(true);

            // Submit request for admin approval
            const submitResponse = await fetch("/api/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: state.items,
                    isSupplyIn: true,
                    additionalNotes,
                }),
            });

            if (!submitResponse.ok) throw new Error("Failed to submit request");

            dispatch({ type: "CLEAR_CART" });
            setAdditionalNotes("");
            toast({
                title: "Success",
                description: "Request submitted for approval",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to submit request. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Sheet>
                <SheetTrigger asChild>
                    <Button className="relative">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Restock Cart
                        {state.items.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                {state.items.length}
                            </span>
                        )}
                    </Button>
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Restock Cart</SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-14rem)] mt-4">
                        {state.items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <ShoppingCart className="h-12 w-12 mb-2" />
                                <p>Your cart is empty</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {state.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center space-x-4 border-b pb-4"
                                    >
                                        <div className="relative h-12 w-12">
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                className="rounded-md object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3
                                                className="font-medium truncate max-w-[200px]"
                                                title={item.name}
                                            >
                                                {item.name}
                                            </h3>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    disabled={isSubmitting}
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.id,
                                                            item.quantity - 1,

                                                            item.name
                                                        )
                                                    }
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    disabled={isSubmitting}
                                                    onChange={(e) =>
                                                        updateQuantity(
                                                            item.id,
                                                            parseInt(
                                                                e.target.value
                                                            ) || 0,
                                                            item.name
                                                        )
                                                    }
                                                    className="w-20 text-center"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    disabled={isSubmitting}
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.id,
                                                            item.quantity + 1,
                                                            item.name
                                                        )
                                                    }
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            disabled={isSubmitting}
                                            onClick={() =>
                                                removeFromCart(
                                                    item.id,
                                                    item.name
                                                )
                                            }
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                    <div className="mt-4">
                        <div className="grid gap-1.5 my-4">
                            <Label className="ms-1" htmlFor="message">
                                Additional Notes{" "}
                                <span className="text-gray-500">
                                    (Optional)
                                </span>
                            </Label>
                            <Textarea
                                value={additionalNotes}
                                onChange={(e) =>
                                    setAdditionalNotes(e.target.value)
                                }
                                disabled={
                                    state.items.length === 0 || isSubmitting
                                }
                                className="resize-none"
                                placeholder="Add any special instructions or notes here (optional)"
                                id="message"
                            />
                        </div>
                        <Button
                            className="w-full"
                            disabled={state.items.length === 0 || isSubmitting}
                            onClick={handleSubmitRequest}
                        >
                            {isSubmitting ? "Submitting..." : "Submit"}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
            <Dialog
                open={dialogState.isOpen}
                onOpenChange={(open) =>
                    setDialogState((prev) => ({ ...prev, isOpen: open }))
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Quantity must be greater than zero
                        </DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                        The quantity cannot be reduced below 1. Would you like
                        to remove this item from your cart instead?
                    </DialogDescription>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setDialogState({
                                        isOpen: false,
                                        item: null,
                                    })
                                }
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            onClick={() => {
                                if (dialogState.item) {
                                    removeFromCart(
                                        dialogState.item.id,
                                        dialogState.item.name
                                    );
                                }
                                setDialogState({ isOpen: false, item: null });
                            }}
                        >
                            Remove Item
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
