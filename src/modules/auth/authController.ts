import { Request, RequestHandler, Response } from "express";
import {
  createUserService,
  loginUserService,
  getRefreshTokenService,
  verify2FAService,
} from "./authService";
import catchAsync from "../../shared/catchAsync";
import { reponseAuthFormat, reponseFormat } from "../../shared/responseFormat";
import {
  ILoginUserResponse,
  IRefreshTokenResponse,
} from "../../interfaces/login";
import { User } from "../../../generated/prisma";
// import { User } from "@prisma/client";
// signup
export const createUser: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    console.log(req.body);
    const { ...userData } = req.body;

    const result = await createUserService(userData);
    let dataWithoutPass;
    if (result) {
      const { password, ...rest } = result;
      dataWithoutPass = rest;
    }
    // @ts-ignore
    reponseFormat<Omit<User, "password">>(res, {
      success: true,
      statusCode: 200,
      message: "User created successfully !",
      data: dataWithoutPass,
    });
  }
);
// login
export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { ...userData } = req.body;
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

  reponseAuthFormat(res, {
    success: true,
    statusCode: 200,
    message: "2FA verification successful!",
    token: others.token,
    // user: others.user,
    twoFa: false,
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
