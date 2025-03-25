import { Request, Response, NextFunction } from "express";
import sharp from "sharp";
import multer from "multer";
import { uploadToS3 } from "../services/s3Uploader.js";
import { CustomFile } from "../types/index.js";

// Użycie pamięci zamiast zapisu na dysk
const storage = multer.memoryStorage();

// Filtr MIME types plików (ograniczenie do obrazów)
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Prawidłowy plik: brak błędu (null), akceptacja (true)
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, JPG, and PNG image files are allowed."
      )
    ); // Błąd, plik odrzucony
  }
};

// Konfiguracja Multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single("avatar");

// Middleware do przesyłania do S3
export const uploadAvatar = async (
  req: Request & { file?: CustomFile },
  res: Response,
  next: NextFunction
) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      console.log(req.file, "czy jest req file");
      //Jeśli przesłano plik, kompresuj go i wyśli do AWS
      if (req.file) {
        // Kompresja obrazu
        console.log("jest przesłany plik, wskakuje do kompresji");
        const optimizedBuffer = await sharp(req.file.buffer)
          .resize(200, 200) // Zmień rozdzielczość na 200x200 px
          .jpeg({ quality: 80 }) // Kompresja JPEG z jakością 80%
          .toBuffer();

        req.file.buffer = optimizedBuffer;
        req.file.mimetype = "image/jpeg";

        // Przesyłanie do S3
        console.log("po kompresji do s3");
        req.file.location = await uploadToS3(req.file);
        console.log("po wysłaniu do s3");
        console.log("req.file.location", req.file.location);

        // Ustaw avatar w req.body na URL przesłanego pliku
        req.body.avatar = req.file.location;
      }

      console.log("middleware idzie do next");
      console.log("Final req.body.avatar:", req.body.avatar);
      next();
    } catch (error) {
      console.error("Error uploading file to S3:", error);
      return res.status(500).json({ message: "File upload failed", error });
    }
  });
};
export default uploadAvatar;
