// import { NestFactory } from '@nestjs/core';
// import { ConfigService } from '@nestjs/config';
// import { ValidationPipe } from '@nestjs/common';
// import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// import helmet from 'helmet';
// import { AppModule } from './app.module';
// import { AllExceptionsFilter } from './common/all-exceptions.filter';
// import { assertEncryptionKeyConfigured } from './config/security.config';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   const config = app.get(ConfigService);
//   const isProd = config.get<string>('NODE_ENV') === 'production';

//   // SECURITY: NIK siswa disimpan terenkripsi (lihat src/common/crypto.util.ts) —
//   // menolak start kalau ENCRYPTION_KEY belum diset/tidak valid, sama seperti
//   // validasi JWT_SECRET (fail fast saat deploy, bukan saat data sudah bocor).
//   assertEncryptionKeyConfigured(config);

//   // --- Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, dll) ---
//   // CSP dimatikan otomatis saat Swagger UI aktif (Swagger butuh inline script/style)
//   // — di production Swagger sudah dinonaktifkan secara default (lihat di bawah),
//   // jadi CSP ketat otomatis berlaku begitu Swagger tidak dimount.
//   const enableSwagger = !isProd || config.get<string>('ENABLE_SWAGGER_IN_PROD') === 'true';
//   app.use(
//     helmet({
//       contentSecurityPolicy: enableSwagger ? false : undefined,
//     }),
//   );

//   // --- CORS: whitelist eksplisit, bukan wildcard terbuka ---
//   const corsOrigins = (config.get<string>('CORS_ORIGIN') || 'http://localhost:5173')
//     .split(',')
//     .map((o) => o.trim())
//     .filter(Boolean);
//   app.enableCors({
//     origin: corsOrigins,
//     credentials: true,
//   });

//   app.setGlobalPrefix('api');

//   app.useGlobalPipes(
//     new ValidationPipe({
//       whitelist: true, // strip properties not defined in DTOs
//       transform: true, // auto-transform payloads to DTO instances
//       forbidNonWhitelisted: true, // tolak payload dengan field tak dikenal (bukan cuma diam-diam dibuang)
//     }),
//   );

//   // --- Jangan pernah membocorkan stack trace / detail internal ke client ---
//   app.useGlobalFilters(new AllExceptionsFilter());

//   // --- Swagger: nonaktif di production secara default (mengurangi permukaan
//   // reconnaissance — skema API lengkap tidak perlu terbuka untuk publik) ---
//   if (enableSwagger) {
//     const swaggerConfig = new DocumentBuilder()
//       .setTitle('EWS-APS Kabupaten Sleman API')
//       .setDescription(
//         'Early Warning System Anak Putus Sekolah - REST API sesuai SRS (Alur Pencegahan & Penanganan)',
//       )
//       .setVersion('1.0')
//       .addBearerAuth()
//       .build();
//     const document = SwaggerModule.createDocument(app, swaggerConfig);
//     SwaggerModule.setup('api/docs', app, document);
//   }

//   const port = config.get<string>('PORT') ? parseInt(config.get<string>('PORT') as string, 10) : 3000;
//   await app.listen(port);
//   // eslint-disable-next-line no-console
//   console.log(`EWS-APS backend running on http://localhost:${port}/api`);
//   if (enableSwagger) {
//     // eslint-disable-next-line no-console
//     console.log(`Swagger docs at http://localhost:${port}/api/docs`);
//   }
// }
// bootstrap();

import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import { assertEncryptionKeyConfigured } from "./config/security.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const isProd = config.get<string>("NODE_ENV") === "production";

  // SECURITY: NIK siswa disimpan terenkripsi (lihat src/common/crypto.util.ts) —
  // menolak start kalau ENCRYPTION_KEY belum diset/tidak valid, sama seperti
  // validasi JWT_SECRET (fail fast saat deploy, bukan saat data sudah bocor).
  assertEncryptionKeyConfigured(config);

  const enableSwagger =
    !isProd || config.get<string>("ENABLE_SWAGGER_IN_PROD") === "true";

  // --- HTTP-01: paksa HTTPS sebelum apa pun diproses ---
  // Aman dipakai baik Node terekspos langsung maupun di belakang reverse
  // proxy/load balancer (yang biasanya set header x-forwarded-proto).
  // Kalau proxy di depan SUDAH melakukan redirect HTTP→HTTPS sendiri,
  // blok ini boleh dihapus — tapi membiarkannya tetap aman (no-op saat
  // koneksi sudah HTTPS).
  if (isProd) {
    app.use((req, res, next) => {
      const proto =
        (req.headers["x-forwarded-proto"] as string) ??
        (req.secure ? "https" : "http");
      if (proto !== "https") {
        return res.redirect(
          301,
          `https://${req.headers.host}${req.originalUrl}`,
        );
      }
      next();
    });
  }

  // --- Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, dll) ---
  // CSP dimatikan otomatis saat Swagger UI aktif (Swagger butuh inline script/style)
  // — di production Swagger sudah dinonaktifkan secara default (lihat di bawah),
  // jadi CSP ketat otomatis berlaku begitu Swagger tidak dimount.
  app.use(
    helmet({
      contentSecurityPolicy: enableSwagger ? false : undefined,
      hsts: { maxAge: 31536000, includeSubDomains: true },
      frameguard: { action: "deny" }, // ← tambahan
      referrerPolicy: { policy: "strict-origin-when-cross-origin" }, // ← tambahan
    }),
  );

  // HEADER-01: helmet tidak menyertakan Permissions-Policy secara default —
  // ini satu-satunya header dari daftar remediasi yang perlu ditambah manual.
  app.use((req, res, next) => {
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    next();
  });

  // --- Parsing cookie: dibutuhkan karena JWT sekarang dikirim lewat cookie
  // httpOnly (lihat ACCESS_TOKEN_COOKIE di security.config.ts), bukan lewat
  // header Authorization yang disimpan di localStorage frontend. ---
  app.use(cookieParser());

  // --- CORS: whitelist eksplisit, bukan wildcard terbuka ---
  const corsOrigins = (
    config.get<string>("CORS_ORIGIN") || "http://localhost:5173"
  )
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties not defined in DTOs
      transform: true, // auto-transform payloads to DTO instances
      forbidNonWhitelisted: true, // tolak payload dengan field tak dikenal (bukan cuma diam-diam dibuang)
    }),
  );

  // --- Jangan pernah membocorkan stack trace / detail internal ke client ---
  app.useGlobalFilters(new AllExceptionsFilter());

  // --- Swagger: nonaktif di production secara default (mengurangi permukaan
  // reconnaissance — skema API lengkap tidak perlu terbuka untuk publik) ---
  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("EWS-APS Kabupaten Sleman API")
      .setDescription(
        "Early Warning System Anak Putus Sekolah - REST API sesuai SRS (Alur Pencegahan & Penanganan)",
      )
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document);
  }

  const port = config.get<string>("PORT")
    ? parseInt(config.get<string>("PORT") as string, 10)
    : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`EWS-APS backend running on http://localhost:${port}/api`);
  if (enableSwagger) {
    // eslint-disable-next-line no-console
    console.log(`Swagger docs at http://localhost:${port}/api/docs`);
  }
}
bootstrap();
