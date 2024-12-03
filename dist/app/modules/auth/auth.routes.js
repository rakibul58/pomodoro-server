"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = require("express");
const auth_controllers_1 = require("./auth.controllers");
const router = (0, express_1.Router)();
router.route("/login").post(auth_controllers_1.AuthControllers.loginUser);
router.route("/refresh-token").post(auth_controllers_1.AuthControllers.refreshToken);
router.route("/change-password").post(auth_controllers_1.AuthControllers.changePassword);
exports.AuthRoutes = router;