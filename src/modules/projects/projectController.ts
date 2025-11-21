// controllers/projectController.ts
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import {
  getAllProjectsService,
  getProjectByIdService,
  updateProjectService,
  deleteProjectService,
  addProjectImagesService,
  setFeaturedImageService,
  deleteProjectImageService,
  addGalleryItemsService,
  deleteGalleryItemService,
  getProjectStatsService,
  addGalleryItemsWithFilesService,
  addProjectImagesWithFilesService,
  createProjectWithFilesService,
  createProjectService,
  updateProjectWithFilesService,
  getProjectsForDropdownService,
} from "./projectService";
import { reponseFormat } from "../../shared/responseFormat";
export const createProjectWithFiles = catchAsync(
  async (req: Request, res: Response) => {
    try {
      const projectImages = (req.files as any)?.projectImages || [];
      const galleryMedia = (req.files as any)?.galleryMedia || [];

      console.log("=== REQUEST DEBUG ===");
      console.log("Body keys:", Object.keys(req.body));
      console.log("projectData from body:", req.body.projectData);
      console.log("Project images:", projectImages.length);
      console.log("Gallery media:", galleryMedia.length);

      // Parse form data safely - FIXED
      let projectData;
      try {
        // First parse the projectData string, then merge with other fields
        const parsedProjectData = req.body.projectData
          ? JSON.parse(req.body.projectData)
          : {};

        projectData = {
          ...parsedProjectData, // This contains name, status, etc.
          amenities: req.body.amenities ? JSON.parse(req.body.amenities) : [],
          imageCaptions: req.body.imageCaptions
            ? JSON.parse(req.body.imageCaptions)
            : [],
          galleryTitles: req.body.galleryTitles
            ? JSON.parse(req.body.galleryTitles)
            : [],
          galleryCategories: req.body.galleryCategories
            ? JSON.parse(req.body.galleryCategories)
            : [],
          galleryItems: req.body.galleryItems
            ? JSON.parse(req.body.galleryItems)
            : [],
        };
      } catch (parseError) {
        console.error("Error parsing form data:", parseError);
        return reponseFormat(res, {
          success: false,
          statusCode: 400,
          message: "Invalid form data format",
        });
      }

      console.log("=== PARSED PROJECT DATA ===");
      console.log("Project name:", projectData.name);
      console.log("Project status:", projectData.status);
      console.log("Project type:", projectData.projectType);
      console.log("Full project data:", projectData);

      // Validate required fields in controller before calling service
      if (
        !projectData.name ||
        !projectData.status ||
        !projectData.projectType
      ) {
        console.error("Missing required fields:", {
          name: projectData.name,
          status: projectData.status,
          projectType: projectData.projectType,
        });
        return reponseFormat(res, {
          success: false,
          statusCode: 400,
          message: "Missing required fields: name, status, or projectType",
        });
      }

      console.log("Calling createProjectWithFilesService...");

      const result = await createProjectWithFilesService(
        projectData, // Now this is the parsed object, not the string
        projectImages,
        galleryMedia
      );

      console.log("Project creation completed successfully");

      reponseFormat(res, {
        success: true,
        statusCode: 201,
        message: "Project created successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error in createProjectWithFiles:", error);

      reponseFormat(res, {
        success: false,
        statusCode: 500,
        message: error.message || "Failed to create project",
      });
    }
  }
);
export const updateProjectWithFiles = catchAsync(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const projectImages = (req.files as any)?.projectImages || [];
      const galleryMedia = (req.files as any)?.galleryMedia || [];

      console.log("=== UPDATE PROJECT CONTROLLER ===");
      console.log("Project ID:", id);
      console.log("Raw request body:", req.body);

      // Parse the main project data from the projectData field
      let mainProjectData = {};
      try {
        if (req.body.projectData) {
          mainProjectData = JSON.parse(req.body.projectData);
          console.log("Parsed projectData field:", mainProjectData);
        }
      } catch (parseError) {
        console.error("Error parsing projectData field:", parseError);
        return reponseFormat(res, {
          success: false,
          statusCode: 400,
          message: "Invalid projectData format",
        });
      }

      // Combine all data - PRESERVE all fields from mainProjectData
      let projectData;
      try {
        projectData = {
          ...mainProjectData, // Primary source for all project data
          // Use mainProjectData fields first, fallback to req.body only if not present
          amenities:
            mainProjectData.amenities ||
            (req.body.amenities ? JSON.parse(req.body.amenities) : []),
          imageCaptions:
            mainProjectData.imageCaptions ||
            (req.body.imageCaptions ? JSON.parse(req.body.imageCaptions) : []),
          galleryTitles:
            mainProjectData.galleryTitles ||
            (req.body.galleryTitles ? JSON.parse(req.body.galleryTitles) : []),
          galleryCategories:
            mainProjectData.galleryCategories ||
            (req.body.galleryCategories
              ? JSON.parse(req.body.galleryCategories)
              : []),
          galleryItems:
            mainProjectData.galleryItems ||
            (req.body.galleryItems ? JSON.parse(req.body.galleryItems) : []),
        };

        // Debug: Check if amenities are preserved
        console.log(
          "Amenities from mainProjectData:",
          mainProjectData.amenities
        );
        console.log("Final amenities in projectData:", projectData.amenities);
        console.log(
          "removeProfileImage in projectData:",
          projectData.removeProfileImage
        );
      } catch (parseError) {
        console.error("Error parsing form data:", parseError);
        return reponseFormat(res, {
          success: false,
          statusCode: 400,
          message: "Invalid form data format",
        });
      }

      console.log("Final combined project data:", projectData);
      console.log("New project images:", projectImages.length);
      console.log("New gallery media:", galleryMedia.length);

      const result = await updateProjectWithFilesService(
        parseInt(id),
        projectData,
        projectImages,
        galleryMedia
      );

      console.log("Final response data:", result);

      reponseFormat(res, {
        success: true,
        statusCode: 200,
        message: "Project updated successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error in updateProjectWithFiles:", error);

      reponseFormat(res, {
        success: false,
        statusCode: 500,
        message: error.message || "Failed to update project",
      });
    }
  }
);

// Add images to existing project with file upload
export const addProjectImages = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    let captions: string[] = [];
    if (req.body.captions) {
      captions =
        typeof req.body.captions === "string"
          ? JSON.parse(req.body.captions)
          : req.body.captions;
    }

    const result = await addProjectImagesWithFilesService(
      parseInt(id),
      files,
      captions
    );

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: result.message,
      data: result,
    });
  }
);

// Add gallery items with file upload
export const addGalleryItems = catchAsync(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const files = (req.files as Express.Multer.File[]) || [];

      console.log("=== ADD GALLERY ITEMS CONTROLLER ===");
      console.log("Project ID:", id);
      console.log("Number of files:", files.length);

      // Parse gallery data safely
      let galleryData;
      try {
        galleryData = {
          titles: req.body.titles ? JSON.parse(req.body.titles) : [],
          categories: req.body.categories
            ? JSON.parse(req.body.categories)
            : [],
        };
      } catch (parseError) {
        console.error("Error parsing gallery data:", parseError);
        return reponseFormat(res, {
          success: false,
          statusCode: 400,
          message: "Invalid gallery data format",
        });
      }

      const result = await addGalleryItemsWithFilesService(
        parseInt(id),
        files,
        galleryData
      );

      reponseFormat(res, {
        success: true,
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (error) {
      console.error("Error in addGalleryItems:", error);

      reponseFormat(res, {
        success: false,
        statusCode: error.statusCode || 500,
        message: error.message || "Failed to add gallery items",
      });
    }
  }
);
export const getProjectsForDropdown = catchAsync(
  async (req: Request, res: Response) => {
    try {
      console.log("=== GET PROJECTS FOR DROPDOWN ===");

      const projects = await getProjectsForDropdownService();

      reponseFormat(res, {
        success: true,
        statusCode: 200,
        message: "Projects fetched successfully for dropdown",
        data: projects,
      });
    } catch (error) {
      console.error("Error in getProjectsForDropdown:", error);

      reponseFormat(res, {
        success: false,
        statusCode: 500,
        message: error.message || "Failed to fetch projects for dropdown",
      });
    }
  }
);
// Add gallery items without files (only URLs)
export const addGalleryItemsData = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { galleryItems } = req.body;

    const result = await addGalleryItemsService(parseInt(id), galleryItems);

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: result.message,
      data: result,
    });
  }
);

// Get all projects
export const getAllProjects = catchAsync(
  async (req: Request, res: Response) => {
    console.log("hit");

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const filters = {
      search: req.query.search as string,
      status: req.query.status as "ongoing" | "completed",
      projectType: req.query.projectType as string,
    };

    const result = await getAllProjectsService(filters, page, limit);
    console.log({ result });
    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Projects retrieved successfully",
      data: result,
    });
  }
);

// Get single project
export const getProjectById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await getProjectByIdService(parseInt(id));

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Project retrieved successfully",
      data: result,
    });
  }
);

// Update project
export const updateProject = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await updateProjectService(parseInt(id), req.body);

  reponseFormat(res, {
    success: true,
    statusCode: 200,
    message: "Project updated successfully",
    data: result,
  });
});

// Delete project
export const deleteProject = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await deleteProjectService(parseInt(id));

  reponseFormat(res, {
    success: true,
    statusCode: 200,
    message: "Project deleted successfully",
    data: result,
  });
});

// Set featured image
export const setFeaturedImage = catchAsync(
  async (req: Request, res: Response) => {
    const { projectId, imageId } = req.params;
    const result = await setFeaturedImageService(
      parseInt(projectId),
      parseInt(imageId)
    );

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Featured image set successfully",
      data: result,
    });
  }
);

// Delete project image
export const deleteProjectImage = catchAsync(
  async (req: Request, res: Response) => {
    const { imageId } = req.params;
    const result = await deleteProjectImageService(parseInt(imageId));

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Image deleted successfully",
      data: result,
    });
  }
);

// Delete gallery item
export const deleteGalleryItem = catchAsync(
  async (req: Request, res: Response) => {
    const { galleryItemId } = req.params;
    const result = await deleteGalleryItemService(parseInt(galleryItemId));

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Gallery item deleted successfully",
      data: result,
    });
  }
);

// Get project statistics
export const getProjectStats = catchAsync(
  async (req: Request, res: Response) => {
    const result = await getProjectStatsService();

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Project statistics retrieved successfully",
      data: result,
    });
  }
);
