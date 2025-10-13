// services/userPermissionService.ts
import { Prisma } from "@prisma/client";
import prisma from "../../shared/prisma";
import APIError from "../../errorHelpers/APIError";
import {
  IUserPermissionCreate,
  IUserPermissionUpdate,
  IUserWithPermissions,
} from "./menu";

// Create user permission
export const createUserPermissionService = async (
  payload: IUserPermissionCreate
): Promise<any> => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new APIError(404, "User not found");
  }

  // Check if menu exists
  const menu = await prisma.menu.findUnique({
    where: { id: payload.menuId },
  });

  if (!menu) {
    throw new APIError(404, "Menu not found");
  }

  // Check if permission already exists
  const existingPermission = await prisma.userMenuPermission.findUnique({
    where: {
      userId_menuId: {
        userId: payload.userId,
        menuId: payload.menuId,
      },
    },
  });

  if (existingPermission) {
    throw new APIError(400, "Permission already exists for this user and menu");
  }

  const result = await prisma.userMenuPermission.create({
    data: {
      userId: payload.userId,
      menuId: payload.menuId,
      canView: payload.canView ?? true,
      canEdit: payload.canEdit ?? false,
      canDelete: payload.canDelete ?? false,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      menu: {
        select: {
          id: true,
          name: true,
          path: true,
        },
      },
    },
  });

  return result;
};

// Get all permissions for a user
export const getUserPermissionsService = async (
  userId: string
): Promise<IUserWithPermissions> => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    throw new APIError(404, "User not found");
  }

  const permissions = await prisma.userMenuPermission.findMany({
    where: { userId },
    include: {
      menu: {
        select: {
          id: true,
          name: true,
          path: true,
          icon: true,
          description: true,
        },
      },
    },
    orderBy: {
      menu: {
        name: "asc",
      },
    },
  });

  return {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    // @ts-ignore
    permissions: permissions.map((perm) => ({
      menuId: perm.menu.id,
      menuName: perm.menu.name,
      menuPath: perm.menu.path,
      menuIcon: perm.menu.icon,
      menuDescription: perm.menu.description,
      canView: perm.canView,
      canEdit: perm.canEdit,
      canDelete: perm.canDelete,
    })),
  };
};

// Update user permission
export const updateUserPermissionService = async (
  id: number,
  payload: IUserPermissionUpdate
): Promise<any> => {
  const result = await prisma.userMenuPermission.update({
    where: { id },
    data: payload,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      menu: {
        select: {
          id: true,
          name: true,
          path: true,
        },
      },
    },
  });

  if (!result) {
    throw new APIError(400, "Failed to update permission");
  }

  return result;
};

// Delete user permission
export const deleteUserPermissionService = async (id: number): Promise<any> => {
  const result = await prisma.userMenuPermission.delete({
    where: { id },
  });

  return result;
};

// Bulk update user permissions
export const bulkUpdateUserPermissionsService = async (
  userId: string,
  permissions: IUserPermissionCreate[]
): Promise<any> => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new APIError(404, "User not found");
  }

  // Use transaction for bulk operations
  const result = await prisma.$transaction(async (tx) => {
    // Delete existing permissions for this user
    await tx.userMenuPermission.deleteMany({
      where: { userId },
    });

    // Create new permissions
    const newPermissions = await tx.userMenuPermission.createMany({
      data: permissions.map((perm) => ({
        userId,
        menuId: perm.menuId,
        canView: perm.canView ?? true,
        canEdit: perm.canEdit ?? false,
        canDelete: perm.canDelete ?? false,
      })),
    });

    return newPermissions;
  });

  return result;
};
