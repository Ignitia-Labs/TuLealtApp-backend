import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para eliminar un plan de precios
 */
export class DeletePricingPlanResponse {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Pricing plan deleted successfully',
  })
  message: string;

  @ApiProperty({
    description: 'ID del plan eliminado',
    example: 1,
  })
  planId: number;

  constructor(planId: number) {
    this.planId = planId;
    this.message = 'Pricing plan deleted successfully';
  }
}
