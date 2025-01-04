import { Router } from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { FocusSessionValidations } from "./focus-sessions.validations";
import { FocusSessionControllers } from "./focus-sessions.controllers";

const router = Router();

// All routes require authentication
router.use(auth());
router
  .route("/start")
  .post(
    validateRequest(FocusSessionValidations.createSessionValidationSchema),
    FocusSessionControllers.startFocusSession
  );

router.route("/metrics").get(FocusSessionControllers.getUserMetrics);
router.route("/streaks").get(FocusSessionControllers.getUserStreaks);
router.route("/badges").get(FocusSessionControllers.getUserBadges);
router.route("/dashboard").get(FocusSessionControllers.getDashboard);

export const FocusSessionRoutes = router;