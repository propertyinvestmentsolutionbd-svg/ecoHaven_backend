/* eslint-disable no-unused-expressions */
import { ErrorRequestHandler } from "express";
import { IGenericErrorMessage } from "../interfaces/error";
import handleValidationError from "../errorHelpers/handleValidationError";
import APIError from "../errorHelpers/APIError";
// global error handler
import { PrismaClientValidationError } from "@prisma/client/runtime/library";
import { TokenExpiredError } from "jsonwebtoken";

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next
) => {
  // console.log({ err });
  // console.log(err.name);

  let success = false;
  let statusCode = 500;
  let message = "Something went wrong";
  let errorMessages: IGenericErrorMessage[] = [];
  let stack = "";

  if (err instanceof PrismaClientValidationError) {
    const simplifiedError = handleValidationError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (err?.name === "ValidationError") {
    const simplifiedError = handleValidationError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorMessages = simplifiedError?.errorMessages;
  } else if (err instanceof APIError) {
    statusCode = err?.statusCode;
    message = err?.message;
    errorMessages = err?.message ? [{ path: "", message: err?.message }] : [];
    stack = err?.stack;
  } else if (err instanceof TokenExpiredError) {
    statusCode = 403;
    message = "Token expired";
    errorMessages = [
      {
        path: "",
        message: `Token expired at ${err.expiredAt}. Please login again.`,
      },
    ];
    stack = err.stack;
  } else if (err instanceof Error) {
    message = err?.message;
    errorMessages = err?.message ? [{ path: "", message: err?.message }] : [];
  }

  res.status(statusCode).json({
    success,
    statusCode,
    message,
    errorMessages,
    stack,
  });
};
