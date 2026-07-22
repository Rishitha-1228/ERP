import { Router } from "express";
import { z } from "zod";
import * as inventoryController from "../controllers/inventory.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";

const router = Router();

router.use(authenticate);

const createMovementSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    movementType: z.enum(["IN", "OUT", "ADJUST"]),
    reason: z.string().min(1),
  }),
});

router.get("/", inventoryController.list);
router.post("/", authorize("ADMIN", "WAREHOUSE"), validate(createMovementSchema), inventoryController.create);

export default router;
