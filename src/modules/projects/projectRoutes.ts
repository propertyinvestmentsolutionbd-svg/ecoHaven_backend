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
  getAllGalleryImages,
  getLocationsForDropdown,
  getDashboardStats,
} from "./projectController";
import {
  uploadAllMedia,
  uploadGalleryMedia,
  uploadProjectImages,
} from "../../config/multer";
import auth from "../../middlewears/auth";

const router = express.Router();

// Public routes (for frontend)
router.get("/project/galleries", getAllGalleryImages);
router.get("/projects", getAllProjects);
router.get("/stats", getDashboardStats);
router.get("/project/:id", getProjectById);
router.get("/projects/dropdown", getProjectsForDropdown);
router.get("/projects/location/dropdown", getLocationsForDropdown);

// Protected admin routes
// router.post("/createProject", createProject); // JSON only
router.post(
  "/createProject/with-files",
  auth(),
  uploadAllMedia,
  createProjectWithFiles
); // With file uploads
router.put(
  "/project/:id/update/with-files",
  auth(),
  uploadAllMedia,
  updateProjectWithFiles
);

// router.put("/:id", updateProject);
router.delete("/project/:id", auth(), deleteProject);
router.post("/:id/images", auth(), uploadProjectImages, addProjectImages);
router.post(
  "/project/:id/gallery-items",
  auth(),
  uploadGalleryMedia,
  addGalleryItems
);
router.post("/:id/gallery-items-data", addGalleryItemsData);
router.patch(
  "/:projectId/featured-image/:imageId",

  setFeaturedImage
);
router.delete("/images/:imageId", deleteProjectImage);
router.delete("/gallery-items/:galleryItemId", auth(), deleteGalleryItem);

export const projectRoutes = router;
