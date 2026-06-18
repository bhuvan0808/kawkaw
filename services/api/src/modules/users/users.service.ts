import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto, paginate } from '../../common/dto/pagination.dto';
import { UserRole } from '../../common/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { SetUserActiveDto, UpdateProfileDto, UpdateUserRoleDto } from './dto/user.dto';

const publicSelect = {
  id: true,
  phone: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  lastLoginAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        ...publicSelect,
        addresses: { where: { deletedAt: null }, orderBy: { isDefault: 'desc' } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.ensureExists(userId);
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name ?? undefined,
        email: dto.email ?? undefined,
        fcmToken: dto.fcmToken ?? undefined,
      },
      select: publicSelect,
    });
  }

  async updateFcmToken(userId: string, fcmToken: string) {
    await this.ensureExists(userId);
    await this.prisma.user.update({ where: { id: userId }, data: { fcmToken } });
  }

  // --- Admin operations ----------------------------------------------------

  async list(query: PaginationQueryDto, role?: UserRole) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(role ? { role } : {}),
      ...(query.search
        ? {
            OR: [
              { phone: { contains: query.search } },
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: publicSelect,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(items, total, query.page, query.pageSize);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { ...publicSelect, fcmToken: false },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setActive(id: string, dto: SetUserActiveDto) {
    await this.ensureExists(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: dto.isActive },
      select: publicSelect,
    });
  }

  async updateRole(id: string, dto: UpdateUserRoleDto) {
    await this.ensureExists(id);
    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      select: publicSelect,
    });
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('User not found');
  }
}
