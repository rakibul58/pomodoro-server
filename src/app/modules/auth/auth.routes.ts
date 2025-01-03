import { Router } from "express";
import { AuthControllers } from "./auth.controllers";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { UserValidations } from "../user/user.validations";

const router = Router();

router.route("/login").post(AuthControllers.loginUser);

router
  .route("/register")
  .post(
    validateRequest(UserValidations.createUserValidationSchema),
    AuthControllers.userRegistration
  );

router.route("/refresh-token").post(AuthControllers.refreshToken);

router.route("/change-password").post(AuthControllers.changePassword);

export const AuthRoutes = router;
