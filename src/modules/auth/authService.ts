import { Secret } from "jsonwebtoken";
import config from "../../config";
import bcrypt from "bcrypt";

import APIError from "../../errorHelpers/APIError";
import {
  ILoginUser,
  ILoginUserResponse,
  IRefreshTokenResponse,
  IUserCreate,
  IVerify2FA,
  IVerify2FAResponse,
} from "../../interfaces/login";
import { createToken, verifyToken } from "../../shared/jwtHelper";
// import { IUser } from "../user/userInterface";
// import { User } from "../user/userModel";
import { Prisma } from "@prisma/client";
import prisma from "../../shared/prisma";
import { User } from "../../../generated/prisma";
import {
  generate2FACode,
  send2FACode,
  save2FACode,
  verify2FACode,
  clear2FACode,
} from "./emailService";
import path from "path";
import fs from "fs";
import { getUserPermissionsService } from "../menu/menuPermissionService";

// creating user
// export const createUserService = async (user: User): Promise<User | null> => {
//   const hashedPassword = await bcrypt.hash(
//     user?.password,
//     Number(config.bycrypt_salt_rounds)
//   );
//   user.password = hashedPassword;

//   const result = await prisma.$transaction(async (tx) => {
//     // Create user
//     const newUser = await tx.user.create({
//       data: user,
//     });

//     // If user is admin, assign all menu permissions
//     if (newUser.role === "admin") {
//       await assignAllMenuPermissionsToUser(tx, newUser.id);
//     }

//     return newUser;
//   });

//   if (!result) {
//     throw new APIError(400, "failed to create User");
//   }
//   return result;
// };
export const createUserService = async (
  userData: IUserCreate,
  profileImage?: Express.Multer.File
): Promise<any> => {
  console.log("=== SERVICE START ===");
  console.log("userData received in service:", userData);
  console.log("userData type:", typeof userData);

  // Validate input more carefully
  if (!userData || typeof userData !== "object") {
    console.log("ERROR: Invalid userData in service:", userData);
    throw new APIError(400, "Valid user data is required");
  }

  if (!userData.password) {
    console.log("ERROR: Password missing in userData");
    throw new APIError(400, "Password is required");
  }

  try {
    const hashedPassword = await bcrypt.hash(
      userData.password,
      Number(config.bycrypt_salt_rounds)
    );

    console.log("Creating modification object...");

    // Create modification object safely
    const modification = {
      name: userData.name,
      email: userData.email,
      contactNo: userData.contactNo,
      role: userData.role || "employee",
      designation: userData.designation || "",
      address: userData.address || "",
      linkedinUrl: userData.linkedinUrl || "",
      profileDescription: userData.profileDescription || "",
      agentDescription: userData.agentDescription || "",
      isFeatured:
        userData.isFeatured === "true" || userData.isFeatured === true,
      isAgent: userData.isAgent === "true" || userData.isAgent === true,
      twofaEnabled:
        userData.twofaEnabled === "true" || userData.twofaEnabled === true,
    };

    console.log("Modification object:", modification);

    const result = await prisma.$transaction(async (tx) => {
      let profileImgUrl = null;

      // If profile image file was uploaded, generate URL
      if (profileImage) {
        profileImgUrl = `/uploads/profiles/${path.basename(
          profileImage.filename
        )}`;
        console.log("Profile image URL:", profileImgUrl);
      }

      // Create user
      const newUser = await tx.user.create({
        data: {
          ...modification,
          password: hashedPassword,
          profileImg: profileImgUrl,
        },
      });

      // If user is admin, assign all menu permissions
      if (newUser.role === "admin") {
        await assignAllMenuPermissionsToUser(tx, newUser.id);
      }

      return newUser;
    });

    console.log("=== SERVICE END - SUCCESS ===");
    return result;
  } catch (error) {
    console.log("=== SERVICE END - ERROR ===", error);
    // Clean up uploaded file if user creation failed
    if (profileImage) {
      deleteImageFile(profileImage.path);
    }
    throw new APIError(400, "Failed to create user");
  }
};
// Update user profile image
export const updateUserProfileImageService = async (
  userId: string,
  profileImage: Express.Multer.File
): Promise<any> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    // Clean up uploaded file if user doesn't exist
    deleteImageFile(profileImage.path);
    throw new APIError(404, "User not found");
  }

  const profileImgUrl = `/uploads/profiles/${path.basename(
    profileImage.filename
  )}`;

  // Delete old profile image if exists
  if (user.profileImg) {
    await deleteImageFile(user.profileImg);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { profileImg: profileImgUrl },
    select: {
      id: true,
      name: true,
      email: true,
      profileImg: true,
      role: true,
      contactNo: true,
    },
  });

  return updatedUser;
};

// Helper function to delete image file
export const deleteImageFile = async (imagePath: string): Promise<void> => {
  try {
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  } catch (error) {
    console.error("Error deleting image file:", error);
    // Don't throw error, just log it
  }
};

// getByemail
const getByEmailFromDB = async (email: string): Promise<User | null> => {
  const result = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  return result;
};
// checkPassword
const checkPassword = async (
  givenPassword: string,
  savedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(givenPassword, savedPassword);
};

// login
// Updated login service
export const loginUserService = async (
  payload: ILoginUser
): Promise<ILoginUserResponse> => {
  const { email, password } = payload;
  const isUserExist = await getByEmailFromDB(email);

  if (!isUserExist) {
    throw new APIError(404, "User does not exist");
  }

  if (
    isUserExist.password &&
    !(await checkPassword(password, isUserExist.password))
  ) {
    throw new APIError(401, "Password is incorrect");
  }

  // Check if 2FA is enabled
  if (isUserExist.twofaEnabled) {
    // Generate 2FA code
    const code = generate2FACode();

    // Save to database
    await save2FACode(isUserExist.id, code);

    // Send email with code
    await send2FACode(email, code);

    // Generate temporary token for 2FA verification
    const tempToken = createToken(
      {
        userId: isUserExist.id,
        requires2FA: true,
        email: isUserExist.email,
      },
      config.jwt.temp_secret as Secret, // Add this to your config
      "10m" // 10 minutes expiration
    );

    return {
      twoFa: true,
      tempToken,
      message: "2FA code sent to your email",
      token: "", // Empty token for 2FA flow
      refreshToken: "", // Empty refresh token for 2FA flow
    };
  }

  // If 2FA is disabled, proceed with normal login
  const { id: userId, role, name } = isUserExist;
  const token = createToken(
    { userId, role, email, name },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string
  );
  const menus = await getUserPermissionsService(userId);
  const refreshToken = createToken(
    { userId, role, email },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string
  );

  return {
    token,
    refreshToken,
    twoFa: false,
    menus,
  };
};

// New service for 2FA verification
export const verify2FAService = async (
  payload: IVerify2FA
): Promise<IVerify2FAResponse> => {
  const { code, tempToken } = payload;

  if (!tempToken) {
    throw new APIError(400, "Temporary token required");
  }

  // Verify temp token
  let verifiedToken;
  try {
    verifiedToken = verifyToken(tempToken, config.jwt.temp_secret as Secret);
  } catch (err) {
    throw new APIError(403, "Invalid or expired temporary token");
  }

  const { userId, email, requires2FA } = verifiedToken as any;

  if (!requires2FA || !userId) {
    throw new APIError(400, "Invalid temporary token");
  }

  // Verify 2FA code
  const isValid = await verify2FACode(userId, code);
  if (!isValid) {
    throw new APIError(401, "Invalid 2FA code");
  }

  // Clear used 2FA code
  await clear2FACode(userId);

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      profileImg: true,
      contactNo: true,
    },
  });

  if (!user) {
    throw new APIError(404, "User not found");
  }

  // Generate final tokens
  const token = createToken(
    { userId: user.id, role: user.role, email: user.email, name: user.name },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = createToken(
    { userId: user.id, role: user.role, email: user.email },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string
  );
  const menus = await getUserPermissionsService(user.id);

  return {
    token,
    refreshToken,
    user,
    menus,
  };
};
// getrefresh
export const getRefreshTokenService = async (
  token: string
): Promise<IRefreshTokenResponse> => {
  //verify token
  // invalid token - synchronous
  let verifiedToken = null;
  try {
    verifiedToken = verifyToken(token, config.jwt.refresh_secret as Secret);
  } catch (err) {
    throw new APIError(403, "Invalid Refresh Token");
  }

  const { email } = verifiedToken;

  // checking deleted user's refresh token

  const isUserExist = await getByEmailFromDB(email);
  if (!isUserExist) {
    throw new APIError(404, "User does not exist");
  }
  //generate new token

  const newAccessToken = createToken(
    {
      userId: isUserExist.id,
      role: isUserExist.role,
      email: isUserExist.email,
    },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string
  );

  return {
    accessToken: newAccessToken,
  };
};
// Helper function to assign all menu permissions to a user
const assignAllMenuPermissionsToUser = async (
  prismaClient: any,
  userId: string
): Promise<void> => {
  // Get all menus
  const allMenus = await prismaClient.menu.findMany();

  if (allMenus.length > 0) {
    // Create permissions for all menus
    const permissionData = allMenus.map((menu: any) => ({
      userId: userId,
      menuId: menu.id,
      canView: true,
      canEdit: true,
      canDelete: true,
    }));

    // Bulk create permissions
    await prismaClient.userMenuPermission.createMany({
      data: permissionData,
      skipDuplicates: true, // Skip if permission already exists
    });
  }
};

// Update user role and adjust permissions accordingly
export const updateUserRoleService = async (
  userId: string,
  newRole: string
): Promise<any> => {
  const validRoles = ["admin", "employee"];

  if (!validRoles.includes(newRole)) {
    throw new APIError(400, "Invalid role. Must be 'admin' or 'employee'");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update user role
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: { id: true, name: true, email: true, role: true },
    });

    // If changing to admin, assign all permissions
    if (newRole === "admin") {
      await assignAllMenuPermissionsToUser(tx, userId);
    }
    // If changing from admin to employee, you might want to remove all permissions
    // or keep existing ones - depending on your business logic
    // For now, we'll keep the existing permissions

    return updatedUser;
  });

  return result;
};

// Get user by ID
export const getUserByIdService = async (userId: string): Promise<any> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      country: true,
      designation: true,
      contactNo: true,
      profileImg: true,
      address: true,
      linkedinUrl: true,
      isFeatured: true,
      profileDescription: true,
      isAgent: true,
      agentDescription: true,
      twofaEnabled: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new APIError(404, "User not found");
  }

  return user;
};
// Update user with or without profile image
export const updateUserWithProfileImageService = async (
  userId: string,
  payload: any
): Promise<any> => {
  const { userData, profileImage } = payload;

  console.log("Service received payload:", payload);
  console.log("Service received userData:", userData);
  console.log("Service received profileImage:", profileImage);

  // Validate input
  if (!userId) {
    throw new APIError(400, "User ID is required");
  }

  // Find existing user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    if (profileImage) {
      deleteImageFile(profileImage.path);
    }
    throw new APIError(404, "User not found");
  }

  try {
    // Extract and parse userData
    let parsedUserData;

    if (typeof userData === "string") {
      // Direct JSON string
      try {
        parsedUserData = JSON.parse(userData);
      } catch (parseError) {
        throw new APIError(400, "Invalid userData JSON format");
      }
    } else if (userData && typeof userData === "object" && userData.userData) {
      // Nested object with userData property (your current case)
      try {
        parsedUserData = JSON.parse(userData.userData);
      } catch (parseError) {
        throw new APIError(400, "Invalid nested userData JSON format");
      }
    } else if (userData && typeof userData === "object") {
      // Already parsed object
      parsedUserData = userData;
    } else {
      throw new APIError(400, "Valid user data is required");
    }

    console.log("Parsed userData:", parsedUserData);

    // Check email uniqueness if being updated
    if (parsedUserData.email && parsedUserData.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: parsedUserData.email },
      });

      if (existingUser) {
        throw new APIError(409, "Email already exists");
      }
    }

    // Check LinkedIn URL uniqueness if being updated
    if (
      parsedUserData.linkedinUrl &&
      parsedUserData.linkedinUrl !== user.linkedinUrl
    ) {
      const existingUser = await prisma.user.findUnique({
        where: { linkedinUrl: parsedUserData.linkedinUrl },
      });

      if (existingUser) {
        throw new APIError(409, "LinkedIn URL already exists");
      }
    }

    let profileImgUrl = user.profileImg; // Keep existing image by default

    // If new profile image was uploaded
    if (profileImage) {
      profileImgUrl = `/uploads/profiles/${path.basename(
        profileImage.filename
      )}`;

      // Delete old profile image if exists and is different from new one
      if (user.profileImg && user.profileImg !== profileImgUrl) {
        try {
          await deleteImageFile(user.profileImg);
        } catch (deleteError) {
          console.warn("Failed to delete old profile image:", deleteError);
          // Continue with update even if old image deletion fails
        }
      }
    } else if (parsedUserData.removeProfileImage) {
      // If explicitly removing profile image
      if (user.profileImg) {
        try {
          await deleteImageFile(user.profileImg);
        } catch (deleteError) {
          console.warn("Failed to delete profile image:", deleteError);
        }
      }
      profileImgUrl = null;
    }

    // Prepare update data - spread the parsed userData into individual fields
    const updateData: any = {
      ...parsedUserData,
      updatedAt: new Date(), // Always update the timestamp
    };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.password; // Password should be updated separately
    delete updateData.removeProfileImage; // Internal flag, not a database field

    // Add profile image URL if changed
    if (profileImage || parsedUserData.removeProfileImage) {
      updateData.profileImg = profileImgUrl;
    }

    // Convert boolean fields if they come as strings
    if (typeof updateData.isFeatured === "string") {
      updateData.isFeatured = updateData.isFeatured === "true";
    }
    if (typeof updateData.isAgent === "string") {
      updateData.isAgent = updateData.isAgent === "true";
    }
    if (typeof updateData.isActive === "string") {
      updateData.isActive = updateData.isActive === "true";
    }
    if (typeof updateData.twofaEnabled === "string") {
      updateData.twofaEnabled = updateData.twofaEnabled === "true";
    }

    console.log("Final update data for Prisma:", updateData);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        contactNo: true,
        profileImg: true,
        address: true,
        linkedinUrl: true,
        isFeatured: true,
        profileDescription: true,
        isAgent: true,
        agentDescription: true,
        twofaEnabled: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  } catch (error) {
    console.error("Error in updateUserWithProfileImageService:", error);
    // Clean up uploaded file if error occurred during processing
    if (profileImage) {
      deleteImageFile(profileImage.path);
    }
    throw error;
  }
};
// Change password
export const changePasswordService = async (
  userId: string,
  payload: any
): Promise<any> => {
  const { currentPassword, newPassword, confirmPassword } = payload;

  if (newPassword !== confirmPassword) {
    throw new APIError(400, "New password and confirm password do not match");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new APIError(404, "User not found");
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!isCurrentPasswordValid) {
    throw new APIError(401, "Current password is incorrect");
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(
    newPassword,
    Number(config.bycrypt_salt_rounds)
  );

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
    select: {
      id: true,
      name: true,
      email: true,
      updatedAt: true,
    },
  });

  return {
    ...updatedUser,
    message: "Password changed successfully",
  };
};

// Toggle user active status
export const toggleUserStatusService = async (userId: string): Promise<any> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new APIError(404, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return {
    ...updatedUser,
    message: `User ${
      updatedUser.isActive ? "activated" : "deactivated"
    } successfully`,
  };
};
// Delete user
export const deleteUserService = async (userId: string): Promise<any> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      menuPermissions: true,
    },
  });

  if (!user) {
    throw new APIError(404, "User not found");
  }

  // Delete profile image if exists
  if (user.profileImg) {
    await deleteImageFile(user.profileImg);
  }

  // Use transaction to ensure all operations succeed or fail together
  const result = await prisma.$transaction(async (tx) => {
    // Delete user permissions
    if (user.menuPermissions.length > 0) {
      await tx.userMenuPermission.deleteMany({
        where: { userId },
      });
    }

    // Delete user
    const deletedUser = await tx.user.delete({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return deletedUser;
  });

  return {
    ...result,
    message: "User deleted successfully",
  };
};
// Add this to services/userService.ts
export const getAllUsersService = async (filters: {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}): Promise<{
  users: any[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  const { page, limit, search, role, isActive } = filters;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { contactNo: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        contactNo: true,
        profileImg: true,
        address: true,
        linkedinUrl: true,
        isFeatured: true,
        profileDescription: true,
        isAgent: true,
        agentDescription: true,
        twofaEnabled: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    users,
    total,
    page,
    totalPages,
  };
};
// Simple forgot password service
export const forgotPasswordService = async (
  payload: any
): Promise<{ message: string }> => {
  const { email, newPassword, confirmPassword } = payload;

  // // Validate passwords match
  // if (newPassword !== confirmPassword) {
  //   throw new APIError(400, "Passwords do not match");
  // }

  // Validate password strength
  if (newPassword.length < 6) {
    throw new APIError(400, "Password must be at least 6 characters long");
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase().trim(),
      isActive: true,
    },
  });

  if (!user) {
    throw new APIError(404, "User with this email not found");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bycrypt_salt_rounds)
  );

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
    },
  });

  return {
    message: "Password has been reset successfully",
  };
};

// Verify email exists (optional - for frontend validation)
export const verifyEmailService = async (
  email: string
): Promise<{ exists: boolean; message: string }> => {
  const user = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase().trim(),
      isActive: true,
    },
    select: { id: true, name: true }, // Only return necessary fields
  });

  if (!user) {
    return {
      exists: false,
      message: "User with this email not found",
    };
  }

  return {
    exists: true,
    message: "Email verified successfully",
  };
};
