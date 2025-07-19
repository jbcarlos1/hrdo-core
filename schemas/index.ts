import * as z from "zod";

export const LoginSchema = z.object({
    email: z.string().email({
        message: "Email is required",
    }),
    password: z.string().min(1, {
        message: "Password is required",
    }),
    code: z.optional(z.string()),
});

export const RegisterSchema = z.object({
    email: z.string().email({
        message: "Email is required",
    }),
    password: z.string().min(6, {
        message: "Minimum 6 characters required",
    }),
    name: z.string().min(1, {
        message: "Name is required",
    }),

    division: z.enum(
        [
            "MANAGEMENT",
            "RECRUITMENT",
            "PLANNING_RESEARCH",
            "DEVELOPMENT_BENEFITS",
        ],
        {
            errorMap: () => ({ message: "Division is required" }),
        }
    ),

    section: z.enum(
        [
            "EXECUTIVE",
            "ADMINISTRATIVE",
            "RECRUITMENT_SELECTION",
            "APPOINTMENT",
            "PLANNING_RESEARCH",
            "MONITORING_EVALUATION",
            "INFORMATION_MANAGEMENT",
            "PROJECTS",
            "SCHOLARSHIP",
            "TRAINING",
            "BENEFITS",
        ],
        {
            errorMap: () => ({ message: "Section is required" }),
        }
    ),
});

export const ResetSchema = z.object({
    email: z.string().email({
        message: "Email is required",
    }),
});

export const NewPasswordSchema = z.object({
    password: z.string().min(6, {
        message: "Minimum 6 characters required",
    }),
});

export const requestItemSchema = z.object({
    id: z.string().min(1, "Item ID is required"),
    quantity: z
        .number({
            invalid_type_error: "Quantity is required",
        })
        .positive("Quantity must be greater than 0")
        .int("Quantity must be an integer")
        .max(999999, "Quantity is too large"),
});

export const createRequestSchema = z.object({
    items: z.array(requestItemSchema).min(1, "At least one item is required"),
    isSupplyIn: z.boolean(),
    additionalNotes: z.string().optional(),
});

export const itemSchema = z.object({
    name: z
        .string()
        .min(1, "Name is required")
        .max(100, "Name must be less than 100 characters"),
    quantity: z
        .number({
            invalid_type_error: "Quantity is required",
        })
        .min(0, "Quantity cannot be negative")
        .int("Quantity must be an integer")
        .max(999999, "Quantity is too large"),
    unit: z
        .string({
            required_error: "Unit of measurement is required",
        })
        .max(20, "Unit must be less than 20 characters"),
    reorderPoint: z
        .number({
            invalid_type_error: "Reorder point is required",
        })
        .min(0, "Reorder point cannot be negative")
        .int("Reorder point must be an integer")
        .max(999999, "Reorder point is too large"),
    status: z.enum([
        "OUT_OF_STOCK",
        "FOR_REORDER",
        "AVAILABLE",
        "PHASED_OUT",
        "DISCONTINUED",
    ]),
    location: z
        .string({
            required_error: "Location is required",
        })
        .max(50, "Location must be less than 50 characters"),
    image: z.string({
        required_error: "Image is required",
    }),
});
