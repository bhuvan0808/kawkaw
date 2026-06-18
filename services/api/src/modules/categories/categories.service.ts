import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ServiceType } from '../../common/enums';
import { slugify } from '../../common/utils/slug.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public listing — active categories, optionally filtered by service. */
  async listPublic(serviceType?: ServiceType) {
    return this.prisma.category.findMany({
      where: { deletedAt: null, isActive: true, ...(serviceType ? { serviceType } : {}) },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async listAll(serviceType?: ServiceType) {
    return this.prisma.category.findMany({
      where: { deletedAt: null, ...(serviceType ? { serviceType } : {}) },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findFirst({ where: { id, deletedAt: null } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const data: Prisma.CategoryCreateInput = {
      name: dto.name,
      slug: dto.slug ? slugify(dto.slug) : slugify(dto.name),
      description: dto.description,
      imageUrl: dto.imageUrl,
      serviceType: dto.serviceType,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      ...(dto.parentId ? { parent: { connect: { id: dto.parentId } } } : {}),
    };
    return this.prisma.category.create({ data });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    return this.prisma.category.update({
      where: { id },
      data: {
        ...dto,
        slug: dto.slug ? slugify(dto.slug) : undefined,
        parentId: dto.parentId ?? undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
