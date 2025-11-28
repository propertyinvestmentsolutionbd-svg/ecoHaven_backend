import express from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
} from "./blogController";
import { uploadBlogImage } from "../../config/multer";
import auth from "../../middlewears/auth";

const router = express.Router();

router.post("/", auth(), uploadBlogImage, createBlog);
router.get("/", getAllBlogs);
router.get("/:id", auth(), getBlogById);
router.put("/:id", auth(), uploadBlogImage, updateBlog);
router.delete("/:id", auth(), deleteBlog);

export const blogRoutes = router;
