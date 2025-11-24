// services/blogService.ts
import fs from "fs";
import path from "path";
import prisma from "../../shared/prisma";

interface CreateBlogData {
  title: string;
  description: string;
  type?: string;
  tag?: string;
  imageUrl?: string;
}

interface UpdateBlogData {
  title?: string;
  description?: string;
  type?: string;
  tag?: string;
  imageUrl?: string;
}

// Helper function to delete image file
const deleteImageFile = (imageUrl: string) => {
  if (imageUrl) {
    const filePath = path.join(process.cwd(), "public", imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted image file: ${filePath}`);
    }
  }
};

export const createBlogService = async (data: CreateBlogData) => {
  try {
    console.log("Creating blog with data:", data);

    const blog = await prisma.blog.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        tag: data.tag,
        imageUrl: data.imageUrl,
      },
    });

    console.log("Blog created successfully:", blog.id);
    return blog;
  } catch (error) {
    console.error("Error in createBlogService:", error);
    throw error;
  }
};

export const getAllBlogsService = async () => {
  try {
    console.log("Fetching all blogs");

    const blogs = await prisma.blog.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Found ${blogs.length} blogs`);

    // Format dates for frontend
    const formattedBlogs = blogs.map((blog) => ({
      ...blog,
      createdAt: blog.createdAt.toISOString().split("T")[0],
      updatedAt: blog.updatedAt.toISOString().split("T")[0],
    }));

    return formattedBlogs;
  } catch (error) {
    console.error("Error in getAllBlogsService:", error);
    throw error;
  }
};

export const getBlogByIdService = async (id: number) => {
  try {
    console.log("Fetching blog by ID:", id);

    const blog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!blog) {
      console.log("Blog not found:", id);
      return null;
    }

    // Format dates for frontend
    const formattedBlog = {
      ...blog,
      createdAt: blog.createdAt.toISOString().split("T")[0],
      updatedAt: blog.updatedAt.toISOString().split("T")[0],
    };

    return formattedBlog;
  } catch (error) {
    console.error("Error in getBlogByIdService:", error);
    throw error;
  }
};

export const updateBlogService = async (
  id: number,
  data: UpdateBlogData,
  newFile?: Express.Multer.File
) => {
  try {
    console.log("Updating blog:", id, data);

    // Check if blog exists
    const existingBlog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!existingBlog) {
      console.log("Blog not found for update:", id);
      return null;
    }

    // Prepare update data
    const updateData: any = { ...data };

    // If new image is uploaded, delete old image and update with new one
    if (newFile && existingBlog.imageUrl) {
      deleteImageFile(existingBlog.imageUrl);
    }

    const blog = await prisma.blog.update({
      where: { id },
      data: updateData,
    });

    console.log("Blog updated successfully:", id);
    return blog;
  } catch (error) {
    console.error("Error in updateBlogService:", error);
    throw error;
  }
};

export const deleteBlogService = async (id: number) => {
  try {
    console.log("Deleting blog:", id);

    // Check if blog exists and get image URL
    const existingBlog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!existingBlog) {
      console.log("Blog not found for deletion:", id);
      return null;
    }

    // Delete associated image file
    if (existingBlog.imageUrl) {
      deleteImageFile(existingBlog.imageUrl);
    }

    const blog = await prisma.blog.delete({
      where: { id },
    });

    console.log("Blog deleted successfully:", id);
    return blog;
  } catch (error) {
    console.error("Error in deleteBlogService:", error);
    throw error;
  }
};
