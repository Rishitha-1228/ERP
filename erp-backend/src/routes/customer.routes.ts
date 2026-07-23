import { Router } from "express";
import { z } from "zod";
import * as customerController from "../controllers/customer.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";

const router = Router();

router.use(authenticate);

const customerBodySchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(7).max(15),
  email: z.string().email().optional().or(z.literal("")),
  businessName: z.string().optional(),
  gstNumber: z.string().optional(),
  customerType: z
    .enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"])
    .optional(),
  address: z.string().optional(),
  status: z.enum(["LEAD", "ACTIVE", "INACTIVE"]).optional(),
  followUpDate: z.string().optional().or(z.literal("")),
  notes: z.string().optional(),
});

const createSchema = z.object({
  body: customerBodySchema,
});

const updateSchema = z.object({
  body: customerBodySchema.partial(),
});

const noteSchema = z.object({
  body: z.object({
    note: z.string().min(1),
  }),
});
const paymentSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    note: z.string().optional(),
    paymentDate: z.string().optional(),
  }),
});

// ===============================
// Customer Routes
// ===============================

router.get("/", customerController.list);

router.get("/:id", customerController.getById);

router.post(
  "/",
  authorize("ADMIN", "SALES"),
  validate(createSchema),
  customerController.create
);
router.post(
  "/:id/payments",
  authorize("ADMIN", "ACCOUNTS"),
  validate(paymentSchema),
  customerController.addPayment
);
router.put(
  "/:id",
  authorize("ADMIN", "SALES"),
  validate(updateSchema),
  customerController.update
);

// ⭐ NEW - Soft Delete (Deactivate Customer)
router.patch(
  "/:id/deactivate",
  authorize("ADMIN", "SALES"),
  customerController.deactivate
);

router.post(
  "/:id/notes",
  authorize("ADMIN", "SALES"),
  validate(noteSchema),
  customerController.addNote
);

export default router;