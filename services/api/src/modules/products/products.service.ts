import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginate } from '../../common/dto/pagination.dto';
import { ServiceType } from '../../common/enums';
import { uniqueSlug } from '../../common/utils/slug.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, ProductQueryDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ProductQueryDto, activeOnly = true) {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(activeOnly ? { isActive: true } : {}),
      ...(query.serviceType ? { serviceType: query.serviceType } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.featured !== undefined ? { isFeatured: query.featured } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: { category: true, inventory: true },
        orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.product.count({ where }),
    ]);
    return paginate(items, total, query.page, query.pageSize);
  }

  async featured(serviceType?: ServiceType) {
    return this.prisma.product.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        isFeatured: true,
        ...(serviceType ? { serviceType } : {}),
      },
      include: { category: true, inventory: true },
      take: 20,
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { category: true, inventory: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug: dto.slug ? dto.slug : uniqueSlug(dto.name),
        description: dto.description,
        imageUrl: dto.imageUrl,
        images: dto.images ?? [],
        categoryId: dto.categoryId,
        serviceType: dto.serviceType,
        sku: dto.sku,
        price: dto.price,
        mrp: dto.mrp,
        unit: dto.unit ?? '1 unit',
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
        requiresPrescription: dto.requiresPrescription ?? false,
        inventory: {
          create: {
            quantity: dto.initialStock ?? 0,
            isInStock: (dto.initialStock ?? 0) > 0,
          },
        },
      },
      include: { category: true, inventory: true },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    const { initialStock: _initialStock, ...rest } = dto;
    return this.prisma.product.update({
      where: { id },
      data: { ...rest, slug: dto.slug ?? undefined },
      include: { category: true, inventory: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
