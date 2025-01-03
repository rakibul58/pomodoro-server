import { Router } from "express";
import auth from "../../middlewares/auth";
import { UserControllers } from "./user.controllers";
import { UserValidations } from "./user.validations";
import validateRequest from "../../middlewares/validateRequest";

const router = Router();

router
  .route("/profile")
  .get(auth(),UserControllers.getUserProfile)
  .put(
    auth(),
    validateRequest(UserValidations.updateUserValidation),
    UserControllers.updateUserProfile
  );

export const UserRoutes = router;
