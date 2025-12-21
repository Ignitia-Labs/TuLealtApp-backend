import { ApiProperty } from '@nestjs/swagger';
import { PricingPlan } from '@libs/domain';
import { PricingPlanSwaggerDto } from '../dto/pricing-plan-swagger.dto';

/**
 * DTO de response para actualizar un plan de precios
 */
export class UpdatePricingPlanResponse {
  @ApiProperty({
    description: 'Plan de precios actualizado',
    type: PricingPlanSwaggerDto,
  })
  plan: PricingPlan;

  constructor(plan: PricingPlan) {
    this.plan = plan;
  }
}
