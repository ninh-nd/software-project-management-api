import { create, getAll } from "controllers/resources/threat.controller";
import express from "express";
const router = express.Router();
// Get all threats
router.get("/", getAll);
// Create a threat
router.post("/", create);
export default router;
