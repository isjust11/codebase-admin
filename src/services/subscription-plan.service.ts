import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { SubscriptionPlanEnum } from 'src/enums/subscription-plan.enum';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from '../dtos/subscription-plan.dto';

@Injectable()
export class SubscriptionPlanService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
  ) { }

  async findAll(activeOnly = false): Promise<SubscriptionPlan[]> {
    const qb = this.planRepository.createQueryBuilder('p').orderBy('p.sortOrder', 'ASC');
    if (activeOnly) {
      qb.andWhere('p.isActive = :active', { active: true });
    }
    return qb.getMany();
  }

  async findById(id: number): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Subscription plan #${id} not found`);
    }
    return plan;
  }

  async findByCode(code: SubscriptionPlanEnum): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.findOne({ where: { code } });
    if (!plan) {
      throw new NotFoundException(`Plan ${code} not found`);
    }
    return plan;
  }

  async create(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const plan = this.planRepository.create({
      ...dto,
      storageLimitBytes: String(dto.storageLimitBytes ?? 0),
    });
    return this.planRepository.save(plan);
  }

  async update(id: number, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const plan = await this.findById(id);
    const updates: Partial<SubscriptionPlan> = { ...dto } as any;
    if (dto.storageLimitBytes !== undefined) {
      updates.storageLimitBytes = String(dto.storageLimitBytes);
    }
    Object.assign(plan, updates);
    plan.id = id;
    return this.planRepository.save(plan);
  }

  async remove(id: number): Promise<void> {
    const plan = await this.findById(id);
    await this.planRepository.remove(plan);
  }

  getMetadata() {
    return {
      codes: Object.values(SubscriptionPlanEnum),
      periodTypes: ['month', 'six_month', 'year', 'lifetime'],
    };
  }
}
