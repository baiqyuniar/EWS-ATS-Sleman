import { Module } from '@nestjs/common';
import { AgamaService } from './agama.service';
import { AgamaController } from './agama.controller';

@Module({
  providers: [AgamaService],
  controllers: [AgamaController],
  exports: [AgamaService],
})
export class AgamaModule {}
