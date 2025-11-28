// routes/careerRoutes.ts
import express from "express";
import {
  createCareer,
  getAllCareers,
  getCareerById,
  updateCareer,
  deleteCareer,
} from "./careerController";
import auth from "../../middlewears/auth";

const router = express.Router();

router.get("/", getAllCareers);
router.post("/", auth(), createCareer);
router.get("/:id", auth(), getCareerById);
router.put("/:id", auth(), updateCareer);
router.delete("/:id", auth(), deleteCareer);

export const careerRoutes = router;
