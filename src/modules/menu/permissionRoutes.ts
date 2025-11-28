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
import auth from "../../middlewears/auth";

const router = express.Router();

router.post("/", createUserPermission);
router.put(
  "/menu-permissions/upsert-permissions",
  auth(),
  upsertUserPermissions
); // New route - replaces all permissions
router.get("/menus/user/:userId", auth(), getUserPermissionsWithAllMenus); // New route
router.patch("/upsert-permissions-partial", upsertUserPermissionsPartial); // New route - updates on
router.get("/user/:userId", auth(), getUserPermissions);
router.get("/users-summary", getAllUsersWithPermissionSummary); // New route
router.put("/:id", updateUserPermission);
router.delete("/:id", deleteUserPermission);
router.put("/bulk/:userId", bulkUpdateUserPermissions);
export const permissionRoutes = router;
