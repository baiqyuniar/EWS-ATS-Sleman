import { Module } from '@nestjs/common';
import { CasesModule } from '../cases/cases.module';
import { HomeVisitService } from './home-visit.service';
import { HomeVisitController } from './home-visit.controller';

@Module({
  imports: [CasesModule],
  providers: [HomeVisitService],
  controllers: [HomeVisitController],
})
export class HomeVisitModule {}
