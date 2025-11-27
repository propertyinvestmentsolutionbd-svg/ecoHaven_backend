import { Request, RequestHandler, Response } from "express";
import {
  createUserService,
  loginUserService,
  getRefreshTokenService,
  verify2FAService,
  updateUserRoleService,
  createUserWithProfileImageService,
  updateUserProfileImageService,
  getUserByIdService,
  updateUserWithProfileImageService,
  deleteUserService,
  toggleUserStatusService,
  changePasswordService,
  getAllUsersService,
  verifyEmailService,
  forgotPasswordService,
  deleteImageFile,
  getEmployeesForDropdownService,
  getUsersForDropdownService,
  resend2FACodeService,
} from "./authService";
import catchAsync from "../../shared/catchAsync";
import { reponseAuthFormat, reponseFormat } from "../../shared/responseFormat";
import {
  ILoginUserResponse,
  IRefreshTokenResponse,
} from "../../interfaces/login";
import { User } from "../../../generated/prisma";
import APIError from "../../errorHelpers/APIError";

export const getEmployeesForDropdown = catchAsync(
  async (req: Request, res: Response) => {
    try {
      console.log("=== GET EMPLOYEES FOR DROPDOWN ===");

      const employees = await getEmployeesForDropdownService();

      reponseFormat(res, {
        success: true,
        statusCode: 200,
        message: "Employees fetched successfully for dropdown",
        data: employees,
      });
    } catch (error) {
      console.error("Error in getEmployeesForDropdown:", error);

      reponseFormat(res, {
        success: false,
        statusCode: 500,
        message: error.message || "Failed to fetch employees for dropdown",
      });
    }
  }
);
export const createUser: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    let userData;
    let profileImage;

    console.log("=== CREATE USER CONTROLLER ===");
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    // Check if request has files (multipart/form-data)
    if (req.file) {
      // Multer has already parsed all fields into req.body
      // Use the individual fields directly instead of parsing userData
      userData = {
        name: req.body.name,
        email: req.body.email,
        contactNo: req.body.contactNo,
        role: req.body.role || "employee",
        designation: req.body.designation || "",
        address: req.body.address || "",
        linkedinUrl: req.body.linkedinUrl || "",
        profileDescription: req.body.profileDescription || "",
        agentDescription: req.body.agentDescription || "",
        isFeatured:
          req.body.isFeatured === "true" || req.body.isFeatured === true,
        isAgent: req.body.isAgent === "true" || req.body.isAgent === true,
        isActive: true,
        twofaEnabled: true,
        password: req.body.password,
      };

      profileImage = req.file;

      console.log("Constructed userData from form fields:", userData);
    } else {
      // Request is JSON only
      userData = req.body;
      profileImage = undefined;
    }

    console.log("Final userData:", userData);
    console.log("Final profileImage:", profileImage);

    // Validate that userData exists and has password
    if (!userData || !userData.password) {
      console.log("Missing userData or password");
      return res.status(400).json({
        success: false,
        message: "User data and password are required",
      });
    }

    try {
      const result = await createUserService(userData, profileImage);

      let dataWithoutPass;
      if (result) {
        const { password, ...rest } = result;
        dataWithoutPass = rest;
      }

      reponseFormat(res, {
        success: true,
        statusCode: 200,
        message: profileImage
          ? "User created with profile image successfully!"
          : "User created successfully!",
        data: dataWithoutPass,
      });
    } catch (error) {
      console.error("Error in createUserService:", error);
      throw error;
    }
  }
);
// login
export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { ...userData } = req.body;
  console.log({ userData });
  const result = await loginUserService(userData);

  // If 2FA is required, send different response
  if (result.twoFa) {
    return reponseAuthFormat(res, {
      success: true,
      statusCode: 200,
      message: result.message ?? null,
      twoFa: true,
      tempToken: result.tempToken,
      token: "", // No token until 2FA verification
    });
  }

  // Normal login flow
  const { refreshToken, ...others } = result;

  const cookieOptions = {
    secure: true,
    httpOnly: true,
  };

  res.cookie("refreshToken", refreshToken, cookieOptions);

  reponseAuthFormat(res, {
    success: true,
    statusCode: 200,
    message: "User signin successfully!",
    token: others.token,
    twoFa: false,
    menus: result?.menus || [],
  });
});
export const verify2FA = catchAsync(async (req: Request, res: Response) => {
  const { code, tempToken } = req.body;

  const result = await verify2FAService({ code, tempToken });
  const { refreshToken, ...others } = result;

  const cookieOptions = {
    secure: true,
    httpOnly: true,
  };

  res.cookie("refreshToken", refreshToken, cookieOptions);
  console.log({ others });
  reponseAuthFormat(res, {
    success: true,
    statusCode: 200,
    message: "2FA verification successful!",
    token: others.token,
    // user: others.user,
    twoFa: false,
    menus: others?.menus || [],
  });
});

export const getRefreshToken = catchAsync(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    const result = await getRefreshTokenService(refreshToken);

    // set refresh token into cookie
    const cookieOptions = {
      secure: true,
      httpOnly: true,
    };

    res.cookie("refreshToken", refreshToken, cookieOptions);

    reponseFormat<IRefreshTokenResponse>(res, {
      statusCode: 200,
      success: true,
      message: "New access token generated successfully !",
      data: result,
    });
  }
);
// Update user profile image
export const updateProfileImage: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const profileImage = req.file;

    if (!profileImage) {
      return reponseFormat(res, {
        success: false,
        statusCode: 400,
        message: "Profile image is required",
      });
    }

    const result = await updateUserProfileImageService(userId, profileImage);

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Profile image updated successfully!",
      data: result,
    });
  }
);
export const updateUserRole = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { role } = req.body;

    const result = await updateUserRoleService(userId, role);

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "User role updated successfully",
      data: result,
    });
  }
);
// Get user by ID
export const getUserById: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await getUserByIdService(id);

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "User retrieved successfully!",
      data: result,
    });
  }
);
// Update user with or without profile image
// Update user with or without profile image
export const updateUserWithImage: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    let userData;
    let profileImage;

    try {
      // Check if request has file upload (multipart/form-data)
      if (req.file) {
        // Extract userData from form data - it's in req.body.userData
        console.log("Raw req.body:", req.body);
        userData = req.body.userData; // This is the JSON string
        profileImage = req.file;
      } else {
        // Request is JSON only - userData is the entire body
        userData = req.body;
        profileImage = undefined;
      }

      // Validate user ID
      if (!id) {
        return reponseFormat(res, {
          success: false,
          statusCode: 400,
          message: "User ID is required",
        });
      }

      console.log("Sending to service - userData:", userData);
      console.log("Sending to service - profileImage:", profileImage);

      // Send the extracted userData directly, not nested
      const result = await updateUserWithProfileImageService(id, {
        userData: userData, // This should be the JSON string directly
        profileImage,
      });

      reponseFormat(res, {
        success: true,
        statusCode: 200,
        message: profileImage
          ? "User updated with profile image successfully!"
          : "User updated successfully!",
        data: result,
      });
    } catch (error) {
      console.error("Error in updateUserWithImage:", error);

      // Clean up uploaded file if error occurred
      if (profileImage) {
        deleteImageFile(profileImage.path);
      }

      if (error instanceof APIError) {
        return reponseFormat(res, {
          success: false,
          statusCode: error.statusCode,
          message: error.message,
        });
      }

      reponseFormat(res, {
        success: false,
        statusCode: 500,
        message: "Internal server error",
      });
    }
  }
);
// Change password
export const changePassword: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const passwordData = req.body;

    const result = await changePasswordService(id, passwordData);

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: result.message,
      data: {
        id: result.id,
        name: result.name,
        email: result.email,
        updatedAt: result.updatedAt,
      },
    });
  }
);

// Toggle user status (activate/deactivate)
export const toggleUserStatus: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await toggleUserStatusService(id);

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: result.message,
      data: {
        id: result.id,
        name: result.name,
        email: result.email,
        isActive: result.isActive,
        updatedAt: result.updatedAt,
      },
    });
  }
);

// Delete user
export const deleteUser: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await deleteUserService(id);

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: result.message,
      data: {
        id: result.id,
        name: result.name,
        email: result.email,
      },
    });
  }
);

// Get all users with pagination
export const getAllUsers: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const role = req.query.role as string;
    const isActive = req.query.isActive
      ? req.query.isActive === "true"
      : undefined;

    const result = await getAllUsersService({
      page,
      limit,
      search,
      role,
      isActive,
    });

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "Users retrieved successfully!",
      data: result,
    });
  }
);

export const forgotPassword = catchAsync(
  async (req: Request, res: Response) => {
    try {
      console.log("=== FORGOT PASSWORD REQUEST ===");

      const { email, newPassword, confirmPassword } = req.body;

      const result = await forgotPasswordService({
        email,
        newPassword,
        confirmPassword,
      });

      reponseFormat(res, {
        success: true,
        statusCode: 200,
        message: result.message,
        data: null,
      });
    } catch (error) {
      console.error("Error in forgotPassword:", error);

      reponseFormat(res, {
        success: false,
        statusCode: error.statusCode || 500,
        message: error.message || "Failed to reset password",
      });
    }
  }
);
export const resend2FACode = catchAsync(async (req: Request, res: Response) => {
  try {
    console.log("=== RESEND 2FA CODE REQUEST ===");

    const { tempToken } = req.body;

    if (!tempToken) {
      return reponseFormat(res, {
        success: false,
        statusCode: 400,
        message: "Temporary token is required",
      });
    }

    const result = await resend2FACodeService(tempToken);

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: result.message,
    });
  } catch (error) {
    console.error("Error in resend2FACode:", error);

    reponseFormat(res, {
      success: false,
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to resend verification code",
    });
  }
});

// Verify email exists
export const verifyEmail: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const result = await verifyEmailService(email);

    reponseFormat(res, {
      success: result.exists,
      statusCode: result.exists ? 200 : 404,
      message: result.message,
      data: {
        exists: result.exists,
      },
    });
  }
);
export const getUsersForDropdown = catchAsync(
  async (req: Request, res: Response) => {
    try {
      console.log("=== GET USERS FOR DROPDOWN ===");

      const dropdownData = await getUsersForDropdownService();

      reponseFormat(res, {
        success: true,
        statusCode: 200,
        message: "Users dropdown data fetched successfully",
        data: dropdownData,
      });
    } catch (error) {
      console.error("Error in getUsersForDropdown:", error);

      reponseFormat(res, {
        success: false,
        statusCode: 500,
        message: error.message || "Failed to fetch users dropdown data",
      });
    }
  }
);
