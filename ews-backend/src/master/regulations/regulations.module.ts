import { Module } from '@nestjs/common';
import { RegulationsService } from './regulations.service';
import { RegulationsController } from './regulations.controller';

@Module({
  providers: [RegulationsService],
  controllers: [RegulationsController],
  exports: [RegulationsService],
})
export class RegulationsModule {}
