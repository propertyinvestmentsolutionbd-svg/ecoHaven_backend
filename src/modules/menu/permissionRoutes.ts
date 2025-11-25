// routes/userPermissionRoutes.ts
import express from "express";
import {
  createUserPermission,
  getUserPermissions,
  updateUserPermission,
  deleteUserPermission,
  bulkUpdateUserPermissions,
  getUserPermissionsWithAllMenus,
  getAllUsersWithPermissionSummary,
  upsertUserPermissions,
  upsertUserPermissionsPartial,
} from "./permissionController";

const router = express.Router();

router.post("/", createUserPermission);
router.put("/menu-permissions/upsert-permissions", upsertUserPermissions); // New route - replaces all permissions
router.get("/menus/user/:userId", getUserPermissionsWithAllMenus); // New route
router.patch("/upsert-permissions-partial", upsertUserPermissionsPartial); // New route - updates on
router.get("/user/:userId", getUserPermissions);
router.get("/users-summary", getAllUsersWithPermissionSummary); // New route
router.put("/:id", updateUserPermission);
router.delete("/:id", deleteUserPermission);
router.put("/bulk/:userId", bulkUpdateUserPermissions);
export const permissionRoutes = router;
