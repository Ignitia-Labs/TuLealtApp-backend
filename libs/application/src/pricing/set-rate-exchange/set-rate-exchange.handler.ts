import { Injectable, Inject } from '@nestjs/common';
import { IRateExchangeRepository } from '@libs/domain';
import { SetRateExchangeRequest } from './set-rate-exchange.request';
import { SetRateExchangeResponse } from './set-rate-exchange.response';

/**
 * Handler para el caso de uso de establecer/actualizar el tipo de cambio
 */
@Injectable()
export class SetRateExchangeHandler {
  constructor(
    @Inject('IRateExchangeRepository')
    private readonly rateExchangeRepository: IRateExchangeRepository,
  ) {}

  async execute(request: SetRateExchangeRequest): Promise<SetRateExchangeResponse> {
    const rateExchange = await this.rateExchangeRepository.setRate(request.rate);

    return new SetRateExchangeResponse(rateExchange);
  }
}

