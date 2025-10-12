import { NextFunction, Request, Response } from "express";
import { Secret } from "jsonwebtoken";
import APIError from "../errorHelpers/APIError";
import config from "../config";
import { verifyToken } from "../shared/jwtHelper";

const auth =
  (...requiredRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      //get authorization token
      const token = req.headers.authorization;
      if (!token) {
        throw new APIError(401, "You are not authorized");
      }
      // verify token
      let verifiedUser = null;

      verifiedUser = verifyToken(token, config.jwt.secret as Secret);

      req.user = verifiedUser; // role  , userid
      //  guard
      if (requiredRoles.length && !requiredRoles.includes(verifiedUser.role)) {
        throw new APIError(403, "Forbidden");
      }
      next();
    } catch (error) {
      next(error);
    }
  };

export default auth;
