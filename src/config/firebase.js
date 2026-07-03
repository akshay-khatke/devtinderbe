import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your service account key file
const serviceAccountPath = path.resolve(__dirname, "./serviceAccountKey.json");

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log("Firebase Admin Initialized successfully.");
} else {
  console.warn("WARNING: serviceAccountKey.json not found in src/config/. Firebase Admin will NOT initialize.");
}

export default admin;
