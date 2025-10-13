// controllers/menuController.ts
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import {
  createMenuService,
  deleteMenuService,
  getAllMenusService,
  getMenuByIdService,
  updateMenuService,
} from "./menuService";
import { reponseFormat } from "../../shared/responseFormat";

export const createMenu = catchAsync(async (req: Request, res: Response) => {
  const result = await createMenuService(req.body);

  reponseFormat(res, {
    success: true,
    statusCode: 201,
    message: "Menu created successfully",
    data: result,
  });
});

export const getAllMenus = catchAsync(async (req: Request, res: Response) => {
  const result = await getAllMenusService();

  reponseFormat(res, {
    success: true,
    statusCode: 200,
    message: "Menus retrieved successfully",
    data: result,
  });
});

export const getMenuById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await getMenuByIdService(parseInt(id!));

  reponseFormat(res, {
    success: true,
    statusCode: 200,
    message: "Menu retrieved successfully",
    data: result,
  });
});

export const updateMenu = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await updateMenuService(parseInt(id!), req.body);

  reponseFormat(res, {
    success: true,
    statusCode: 200,
    message: "Menu updated successfully",
    data: result,
  });
});

export const deleteMenu = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await deleteMenuService(parseInt(id!));

  reponseFormat(res, {
    success: true,
    statusCode: 200,
    message: "Menu deleted successfully",
    data: result,
  });
});
