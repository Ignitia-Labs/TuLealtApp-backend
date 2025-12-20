import { ApiProperty } from '@nestjs/swagger';
import { PricingPlan } from '@libs/domain';
import { PricingPlanSwaggerDto } from '../dto/pricing-plan-swagger.dto';

/**
 * DTO de response para crear un plan de precios
 */
export class CreatePricingPlanResponse {
  @ApiProperty({
    description: 'Plan de precios creado',
    type: PricingPlanSwaggerDto,
  })
  plan: PricingPlan;

  constructor(plan: PricingPlan) {
    this.plan = plan;
  }
}

