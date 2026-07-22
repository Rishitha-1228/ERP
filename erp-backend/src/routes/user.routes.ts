import { Router } from "express";
import { z } from "zod";
import * as userController from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"]),
  }),
});

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    role: z.enum(["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"]).optional(),
    isActive: z.boolean().optional(),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({ newPassword: z.string().min(6) }),
});

router.get("/", userController.list);
router.post("/", validate(createUserSchema), userController.create);
router.put("/:id", validate(updateUserSchema), userController.update);
router.post("/:id/reset-password", validate(resetPasswordSchema), userController.resetPassword);

export default router;
