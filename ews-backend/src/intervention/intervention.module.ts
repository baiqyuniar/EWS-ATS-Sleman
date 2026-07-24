import { Module } from '@nestjs/common';
import { CasesModule } from '../cases/cases.module';
import { InterventionService } from './intervention.service';
import { InterventionController } from './intervention.controller';

@Module({
  imports: [CasesModule],
  providers: [InterventionService],
  controllers: [InterventionController],
})
export class InterventionModule {}
