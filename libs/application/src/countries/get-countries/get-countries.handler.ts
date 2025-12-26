import { Injectable, Inject } from '@nestjs/common';
import { GetCountriesRequest } from './get-countries.request';
import { GetCountriesResponse } from './get-countries.response';
import { ICountryRepository } from '@libs/domain';

/**
 * Handler para el caso de uso de obtener países
 */
@Injectable()
export class GetCountriesHandler {
  constructor(
    @Inject('ICountryRepository')
    private readonly countryRepository: ICountryRepository,
  ) {}

  async execute(request: GetCountriesRequest): Promise<GetCountriesResponse> {
    const countries = request.includeInactive
      ? await this.countryRepository.findAll()
      : await this.countryRepository.findAllActive();

    return new GetCountriesResponse(countries);
  }
}

