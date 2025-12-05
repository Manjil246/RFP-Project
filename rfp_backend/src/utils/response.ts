import { Response } from "express";
import { NODE_ENV } from "../config/imports";

interface SuccessResponse {
  status: string;
  statusCode: number;
  message: string;
  data?: any;
}

interface ErrorResponse {
  status: string;
  statusCode: number;
  message: string;
  error?: {
    message?: string;
    stack?: any;
  } | null;
}

const sendSuccessResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data?: any
) => {
  const response: SuccessResponse = {
    status: "success",
    statusCode,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  error?: any
) => {
  let response: ErrorResponse = {
    status: "error",
    statusCode,
    message,
  };
  if (NODE_ENV === "development") {
    console.error(error);
    response.error = {
      message: error?.message,
      stack: error?.stack,
    };
  } else {
    response.error = {
      message: error?.message,
    };
  }

  return res.status(statusCode).json(response);
};

export { sendSuccessResponse, sendErrorResponse };
