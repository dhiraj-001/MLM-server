import { z } from "zod";

const AdminDepositSchema = z.object({
  userId: z.string({ required_error: "User ID is required" }),
  amount: z
    .number({ required_error: "Amount is required" })
    .positive({ message: "Amount must be positive" }),
  remark: z.string().optional(),
});

const DepositSchema = z.object({
  amount: z
    .number({ required_error: "Amount is required" })
    .positive({ message: "Amount must be positive" }),
  transactionId: z
    .string({ required_error: "Transaction ID is required" })
    .trim()
    .min(3, { message: "Transaction ID must be at least 3 characters" }),
});

export { DepositSchema, AdminDepositSchema };
