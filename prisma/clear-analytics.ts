import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Clearing pre-seeded mock analytics history...");

  // Keep users, posts, and newsletter subscribers intact, but clear page views
  const result = await db.pageView.deleteMany();

  console.log(`Successfully cleared ${result.count} mock page view records!`);
  console.log("Your DevFeed Analytics Dashboard is now clean and will track ONLY real-time traffic.");
}

main()
  .catch((e) => {
    console.error("Error clearing analytics:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
