// routes/projectRoutes.ts
import express from "express";
import {
  createProject,
  createProjectWithFiles,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectImages,
  addGalleryItems,
  addGalleryItemsData,
  setFeaturedImage,
  deleteProjectImage,
  deleteGalleryItem,
  getProjectStats,
  getAllProjects,
  updateProjectWithFiles,
  getProjectsForDropdown,
} from "./projectController";
import {
  uploadAllMedia,
  uploadGalleryMedia,
  uploadProjectImages,
} from "../../config/multer";

const router = express.Router();

// Public routes (for frontend)
router.get("/projects", getAllProjects);
router.get("/stats", getProjectStats);
router.get("/:id", getProjectById);
router.get("/projects/dropdown", getProjectsForDropdown);

// Protected admin routes
// router.post("/createProject", createProject); // JSON only
router.post(
  "/createProject/with-files",
  uploadAllMedia,
  createProjectWithFiles
); // With file uploads
router.put(
  "/project/:id/update/with-files",
  uploadAllMedia,
  updateProjectWithFiles
);

// router.put("/:id", updateProject);
router.delete("/project/:id", deleteProject);
router.post(
  "/:id/images",

  uploadProjectImages,
  addProjectImages
);
router.post(
  "/project/:id/gallery-items",

  uploadGalleryMedia,
  addGalleryItems
);
router.post("/:id/gallery-items-data", addGalleryItemsData);
router.patch(
  "/:projectId/featured-image/:imageId",

  setFeaturedImage
);
router.delete("/images/:imageId", deleteProjectImage);
router.delete(
  "/gallery-items/:galleryItemId",

  deleteGalleryItem
);

export const projectRoutes = router;
