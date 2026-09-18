import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { CardsService, toCardResponse } from './cards.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';
import { CreateCardDto, UpdateCardDto } from './dto/card.dto';

@Controller('cards')
export class CardsController {
  constructor(private readonly cards: CardsService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const rows = await this.cards.findAll(user.id);
    return rows.map(toCardResponse);
  }

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCardDto) {
    return toCardResponse(await this.cards.create(user.id, dto));
  }

  @Patch(':id')
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateCardDto) {
    return toCardResponse(await this.cards.update(user.id, id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.cards.remove(user.id, id);
  }
}
