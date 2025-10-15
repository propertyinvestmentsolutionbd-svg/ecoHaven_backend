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
router.put("/upsert-permissions", upsertUserPermissions); // New route - replaces all permissions
router.patch("/upsert-permissions-partial", upsertUserPermissionsPartial); // New route - updates on
router.get("/user/:userId", getUserPermissions);
router.get("/user-with-menus/:userId", getUserPermissionsWithAllMenus); // New route
router.get("/users-summary", getAllUsersWithPermissionSummary); // New route
router.put("/:id", updateUserPermission);
router.delete("/:id", deleteUserPermission);
router.put("/bulk/:userId", bulkUpdateUserPermissions);
export const permissionRoutes = router;
