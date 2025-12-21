import { ApiProperty } from '@nestjs/swagger';
import { PricingPlan } from '@libs/domain';
import { PricingPlanSwaggerDto } from '../dto/pricing-plan-swagger.dto';

/**
 * DTO de response para activar/desactivar un plan de precios
 */
export class ToggleStatusPricingPlanResponse {
  @ApiProperty({
    description: 'Plan de precios actualizado',
    type: PricingPlanSwaggerDto,
  })
  plan: PricingPlan;

  @ApiProperty({
    description: 'Nuevo estado del plan',
    example: 'active',
    enum: ['active', 'inactive'],
  })
  status: 'active' | 'inactive';

  constructor(plan: PricingPlan) {
    this.plan = plan;
    this.status = plan.status;
  }
}
