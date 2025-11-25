// services/userPermissionService.ts
import { Prisma } from "@prisma/client";
import prisma from "../../shared/prisma";
import APIError from "../../errorHelpers/APIError";
import {
  IUpsertPermissionsResponse,
  IUserMenuWithPermissions,
  IUserPermissionCreate,
  IUserPermissionUpdate,
  IUserPermissionUpsert,
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
    where: {
      userId,
      canView: true, // ✅ Only get permissions where canView is true
    },
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
        id: "asc",
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

// Get user permissions with all available menus
export const getUserPermissionsWithAllMenusService = async (
  userId: string
): Promise<IUserMenuWithPermissions> => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new APIError(404, "User not found");
  }

  if (!user.isActive) {
    throw new APIError(400, "User is inactive");
  }

  // Get all menus in the system
  const allMenus = await prisma.menu.findMany({
    select: {
      id: true,
      name: true,
      path: true,
      icon: true,
      description: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Get user's existing permissions
  const userPermissions = await prisma.userMenuPermission.findMany({
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
  });

  // Transform user permissions
  const assignedPermissions = userPermissions.map((perm) => ({
    permissionId: perm.id,
    menuId: perm.menu.id,
    menuName: perm.menu.name,
    menuPath: perm.menu.path,
    menuIcon: perm.menu.icon,
    menuDescription: perm.menu.description,
    canView: perm.canView,
    canEdit: perm.canEdit,
    canDelete: perm.canDelete,
  }));

  // Create list of available menus (including unassigned ones)
  const availableMenus = allMenus.map((menu) => {
    const userPermission = userPermissions.find(
      (perm) => perm.menuId === menu.id
    );

    return {
      menuId: menu.id,
      menuName: menu.name,
      menuPath: menu.path,
      menuIcon: menu.icon,
      menuDescription: menu.description,
      isAssigned: userPermission ? userPermission.canView : false, // ✅ This is correct
    };
  });

  return {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    assignedPermissions,
    availableMenus,
  };
};

// Get all users with their permission summary (for admin listing)
export const getAllUsersWithPermissionSummaryService = async (): Promise<
  any[]
> => {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      contactNo: true,
      isActive: true,
      createdAt: true,
      permissions: {
        select: {
          menu: {
            select: {
              name: true,
            },
          },
          canView: true,
          canEdit: true,
          canDelete: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transform the data for better frontend consumption
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    contactNo: user.contactNo,
    isActive: user.isActive,
    createdAt: user.createdAt,
    totalAssignedMenus: user.permissions.length,
    permissionsSummary: {
      canViewCount: user.permissions.filter((p) => p.canView).length,
      canEditCount: user.permissions.filter((p) => p.canEdit).length,
      canDeleteCount: user.permissions.filter((p) => p.canDelete).length,
    },
    assignedMenuNames: user.permissions.map((p) => p.menu.name),
  }));
};

// -----------------------

// Upsert (Create/Update) user permissions
export const upsertUserPermissionsService = async (
  payload: IUserPermissionUpsert
): Promise<IUpsertPermissionsResponse> => {
  const { userId, permissions } = payload;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  if (!user) {
    throw new APIError(404, "User not found");
  }

  if (!user.isActive) {
    throw new APIError(400, "Cannot assign permissions to inactive user");
  }

  // Check if all menus exist
  const menuIds = permissions.map((p) => p.menuId);
  const existingMenus = await prisma.menu.findMany({
    where: { id: { in: menuIds } },
    select: { id: true, name: true },
  });

  if (existingMenus.length !== menuIds.length) {
    const existingMenuIds = existingMenus.map((m) => m.id);
    const invalidMenuIds = menuIds.filter(
      (id) => !existingMenuIds.includes(id)
    );
    throw new APIError(404, `Invalid menu IDs: ${invalidMenuIds.join(", ")}`);
  }

  // Get existing permissions for this user
  const existingPermissions = await prisma.userMenuPermission.findMany({
    where: { userId },
    include: {
      menu: {
        select: { name: true },
      },
    },
  });

  // Use transaction for atomic operations
  const result = await prisma.$transaction(async (tx) => {
    const upsertResults = [];
    let createdCount = 0;
    let updatedCount = 0;

    for (const permission of permissions) {
      const { menuId, canView, canEdit, canDelete } = permission;

      // Find if permission already exists
      const existingPermission = existingPermissions.find(
        (ep) => ep.menuId === menuId
      );

      if (existingPermission) {
        // Update existing permission if values are different
        if (
          existingPermission.canView !== canView ||
          existingPermission.canEdit !== canEdit ||
          existingPermission.canDelete !== canDelete
        ) {
          await tx.userMenuPermission.update({
            where: { id: existingPermission.id },
            data: { canView, canEdit, canDelete },
          });
          updatedCount++;
          upsertResults.push({
            menuId,
            menuName: existingPermission.menu.name,
            canView,
            canEdit,
            canDelete,
            action: "updated" as const,
          });
        } else {
          upsertResults.push({
            menuId,
            menuName: existingPermission.menu.name,
            canView,
            canEdit,
            canDelete,
            action: "unchanged" as const,
          });
        }
      } else {
        // Create new permission
        await tx.userMenuPermission.create({
          data: {
            userId,
            menuId,
            canView,
            canEdit,
            canDelete,
          },
        });
        createdCount++;
        const menu = existingMenus.find((m) => m.id === menuId);
        upsertResults.push({
          menuId,
          menuName: menu?.name || "Unknown Menu",
          canView,
          canEdit,
          canDelete,
          action: "created" as const,
        });
      }
    }

    // Remove permissions that are not in the new list (if you want to delete unselected permissions)
    const newMenuIds = permissions.map((p) => p.menuId);
    const permissionsToDelete = existingPermissions.filter(
      (ep) => !newMenuIds.includes(ep.menuId)
    );

    if (permissionsToDelete.length > 0) {
      await tx.userMenuPermission.deleteMany({
        where: {
          userId,
          menuId: { in: permissionsToDelete.map((p) => p.menuId) },
        },
      });
    }

    return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      totalPermissions: permissions.length,
      created: createdCount,
      updated: updatedCount,
      deleted: permissionsToDelete.length,
      permissions: upsertResults,
    };
  });

  return result;
};

// Alternative: Upsert permissions without deleting existing ones (only update provided permissions)
export const upsertUserPermissionsPartialService = async (
  payload: IUserPermissionUpsert
): Promise<IUpsertPermissionsResponse> => {
  const { userId, permissions } = payload;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  if (!user) {
    throw new APIError(404, "User not found");
  }

  if (!user.isActive) {
    throw new APIError(400, "Cannot assign permissions to inactive user");
  }

  // Check if all menus exist
  const menuIds = permissions.map((p) => p.menuId);
  const existingMenus = await prisma.menu.findMany({
    where: { id: { in: menuIds } },
    select: { id: true, name: true },
  });

  if (existingMenus.length !== menuIds.length) {
    const existingMenuIds = existingMenus.map((m) => m.id);
    const invalidMenuIds = menuIds.filter(
      (id) => !existingMenuIds.includes(id)
    );
    throw new APIError(404, `Invalid menu IDs: ${invalidMenuIds.join(", ")}`);
  }

  // Use transaction for atomic operations
  const result = await prisma.$transaction(async (tx) => {
    const upsertResults = [];
    let createdCount = 0;
    let updatedCount = 0;

    for (const permission of permissions) {
      const { menuId, canView, canEdit, canDelete } = permission;

      // Upsert each permission
      const upsertedPermission = await tx.userMenuPermission.upsert({
        where: {
          userId_menuId: {
            userId,
            menuId,
          },
        },
        update: {
          canView,
          canEdit,
          canDelete,
        },
        create: {
          userId,
          menuId,
          canView,
          canEdit,
          canDelete,
        },
        include: {
          menu: {
            select: { name: true },
          },
        },
      });

      // Determine if it was created or updated
      const isNew =
        !upsertedPermission.createdAt ||
        upsertedPermission.createdAt.getTime() ===
          upsertedPermission.updatedAt.getTime();

      if (isNew) {
        createdCount++;
        upsertResults.push({
          menuId,
          menuName: upsertedPermission.menu.name,
          canView,
          canEdit,
          canDelete,
          action: "created" as const,
        });
      } else {
        updatedCount++;
        upsertResults.push({
          menuId,
          menuName: upsertedPermission.menu.name,
          canView,
          canEdit,
          canDelete,
          action: "updated" as const,
        });
      }
    }

    return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      totalPermissions: permissions.length,
      created: createdCount,
      updated: updatedCount,
      permissions: upsertResults,
    };
  });

  return result;
};
