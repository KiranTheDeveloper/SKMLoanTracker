import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const loanProducts = [
  { name: "Personal Loan", slug: "personal-loan", description: "Unsecured loans for personal expenses" },
  { name: "Business Loan", slug: "business-loan", description: "Loans for business expansion and working capital" },
  { name: "Home Loan", slug: "home-loan", description: "Loans for home purchase, construction or renovation" },
  { name: "Auto / Vehicle Loan", slug: "auto-loan", description: "Loans for cars, bikes and commercial vehicles" },
  { name: "Loan Against Property", slug: "lap", description: "Secured loans against residential or commercial property" },
  { name: "Education Loan", slug: "education-loan", description: "Loans for higher education in India and abroad" },
  { name: "Gold Loan", slug: "gold-loan", description: "Instant loans against gold jewellery" },
  { name: "Credit Card", slug: "credit-card", description: "Credit card applications and upgrades" },
  { name: "Credit Repair", slug: "credit-repair", description: "CIBIL score improvement and credit counselling" },
  { name: "Balance Transfer", slug: "balance-transfer", description: "Transfer existing loans to lower interest rates" },
];

async function main() {
  console.log("Seeding database...");

  // Seed loan products
  for (const product of loanProducts) {
    await prisma.loanProduct.upsert({
      where: { slug: product.slug },
      update: { name: product.name, description: product.description },
      create: product,
    });
  }
  console.log(`Seeded ${loanProducts.length} loan products.`);

  // Seed admin user
  const hashedPassword = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@skmfinancial.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@skmfinancial.com",
      password: hashedPassword,
      role: "ADMIN",
      phone: "9999999999",
    },
  });
  console.log(`Admin user ready: ${admin.email}`);

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
