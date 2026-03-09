import { MESSAGES } from "../constants/messages.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const successResponse = (data, message = MESSAGES.SUCCESS.FETCHED) => ({
  statusCode: HTTP_STATUS.OK,
  success: true,
  message,
  data,
});

export const createdResponse = (data, message = MESSAGES.SUCCESS.CREATED) => ({
  statusCode: HTTP_STATUS.CREATED,
  success: true,
  message,
  data,
});
