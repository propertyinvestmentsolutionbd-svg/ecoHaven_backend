import express from "express";
import {
  createUser,
  loginUser,
  getRefreshToken,
  verify2FA,
  updateUserRole,
  updateProfileImage,
  getAllUsers,
  getUserById,
  updateUserWithImage,
  changePassword,
  deleteUser,
  toggleUserStatus,
  verifyEmail,
  forgotPassword,
  getEmployeesForDropdown,
  getUsersForDropdown,
  resend2FACode,
} from "./authController";
import { uploadProfileImage } from "../../config/multer";

const router = express.Router();
router.get("/employees/dropdown", getEmployeesForDropdown);
router.get("/employees", getAllUsers);

// Get user by ID
router.get("/profile/:id", getUserById);
router.put("/:id/with-image", uploadProfileImage, updateUserWithImage);
router.patch("/:id/change-password", changePassword);
router.delete("/:id", deleteUser);
router.patch("/:id/toggle-status", toggleUserStatus);
// Forgot password routes
router.post("/forgot_password", forgotPassword);
router.post("/resend-2fa", resend2FACode);

router.post("/verify-email", verifyEmail);
// router.post("/auth/signup", createUser);
router.post("/auth/signup", uploadProfileImage, createUser);
router.get("/agent", getUsersForDropdown);

router.post("/auth/signin", loginUser);
router.post("/auth/verify-2fa", verify2FA);
router.post("/auth/refresh-token", getRefreshToken);
router.put("/update-role/:userId", updateUserRole);
// router.patch(
//   "/users/:userId/profile-image",
//   uploadProfileImage,
//   updateProfileImage
// );

export const authRoutes = router;
