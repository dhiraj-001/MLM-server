import { z } from "zod";

const SignUpSchema = z.object({
  username: z
    .string({ required_error: "Username is required" })
    .trim()
    .min(3, { message: "Username must be at least 3 characters long" })
    .max(255, { message: "Username must be at most 255 characters long" }),
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .min(3, { message: "Email must be at least 3 characters long" })
    .max(255, { message: "Email must be at most 255 characters long" })
    .email({ message: "Invalid email address", tldWhitelist: ["com", "net"] }),

  phone: z
    .string({ required_error: "Phone is required" })
    .trim()
    .min(10, { message: "Phone must be at least 10 characters long" })
    .max(15, { message: "Phone must be at most 15 characters long" })
    .regex(/^\d+$/, { message: "Phone must contain only digits" }),
  referredBy: z.string().trim().optional(),
});

const LoginSchema = z
  .object({
    phone: z
      .string()
      .trim()
      .regex(/^\d+$/, { message: "Phone must contain only digits" })
      .min(10, { message: "Phone must be at least 10 digits" })
      .max(15, { message: "Phone must be at most 15 digits" })
      .optional(),
    password: z
      .string({ required_error: "Password is required" })
      .min(2, { message: "Password must be at least 6 characters long" })
      .max(255, { message: "Password must be at most 255 characters long" }),
  })
  .refine((data) => data.email || data.phone, {
    message: "Either phone or email must be provided",
  });

const ForgetPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email({ message: "Invalid email address", tldWhitelist: ["com", "net"] }),
});

export { SignUpSchema, LoginSchema, ForgetPasswordSchema };
