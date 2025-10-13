// controllers/userPermissionController.ts
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import {
  createUserPermissionService,
  getUserPermissionsService,
  updateUserPermissionService,
  deleteUserPermissionService,
  bulkUpdateUserPermissionsService,
} from "./menuPermissionService";
import { reponseFormat } from "../../shared/responseFormat";

export const createUserPermission = catchAsync(
  async (req: Request, res: Response) => {
    const result = await createUserPermissionService(req.body);

    reponseFormat(res, {
      success: true,
      statusCode: 201,
      message: "User permission created successfully",
      data: result,
    });
  }
);

export const getUserPermissions = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const result = await getUserPermissionsService(userId!);

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "User permissions retrieved successfully",
      data: result,
    });
  }
);

export const updateUserPermission = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await updateUserPermissionService(parseInt(id!), req.body);

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "User permission updated successfully",
      data: result,
    });
  }
);

export const deleteUserPermission = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await deleteUserPermissionService(parseInt(id!));

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "User permission deleted successfully",
      data: result,
    });
  }
);

export const bulkUpdateUserPermissions = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { permissions } = req.body;

    const result = await bulkUpdateUserPermissionsService(userId!, permissions);

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "User permissions updated successfully",
      data: result,
    });
  }
);
