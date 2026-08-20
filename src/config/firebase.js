import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your service account key file
const serviceAccountPath = path.resolve(__dirname, "./serviceAccountKey.json");

let messagingInstance = null;

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  
  const app = initializeApp({
    credential: cert(serviceAccount)
  });
  
  messagingInstance = getMessaging(app);
  
  console.log("Firebase Admin Initialized successfully.");
} else {
  console.warn("WARNING: serviceAccountKey.json not found in src/config/. Firebase Admin will NOT initialize.");
}

export { messagingInstance as messaging };
