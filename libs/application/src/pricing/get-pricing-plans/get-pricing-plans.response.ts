import { ApiProperty } from '@nestjs/swagger';
import { PricingPlan } from '@libs/domain';
import { PricingPlanSwaggerDto } from '../dto/pricing-plan-swagger.dto';

/**
 * DTO de response para obtener planes de precios
 */
export class GetPricingPlansResponse {
  @ApiProperty({
    description: 'Lista de planes de precios',
    type: PricingPlanSwaggerDto,
    isArray: true,
  })
  plans: PricingPlan[];

  constructor(plans: PricingPlan[]) {
    this.plans = plans;
  }
}

