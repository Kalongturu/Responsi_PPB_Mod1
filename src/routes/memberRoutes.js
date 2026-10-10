import express from "express";
import { MemberController } from "../controllers/memberControllers.js";

const router = express.Router();

router.get("/", MemberController.getAll);
router.get("/:id", MemberController.getById);
router.post("/", MemberController.create);
router.put("/:id", MemberController.update);
router.delete("/:id", MemberController.remove);

export default router;
