import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';
import { IncomesService, toIncomeResponse } from './incomes.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';

@Controller('incomes')
export class IncomesController {
  constructor(private readonly incomes: IncomesService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const rows = await this.incomes.findAll(user.id);
    return rows.map(toIncomeResponse);
  }

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateIncomeDto) {
    const row = await this.incomes.create(user.id, dto);
    return toIncomeResponse(row);
  }

  @Patch(':id')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateIncomeDto) {
    const row = await this.incomes.update(user.id, id, dto);
    return toIncomeResponse(row);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.incomes.remove(user.id, id);
  }
}
