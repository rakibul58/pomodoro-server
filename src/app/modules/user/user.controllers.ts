import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import { Request, Response } from "express";
import sendResponse from "../../../shared/sendResponse";
import { UserServices } from "./user.services";

const getUserProfile = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const result = await UserServices.getUserProfileFromDB(req.user);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "User Profile Fetched successfully!",
      data: result,
    });
  }
);

const updateUserProfile = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const result = await UserServices.updateUserProfile(req.user, req.body);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Profile Updated successfully!",
      data: result,
    });
  }
);

export const UserControllers = {
  getUserProfile,
  updateUserProfile,
};
