import express from "express";
import { LoanController } from "../controllers/loanControllers.js";

const router = express.Router();

router.get("/", LoanController.getAll);
router.get("/:id", LoanController.getById);
router.post("/", LoanController.create);
router.put("/:id", LoanController.update);
router.delete("/:id", LoanController.remove);

export default router;
