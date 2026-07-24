import { Module } from '@nestjs/common';
import { KebutuhanKhususService } from './kebutuhan-khusus.service';
import { KebutuhanKhususController } from './kebutuhan-khusus.controller';

@Module({
  providers: [KebutuhanKhususService],
  controllers: [KebutuhanKhususController],
  exports: [KebutuhanKhususService],
})
export class KebutuhanKhususModule {}
