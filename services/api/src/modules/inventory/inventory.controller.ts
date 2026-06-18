import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { AdjustStockDto, SetStockDto } from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get('low-stock')
  @ApiOperation({ summary: '[Admin] Products at or below their low-stock threshold' })
  lowStock() {
    return this.inventory.lowStock();
  }

  @Get(':productId')
  @ApiOperation({ summary: '[Admin] Get inventory for a product' })
  get(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.inventory.get(productId);
  }

  @Patch(':productId')
  @ApiOperation({ summary: '[Admin] Set absolute stock level' })
  setStock(@Param('productId', ParseUUIDPipe) productId: string, @Body() dto: SetStockDto) {
    return this.inventory.setStock(productId, dto);
  }

  @Post(':productId/adjust')
  @ApiOperation({ summary: '[Admin] Adjust stock by a signed delta' })
  adjust(@Param('productId', ParseUUIDPipe) productId: string, @Body() dto: AdjustStockDto) {
    return this.inventory.adjust(productId, dto);
  }
}
