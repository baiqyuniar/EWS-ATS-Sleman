import { PrismaService } from '../prisma/prisma.service';

/**
 * BR-02: Nomor Case harus unik, format APS-YYYY-000001, tidak pernah berubah.
 * Generates the next sequential case number for the current year.
 */
export async function generateCaseNumber(prisma: PrismaService): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `APS-${year}-`;

  const lastCase = await prisma.case.findFirst({
    where: { nomorKasus: { startsWith: prefix } },
    orderBy: { nomorKasus: 'desc' },
  });

  let nextSeq = 1;
  if (lastCase) {
    const lastSeqStr = lastCase.nomorKasus.replace(prefix, '');
    const lastSeq = parseInt(lastSeqStr, 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  return `${prefix}${String(nextSeq).padStart(6, '0')}`;
}
