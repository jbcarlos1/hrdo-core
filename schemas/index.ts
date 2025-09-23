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

  division: z.enum(["MANAGEMENT", "RECRUITMENT", "PLANNING_RESEARCH", "DEVELOPMENT_BENEFITS"], {
    errorMap: () => ({ message: "Division is required" }),
  }),

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
    .min(1, "Reference number is required")
    .max(1000, "Name must be less than 1000 characters"),
  signatories: z
    .array(
      z
        .string()
        .min(1, "Each signatory must not be empty")
        .max(1000, "Signatory must be less than 1000 characters")
    )
    .min(1, "At least one signatory is required"),
  issuingOffices: z
    .array(
      z
        .string()
        .min(1, "Each issuing office/agency must not be empty")
        .max(1000, "Issuing office/agency must be less than 1000 characters")
    )
    .min(1, "At least one issuing office/agency is required"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(1000, "Subject must be less than 1000 characters"),
  date: z
    .string({ required_error: "Date is required" })
    .min(1, "Date is required")
    .max(1000, "Date must be less than 1000 characters"),
  keywords: z
    .array(
      z
        .string()
        .min(1, "Each keyword must not be empty")
        .max(1000, "Keyword must be less than 1000 characters")
    )
    .min(1, "At least one keyword is required"),
  pdfUrl: z.string().url({ message: "PDF URL is required" }),
});

export const issuingOfficeSchema = z.object({
  unitCode: z
    .string()
    .min(1, "Office/Agency code is required")
    .max(1000, "Office/Agency code must be less than 1000 characters"),
  unit: z
    .string()
    .min(1, "Office/Agency is required")
    .max(1000, "Office/Agency must be less than 1000 characters"),
});

export const signatorySchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(1000, "Full name must be less than 1000 characters"),
});

export const keywordSchema = z.object({
  keyword: z
    .string()
    .min(1, "Keyword is required")
    .max(1000, "Keyword must be less than 1000 characters"),
});
