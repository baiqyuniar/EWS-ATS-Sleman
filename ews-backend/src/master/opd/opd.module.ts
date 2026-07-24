import { Module } from '@nestjs/common';
import { OpdService } from './opd.service';
import { OpdController } from './opd.controller';

@Module({
  providers: [OpdService],
  controllers: [OpdController],
  exports: [OpdService],
})
export class OpdModule {}
