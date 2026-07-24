import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MasterModule } from './master/master.module';
import { StudentsModule } from './students/students.module';
import { PredictionModule } from './prediction/prediction.module';
import { CasesModule } from './cases/cases.module';
import { HomeVisitModule } from './home-visit/home-visit.module';
import { ReferralModule } from './referral/referral.module';
import { InterventionModule } from './intervention/intervention.module';
import { ReviewModule } from './review/review.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // SECURITY: rate limiting global (mitigasi brute-force & DoS ringan).
    // Batas lebih ketat khusus /auth/login diatur lewat @Throttle() di AuthController.
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: 60_000, // 1 menit
          limit: Number(config.get<string>('THROTTLE_LIMIT') ?? 100),
        },
      ],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), process.env.UPLOAD_DIR || 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    MasterModule,
    StudentsModule,
    PredictionModule,
    CasesModule,
    HomeVisitModule,
    ReferralModule,
    InterventionModule,
    ReviewModule,
    MonitoringModule,
    DashboardModule,
    ReportsModule,
    UploadsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
