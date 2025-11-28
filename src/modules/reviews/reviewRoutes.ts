// routes/reviewRoutes.ts
import express from "express";
import {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
} from "./reviewController";
import { uploadReviewImage } from "../../config/multer";
import auth from "../../middlewears/auth";

const router = express.Router();

router.post("/", uploadReviewImage, createReview);
router.get("/", getAllReviews);
router.get("/:id", getReviewById);
router.put("/:id", auth(), uploadReviewImage, updateReview);
router.delete("/:id", auth(), deleteReview);

export const reviewRoutes = router;
