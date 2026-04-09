import "dotenv/config";
import { readFileSync } from "fs";
import { importManualCsv } from "@/lib/importManualCsv";

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: tsx scripts/importCsv.ts /path/to/file.csv");
  process.exit(1);
}

const buf = readFileSync(csvPath);
console.log(`Importing ${csvPath}...`);
importManualCsv(buf).then((result) => {
  console.log("Brands created:", result.brandsCreated);
  console.log("Brands updated:", result.brandsUpdated);
  console.log("Products created:", result.productsCreated);
  console.log("Products skipped:", result.productsSkipped);
  console.log("Listings created:", result.listingsCreated);
  if (result.errors.length > 0) {
    console.log("\nErrors:");
    result.errors.forEach((e) => console.log(" ", e));
  }
  process.exit(0);
}).catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
