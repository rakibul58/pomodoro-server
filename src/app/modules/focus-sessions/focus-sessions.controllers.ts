import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import {
  createFocusSession,
  getFocusMetrics,
  getStreaks,
  getDashboardSummary,
  getBadges,
} from "./focus-sessions.services";

const startFocusSession = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await createFocusSession(req.user, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Focus session created successfully!",
    data: result,
  });
});

const getUserMetrics = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await getFocusMetrics(req.user, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Focus metrics retrieved successfully!",
    data: result,
  });
});

const getUserStreaks = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await getStreaks(req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Streak data retrieved successfully!",
    data: result,
  });
});

const getUserBadges = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await getBadges(req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Badges retrieved successfully!",
    data: result,
  });
});

const getDashboard = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await getDashboardSummary(req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Dashboard data retrieved successfully!",
    data: result,
  });
});

export const FocusSessionControllers = {
  startFocusSession,
  getUserMetrics,
  getUserStreaks,
  getUserBadges,
  getDashboard,
};