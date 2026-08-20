import { Router } from "express";
import authRoutes from "./auth.js";
import filesRoutes from "./files.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/files", filesRoutes);

// GET /api/health
// Confirms the server is up and can respond. Useful for quickly checking
// the backend works before wiring up the frontend, and later for deploy
// platforms that expect a health-check endpoint.
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Future phases will add:
// router.use('/folders', folderRoutes)
// router.use('/share', shareRoutes)
// router.use('/search', searchRoutes)

export default router;
