"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthControllers = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const auth_services_1 = require("./auth.services");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const loginUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_services_1.AuthServices.loginUser(req.body);
    const { refreshToken, accessToken } = result;
    res.cookie("accessToken", accessToken, {
        secure: config_1.default.env === "development" ? false : true,
        httpOnly: true,
    });
    res.cookie("refreshToken", refreshToken, {
        secure: config_1.default.env === "development" ? false : true,
        httpOnly: true,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Logged in successfully!",
        data: {
            accessToken: result.accessToken,
            needPasswordChange: result.needPasswordChange,
        },
    });
}));
exports.AuthControllers = {
    loginUser,
};
