// config/multer.ts
import multer from "multer";
import path from "path";
import { NextFunction, Request } from "express";
import fs from "fs";
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
// Configure storage for project images
const projectStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const dir = "uploads/projects/";
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
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
    const dir = "uploads/gallery/";
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, "gallery-" + uniqueSuffix + fileExtension);
  },
});
const reviewStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const dir = "uploads/reviews/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, "review-" + uniqueSuffix + fileExtension);
  },
});

// Review image upload middleware
export const uploadReviewImage = multer({
  storage: reviewStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).single("reviewImage");
// Create a dynamic storage that routes files based on field name
// const dynamicStorage = multer.diskStorage({
//   destination: (req: Request, file: Express.Multer.File, cb) => {
//     let dir = "uploads/";

//     if (file.fieldname === "projectImages") {
//       dir += "projects/";
//     } else if (file.fieldname === "galleryMedia") {
//       dir += "gallery/";
//     } else if (file.fieldname === "profileImg") {
//       dir += "profiles/";
//     }

//     // Ensure directory exists
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//     }

//     console.log(`Saving ${file.fieldname} to: ${dir}`);
//     cb(null, dir);
//   },
//   filename: (req: Request, file: Express.Multer.File, cb) => {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     const fileExtension = path.extname(file.originalname);

//     let prefix = "file";
//     if (file.fieldname === "projectImages") {
//       prefix = "project";
//     } else if (file.fieldname === "galleryMedia") {
//       prefix = "gallery";
//     } else if (file.fieldname === "profileImg") {
//       prefix = "profile";
//     }

//     const filename = `${prefix}-${uniqueSuffix}${fileExtension}`;
//     console.log(`Generated filename for ${file.fieldname}: ${filename}`);
//     cb(null, filename);
//   },
// });
const dynamicStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    let dir = "uploads/";

    if (file.fieldname === "projectImages") {
      dir += "projects/";
    } else if (file.fieldname === "galleryMedia") {
      dir += "gallery/";
    } else if (file.fieldname === "profileImg") {
      dir += "profiles/";
    } else if (file.fieldname === "blogImage") {
      dir += "blogs/";
    } else if (file.fieldname === "reviewImage") {
      dir += "reviews/"; // Add review images
    }

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    console.log(`Saving ${file.fieldname} to: ${dir}`);
    cb(null, dir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);

    let prefix = "file";
    if (file.fieldname === "projectImages") {
      prefix = "project";
    } else if (file.fieldname === "galleryMedia") {
      prefix = "gallery";
    } else if (file.fieldname === "profileImg") {
      prefix = "profile";
    } else if (file.fieldname === "blogImage") {
      prefix = "blog";
    } else if (file.fieldname === "reviewImage") {
      prefix = "review"; // Add review prefix
    }

    const filename = `${prefix}-${uniqueSuffix}${fileExtension}`;
    console.log(`Generated filename for ${file.fieldname}: ${filename}`);
    cb(null, filename);
  },
});

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

// Configure storage for blog images
const blogStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const dir = "uploads/blogs/";
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, "blog-" + uniqueSuffix + fileExtension);
  },
});

// Blog image upload middleware
export const uploadBlogImage = multer({
  storage: blogStorage,
  fileFilter: imageFileFilter, // Reuse existing image filter
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).single("blogImage");

// Multiple file upload configurations
export const uploadProjectImages = projectImageUpload.array(
  "projectImages",
  10
);
export const uploadGalleryMedia = galleryMediaUpload.array("galleryMedia", 10);
// export const uploadAllMedia = multer({
//   storage: projectStorage, // Use projectStorage for projectImages
// }).fields([
//   { name: "projectImages", maxCount: 10 },
//   { name: "galleryMedia", maxCount: 10 },
// ]);
// config/multer.ts - Add this to your existing file

// Configure storage for profile images

// Custom middleware to handle different storages based on field name
export const uploadAllMedia = multer({
  storage: dynamicStorage,
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    // Use different filters based on field name
    if (file.fieldname === "projectImages") {
      // Project images: images only
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Project images must be image files only!"));
      }
    } else if (file.fieldname === "galleryMedia") {
      // Gallery media: images and videos
      if (
        file.mimetype.startsWith("image/") ||
        file.mimetype.startsWith("video/")
      ) {
        cb(null, true);
      } else {
        cb(new Error("Gallery media must be image or video files!"));
      }
    } else {
      cb(null, true);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for all files
  },
}).fields([
  { name: "projectImages", maxCount: 10 },
  { name: "galleryMedia", maxCount: 10 },
]);

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
