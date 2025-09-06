/* eslint-disable no-console */
const { PrismaClient, UserPosition } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const phone = "+998901234572"; // Support Director phone
  const passwordPlain = "admin123"; // default password
  const password = await bcrypt.hash(passwordPlain, 12);

  // Pick first branch or create one if none exists
  let branch = await prisma.branch.findFirst();
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        shortName: "Main Campus",
        legalName: "Beruniy Maktab Main Campus",
        stir: "999999999",
        phone: "+998900000000",
        region: "Tashkent",
        address: "Auto-created branch",
        district: "Yunusabad",
        longitude: 69.2401,
        latitude: 41.2995,
        status: "ACTIVE",
      },
    });
  }

  // If exists, skip
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    console.log("Support Director user already exists:", existing.phone);
    return;
  }

  const user = await prisma.user.create({
    data: {
      firstName: "Support",
      lastName: "Director",
      gender: "MALE",
      dateOfBirth: new Date("1990-01-01"),
      phone,
      userId: "support_dir_001",
      email: "support.director@example.com",
      status: "ACTIVE",
      address: "Tashkent",
      position: UserPosition.SUPPORT_DIRECTOR,
      branchId: branch.id,
      password,
    },
  });

  console.log("✅ Created Support Director user:", user.phone);
  console.log("You can login with:");
  console.log("Phone:", phone);
  console.log("Password:", passwordPlain);
}

main()
  .catch((e) => {
    console.error("❌ Error creating Support Director:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


