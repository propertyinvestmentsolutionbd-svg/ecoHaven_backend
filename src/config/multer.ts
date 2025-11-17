// config/multer.ts
import multer from "multer";
import path from "path";
import { Request } from "express";

// Configure storage for project images
const projectStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, "uploads/projects/");
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, "project-" + uniqueSuffix + fileExtension);
  },
});

// Configure storage for gallery items
const galleryStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, "uploads/gallery/");
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, "gallery-" + uniqueSuffix + fileExtension);
  },
});

// File filter for images only
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

// File filter for images and videos
const mediaFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed!"));
  }
};

// Configure multer instances
export const projectImageUpload = multer({
  storage: projectStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export const galleryMediaUpload = multer({
  storage: galleryStorage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for videos
  },
});

// Multiple file upload configurations
export const uploadProjectImages = projectImageUpload.array(
  "projectImages",
  10
); // Max 10 project images
export const uploadGalleryMedia = galleryMediaUpload.array("galleryMedia", 10); // Max 10 gallery items
export const uploadAllMedia = galleryMediaUpload.fields([
  { name: "projectImages", maxCount: 10 },
  { name: "galleryMedia", maxCount: 10 },
]);
// config/multer.ts - Add this to your existing file

// Configure storage for profile images
const profileStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, "uploads/profiles/");
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, "profile-" + uniqueSuffix + fileExtension);
  },
});

// Add to your existing exports
export const uploadProfileImage = multer({
  storage: profileStorage,
  fileFilter: imageFileFilter, // Reuse the existing image filter
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for profile images
  },
}).single("profileImg"); // Single file with field name "profileImg"
// Create a debug version of the upload middleware
export const debugUploadProfileImage = (req: any, res: any, next: any) => {
  console.log("=== BEFORE MULTER ===");
  console.log("Request headers:", req.headers);
  console.log("Request body keys (before multer):", req.body, { res });

  multer({
    storage: profileStorage,
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 2 * 1024 * 1024,
    },
  }).single("profileImg")(req, res, (err) => {
    if (err) {
      console.log("Multer error:", err);
      return res.status(400).json({
        success: false,
        message: `File upload error: ${err.message}`,
      });
    }

    console.log("=== AFTER MULTER ===");
    console.log("Uploaded file:", req.file);
    console.log("Request body keys (after multer):", Object.keys(req.body));
    console.log("userData in body:", req.body.userData);

    next();
  });
};
