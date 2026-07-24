import { Module } from '@nestjs/common';
import { RiskFactorsService } from './risk-factors.service';
import { RiskFactorsController } from './risk-factors.controller';

@Module({
  providers: [RiskFactorsService],
  controllers: [RiskFactorsController],
  exports: [RiskFactorsService],
})
export class RiskFactorsModule {}
