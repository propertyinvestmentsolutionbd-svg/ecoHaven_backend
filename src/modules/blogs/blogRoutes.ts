import express from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
} from "./blogController";
import { uploadBlogImage } from "../../config/multer";

const router = express.Router();

router.post("/", uploadBlogImage, createBlog);
router.get("/", getAllBlogs);
router.get("/:id", getBlogById);
router.put("/:id", uploadBlogImage, updateBlog);
router.delete("/:id", deleteBlog);

export const blogRoutes = router;
