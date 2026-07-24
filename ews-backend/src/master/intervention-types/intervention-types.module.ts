import { Module } from '@nestjs/common';
import { InterventionTypesService } from './intervention-types.service';
import { InterventionTypesController } from './intervention-types.controller';

@Module({
  providers: [InterventionTypesService],
  controllers: [InterventionTypesController],
  exports: [InterventionTypesService],
})
export class InterventionTypesModule {}
