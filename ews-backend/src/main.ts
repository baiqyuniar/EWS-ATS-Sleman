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

  // SECURITY: NIK siswa disimpan terenkripsi (lihat src/common/crypto.util.ts)
  assertEncryptionKeyConfigured(config);

  const enableSwagger =
    !isProd || config.get<string>("ENABLE_SWAGGER_IN_PROD") === "true";

  // --- CORS: wajib dipasang sebelum middleware lain ---
  const envOrigins = (config.get<string>("CORS_ORIGIN") || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    ...envOrigins,
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (mobile apps, Postman, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (!isProd || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} blocked by CORS`));
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Accept",
      "Authorization",
      "X-Requested-With",
      "Origin",
    ],
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set("trust proxy", 1);

  // --- HTTP-01: paksa HTTPS jika diakses langsung tanpa HTTPS (hanya di production) ---
  // Catatan: Jika aplikasi di belakang reverse proxy (Nginx), Nginx biasanya sudah
  // menangani pengalihan HTTP ke HTTPS di port 80/443. Hanya redirect jika x-forwarded-proto
  // secara eksplisit berisi 'http', dan gunakan status 308 agar method POST tidak diubah jadi GET.
  if (isProd) {
    app.use((req, res, next) => {
      const forwardedProto = req.headers["x-forwarded-proto"];
      if (forwardedProto && forwardedProto !== "https") {
        return res.redirect(
          308,
          `https://${req.headers.host}${req.originalUrl}`,
        );
      }
      next();
    });
  }

  // --- Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, dll) ---
  app.use(
    helmet({
      contentSecurityPolicy: enableSwagger ? false : undefined,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      hsts: isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
      frameguard: { action: "deny" },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    }),
  );

  // HEADER-01: Permissions-Policy
  app.use((req, res, next) => {
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    next();
  });

  // --- Parsing cookie ---
  app.use(cookieParser());

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

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
  console.log(`EWS-APS backend running on http://localhost:${port}/api`);
  if (enableSwagger) {
    console.log(`Swagger docs at http://localhost:${port}/api/docs`);
  }
}
bootstrap();
