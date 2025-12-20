import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { IRateExchangeRepository } from '@libs/domain';
import { GetRateExchangeRequest } from './get-rate-exchange.request';
import { GetRateExchangeResponse } from './get-rate-exchange.response';

/**
 * Handler para el caso de uso de obtener el tipo de cambio actual
 */
@Injectable()
export class GetRateExchangeHandler {
  constructor(
    @Inject('IRateExchangeRepository')
    private readonly rateExchangeRepository: IRateExchangeRepository,
  ) {}

  async execute(request: GetRateExchangeRequest): Promise<GetRateExchangeResponse> {
    const rateExchange = await this.rateExchangeRepository.getCurrent();

    if (!rateExchange) {
      throw new NotFoundException('Rate exchange not found. Please configure the exchange rate first.');
    }

    return new GetRateExchangeResponse(rateExchange);
  }
}

