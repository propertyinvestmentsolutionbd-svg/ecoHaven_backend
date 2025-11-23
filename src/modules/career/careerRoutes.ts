// routes/careerRoutes.ts
import express from "express";
import {
  createCareer,
  getAllCareers,
  getCareerById,
  updateCareer,
  deleteCareer,
} from "./careerController";

const router = express.Router();

router.get("/", getAllCareers);
router.post("/", createCareer);
router.get("/:id", getCareerById);
router.put("/:id", updateCareer);
router.delete("/:id", deleteCareer);

export const careerRoutes = router;
