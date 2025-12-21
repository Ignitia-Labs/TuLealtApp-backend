import { ApiProperty } from '@nestjs/swagger';
import { PricingPlan } from '@libs/domain';
import { PricingPlanSwaggerDto } from '../dto/pricing-plan-swagger.dto';

/**
 * DTO de response para obtener un plan de precios por slug
 */
export class GetPricingPlanBySlugResponse {
  @ApiProperty({
    description: 'Plan de precios',
    type: PricingPlanSwaggerDto,
  })
  plan: PricingPlan;

  constructor(plan: PricingPlan) {
    this.plan = plan;
  }
}
