import * as fs from "fs";
import * as path from "path";

// Define the path of the .env file
const envPath = path.resolve(__dirname, "..", "..", ".env");

// Define the content of the .env file
const envContent = `
GOOGLE_AUTH_URL="https://calendar.google.com/"
GOOGLE_USERNAME="…"
GOOGLE_PASSWORD="…"
GOOGLE_RECOVERY_PHONE_NUMBER="…"
GOOGLE_STAY_SIGNED_IN="false"

PROTON_AUTH_URL="https://calendar.proton.me"
PROTON_USERNAME="…"
PROTON_PASSWORD="…"
PROTON_STAY_SIGNED_IN="false"

SKIFF_AUTH_URL="https://app.skiff.com/calendar/"
SKIFF_USERNAME="…"
SKIFF_PASSWORD="…"
SKIFF_STAY_SIGNED_IN="false"
`;

fs.access(envPath, fs.constants.F_OK, (err) => {
  if (err) {
    fs.writeFile(envPath, envContent, (err) => {
      if (err) {
        console.error("Error while creating .env file:", err);
      } else {
        console.log(".env file has been created successfully.");
      }
    });
  } else {
    console.log(".env file already exists.");
  }
});
