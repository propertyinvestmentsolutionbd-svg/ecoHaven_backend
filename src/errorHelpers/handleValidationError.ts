import { Prisma } from "@prisma/client";
import { IGenericErrorResponse } from "../interfaces/error";
import { PrismaClientValidationError } from "../../generated/prisma/runtime/library";

const handleValidationError = (
  error: PrismaClientValidationError
): IGenericErrorResponse => {
  const errors = [
    {
      path: "",
      message: error.message,
    },
  ];
  const statusCode = 400;
  return {
    statusCode,
    message: "Validation Error",
    errorMessages: errors,
  };
};

export default handleValidationError;
