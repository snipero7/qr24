import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(5),
  notes: z.string().optional(),
});

export const createOrderSchema = z.object({
  customer: customerSchema,
  deviceModel: z.string().optional(),
  imei: z.string().optional(),
  service: z.string().min(1),
  originalPrice: z.coerce.number().nonnegative().default(0),
});

export const updateStatusSchema = z.object({
  to: z.enum(["NEW","IN_PROGRESS","WAITING_PARTS","READY","DELIVERED","CANCELED"]),
  note: z.string().optional(),
});

export const deliverOrderSchema = z.object({
  collectedPrice: z.coerce.number().positive(),
});

export const createDebtSchema = z.object({
  shopName: z.string().min(1),
  service: z.string().min(1),
  amount: z.coerce.number().positive(),
  notes: z.string().optional(),
});

export const addPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type DeliverOrderInput = z.infer<typeof deliverOrderSchema>;
export type CreateDebtInput = z.infer<typeof createDebtSchema>;
export type AddPaymentInput = z.infer<typeof addPaymentSchema>;

export function errorResponse(code: string, message: string, details?: unknown) {
  return Response.json({ code, message, details }, { status: 400 });
}

