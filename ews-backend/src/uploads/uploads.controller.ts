import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomBytes } from 'crypto';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * Simple local-disk file upload used by Home Visit photos and Intervention
 * attachments (BR-15, BR-16). Returns a URL the client then passes into
 * CreateHomeVisitDto.fotoUrls / UpdateInterventionResultDto.lampiranUrls.
 *
 * SECURITY: hanya menerima gambar (jpg/jpeg/png/webp) dan PDF — daftar ekstensi &
 * MIME type di-whitelist secara eksplisit (fileFilter) supaya file berbahaya
 * (.html, .svg, .js, .php, dll) tidak bisa diunggah lalu dilayani publik oleh
 * ServeStaticModule di /uploads, yang sebelumnya bisa dipakai untuk stored-XSS
 * atau menyamarkan malware sebagai lampiran kasus.
 *
 * PRODUCTION NOTE: swap `diskStorage` below for an S3/MinIO/GCS multer storage
 * engine when deploying, dan pertimbangkan signed/time-limited URL alih-alih
 * penyajian publik langsung — folder /uploads saat ini berisi foto kunjungan
 * rumah & lampiran kasus siswa yang termasuk data pribadi anak (UU PDP).
 */
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: process.env.UPLOAD_DIR || './uploads',
        filename: (_req, file, cb) => {
          // Nama file acak (bukan dari input pengguna sama sekali) — mencegah
          // path traversal maupun penebakan nama file oleh pihak lain.
          const unique = `${Date.now()}-${randomBytes(16).toString('hex')}`;
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${unique}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
          cb(new BadRequestException('Jenis file tidak diizinkan. Hanya JPG, PNG, WEBP, atau PDF.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan atau jenis file tidak diizinkan.');
    }
    return {
      fileName: file.filename,
      url: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
