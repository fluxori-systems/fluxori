import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query } from '@nestjs/common';
import { OfferService, Offer, CreateOfferDto, UpdateOfferDto } from '../services/offer.service';

@Controller('offers')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post()
  create(@Body() dto: CreateOfferDto): Offer {
    return this.offerService.createOffer(dto);
  }

  @Get(':id')
  getById(@Param('id') id: string): Offer {
    return this.offerService.getOfferById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOfferDto): Offer {
    return this.offerService.updateOffer(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string): void {
    this.offerService.deleteOffer(id);
  }

  @Get()
  listByProduct(@Query('productId') productId: string): Offer[] {
    if (!productId) throw new NotFoundException('productId query param required');
    return this.offerService.listOffersByProduct(productId);
  }
}
