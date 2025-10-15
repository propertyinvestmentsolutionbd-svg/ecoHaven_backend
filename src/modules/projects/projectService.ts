// services/projectService.ts
import { Prisma } from "@prisma/client";
import prisma from "../../shared/prisma";
import APIError from "../../errorHelpers/APIError";
import {
  IProjectCreate,
  IProjectUpdate,
  IProjectFilters,
  IProjectStats,
  IGalleryItemCreate,
} from "./project";
import fs from "fs";
import path from "path";
// Create new project with images and gallery items
export const createProjectService = async (
  payload: IProjectCreate
): Promise<any> => {
  const { images, galleryItems, ...projectData } = payload;

  const result = await prisma.$transaction(async (tx) => {
    // Create the project
    const project = await tx.project.create({
      data: {
        ...projectData,
        amenities: projectData.amenities || [],
      },
    });

    // Create project images if provided
    if (images && images.length > 0) {
      const imageData = images.map((image) => ({
        ...image,
        projectId: project.id,
        isFeatured: image.isFeatured || false,
      }));

      await tx.projectImage.createMany({
        data: imageData,
      });
    }

    // Create gallery items if provided
    if (galleryItems && galleryItems.length > 0) {
      const galleryData = galleryItems.map((item) => ({
        ...item,
        projectId: project.id,
      }));

      await tx.gallery.createMany({
        data: galleryData,
      });
    }

    // Return the complete project with relations
    return await tx.project.findUnique({
      where: { id: project.id },
      include: {
        images: true,
        galleryItems: true,
      },
    });
  });

  return result;
};

// services/projectService.ts
export const createProjectWithFilesService = async (
  projectData: any,
  projectImages: Express.Multer.File[],
  galleryMedia: Express.Multer.File[]
): Promise<any> => {
  // Extract only the fields that belong to the Project model
  const {
    imageCaptions,
    galleryTitles,
    galleryCategories,
    galleryItems,
    ...projectPayload
  } = projectData;

  const result = await prisma.$transaction(async (tx) => {
    // Create the project with only valid fields
    const project = await tx.project.create({
      data: {
        name: projectPayload.name,
        mapUrl: projectPayload.mapUrl,
        location: projectPayload.location,
        priceRange: projectPayload.priceRange,
        sizeSqft: projectPayload.sizeSqft,
        landArea: projectPayload.landArea,
        status: projectPayload.status,
        description: projectPayload.description,
        amenities: projectPayload.amenities || [],
        projectType: projectPayload.projectType,
        progressPercentage: projectPayload.progressPercentage,
        completionYear: projectPayload.completionYear,
        brochureUrl: projectPayload.brochureUrl,
        virtualTourUrl: projectPayload.virtualTourUrl,
        latitude: projectPayload.latitude,
        longitude: projectPayload.longitude,
      },
    });

    // Process uploaded project images
    if (projectImages && projectImages.length > 0) {
      const projectImageData = projectImages.map((file, index) => ({
        imageUrl: `/uploads/projects/${path.basename(file.filename)}`,
        caption: imageCaptions?.[index] || null,
        isFeatured: index === 0, // First image as featured by default
        projectId: project.id,
      }));

      await tx.projectImage.createMany({
        data: projectImageData,
      });
    }

    // Process uploaded gallery media
    if (galleryMedia && galleryMedia.length > 0) {
      const galleryData = galleryMedia.map((file, index) => {
        const isImage = file.mimetype.startsWith("image/");
        const isVideo = file.mimetype.startsWith("video/");

        return {
          title: galleryTitles?.[index] || `Gallery Item ${index + 1}`,
          category: galleryCategories?.[index] || "general",
          imageUrl: isImage
            ? `/uploads/gallery/${path.basename(file.filename)}`
            : null,
          videoUrl: isVideo
            ? `/uploads/gallery/${path.basename(file.filename)}`
            : null,
          projectId: project.id,
        };
      });

      await tx.gallery.createMany({
        data: galleryData,
      });
    }

    // Process additional gallery items from JSON (if any)
    if (galleryItems && galleryItems.length > 0) {
      const additionalGalleryData = galleryItems.map((item: any) => ({
        ...item,
        projectId: project.id,
      }));

      await tx.gallery.createMany({
        data: additionalGalleryData,
      });
    }

    // Return the complete project with relations
    return await tx.project.findUnique({
      where: { id: project.id },
      include: {
        images: {
          orderBy: {
            isFeatured: "desc",
          },
        },
        galleryItems: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  });

  return result;
};

// Add images to existing project with file upload
export const addProjectImagesWithFilesService = async (
  projectId: number,
  files: Express.Multer.File[],
  captions?: string[]
): Promise<any> => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    // Clean up uploaded files if project doesn't exist
    files.forEach((file) => deleteImageFile(file.path));
    throw new APIError(404, "Project not found");
  }

  const imageData = files.map((file, index) => ({
    imageUrl: `/uploads/projects/${path.basename(file.filename)}`,
    caption: captions?.[index] || null,
    isFeatured: false,
    projectId,
  }));

  const result = await prisma.projectImage.createMany({
    data: imageData,
  });

  return {
    count: result.count,
    projectId,
    message: `${result.count} images added to project`,
  };
};

// Add gallery items with file upload
export const addGalleryItemsWithFilesService = async (
  projectId: number,
  files: Express.Multer.File[],
  galleryData: {
    titles?: string[];
    categories?: string[];
  }
): Promise<any> => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    // Clean up uploaded files if project doesn't exist
    files.forEach((file) => deleteImageFile(file.path));
    throw new APIError(404, "Project not found");
  }

  const galleryItemsData = files.map((file, index) => {
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");

    return {
      title: galleryData.titles?.[index] || `Gallery Item ${index + 1}`,
      category: galleryData.categories?.[index] || "general",
      imageUrl: isImage
        ? `/uploads/gallery/${path.basename(file.filename)}`
        : null,
      videoUrl: isVideo
        ? `/uploads/gallery/${path.basename(file.filename)}`
        : null,
      projectId,
    };
  });

  const result = await prisma.gallery.createMany({
    data: galleryItemsData,
  });

  return {
    count: result.count,
    projectId,
    message: `${result.count} gallery items added to project`,
  };
};
// Get all projects with filtering and pagination
export const getAllProjectsService = async (
  filters: IProjectFilters = {},
  page: number = 1,
  limit: number = 10
): Promise<{
  projects: any[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const skip = (page - 1) * limit;

  // Build where clause for filters
  const where: any = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { location: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.projectType) {
    where.projectType = { contains: filters.projectType, mode: "insensitive" };
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        images: {
          where: { isFeatured: true },
          take: 1,
        },
        galleryItems: {
          take: 3, // Show first 3 gallery items
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            images: true,
            galleryItems: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    projects,
    total,
    page,
    totalPages,
  };
};

// Get single project by ID with all relations
export const getProjectByIdService = async (id: number): Promise<any> => {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: {
          isFeatured: "desc",
        },
      },
      galleryItems: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!project) {
    throw new APIError(404, "Project not found");
  }

  return project;
};

// Update project with images and gallery items
export const updateProjectService = async (
  id: number,
  payload: IProjectUpdate
): Promise<any> => {
  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    throw new APIError(404, "Project not found");
  }

  const result = await prisma.project.update({
    where: { id },
    data: {
      ...payload,
      amenities: payload.amenities || project.amenities,
    },
  });

  return result;
};

// Delete project and associated images/gallery items
export const deleteProjectService = async (id: number): Promise<any> => {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      images: true,
      galleryItems: true,
    },
  });

  if (!project) {
    throw new APIError(404, "Project not found");
  }

  // Delete physical image files
  for (const image of project.images) {
    await deleteImageFile(image.imageUrl);
  }

  // Delete project and all related records (cascade delete)
  const result = await prisma.project.delete({
    where: { id },
  });

  return result;
};

// Add gallery items to project
export const addGalleryItemsService = async (
  projectId: number,
  galleryItems: IGalleryItemCreate[]
): Promise<any> => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new APIError(404, "Project not found");
  }

  const galleryData = galleryItems.map((item) => ({
    ...item,
    projectId,
  }));

  const result = await prisma.gallery.createMany({
    data: galleryData,
  });

  return {
    count: result.count,
    projectId,
    message: `${result.count} gallery items added to project`,
  };
};

// Delete gallery item
export const deleteGalleryItemService = async (
  galleryItemId: number
): Promise<any> => {
  const galleryItem = await prisma.gallery.findUnique({
    where: { id: galleryItemId },
  });

  if (!galleryItem) {
    throw new APIError(404, "Gallery item not found");
  }

  // Delete physical file if it's an image
  if (galleryItem.imageUrl) {
    await deleteImageFile(galleryItem.imageUrl);
  }

  const result = await prisma.gallery.delete({
    where: { id: galleryItemId },
  });

  return result;
};

// Add images to project
export const addProjectImagesService = async (
  projectId: number,
  files: Express.Multer.File[],
  captions?: string[]
): Promise<any> => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    // Clean up uploaded files if project doesn't exist
    files.forEach((file) => deleteImageFile(file.path));
    throw new APIError(404, "Project not found");
  }

  const imageData = files.map((file, index) => ({
    imageUrl: `/uploads/projects/${path.basename(file.filename)}`,
    caption: captions?.[index] || null,
    isFeatured: false,
    projectId,
  }));

  const result = await prisma.projectImage.createMany({
    data: imageData,
  });

  return {
    count: result.count,
    projectId,
    message: `${result.count} images added to project`,
  };
};

// Set featured image
export const setFeaturedImageService = async (
  projectId: number,
  imageId: number
): Promise<any> => {
  // First, set all images of this project as not featured
  await prisma.projectImage.updateMany({
    where: { projectId },
    data: { isFeatured: false },
  });

  // Then set the specified image as featured
  const result = await prisma.projectImage.update({
    where: { id: imageId },
    data: { isFeatured: true },
    include: {
      project: {
        select: { name: true },
      },
    },
  });

  return result;
};

// Delete project image
export const deleteProjectImageService = async (
  imageId: number
): Promise<any> => {
  const image = await prisma.projectImage.findUnique({
    where: { id: imageId },
  });

  if (!image) {
    throw new APIError(404, "Image not found");
  }

  // Delete physical file
  await deleteImageFile(image.imageUrl);

  // Delete database record
  const result = await prisma.projectImage.delete({
    where: { id: imageId },
  });

  return result;
};

// Get project statistics
export const getProjectStatsService = async (): Promise<IProjectStats> => {
  const [total, ongoing, completed] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: "ongoing" } }),
    prisma.project.count({ where: { status: "completed" } }),
  ]);

  return {
    total,
    ongoing,
    completed,
  };
};

// Helper function to delete physical image file
const deleteImageFile = async (imageUrl: string): Promise<void> => {
  try {
    const filename = path.basename(imageUrl);
    const filePath = path.join("uploads", "projects", filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Error deleting image file:", error);
    // Don't throw error, just log it
  }
};
