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

export const memorandumSchema = z.object({
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
    reorderPoint: z
        .number({
            invalid_type_error: "Reorder point is required",
        })
        .min(0, "Reorder point cannot be negative")
        .int("Reorder point must be an integer")
        .max(999999, "Reorder point is too large"),
    image: z.string({
        required_error: "Image is required",
    }),
});
