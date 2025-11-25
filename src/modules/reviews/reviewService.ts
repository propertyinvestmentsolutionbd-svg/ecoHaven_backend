// services/reviewService.ts
import fs from "fs";
import path from "path";
import prisma from "../../shared/prisma";

interface CreateReviewData {
  reviewerName: string;
  description: string;
  type?: string;
  imageUrl?: string;
}

interface UpdateReviewData {
  reviewerName?: string;
  description?: string;
  type?: string;
  imageUrl?: string;
}

// Helper function to delete image file
const deleteImageFile = (imageUrl: string) => {
  if (imageUrl) {
    const filePath = path.join(process.cwd(), "public", imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted image file: ${filePath}`);
    }
  }
};

export const createReviewService = async (data: CreateReviewData) => {
  try {
    console.log("Creating review with data:", data);

    const review = await prisma.review.create({
      data: {
        reviewerName: data.reviewerName,
        description: data.description,
        type: data.type,
        imageUrl: data.imageUrl,
      },
    });

    console.log("Review created successfully:", review.id);
    return review;
  } catch (error) {
    console.error("Error in createReviewService:", error);
    throw error;
  }
};

export const getAllReviewsService = async () => {
  try {
    console.log("Fetching all reviews");

    const reviews = await prisma.review.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Found ${reviews.length} reviews`);

    // Format dates for frontend
    const formattedReviews = reviews.map((review) => ({
      ...review,
      createdAt: review.createdAt.toISOString().split("T")[0],
      updatedAt: review.updatedAt.toISOString().split("T")[0],
    }));

    return formattedReviews;
  } catch (error) {
    console.error("Error in getAllReviewsService:", error);
    throw error;
  }
};

export const getReviewByIdService = async (id: number) => {
  try {
    console.log("Fetching review by ID:", id);

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      console.log("Review not found:", id);
      return null;
    }

    // Format dates for frontend
    const formattedReview = {
      ...review,
      createdAt: review.createdAt.toISOString().split("T")[0],
      updatedAt: review.updatedAt.toISOString().split("T")[0],
    };

    return formattedReview;
  } catch (error) {
    console.error("Error in getReviewByIdService:", error);
    throw error;
  }
};

export const updateReviewService = async (
  id: number,
  data: UpdateReviewData,
  newFile?: Express.Multer.File
) => {
  try {
    console.log("Updating review:", id, data);

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      console.log("Review not found for update:", id);
      return null;
    }

    // Prepare update data
    const updateData: any = { ...data };

    // If new image is uploaded, delete old image and update with new one
    if (newFile && existingReview.imageUrl) {
      deleteImageFile(existingReview.imageUrl);
    }

    const review = await prisma.review.update({
      where: { id },
      data: updateData,
    });

    console.log("Review updated successfully:", id);
    return review;
  } catch (error) {
    console.error("Error in updateReviewService:", error);
    throw error;
  }
};

export const deleteReviewService = async (id: number) => {
  try {
    console.log("Deleting review:", id);

    // Check if review exists and get image URL
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      console.log("Review not found for deletion:", id);
      return null;
    }

    // Delete associated image file
    if (existingReview.imageUrl) {
      deleteImageFile(existingReview.imageUrl);
    }

    const review = await prisma.review.delete({
      where: { id },
    });

    console.log("Review deleted successfully:", id);
    return review;
  } catch (error) {
    console.error("Error in deleteReviewService:", error);
    throw error;
  }
};
