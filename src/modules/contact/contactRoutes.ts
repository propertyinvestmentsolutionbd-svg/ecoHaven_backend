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

const router = express.Router();

// Public routes
router.post("/", createContact);

// Protected admin routes
router.get("/", getAllContacts);
router.get("/stats", getContactStats);
router.get("/:id", getContactById);
router.put("/:id", updateContact);
router.delete("/:id", deleteContact);
router.patch("/:id/read", markAsRead);
router.patch("/:id/replied", markAsReplied);

export const contactRoutes = router;
