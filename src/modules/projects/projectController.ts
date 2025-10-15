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
} from "./projectService";
import { reponseFormat } from "../../shared/responseFormat";
// Create new project with direct file uploads
export const createProjectWithFiles = catchAsync(
  async (req: Request, res: Response) => {
    const projectImages = (req.files as any)?.projectImages || [];
    const galleryMedia = (req.files as any)?.galleryMedia || [];

    // Parse form data safely
    const projectData = {
      ...req.body,
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

    const result = await createProjectWithFilesService(
      projectData,
      projectImages,
      galleryMedia
    );

    reponseFormat(res, {
      success: true,
      statusCode: 201,
      message: "Project created with files successfully",
      data: result,
    });
  }
);

// Create project without files (only data)
export const createProject = catchAsync(async (req: Request, res: Response) => {
  const result = await createProjectService(req.body);

  reponseFormat(res, {
    success: true,
    statusCode: 201,
    message: "Project created successfully",
    data: result,
  });
});

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
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    const galleryData = {
      titles: req.body.titles ? JSON.parse(req.body.titles) : [],
      categories: req.body.categories ? JSON.parse(req.body.categories) : [],
    };

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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const filters = {
      search: req.query.search as string,
      status: req.query.status as "ongoing" | "completed",
      projectType: req.query.projectType as string,
    };

    const result = await getAllProjectsService(filters, page, limit);

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
