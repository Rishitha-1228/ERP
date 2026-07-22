import { Router } from "express";
import { z } from "zod";
import * as productController from "../controllers/product.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";

const router = Router();

router.use(authenticate);

const productBodySchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(1),
  category: z.string().optional(),
  warehouse: z.string().optional(),
  unitPrice: z.number().nonnegative(),
  currentStock: z.number().int().nonnegative().optional(),
  minStockAlert: z.number().int().nonnegative().optional(),
});

const createSchema = z.object({
  body: productBodySchema,
});

const updateSchema = z.object({
  body: productBodySchema.partial(),
});

// =========================
// Lookup Routes
// =========================

router.get("/categories", productController.listCategories);

router.get("/warehouses", productController.listWarehouses);

// =========================
// Product Routes
// =========================

router.get("/", productController.list);

router.get("/:id", productController.getById);

router.post(
  "/",
  authorize("ADMIN", "WAREHOUSE"),
  validate(createSchema),
  productController.create
);

router.put(
  "/:id",
  authorize("ADMIN", "WAREHOUSE"),
  validate(updateSchema),
  productController.update
);

// ⭐ NEW - Soft Delete Product
router.patch(
  "/:id/deactivate",
  authorize("ADMIN", "WAREHOUSE"),
  productController.deactivate
);

export default router;