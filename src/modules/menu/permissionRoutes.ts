// routes/userPermissionRoutes.ts
import express from "express";
import {
  createUserPermission,
  getUserPermissions,
  updateUserPermission,
  deleteUserPermission,
  bulkUpdateUserPermissions,
} from "./permissionController";

const router = express.Router();

router.post("/", createUserPermission);
router.get("/user/:userId", getUserPermissions);
router.put("/:id", updateUserPermission);
router.delete("/:id", deleteUserPermission);
router.put("/bulk/:userId", bulkUpdateUserPermissions);

export default router;
