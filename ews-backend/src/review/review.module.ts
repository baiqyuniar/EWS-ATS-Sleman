import { Module } from '@nestjs/common';
import { CasesModule } from '../cases/cases.module';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';

@Module({
  imports: [CasesModule],
  providers: [ReviewService],
  controllers: [ReviewController],
})
export class ReviewModule {}
