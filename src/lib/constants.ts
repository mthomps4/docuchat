import path from "path";

// For local development this is fine -- Future S3, R2 bucket storage
export const DOCUMENTS_DIR = path.join(process.cwd(), "public", "documents");
