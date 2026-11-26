import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface PuskesmasSeed {
  kode: string;
  nama: string;
  jenisLayanan: string;
  alamat: string;
  kontak: string;
  userEmail: string;
  userName: string;
}

async function main() {
  console.log("==========================================");
  console.log("🏥 Seeding 25 Puskesmas & User OPD Sleman");
  console.log("==========================================");

  const jsonPath = path.join(__dirname, "..", "seed-data", "puskesmas.json");
  const data: PuskesmasSeed[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  const defaultPassword = "Puskesmas123!";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  let opdCreated = 0;
  let opdUpdated = 0;
  let userCreated = 0;
  let userUpdated = 0;

  for (const item of data) {
    // 1. Upsert OPD
    const existingOpd = await prisma.opd.findUnique({
      where: { kode: item.kode },
    });

    const opd = await prisma.opd.upsert({
      where: { kode: item.kode },
      update: {
        nama: item.nama,
        jenisLayanan: item.jenisLayanan,
        alamat: item.alamat,
        kontak: item.kontak,
        active: true,
      },
      create: {
        kode: item.kode,
        nama: item.nama,
        jenisLayanan: item.jenisLayanan,
        alamat: item.alamat,
        kontak: item.kontak,
        active: true,
      },
    });

    if (existingOpd) {
      opdUpdated++;
    } else {
      opdCreated++;
    }

    // 2. Upsert User OPD
    const existingUser = await prisma.user.findUnique({
      where: { email: item.userEmail },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { email: item.userEmail },
        data: {
          name: item.userName,
          opdId: opd.id,
          role: UserRole.OPD,
          active: true,
        },
      });
      userUpdated++;
    } else {
      await prisma.user.create({
        data: {
          name: item.userName,
          email: item.userEmail,
          passwordHash,
          role: UserRole.OPD,
          opdId: opd.id,
          active: true,
        },
      });
      userCreated++;
    }
  }

  console.log(`✅ OPD: ${opdCreated} dibuat baru, ${opdUpdated} diperbarui.`);
  console.log(`✅ User OPD: ${userCreated} dibuat baru, ${userUpdated} diperbarui.`);
  console.log(`🔑 Password default untuk akun Puskesmas baru: ${defaultPassword}`);
  console.log("==========================================");
}

main()
  .catch((err) => {
    console.error("❌ Gagal seeding data puskesmas:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
