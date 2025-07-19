import {
    createContext,
    useContext,
    useReducer,
    ReactNode,
    useEffect,
} from "react";

interface CartItem {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    image: string;
}

interface CartState {
    items: CartItem[];
}

type CartAction =
    | { type: "ADD_ITEM"; payload: CartItem }
    | { type: "REMOVE_ITEM"; payload: string }
    | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
    | { type: "CLEAR_CART" };

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
                                  quantity:
                                      item.quantity + action.payload.quantity,
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
        default:
            return state;
    }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(cartReducer, { items: [] }, () => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("restock-cart");
            return saved ? JSON.parse(saved) : { items: [] };
        }
        return { items: [] };
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("restock-cart", JSON.stringify(state));
        }
    }, [state]);

    return (
        <CartContext.Provider value={{ state, dispatch }}>
            {children}
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
