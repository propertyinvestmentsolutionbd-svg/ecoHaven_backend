import { Response } from "express";

type IApiData<T> = {
  statusCode: number;
  success: boolean;
  message?: string | null;
  data?: T | null;
  meta?:
    | {
        page: number;
        limit: number;
        count?: number;
      }
    | null
    | undefined;
};
type IAuthData<T> = {
  statusCode: number;
  success: boolean;
  message?: string | null;
  token?: T | null;
  twoFa?: boolean;
  tempToken?: T | null;
};
export const reponseFormat = <T>(res: Response, data: IApiData<T>): void => {
  const responseData: IApiData<T> = {
    statusCode: data.statusCode,
    success: data.success,
    message: data.message || null,
    data: data.data || null,
    meta: data.meta || null || undefined,
  };

  res.status(data.statusCode).json(responseData);
};
export const reponseAuthFormat = <T>(
  res: Response,
  data: IAuthData<T>
): void => {
  const responseData: IAuthData<T> = {
    statusCode: data.statusCode,
    success: data.success,
    message: data.message || null,
    token: data.token || null,
    twoFa: data.twoFa || false,
    tempToken: data.tempToken || null,
  };

  res.status(data.statusCode).json(responseData);
};
