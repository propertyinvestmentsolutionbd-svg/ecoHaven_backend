import express from "express";
import {
  createUser,
  loginUser,
  getRefreshToken,
  verify2FA,
} from "./authController";

const router = express.Router();

router.post("/auth/signup", createUser);
router.post("/auth/signin", loginUser);
router.post("/auth/verify-2fa", verify2FA);
router.post("/auth/refresh-token", getRefreshToken);
export const authRoutes = router;
