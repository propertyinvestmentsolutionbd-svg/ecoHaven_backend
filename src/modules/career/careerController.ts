// controllers/careerController.ts
import { Request, Response } from "express";
import {
  createCareerService,
  getAllCareersService,
  getCareerByIdService,
  updateCareerService,
  deleteCareerService,
} from "./careerService";
import catchAsync from "../../shared/catchAsync";
import { reponseFormat } from "../../shared/responseFormat";

export const createCareer = catchAsync(async (req: Request, res: Response) => {
  try {
    console.log("=== CREATE CAREER ===");
    console.log("Request body:", req.body);

    const career = await createCareerService(req.body);

    reponseFormat(res, {
      success: true,
      statusCode: 201,
      message: "Career posting created successfully",
      data: career,
    });
  } catch (error) {
    console.error("Error in createCareer:", error);

    reponseFormat(res, {
      success: false,
      statusCode: 500,
      message: error.message || "Failed to create career posting",
    });
  }
});

export const getAllCareers = catchAsync(async (req: Request, res: Response) => {
  try {
    console.log("=== GET ALL CAREERS ===");

    const careers = await getAllCareersService();

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Careers retrieved successfully",
      data: careers,
    });
  } catch (error) {
    console.error("Error in getAllCareers:", error);

    reponseFormat(res, {
      success: false,
      statusCode: 500,
      message: error.message || "Failed to retrieve careers",
    });
  }
});

export const getCareerById = catchAsync(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("=== GET CAREER BY ID ===", id);

    const career = await getCareerByIdService(parseInt(id));

    if (!career) {
      return reponseFormat(res, {
        success: false,
        statusCode: 404,
        message: "Career posting not found",
      });
    }

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Career retrieved successfully",
      data: career,
    });
  } catch (error) {
    console.error("Error in getCareerById:", error);

    reponseFormat(res, {
      success: false,
      statusCode: 500,
      message: error.message || "Failed to retrieve career",
    });
  }
});

export const updateCareer = catchAsync(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("=== UPDATE CAREER ===", id);
    console.log("Update data:", req.body);

    const career = await updateCareerService(parseInt(id), req.body);

    if (!career) {
      return reponseFormat(res, {
        success: false,
        statusCode: 404,
        message: "Career posting not found",
      });
    }

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Career posting updated successfully",
      data: career,
    });
  } catch (error) {
    console.error("Error in updateCareer:", error);

    reponseFormat(res, {
      success: false,
      statusCode: 500,
      message: error.message || "Failed to update career posting",
    });
  }
});

export const deleteCareer = catchAsync(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("=== DELETE CAREER ===", id);

    const career = await deleteCareerService(parseInt(id));

    if (!career) {
      return reponseFormat(res, {
        success: false,
        statusCode: 404,
        message: "Career posting not found",
      });
    }

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Career posting deleted successfully",
      data: career,
    });
  } catch (error) {
    console.error("Error in deleteCareer:", error);

    reponseFormat(res, {
      success: false,
      statusCode: 500,
      message: error.message || "Failed to delete career posting",
    });
  }
});
