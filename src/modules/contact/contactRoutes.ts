// routes/contactRoutes.ts
import express from "express";
import {
  createContact,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  markAsRead,
  markAsReplied,
  markMultipleAsRead,
  getContactStats,
} from "./contactController";
import auth from "../../middlewears/auth";

const router = express.Router();

// Public routes
router.post("/", createContact);

// Protected admin routes
router.get("/", auth(), getAllContacts);
router.get("/stats", getContactStats);
router.get("/:id", auth(), getContactById);
router.put("/:id", auth(), updateContact);
router.delete("/:id", auth(), deleteContact);
router.patch("/:id/read", auth(), markAsRead);
router.patch("/:id/replied", auth(), markAsReplied);

export const contactRoutes = router;
