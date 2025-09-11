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
  extraCharge: z.coerce.number().nonnegative().default(0).optional(),
  extraReason: z.string().optional(),
}).refine((data) => {
  if ((data.extraCharge ?? 0) > 0) return !!(data.extraReason && data.extraReason.trim().length > 0);
  return true;
}, { message: 'يجب إدخال سبب للرسوم الإضافية', path: ['extraReason'] });

export const createDebtSchema = z.object({
  shopName: z.string().min(1),
  phone: z.string().optional(),
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
