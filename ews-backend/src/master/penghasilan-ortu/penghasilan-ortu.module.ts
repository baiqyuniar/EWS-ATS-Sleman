import { Module } from '@nestjs/common';
import { PenghasilanOrtuService } from './penghasilan-ortu.service';
import { PenghasilanOrtuController } from './penghasilan-ortu.controller';

@Module({
  providers: [PenghasilanOrtuService],
  controllers: [PenghasilanOrtuController],
  exports: [PenghasilanOrtuService],
})
export class PenghasilanOrtuModule {}
