import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { PaymentOptionsService, toPaymentOptionResponse } from './payment-options.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';
import { CreatePaymentOptionDto, UpdatePaymentOptionDto } from './dto/payment-option.dto';

@Controller('payment-options')
export class PaymentOptionsController {
  constructor(private readonly options: PaymentOptionsService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const rows = await this.options.findAll(user.id);
    return rows.map(toPaymentOptionResponse);
  }

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePaymentOptionDto) {
    return toPaymentOptionResponse(await this.options.create(user.id, dto));
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePaymentOptionDto,
  ) {
    return toPaymentOptionResponse(await this.options.update(user.id, id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.options.remove(user.id, id);
  }
}
