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
        .max(100, "Name must be less than 100 characters")
        .regex(
            /^[a-zA-Z0-9 ,./()&'\-]+$/,
            "Memo number can only contain letters, numbers, spaces, commas, periods, slashes, parentheses, ampersands, apostrophes, and dashes"
        ),
    signatory: z
        .string()
        .min(1, "Signatory is required")
        .max(100, "Signatory must be less than 100 characters")
        .regex(
            /^[a-zA-Z0-9 ,./()&'\-]+$/,
            "Signatory can only contain letters, numbers, spaces, commas, periods, slashes, parentheses, ampersands, apostrophes, and dashes"
        ),
    issuingOffice: z
        .string({ required_error: "Issuing office/agency is required" })
        .min(1, "Issuing office/agency is required")
        .max(100, "Issuing office/agency must be less than 100 characters")
        .regex(
            /^[a-zA-Z0-9 ,./()&'\-]+$/,
            "Issuing office/agency can only contain letters, numbers, spaces, commas, periods, slashes, parentheses, ampersands, apostrophes, and dashes"
        ),
    subject: z
        .string()
        .min(1, "Subject is required")
        .max(100, "Subject must be less than 100 characters")
        .regex(
            /^[a-zA-Z0-9 ,./()&'\-]+$/,
            "Subject can only contain letters, numbers, spaces, commas, periods, slashes, parentheses, ampersands, apostrophes, and dashes"
        ),
    date: z
        .string({ required_error: "Date is required" })
        .min(1, "Date is required")
        .max(100, "Date must be less than 100 characters")
        .regex(
            /^[a-zA-Z0-9 ,./()&'\-:]+$/,
            "Date can only contain letters, numbers, spaces, commas, periods, slashes, colons, parentheses, ampersands, apostrophes, and dashes"
        ),
    keywords: z
        .string()
        .min(1, "Keywords is required")
        .max(100, "Keywords must be less than 100 characters"),
    pdfUrl: z.string().url({ message: "PDF URL is required" }),
});

export const issuingOfficeSchema = z.object({
    unitCode: z
        .string()
        .min(1, "Office/Agency code is required")
        .max(50, "Office/Agency code must be less than 50 characters")
        .regex(
            /^[a-zA-Z0-9 ,./()&'\-]+$/,
            "Office/Agency code can only contain letters, numbers, spaces, commas, periods, slashes, parentheses, ampersands, apostrophes, and dashes"
        ),
    unit: z
        .string()
        .min(1, "Office/Agency is required")
        .max(200, "Office/Agency must be less than 200 characters")
        .regex(
            /^[a-zA-Z0-9 ,./()&'\-]+$/,
            "Office/Agency can only contain letters, numbers, spaces, commas, periods, slashes, parentheses, ampersands, apostrophes, and dashes"
        ),
});

export const signatorySchema = z.object({
    fullName: z
        .string()
        .min(1, "Full name is required")
        .max(200, "Full name must be less than 200 characters")
        .regex(
            /^[a-zA-Z0-9 ,./()&'\-]+$/,
            "Full name can only contain letters, numbers, spaces, commas, periods, slashes, parentheses, ampersands, apostrophes, and dashes"
        ),
});
