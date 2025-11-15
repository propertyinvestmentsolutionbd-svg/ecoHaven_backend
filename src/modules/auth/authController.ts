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
} from "./authService";
import catchAsync from "../../shared/catchAsync";
import { reponseAuthFormat, reponseFormat } from "../../shared/responseFormat";
import {
  ILoginUserResponse,
  IRefreshTokenResponse,
} from "../../interfaces/login";
import { User } from "../../../generated/prisma";

// export const createUser: RequestHandler = catchAsync(
//   async (req: Request, res: Response) => {
//     const { ...userData } = req.body;

//     const result = await createUserService(userData);
//     let dataWithoutPass;
//     if (result) {
//       const { password, ...rest } = result;
//       dataWithoutPass = rest;
//     }
//     // @ts-ignore
//     reponseFormat<Omit<User, "password">>(res, {
//       success: true,
//       statusCode: 200,
//       message: "User created successfully !",
//       data: dataWithoutPass,
//     });
//   }
// );
export const createUser: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    let userData;
    let profileImage;

    // Check if request has files (multipart/form-data)
    if (req.file) {
      // Request has file upload - parse form data
      userData = JSON.parse(req.body.userData || "{}");
      profileImage = req.file;
    } else {
      // Request is JSON only
      userData = req.body;
      profileImage = undefined;
    }

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
// Update user with profile image
export const updateUserWithImage: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userData = JSON.parse(req.body.userData || "{}");
    const profileImage = req.file;

    const result = await updateUserWithProfileImageService(id, {
      userData,
      profileImage,
    });

    reponseFormat(res, {
      success: true,
      statusCode: 200,
      message: "User updated with profile image successfully!",
      data: result,
    });
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

// Forgot password - reset using email
export const forgotPassword: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
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
  }
);

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
