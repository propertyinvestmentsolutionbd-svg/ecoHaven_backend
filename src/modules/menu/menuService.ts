// services/menuService.ts
import { Prisma } from "@prisma/client";
import prisma from "../../shared/prisma";
import APIError from "../../errorHelpers/APIError";
import { IMenuCreate, IMenuUpdate } from "./menu";

// Create menu and auto-assign to all admin users
export const createMenuService = async (payload: IMenuCreate): Promise<any> => {
  const result = await prisma.$transaction(async (tx) => {
    // Create the new menu
    const newMenu = await tx.menu.create({
      data: payload,
    });

    if (!newMenu) {
      throw new APIError(400, "Failed to create menu");
    }

    // Automatically assign this menu to all admin users with full permissions
    await assignMenuToAllAdmins(tx, newMenu.id);

    return newMenu;
  });

  return result;
};
// Get all menus
export const getAllMenusService = async (): Promise<any[]> => {
  const result = await prisma.menu.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

// Get single menu by ID
export const getMenuByIdService = async (id: number): Promise<any> => {
  const result = await prisma.menu.findUnique({
    where: { id },
  });

  if (!result) {
    throw new APIError(404, "Menu not found");
  }

  return result;
};

// Update menu
export const updateMenuService = async (
  id: number,
  payload: IMenuUpdate
): Promise<any> => {
  const result = await prisma.menu.update({
    where: { id },
    data: payload,
  });

  if (!result) {
    throw new APIError(400, "Failed to update menu");
  }

  return result;
};

// Delete menu
export const deleteMenuService = async (id: number): Promise<any> => {
  // Check if menu exists
  const menu = await prisma.menu.findUnique({
    where: { id },
    include: {
      permissions: true,
    },
  });

  if (!menu) {
    throw new APIError(404, "Menu not found");
  }

  // Delete associated permissions first
  if (menu.permissions.length > 0) {
    await prisma.userMenuPermission.deleteMany({
      where: { menuId: id },
    });
  }

  // Delete menu
  const result = await prisma.menu.delete({
    where: { id },
  });

  return result;
};
// Helper function to assign menu to all admin users
const assignMenuToAllAdmins = async (
  prismaClient: any,
  menuId: number
): Promise<void> => {
  // Get all admin users
  const adminUsers = await prismaClient.user.findMany({
    where: {
      role: "admin",
      isActive: true,
    },
    select: { id: true },
  });

  if (adminUsers.length > 0) {
    // Create permission data for all admin users
    const permissionData = adminUsers.map((admin) => ({
      userId: admin.id,
      menuId: menuId,
      canView: true,
      canEdit: true,
      canDelete: true,
    }));

    // Bulk create permissions for all admins
    await prismaClient.userMenuPermission.createMany({
      data: permissionData,
      skipDuplicates: true,
    });
  }
};
