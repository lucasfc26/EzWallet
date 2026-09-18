import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';
import { ChargesService, toChargeResponse } from './charges.service';
import { toIncomeResponse } from '../incomes/incomes.service';
import { CreateChargeDto } from './dto/create-charge.dto';
import { UpdateChargeDto } from './dto/update-charge.dto';
import { SettleChargeDto } from './dto/settle-charge.dto';

@Controller('charges')
export class ChargesController {
  constructor(private readonly charges: ChargesService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const rows = await this.charges.findAll(user.id);
    return rows.map(toChargeResponse);
  }

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateChargeDto) {
    const row = await this.charges.create(user.id, dto);
    return toChargeResponse(row);
  }

  @Patch(':id')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateChargeDto) {
    const row = await this.charges.update(user.id, id, dto);
    return toChargeResponse(row);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.charges.remove(user.id, id);
  }

  @Post(':id/settle')
  async settle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: SettleChargeDto,
  ) {
    const { charge, income } = await this.charges.settle(user.id, id, body?.receivedAt);
    return { charge: toChargeResponse(charge), income: toIncomeResponse(income) };
  }
}
