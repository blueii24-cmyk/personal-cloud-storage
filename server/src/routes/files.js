import { Router } from "express";
import multer from "multer";
import os from "node:os";
import { requireAuth } from "../middleware/auth.js";
import * as filesController from "../controllers/filesController.js";

// diskStorage streams the incoming upload straight to a temp file
// instead of buffering it in memory (multer's default memoryStorage
// would hold the whole file as a Buffer — fine for small files, not
// for large ones). We then stream that temp file into the storage
// provider and delete it — see fileService.saveUploadedFile.
const upload = multer({
  storage: multer.diskStorage({ destination: os.tmpdir() }),
  limits: {
    fileSize: (Number(process.env.MAX_UPLOAD_SIZE_MB) || 500) * 1024 * 1024,
  },
});

// Wraps multer so a file-too-large error comes back as a normal,
// readable JSON error instead of an unhandled exception.
function uploadFilesMiddleware(req, res, next) {
  upload.array("files", 20)(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        err.status = 413;
        err.message = `File too large (max ${process.env.MAX_UPLOAD_SIZE_MB || 500}MB)`;
      }
      return next(err);
    }
    next();
  });
}

const router = Router();

router.use(requireAuth); // every route below requires a logged-in user

router.get("/", filesController.listFiles);
router.post("/upload", uploadFilesMiddleware, filesController.uploadFiles);
router.get("/:id", filesController.getFile);
router.get("/:id/download", filesController.downloadFile);
router.delete("/:id", filesController.deleteFile);

export default router;
