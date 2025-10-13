// routes/menuRoutes.ts
import express from "express";
import {
  createMenu,
  getAllMenus,
  getMenuById,
  updateMenu,
  deleteMenu,
} from "./menuController";

const router = express.Router();

router.post("/menu", createMenu);
router.get("/menu", getAllMenus);
router.get("/menu/:id", getMenuById);
router.put("/menu/:id", updateMenu);
router.delete("/menu/:id", deleteMenu);

export default router;
