import { Module } from '@nestjs/common';
import { ChargesController } from './charges.controller';
import { ChargesService } from './charges.service';
import { IncomesModule } from '../incomes/incomes.module';

@Module({
  imports: [IncomesModule],
  controllers: [ChargesController],
  providers: [ChargesService],
  exports: [ChargesService],
})
export class ChargesModule {}
