import { Module } from '@nestjs/common';
import { AlatTransportasiService } from './alat-transportasi.service';
import { AlatTransportasiController } from './alat-transportasi.controller';

@Module({
  providers: [AlatTransportasiService],
  controllers: [AlatTransportasiController],
  exports: [AlatTransportasiService],
})
export class AlatTransportasiModule {}
