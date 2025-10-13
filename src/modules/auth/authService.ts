import { Secret } from "jsonwebtoken";
import config from "../../config";
import bcrypt from "bcrypt";

import APIError from "../../errorHelpers/APIError";
import {
  ILoginUser,
  ILoginUserResponse,
  IRefreshTokenResponse,
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
// creating user
export const createUserService = async (user: User): Promise<User | null> => {
  const hashedPassword = await bcrypt.hash(
    user?.password,
    Number(config.bycrypt_salt_rounds)
  );
  user.password = hashedPassword;

  const result = await prisma.$transaction(async (tx) => {
    // Create user
    const newUser = await tx.user.create({
      data: user,
    });

    // If user is admin, assign all menu permissions
    if (newUser.role === "admin") {
      await assignAllMenuPermissionsToUser(tx, newUser.id);
    }

    return newUser;
  });

  if (!result) {
    throw new APIError(400, "failed to create User");
  }
  return result;
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
  const { id: userId, role } = isUserExist;
  const token = createToken(
    { userId, role, email },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = createToken(
    { userId, role, email },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string
  );

  return {
    token,
    refreshToken,
    twoFa: false,
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
    { userId: user.id, role: user.role, email: user.email },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = createToken(
    { userId: user.id, role: user.role, email: user.email },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string
  );

  return {
    token,
    refreshToken,
    user,
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
