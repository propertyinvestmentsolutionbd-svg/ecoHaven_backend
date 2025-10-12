export type IGenericErrorMessage = {
  path: string | number;
  message: string;
};

export type IGenericErrorResponse = {
  statusCode: number;
  message: string;
  errorMessages: IGenericErrorMessage[];
  stack?: string;
};
export type IGenericResponse<T> = {
  meta: {
    page: number;
    limit: number;
    total?: number;
    totalPages?: number;
  };
  data: T;
};
