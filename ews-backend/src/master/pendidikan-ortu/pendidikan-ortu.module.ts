import { Module } from '@nestjs/common';
import { PendidikanOrtuService } from './pendidikan-ortu.service';
import { PendidikanOrtuController } from './pendidikan-ortu.controller';

@Module({
  providers: [PendidikanOrtuService],
  controllers: [PendidikanOrtuController],
  exports: [PendidikanOrtuService],
})
export class PendidikanOrtuModule {}
