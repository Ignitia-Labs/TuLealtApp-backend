import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Controlador de órdenes para Partner API
 * Ejemplo de estructura - los handlers se agregarán cuando se implementen
 */
@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  @Get()
  @ApiOperation({ summary: 'Obtener órdenes del partner' })
  @ApiResponse({
    status: 200,
    description: 'Lista de órdenes obtenida exitosamente',
  })
  async getOrders() {
    // TODO: Implementar handler GetOrdersByPartnerHandler
    return {
      message: 'Orders endpoint - handler to be implemented',
      orders: [],
    };
  }
}
