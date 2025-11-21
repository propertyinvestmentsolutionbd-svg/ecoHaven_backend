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
export const createProjectWithFilesService = async (
  projectData: any,
  projectImages: Express.Multer.File[] = [],
  galleryMedia: Express.Multer.File[] = []
): Promise<any> => {
  console.log("=== SERVICE START ===");
  console.log("Project images:", projectImages?.length || 0);
  console.log("Gallery media:", galleryMedia?.length || 0);

  // Extract only the fields that belong to the Project model
  const {
    imageCaptions = [],
    galleryTitles = [],
    galleryCategories = [],
    galleryItems = [],
    ...projectPayload
  } = projectData;

  console.log("Project payload:", projectPayload);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Validate required fields for project
      if (!projectPayload.name) {
        throw new Error("Project name is required");
      }
      if (!projectPayload.status) {
        throw new Error("Project status is required");
      }
      if (!projectPayload.projectType) {
        throw new Error("Project type is required");
      }

      console.log("Creating project in database...");

      // Convert status to uppercase if it's an enum
      const status = projectPayload.status || "Upcoming";

      // Create the project - this works with or without images
      const project = await tx.project.create({
        data: {
          name: projectPayload.name,
          mapUrl: projectPayload.mapUrl || null,
          location: projectPayload.location || null,
          priceRange: projectPayload.priceRange || null,
          sizeSqft: projectPayload.sizeSqft
            ? parseInt(projectPayload.sizeSqft)
            : null,
          landArea: projectPayload.landArea || null,
          status: status,
          description: projectPayload.description || null,
          amenities: projectPayload.amenities || [],
          projectType: projectPayload.projectType,
          progressPercentage: projectPayload.progressPercentage
            ? parseInt(projectPayload.progressPercentage)
            : 0,
          completionYear: projectPayload.completionYear
            ? parseInt(projectPayload.completionYear)
            : null,
          brochureUrl: projectPayload.brochureUrl || null,
          virtualTourUrl: projectPayload.virtualTourUrl || null,
          latitude: projectPayload.latitude
            ? parseFloat(projectPayload.latitude)
            : null,
          longitude: projectPayload.longitude
            ? parseFloat(projectPayload.longitude)
            : null,
        },
      });

      console.log(`Project created successfully with ID: ${project.id}`);

      // PROCESS PROJECT IMAGES (Optional)
      if (projectImages && projectImages.length > 0) {
        console.log(`Processing ${projectImages.length} project images...`);

        const projectImageData = projectImages.map((file, index) => ({
          imageUrl: `/uploads/projects/${path.basename(file.filename)}`,
          caption: imageCaptions?.[index] || null,
          isFeatured: index === 0, // First image as featured
          projectId: project.id,
        }));

        await tx.projectImage.createMany({
          data: projectImageData,
        });

        console.log(`Created ${projectImageData.length} project images`);
      } else {
        console.log(
          "No project images provided - project created without images"
        );
      }

      // PROCESS GALLERY MEDIA (Optional)
      if (galleryMedia && galleryMedia.length > 0) {
        console.log(`Processing ${galleryMedia.length} gallery items...`);

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

        console.log(`Created ${galleryData.length} gallery items`);
      } else {
        console.log(
          "No gallery media provided - project created without gallery"
        );
      }

      // PROCESS ADDITIONAL GALLERY ITEMS FROM JSON (Optional)
      if (galleryItems && galleryItems.length > 0) {
        console.log(
          `Processing ${galleryItems.length} additional gallery items...`
        );

        const additionalGalleryData = galleryItems.map((item: any) => ({
          ...item,
          projectId: project.id,
        }));

        await tx.gallery.createMany({
          data: additionalGalleryData,
        });

        console.log(
          `Created ${additionalGalleryData.length} additional gallery items`
        );
      }

      // Return the complete project with relations
      const completeProject = await tx.project.findUnique({
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

      console.log("=== SERVICE COMPLETED SUCCESSFULLY ===");
      return completeProject;
    });

    return result;
  } catch (error) {
    console.error("Error in createProjectWithFilesService:", error);

    // Clean up uploaded files if project creation failed
    if (projectImages && projectImages.length > 0) {
      projectImages.forEach((file) => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`Cleaned up project image: ${file.path}`);
          }
        } catch (cleanupError) {
          console.error("Error cleaning up project image:", cleanupError);
        }
      });
    }

    if (galleryMedia && galleryMedia.length > 0) {
      galleryMedia.forEach((file) => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`Cleaned up gallery media: ${file.path}`);
          }
        } catch (cleanupError) {
          console.error("Error cleaning up gallery media:", cleanupError);
        }
      });
    }

    throw error;
  }
};
export const updateProjectWithFilesService = async (
  projectId: number,
  projectData: any,
  projectImages: Express.Multer.File[] = [],
  galleryMedia: Express.Multer.File[] = []
): Promise<any> => {
  console.log("=== UPDATE SERVICE ===");
  console.log("Project ID:", projectId);
  console.log("Raw project data:", projectData);
  console.log("New project images:", projectImages.length);
  console.log("New gallery media:", galleryMedia.length);

  // Extract fields
  const {
    imageCaptions = [],
    galleryTitles = [],
    galleryCategories = [],
    galleryItems = [],
    removeProfileImage = false,
    ...projectPayload
  } = projectData;

  console.log("Cleaned project payload:", projectPayload);
  console.log("removeProfileImage:", removeProfileImage);
  console.log("amenities:", projectPayload.amenities);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Check if project exists
      const existingProject = await tx.project.findUnique({
        where: { id: projectId },
        include: {
          images: true,
          galleryItems: true,
        },
      });

      if (!existingProject) {
        throw new Error("Project not found");
      }

      console.log("Existing project name:", existingProject.name);
      console.log("Existing project amenities:", existingProject.amenities);

      // Prepare update data
      const updateData: any = {};

      // Debug each field
      Object.keys(projectPayload).forEach((key) => {
        console.log(`Field ${key}:`, {
          incoming: projectPayload[key],
          existing: existingProject[key],
          type: typeof projectPayload[key],
        });
      });

      // Only include fields that are provided
      if (projectPayload.name !== undefined) {
        updateData.name = projectPayload.name;
        console.log(
          `Updating name: "${existingProject.name}" → "${projectPayload.name}"`
        );
      }

      if (projectPayload.location !== undefined) {
        updateData.location = projectPayload.location;
        console.log(
          `Updating location: "${existingProject.location}" → "${projectPayload.location}"`
        );
      }

      if (projectPayload.priceRange !== undefined) {
        updateData.priceRange = projectPayload.priceRange;
        console.log(
          `Updating priceRange: "${existingProject.priceRange}" → "${projectPayload.priceRange}"`
        );
      }

      if (projectPayload.status !== undefined) {
        updateData.status = projectPayload.status; // Use as-is, don't convert to uppercase
        console.log(
          `Updating status: "${existingProject.status}" → "${projectPayload.status}"`
        );
      }

      if (projectPayload.description !== undefined) {
        updateData.description = projectPayload.description;
        console.log(
          `Updating description: "${existingProject.description}" → "${projectPayload.description}"`
        );
      }

      if (projectPayload.projectType !== undefined) {
        updateData.projectType = projectPayload.projectType;
        console.log(
          `Updating projectType: "${existingProject.projectType}" → "${projectPayload.projectType}"`
        );
      }

      // Handle numeric fields more safely
      if (projectPayload.sizeSqft !== undefined) {
        updateData.sizeSqft = projectPayload.sizeSqft
          ? parseInt(projectPayload.sizeSqft)
          : null;
        console.log(
          `Updating sizeSqft: ${existingProject.sizeSqft} → ${updateData.sizeSqft}`
        );
      }

      if (projectPayload.progressPercentage !== undefined) {
        updateData.progressPercentage = projectPayload.progressPercentage
          ? parseInt(projectPayload.progressPercentage)
          : 0;
        console.log(
          `Updating progressPercentage: ${existingProject.progressPercentage} → ${updateData.progressPercentage}`
        );
      }

      // Handle amenities - ensure it's always an array
      if (projectPayload.amenities !== undefined) {
        updateData.amenities = Array.isArray(projectPayload.amenities)
          ? projectPayload.amenities
          : [];
        console.log(
          `Updating amenities:`,
          existingProject.amenities,
          "→",
          updateData.amenities
        );
      }

      // Handle other fields...
      if (projectPayload.mapUrl !== undefined)
        updateData.mapUrl = projectPayload.mapUrl;
      if (projectPayload.landArea !== undefined)
        updateData.landArea = projectPayload.landArea;
      if (projectPayload.completionYear !== undefined)
        updateData.completionYear = projectPayload.completionYear
          ? parseInt(projectPayload.completionYear)
          : null;
      if (projectPayload.brochureUrl !== undefined)
        updateData.brochureUrl = projectPayload.brochureUrl;
      if (projectPayload.virtualTourUrl !== undefined)
        updateData.virtualTourUrl = projectPayload.virtualTourUrl;
      if (projectPayload.latitude !== undefined)
        updateData.latitude = projectPayload.latitude
          ? parseFloat(projectPayload.latitude)
          : null;
      if (projectPayload.longitude !== undefined)
        updateData.longitude = projectPayload.longitude
          ? parseFloat(projectPayload.longitude)
          : null;

      console.log("Final update data to Prisma:", updateData);

      // Update the project
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: updateData,
      });

      console.log("Prisma update result:", updatedProject);

      // HANDLE PROJECT IMAGES UPDATE - ALWAYS REPLACE WHEN NEW IMAGES ARE UPLOADED
      if (projectImages && projectImages.length > 0) {
        console.log(
          `Processing ${projectImages.length} new project images, replacing existing ones...`
        );

        // Delete existing images and their files
        if (existingProject.images.length > 0) {
          console.log(
            `Deleting ${existingProject.images.length} existing project images...`
          );

          for (const image of existingProject.images) {
            await deleteImageFile(image.imageUrl);
            console.log(`Deleted old image file: ${image.imageUrl}`);
          }

          await tx.projectImage.deleteMany({
            where: { projectId: projectId },
          });
          console.log(
            `Deleted ${existingProject.images.length} existing project images from database`
          );
        }

        // Add new project images
        const projectImageData = projectImages.map((file, index) => ({
          imageUrl: `/uploads/projects/${path.basename(file.filename)}`,
          caption: imageCaptions?.[index] || null,
          isFeatured: index === 0,
          projectId: projectId,
        }));

        await tx.projectImage.createMany({
          data: projectImageData,
        });

        console.log(`Added ${projectImageData.length} new project images`);
      } else if (removeProfileImage && existingProject.images.length > 0) {
        // Remove all images if removeProfileImage is true but no new images
        console.log("Removing all project images as requested...");

        for (const image of existingProject.images) {
          await deleteImageFile(image.imageUrl);
          console.log(`Deleted image file: ${image.imageUrl}`);
        }

        await tx.projectImage.deleteMany({
          where: { projectId: projectId },
        });

        console.log("Removed all project images");
      } else {
        console.log("No image changes requested");
      }

      // HANDLE GALLERY MEDIA UPDATE
      if (galleryMedia && galleryMedia.length > 0) {
        console.log(`Processing ${galleryMedia.length} new gallery items...`);

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
            projectId: projectId,
          };
        });

        await tx.gallery.createMany({
          data: galleryData,
        });

        console.log(`Added ${galleryData.length} new gallery items`);
      }

      // PROCESS ADDITIONAL GALLERY ITEMS FROM JSON
      if (galleryItems && galleryItems.length > 0) {
        console.log(
          `Processing ${galleryItems.length} additional gallery items...`
        );

        const additionalGalleryData = galleryItems.map((item: any) => ({
          ...item,
          projectId: projectId,
        }));

        await tx.gallery.createMany({
          data: additionalGalleryData,
        });

        console.log(
          `Added ${additionalGalleryData.length} additional gallery items`
        );
      }

      // Return the complete updated project with relations
      const completeProject = await tx.project.findUnique({
        where: { id: projectId },
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

      console.log("Project update completed successfully");
      console.log("Final project amenities:", completeProject.amenities);
      return completeProject;
    });

    return result;
  } catch (error) {
    console.error("Error in updateProjectWithFilesService:", error);

    // Clean up uploaded files if update failed
    if (projectImages && projectImages.length > 0) {
      projectImages.forEach((file) => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`Cleaned up project image: ${file.path}`);
          }
        } catch (cleanupError) {
          console.error("Error cleaning up project image:", cleanupError);
        }
      });
    }

    if (galleryMedia && galleryMedia.length > 0) {
      galleryMedia.forEach((file) => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`Cleaned up gallery media: ${file.path}`);
          }
        } catch (cleanupError) {
          console.error("Error cleaning up gallery media:", cleanupError);
        }
      });
    }

    throw error;
  }
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
  try {
    console.log("=== ADD GALLERY ITEMS SERVICE ===");
    console.log("Project ID:", projectId);
    console.log("Files count:", files.length);
    console.log("Gallery data:", galleryData);

    // Validate files
    if (!files || files.length === 0) {
      throw new APIError(400, "No files provided for gallery items");
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      // Clean up uploaded files if project doesn't exist
      files.forEach((file) => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`Cleaned up file: ${file.path}`);
          }
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      });
      throw new APIError(404, "Project not found");
    }

    const galleryItemsData = files.map((file, index) => {
      const isImage = file.mimetype.startsWith("image/");
      const isVideo = file.mimetype.startsWith("video/");

      // Validate file type
      if (!isImage && !isVideo) {
        throw new APIError(
          400,
          `File ${file.originalname} is not a valid image or video`
        );
      }

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

    console.log(`Successfully added ${result.count} gallery items`);

    return {
      success: true,
      count: result.count,
      projectId,
      projectName: project.name,
      message: `${result.count} gallery items added to project "${project.name}"`,
    };
  } catch (error) {
    console.error("Error in addGalleryItemsWithFilesService:", error);

    // Clean up uploaded files on error
    if (files && files.length > 0) {
      files.forEach((file) => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`Cleaned up file on error: ${file.path}`);
          }
        } catch (cleanupError) {
          console.error("Error cleaning up file on error:", cleanupError);
        }
      });
    }

    throw error; // Re-throw for controller to handle
  }
};
export const getProjectsForDropdownService = async (): Promise<
  Array<{ value: number; label: string }>
> => {
  try {
    console.log("=== GET PROJECTS FOR DROPDOWN SERVICE ===");

    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
      },
      where: {
        // Optional: Add any filters if needed
        // status: 'ACTIVE'
      },
      orderBy: {
        name: "asc", // Alphabetical order
      },
    });

    console.log(`Found ${projects.length} projects for dropdown`);

    // Transform to value-label format for frontend dropdown
    const dropdownProjects = projects.map((project) => ({
      value: project.id,
      label: project.name,
    }));

    console.log("Transformed projects for dropdown:", dropdownProjects);

    return dropdownProjects;
  } catch (error) {
    console.error("Error in getProjectsForDropdownService:", error);
    throw error;
  }
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

const deleteImageFile = async (imageUrl: string): Promise<void> => {
  try {
    if (!imageUrl) {
      console.log("No image URL provided for deletion");
      return;
    }

    // Handle both formats: /uploads/projects/filename and uploads/projects/filename
    let filePath = imageUrl;
    if (imageUrl.startsWith("/")) {
      filePath = imageUrl.substring(1); // Remove leading slash
    }

    console.log(`Attempting to delete file: ${filePath}`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Successfully deleted file: ${filePath}`);
    } else {
      // Try alternative path format
      const altPath = path.join("uploads", "projects", path.basename(imageUrl));
      if (fs.existsSync(altPath)) {
        fs.unlinkSync(altPath);
        console.log(`Successfully deleted file (alt path): ${altPath}`);
      } else {
        console.log(`File not found, skipping: ${filePath}`);
      }
    }
  } catch (error) {
    console.error("Error deleting image file:", error);
  }
};
