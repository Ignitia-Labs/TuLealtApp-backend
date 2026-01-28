import { Controller, Get, Param, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  ValidateInvitationCodeHandler,
  ValidateInvitationCodeRequest,
  ValidateInvitationCodeResponse,
} from '@libs/application';
import { NotFoundErrorResponseDto } from '@libs/shared';

/**
 * Controlador de códigos de invitación para Customer API
 * Endpoints públicos para validar códigos de invitación antes del registro
 *
 * Endpoints:
 * - GET /customer/invitation-codes/validate/:code - Validar código de invitación
 */
@ApiTags('Invitation Codes')
@Controller('invitation-codes')
export class InvitationCodesController {
  constructor(private readonly validateInvitationCodeHandler: ValidateInvitationCodeHandler) {}

  @Get('validate/:code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar código de invitación',
    description:
      'Valida un código de invitación y retorna información pública del tenant asociado. ' +
      'Este endpoint es público y permite al frontend validar códigos antes de mostrar el formulario de registro.',
  })
  @ApiParam({
    name: 'code',
    type: String,
    description: 'Código de invitación a validar',
    example: 'INV-ABC23456',
  })
  @ApiResponse({
    status: 200,
    description: 'Validación completada exitosamente',
    type: ValidateInvitationCodeResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Código no encontrado',
    type: NotFoundErrorResponseDto,
  })
  async validateInvitationCode(
    @Param('code') code: string,
  ): Promise<ValidateInvitationCodeResponse> {
    const request = new ValidateInvitationCodeRequest();
    request.code = code;

    const response = await this.validateInvitationCodeHandler.execute(request);

    // Si el código no existe, retornar 404
    if (!response.isValid && response.message === 'Código de invitación no encontrado') {
      throw new NotFoundException(response.message);
    }

    return response;
  }
}
