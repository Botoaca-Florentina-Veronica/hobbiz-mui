const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    const ext = (file.originalname.split(".").pop() || "").toLowerCase();
    const isImage = IMAGE_EXTENSIONS.includes(ext);
    return {
      folder: "hobbiz-documents",
      // PDF/Word/text trimise ca resource_type "raw" — livrarea lor nu trece prin
      // pipeline-ul de imagini al Cloudinary (care, implicit, blochează accesul
      // public la PDF/ZIP din motive de securitate), ci e servită ca fișier brut,
      // identic cu ce a fost încărcat.
      resource_type: isImage ? "image" : "raw",
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "pdf", "doc", "docx", "txt"],
    };
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size for documents
  },
});

module.exports = upload;