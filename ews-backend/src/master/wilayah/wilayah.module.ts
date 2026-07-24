import { Module } from '@nestjs/common';
import { WilayahService } from './wilayah.service';
import { WilayahController } from './wilayah.controller';

@Module({
  providers: [WilayahService],
  controllers: [WilayahController],
  exports: [WilayahService],
})
export class WilayahModule {}
