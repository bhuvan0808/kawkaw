import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdjustStockDto, SetStockDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async get(productId: string) {
    const inventory = await this.prisma.inventory.findFirst({
      where: { productId, deletedAt: null },
    });
    if (!inventory) throw new NotFoundException('Inventory record not found');
    return inventory;
  }

  async setStock(productId: string, dto: SetStockDto) {
    if (dto.quantity < 0) throw new BadRequestException('Quantity cannot be negative');
    await this.get(productId);
    return this.prisma.inventory.update({
      where: { productId },
      data: {
        quantity: dto.quantity,
        isInStock: dto.quantity > 0,
        lowStockThreshold: dto.lowStockThreshold ?? undefined,
        warehouseLocation: dto.warehouseLocation ?? undefined,
      },
    });
  }

  async adjust(productId: string, dto: AdjustStockDto) {
    const inventory = await this.get(productId);
    const next = inventory.quantity + dto.delta;
    if (next < 0) throw new BadRequestException('Adjustment would make stock negative');
    return this.prisma.inventory.update({
      where: { productId },
      data: { quantity: next, isInStock: next > 0 },
    });
  }

  async lowStock() {
    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; productId: string; quantity: number; lowStockThreshold: number }>
    >`SELECT id, "productId", quantity, "lowStockThreshold"
      FROM inventory
      WHERE "deletedAt" IS NULL AND quantity <= "lowStockThreshold"
      ORDER BY quantity ASC`;
    return rows;
  }

  /**
   * Atomically decrement stock for an order, inside the caller's transaction.
   * Throws ConflictException if insufficient stock — used by order placement.
   */
  async decrementForOrder(
    tx: Prisma.TransactionClient,
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<void> {
    for (const item of items) {
      const inv = await tx.inventory.findFirst({
        where: { productId: item.productId, deletedAt: null },
      });
      if (!inv) throw new NotFoundException(`Inventory missing for product ${item.productId}`);
      if (inv.quantity < item.quantity) {
        throw new ConflictException(`Insufficient stock for product ${item.productId}`);
      }
      const next = inv.quantity - item.quantity;
      await tx.inventory.update({
        where: { productId: item.productId },
        data: { quantity: next, isInStock: next > 0 },
      });
    }
  }

  /** Restore stock when an order is cancelled. */
  async restoreForOrder(
    tx: Prisma.TransactionClient,
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<void> {
    for (const item of items) {
      await tx.inventory.updateMany({
        where: { productId: item.productId, deletedAt: null },
        data: { quantity: { increment: item.quantity }, isInStock: true },
      });
    }
  }
}
