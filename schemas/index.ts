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
    memoNumber: z
        .string()
        .min(1, "Memo number is required")
        .max(100, "Name must be less than 100 characters"),
    addressee: z
        .string()
        .min(1, "Addressee is required")
        .max(100, "Addressee must be less than 100 characters"),
    sender: z
        .string()
        .min(1, "Sender is required")
        .max(100, "Sender must be less than 100 characters"),
    senderOffice: z
        .string()
        .min(1, "Sender's office is required")
        .max(100, "Sender's office must be less than 100 characters"),
    subject: z
        .string()
        .min(1, "Subject is required")
        .max(100, "Subject must be less than 100 characters"),
    date: z
        .string({ required_error: "Date is required" })
        .nonempty("Date is required")
        .max(100, "Date must be less than 100 characters"),
    keywords: z
        .string()
        .min(1, "Keywords is required")
        .max(100, "Keywords must be less than 100 characters"),
    image: z.string({
        required_error: "Image is required",
    }),
});
