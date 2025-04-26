import { RequestHandler } from "express";

interface S3File extends Express.Multer.File {
  location: string; // ✅ AWS S3 location URL
}

export const uploadAvatarOnly: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const file = req.file as S3File;

    if (!file || !file.location) {
      res.status(400).json({ message: "Avatar upload failed." });
      return;
    }

    res.status(200).json({
      message: "Avatar uploaded successfully",
      avatarUrl: file.location, // ✅ Correct AWS link
    });
  } catch (error: any) {
    console.error("🔴 Error uploading avatar:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message || "Something went wrong",
    });
  }
};

