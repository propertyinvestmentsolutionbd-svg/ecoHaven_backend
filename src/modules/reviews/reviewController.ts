// controllers/reviewController.ts
import { Request, Response } from "express";
import {
  createReviewService,
  getAllReviewsService,
  getReviewByIdService,
  updateReviewService,
  deleteReviewService,
} from "./reviewService";
import catchAsync from "../../shared/catchAsync";
import { reponseFormat } from "../../shared/responseFormat";

export const createReview = catchAsync(async (req: Request, res: Response) => {
  try {
    console.log("=== CREATE REVIEW ===");
    console.log("Request body:", req.body);
    console.log("Uploaded file:", req.file);

    const reviewData = {
      reviewerName: req.body.reviewerName,
      description: req.body.description,
      type: req.body.type || null,
      imageUrl: req.file ? `/uploads/reviews/${req.file.filename}` : null,
    };

    const review = await createReviewService(reviewData);

    reponseFormat(res, {
      success: true,
      statusCode: 201,
      message: "Review created successfully",
      data: review,
    });
  } catch (error) {
    console.error("Error in createReview:", error);

    // Clean up uploaded file if creation failed
    if (req.file) {
      const fs = require("fs");
      fs.unlinkSync(req.file.path);
    }

    reponseFormat(res, {
      success: false,
      statusCode: 500,
      message: error.message || "Failed to create review",
    });
  }
});

export const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  try {
    console.log("=== GET ALL REVIEWS ===");

    const reviews = await getAllReviewsService();

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Reviews retrieved successfully",
      data: reviews,
    });
  } catch (error) {
    console.error("Error in getAllReviews:", error);

    reponseFormat(res, {
      success: false,
      statusCode: 500,
      message: error.message || "Failed to retrieve reviews",
    });
  }
});

export const getReviewById = catchAsync(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("=== GET REVIEW BY ID ===", id);

    const review = await getReviewByIdService(parseInt(id));

    if (!review) {
      return reponseFormat(res, {
        success: false,
        statusCode: 404,
        message: "Review not found",
      });
    }

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Review retrieved successfully",
      data: review,
    });
  } catch (error) {
    console.error("Error in getReviewById:", error);

    reponseFormat(res, {
      success: false,
      statusCode: 500,
      message: error.message || "Failed to retrieve review",
    });
  }
});

export const updateReview = catchAsync(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("=== UPDATE REVIEW ===", id);
    console.log("Update data:", req.body);
    console.log("Uploaded file:", req.file);

    const updateData: any = {
      reviewerName: req.body.reviewerName,
      description: req.body.description,
      type: req.body.type || null,
    };

    // Add image URL if new file was uploaded
    if (req.file) {
      updateData.imageUrl = `/uploads/reviews/${req.file.filename}`;
    }

    const review = await updateReviewService(
      parseInt(id),
      updateData,
      req.file
    );

    if (!review) {
      // Clean up uploaded file if review not found
      if (req.file) {
        const fs = require("fs");
        fs.unlinkSync(req.file.path);
      }

      return reponseFormat(res, {
        success: false,
        statusCode: 404,
        message: "Review not found",
      });
    }

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Review updated successfully",
      data: review,
    });
  } catch (error) {
    console.error("Error in updateReview:", error);

    // Clean up uploaded file if update failed
    if (req.file) {
      const fs = require("fs");
      fs.unlinkSync(req.file.path);
    }

    reponseFormat(res, {
      success: false,
      statusCode: 500,
      message: error.message || "Failed to update review",
    });
  }
});

export const deleteReview = catchAsync(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("=== DELETE REVIEW ===", id);

    const review = await deleteReviewService(parseInt(id));

    if (!review) {
      return reponseFormat(res, {
        success: false,
        statusCode: 404,
        message: "Review not found",
      });
    }

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Review deleted successfully",
      data: review,
    });
  } catch (error) {
    console.error("Error in deleteReview:", error);

    reponseFormat(res, {
      success: false,
      statusCode: 500,
      message: error.message || "Failed to delete review",
    });
  }
});
