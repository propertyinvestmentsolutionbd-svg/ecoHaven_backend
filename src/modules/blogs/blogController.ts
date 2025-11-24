// controllers/blogController.ts
import { Request, Response } from "express";
import {
  createBlogService,
  getAllBlogsService,
  getBlogByIdService,
  updateBlogService,
  deleteBlogService,
} from "./blogService";
import catchAsync from "../../shared/catchAsync";
import { reponseFormat } from "../../shared/responseFormat";

export const createBlog = catchAsync(async (req: Request, res: Response) => {
  try {
    console.log("=== CREATE BLOG ===");
    console.log("Request body:", req.body);
    console.log("Uploaded file:", req.file);

    const blogData = {
      title: req.body.title,
      description: req.body.description,
      type: req.body.type || null,
      tag: req.body.tag || null,
      imageUrl: req.file ? `/uploads/blogs/${req.file.filename}` : null,
    };

    const blog = await createBlogService(blogData);

    reponseFormat(res, {
      success: true,
      statusCode: 201,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Error in createBlog:", error);

    // Clean up uploaded file if creation failed
    if (req.file) {
      const fs = require("fs");
      fs.unlinkSync(req.file.path);
    }

    reponseFormat(res, {
      success: false,
      statusCode: 500,
      message: error.message || "Failed to create blog",
    });
  }
});

export const getAllBlogs = catchAsync(async (req: Request, res: Response) => {
  try {
    console.log("=== GET ALL BLOGS ===");

    const blogs = await getAllBlogsService();

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Blogs retrieved successfully",
      data: blogs,
    });
  } catch (error) {
    console.error("Error in getAllBlogs:", error);

    reponseFormat(res, {
      success: false,
      statusCode: 500,
      message: error.message || "Failed to retrieve blogs",
    });
  }
});

export const getBlogById = catchAsync(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("=== GET BLOG BY ID ===", id);

    const blog = await getBlogByIdService(parseInt(id));

    if (!blog) {
      return reponseFormat(res, {
        success: false,
        statusCode: 404,
        message: "Blog not found",
      });
    }

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Blog retrieved successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Error in getBlogById:", error);

    reponseFormat(res, {
      success: false,
      statusCode: 500,
      message: error.message || "Failed to retrieve blog",
    });
  }
});

export const updateBlog = catchAsync(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("=== UPDATE BLOG ===", id);
    console.log("Update data:", req.body);
    console.log("Uploaded file:", req.file);

    const updateData: any = {
      title: req.body.title,
      description: req.body.description,
      type: req.body.type || null,
      tag: req.body.tag || null,
    };

    // Add image URL if new file was uploaded
    if (req.file) {
      updateData.imageUrl = `/uploads/blogs/${req.file.filename}`;
    }

    const blog = await updateBlogService(parseInt(id), updateData, req.file);

    if (!blog) {
      // Clean up uploaded file if blog not found
      if (req.file) {
        const fs = require("fs");
        fs.unlinkSync(req.file.path);
      }

      return reponseFormat(res, {
        success: false,
        statusCode: 404,
        message: "Blog not found",
      });
    }

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Blog updated successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Error in updateBlog:", error);

    // Clean up uploaded file if update failed
    if (req.file) {
      const fs = require("fs");
      fs.unlinkSync(req.file.path);
    }

    reponseFormat(res, {
      success: false,
      statusCode: 500,
      message: error.message || "Failed to update blog",
    });
  }
});

export const deleteBlog = catchAsync(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("=== DELETE BLOG ===", id);

    const blog = await deleteBlogService(parseInt(id));

    if (!blog) {
      return reponseFormat(res, {
        success: false,
        statusCode: 404,
        message: "Blog not found",
      });
    }

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Blog deleted successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Error in deleteBlog:", error);

    reponseFormat(res, {
      success: false,
      statusCode: 500,
      message: error.message || "Failed to delete blog",
    });
  }
});
