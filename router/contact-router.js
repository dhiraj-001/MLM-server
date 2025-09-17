import express from "express";
import { contactForm } from "../controllers/contact-controller.js";
import { ContactFormSchema } from "../validators/contact-form-validator.js";
import validate from "../middlewares/validate-middleware.js";

const router = express.Router();

router.route("/contact").post(validate(ContactFormSchema), contactForm);

export default router;
