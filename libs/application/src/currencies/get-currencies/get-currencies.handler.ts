import { Injectable, Inject } from '@nestjs/common';
import { GetCurrenciesRequest } from './get-currencies.request';
import { GetCurrenciesResponse } from './get-currencies.response';
import { ICurrencyRepository } from '@libs/domain';

/**
 * Handler para el caso de uso de obtener monedas
 */
@Injectable()
export class GetCurrenciesHandler {
  constructor(
    @Inject('ICurrencyRepository')
    private readonly currencyRepository: ICurrencyRepository,
  ) {}

  async execute(request: GetCurrenciesRequest): Promise<GetCurrenciesResponse> {
    const currencies = request.includeInactive
      ? await this.currencyRepository.findAll()
      : await this.currencyRepository.findAllActive();

    return new GetCurrenciesResponse(currencies);
  }
}
