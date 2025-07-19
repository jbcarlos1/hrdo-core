import {
    createContext,
    useContext,
    useReducer,
    ReactNode,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CartItem {
    id: string;
    name: string;
    quantity: number;
    maxQuantity: number;
    unit: string;
    image: string;
    lastSynced?: number;
}

interface CartState {
    items: CartItem[];
}

type CartAction =
    | { type: "ADD_ITEM"; payload: CartItem }
    | { type: "REMOVE_ITEM"; payload: string }
    | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
    | { type: "CLEAR_CART" }
    | { type: "SYNC_ITEM"; payload: CartItem };

const CartContext = createContext<{
    state: CartState;
    dispatch: React.Dispatch<CartAction>;
} | null>(null);

const cartReducer = (state: CartState, action: CartAction): CartState => {
    switch (action.type) {
        case "ADD_ITEM": {
            const existingItem = state.items.find(
                (item) => item.id === action.payload.id
            );
            if (existingItem) {
                return {
                    ...state,
                    items: state.items.map((item) =>
                        item.id === action.payload.id
                            ? {
                                  ...item,
                                  quantity: Math.min(
                                      item.quantity + action.payload.quantity,
                                      item.maxQuantity
                                  ),
                              }
                            : item
                    ),
                };
            }
            return { ...state, items: [...state.items, action.payload] };
        }
        case "REMOVE_ITEM":
            return {
                ...state,
                items: state.items.filter((item) => item.id !== action.payload),
            };
        case "UPDATE_QUANTITY":
            return {
                ...state,
                items: state.items.map((item) =>
                    item.id === action.payload.id
                        ? {
                              ...item,
                              quantity: Math.max(0, action.payload.quantity),
                          }
                        : item
                ),
            };
        case "CLEAR_CART":
            return { items: [] };
        case "SYNC_ITEM": {
            const { id, maxQuantity, name, unit, image } = action.payload;
            return {
                ...state,
                items: state.items.map((item) => {
                    if (item.id === id) {
                        const newQuantity = Math.min(
                            item.quantity,
                            maxQuantity
                        );
                        if (newQuantity !== item.quantity) {
                            return {
                                ...item,
                                maxQuantity,
                                name,
                                unit,
                                image,
                                quantity: newQuantity,
                                lastSynced: Date.now(),
                            };
                        }
                        return {
                            ...item,
                            maxQuantity,
                            name,
                            unit,
                            image,
                            lastSynced: Date.now(),
                        };
                    }
                    return item;
                }),
            };
        }
        default:
            return state;
    }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [showAlert, setShowAlert] = useState(false);
    const [alertTitle, setAlertTitle] = useState("");
    const [alertDescription, setAlertDescription] = useState("");
    const [state, dispatch] = useReducer(cartReducer, { items: [] }, () => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("cart");
            return saved ? JSON.parse(saved) : { items: [] };
        }
        return { items: [] };
    });

    const itemIds = useMemo(
        () => state.items.map((item) => item.id).join(","),
        [state.items.map((item) => item.id).join(",")]
    );

    useEffect(() => {
        if (!itemIds) return;

        const syncCart = async () => {
            try {
                const response = await fetch(`/api/items/batch?ids=${itemIds}`);
                if (!response.ok) throw new Error("Failed to sync cart");

                interface SyncedItem {
                    id: string;
                    quantity: number;
                    name: string;
                    unit: string;
                    image: string;
                }

                const items: SyncedItem[] = await response.json();

                items.forEach((item) => {
                    const cartItem = state.items.find((i) => i.id === item.id);
                    if (cartItem && cartItem.quantity > item.quantity) {
                        setAlertTitle("Stock Update");
                        setAlertDescription(
                            "Quantity adjusted due to stock changes"
                        );
                        setShowAlert(true);
                    }

                    dispatch({
                        type: "SYNC_ITEM",
                        payload: {
                            id: item.id,
                            maxQuantity: item.quantity,
                            quantity: Math.min(
                                state.items.find((i) => i.id === item.id)
                                    ?.quantity ?? item.quantity,
                                item.quantity
                            ),
                            name: item.name,
                            unit: item.unit,
                            image: item.image,
                        },
                    });
                });
            } catch (error) {
                if (error instanceof Error && error.name !== "AbortError") {
                    console.error("Cart sync failed:", error);
                    setAlertTitle("Cart Update Error");
                    setAlertDescription(
                        "Could not sync cart with latest stock data"
                    );
                    setShowAlert(true);
                }
            }
        };

        syncCart();
        const interval = setInterval(syncCart, 60000);
        return () => clearInterval(interval);
    }, [itemIds]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("cart", JSON.stringify(state));
        }
    }, [state]);

    return (
        <CartContext.Provider value={{ state, dispatch }}>
            {children}
            <Dialog open={showAlert} onOpenChange={setShowAlert}>
                <DialogContent className="w-[350px]">
                    <DialogHeader>
                        <DialogTitle>{alertTitle}</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>{alertDescription}</DialogDescription>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button onClick={() => setShowAlert(false)}>
                                Ok
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
