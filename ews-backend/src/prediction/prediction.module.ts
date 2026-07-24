import { Module } from '@nestjs/common';
import { PredictionService } from './prediction.service';
import { PredictionController } from './prediction.controller';
import { PredictionEngineService } from './prediction-engine.service';
import { MlClientService } from './ml-client.service';

@Module({
  providers: [PredictionService, PredictionEngineService, MlClientService],
  controllers: [PredictionController],
  exports: [PredictionService],
})
export class PredictionModule {}
