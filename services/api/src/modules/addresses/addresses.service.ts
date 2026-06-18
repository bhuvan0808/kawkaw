import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.address.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(userId: string, id: string) {
    const address = await this.prisma.address.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  async create(userId: string, dto: CreateAddressDto) {
    return this.prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId, deletedAt: null } });
      const makeDefault = dto.isDefault || count === 0;
      if (makeDefault) {
        await tx.address.updateMany({
          where: { userId, deletedAt: null },
          data: { isDefault: false },
        });
      }
      return tx.address.create({
        data: {
          userId,
          type: dto.type,
          label: dto.label,
          line1: dto.line1,
          line2: dto.line2,
          landmark: dto.landmark,
          city: dto.city,
          state: dto.state,
          pincode: dto.pincode,
          latitude: dto.latitude,
          longitude: dto.longitude,
          isDefault: makeDefault,
          receiverName: dto.receiverName,
          receiverPhone: dto.receiverPhone,
        },
      });
    });
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    await this.findOne(userId, id);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.address.updateMany({
          where: { userId, deletedAt: null },
          data: { isDefault: false },
        });
      }
      return tx.address.update({ where: { id }, data: { ...dto } });
    });
  }

  async setDefault(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.$transaction([
      this.prisma.address.updateMany({
        where: { userId, deletedAt: null },
        data: { isDefault: false },
      }),
      this.prisma.address.update({ where: { id }, data: { isDefault: true } }),
    ]);
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.address.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
