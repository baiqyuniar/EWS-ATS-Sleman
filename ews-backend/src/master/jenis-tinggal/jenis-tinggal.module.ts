import { Module } from '@nestjs/common';
import { JenisTinggalService } from './jenis-tinggal.service';
import { JenisTinggalController } from './jenis-tinggal.controller';

@Module({
  providers: [JenisTinggalService],
  controllers: [JenisTinggalController],
  exports: [JenisTinggalService],
})
export class JenisTinggalModule {}
