import AWS from "aws-sdk";

// Funkcja do walidacji zmiennych środowiskowych
const validateEnvVar = (varName: string): string => {
  const value = process.env[varName];
  if (!value) {
    throw new Error(`Environment variable ${varName} is not set!`);
  }
  return value;
};

// Walidacja kluczowych zmiennych środowiskowych
const bucketName = validateEnvVar("S3_BUCKET_NAME");
const accessKeyId = validateEnvVar("AWS_ACCESS_KEY_ID");
const secretAccessKey = validateEnvVar("AWS_SECRET_ACCESS_KEY");
const region = validateEnvVar("AWS_REGION");

// Konfiguracja S3 za pomocą kluczy środowiskowych
// Tworzy obiekt S3 za pomocą klasy AWS.S3
const s3 = new AWS.S3({
  accessKeyId,
  secretAccessKey,
  region,
});

// Funkcja przesyłania plików do S3
// Ten obiekt definiuje, jak plik ma być przesłany do S3
export const uploadToS3 = async (
  file: Express.Multer.File
): Promise<string> => {
  try {
    const params = {
      Bucket: bucketName, // Nazwa bucketu
      Key: `uploads/${Date.now()}-${file.originalname}`, // Unikalna nazwa pliku
      Body: file.buffer, // Zawartość pliku - przekazane przez multer
      ContentType: file.mimetype, // Typ MIME pliku (np. image/jpeg)
      // ACL: "public-read", // Publiczny dostęp do pliku
    };

    // Wysłanie danych zdefiniowanych w params do bucketu S3 (AWS)
    const result = await s3.upload(params).promise();
    console.log("s3Uploader link:", result.Location);
    return result.Location; // zwraca URL przesłanego pliku
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error("File upload failed");
  }
};
