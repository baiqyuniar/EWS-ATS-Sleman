import { Module } from '@nestjs/common';
import { PekerjaanOrtuService } from './pekerjaan-ortu.service';
import { PekerjaanOrtuController } from './pekerjaan-ortu.controller';

@Module({
  providers: [PekerjaanOrtuService],
  controllers: [PekerjaanOrtuController],
  exports: [PekerjaanOrtuService],
})
export class PekerjaanOrtuModule {}
