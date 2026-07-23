import { Router } from "express";
import { z } from "zod";
import * as challanController from "../controllers/challan.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";

const router = Router();

router.use(authenticate);

const createChallanSchema = z.object({
  body: z.object({
    customerId: z.string().uuid(),
    status: z.enum(["DRAFT", "CONFIRMED"]).default("DRAFT"),
    items: z
      .array(z.object({ productId: z.string().uuid(), quantity: z.number().int().positive() }))
      .min(1, "At least one product line is required"),
  }),
});

router.get("/", challanController.list);
router.get("/:id", challanController.getById);
router.get("/:id/pdf", challanController.downloadPdf);
router.post("/", authorize("ADMIN", "SALES"), validate(createChallanSchema), challanController.create);
router.post("/:id/confirm", authorize("ADMIN", "SALES", "WAREHOUSE"), challanController.confirm);
router.post("/:id/cancel", authorize("ADMIN", "SALES", "WAREHOUSE"), challanController.cancel);

export default router;