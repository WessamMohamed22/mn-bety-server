import * as CartService from "./cart.service.js";
import asyncHandler from "../../middlewares/asynHandler.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { successResponse } from "../../utils/apiResponse.util.js";

export const getUserCart = asyncHandler(async(req , res)=>{
    const userId = req.decoded.id;
    const cart = await CartService.getUserCart(userId);
    return res
        .status(HTTP_STATUS.OK)
        .json(successResponse({ cart }, "Cart fetched successfully"));
})