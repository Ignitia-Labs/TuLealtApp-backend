import { Injectable, Inject } from '@nestjs/common';
import { ICurrencyRepository, Currency, ICountryRepository } from '@libs/domain';
import { BaseSeed } from '../base/base-seed';

/**
 * Seed para crear las monedas por defecto
 */
@Injectable()
export class CurrencySeed extends BaseSeed {
  constructor(
    @Inject('ICurrencyRepository')
    private readonly currencyRepository: ICurrencyRepository,
    @Inject('ICountryRepository')
    private readonly countryRepository: ICountryRepository,
  ) {
    super();
  }

  getName(): string {
    return 'CurrencySeed';
  }

  async run(): Promise<void> {
    this.log('Iniciando seed de monedas...');

    try {
      const currencies: Array<{
        code: string;
        name: string;
        symbol: string;
        symbolPosition: 'before' | 'after';
        decimalPlaces: number;
      }> = [
        // América del Norte
        {
          code: 'USD',
          name: 'Dólar Estadounidense',
          symbol: '$',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'MXN',
          name: 'Peso Mexicano',
          symbol: '$',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'CAD',
          name: 'Dólar Canadiense',
          symbol: '$',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        // América Central
        {
          code: 'GTQ',
          name: 'Quetzal Guatemalteco',
          symbol: 'Q',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'HNL',
          name: 'Lempira Hondureño',
          symbol: 'L',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'NIO',
          name: 'Córdoba Nicaragüense',
          symbol: 'C$',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'CRC',
          name: 'Colón Costarricense',
          symbol: '₡',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'PAB',
          name: 'Balboa Panameño',
          symbol: 'B/.',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'SVC',
          name: 'Colón Salvadoreño',
          symbol: '₡',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'BZD',
          name: 'Dólar Beliceño',
          symbol: 'BZ$',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        // América del Sur
        {
          code: 'COP',
          name: 'Peso Colombiano',
          symbol: '$',
          symbolPosition: 'before',
          decimalPlaces: 0,
        },
        {
          code: 'ARS',
          name: 'Peso Argentino',
          symbol: '$',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'CLP',
          name: 'Peso Chileno',
          symbol: '$',
          symbolPosition: 'before',
          decimalPlaces: 0,
        },
        {
          code: 'PEN',
          name: 'Sol Peruano',
          symbol: 'S/',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'BRL',
          name: 'Real Brasileño',
          symbol: 'R$',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'UYU',
          name: 'Peso Uruguayo',
          symbol: '$',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'PYG',
          name: 'Guaraní Paraguayo',
          symbol: '₲',
          symbolPosition: 'before',
          decimalPlaces: 0,
        },
        {
          code: 'BOB',
          name: 'Boliviano',
          symbol: 'Bs',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'VES',
          name: 'Bolívar Venezolano',
          symbol: 'Bs.',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'GYD',
          name: 'Dólar Guyanés',
          symbol: 'G$',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'SRD',
          name: 'Dólar Surinamés',
          symbol: '$',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        // Caribe
        {
          code: 'DOP',
          name: 'Peso Dominicano',
          symbol: 'RD$',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'CUP',
          name: 'Peso Cubano',
          symbol: '$',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'HTG',
          name: 'Gourde Haitiano',
          symbol: 'G',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'JMD',
          name: 'Dólar Jamaiquino',
          symbol: 'J$',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'TTD',
          name: 'Dólar de Trinidad y Tobago',
          symbol: 'TT$',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'BBD',
          name: 'Dólar de Barbados',
          symbol: 'Bds$',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'BSD',
          name: 'Dólar Bahameño',
          symbol: 'B$',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        {
          code: 'XCD',
          name: 'Dólar del Caribe Oriental',
          symbol: 'EC$',
          symbolPosition: 'before',
          decimalPlaces: 2,
        },
        // Otras (referencia internacional)
        { code: 'EUR', name: 'Euro', symbol: '€', symbolPosition: 'before', decimalPlaces: 2 },
      ];

      // Obtener todos los países una vez para asociar con monedas
      const countries = await this.countryRepository.findAll();
      const countriesByCurrencyCode = new Map<string, number>();
      countries.forEach((country) => {
        // Si hay múltiples países con la misma moneda, tomamos el primero
        // (ej: varios países usan USD o XCD)
        if (!countriesByCurrencyCode.has(country.currencyCode)) {
          countriesByCurrencyCode.set(country.currencyCode, country.id);
        }
      });

      for (const currencyData of currencies) {
        const existingCurrency = await this.currencyRepository.findByCode(currencyData.code);

        if (!existingCurrency) {
          // Buscar el país asociado por código de moneda
          const countryId = countriesByCurrencyCode.get(currencyData.code) || null;

          const currency = Currency.create(
            currencyData.code,
            currencyData.name,
            currencyData.symbol,
            currencyData.symbolPosition,
            currencyData.decimalPlaces,
            'active',
            countryId,
          );

          await this.currencyRepository.save(currency);
          const countryInfo = countryId
            ? ` (asociada a país ID: ${countryId})`
            : ' (sin país asociado)';
          this.log(`✓ Moneda creada: ${currencyData.code} - ${currencyData.name}${countryInfo}`);
        } else {
          // Si la moneda ya existe pero no tiene país asociado, intentar asociarlo
          if (!existingCurrency.countryId) {
            const countryId = countriesByCurrencyCode.get(currencyData.code);
            if (countryId) {
              const updatedCurrency = Currency.create(
                existingCurrency.code,
                existingCurrency.name,
                existingCurrency.symbol,
                existingCurrency.symbolPosition,
                existingCurrency.decimalPlaces,
                existingCurrency.status,
                countryId,
                existingCurrency.id,
              );
              await this.currencyRepository.save(updatedCurrency);
              this.log(
                `✓ Moneda actualizada: ${currencyData.code} - asociada a país ID: ${countryId}`,
              );
            } else {
              this.log(
                `- Moneda ya existe: ${currencyData.code} - ${currencyData.name} (sin país asociado)`,
              );
            }
          } else {
            this.log(
              `- Moneda ya existe: ${currencyData.code} - ${currencyData.name} (país ID: ${existingCurrency.countryId})`,
            );
          }
        }
      }

      this.log('✓ Seed de monedas completado exitosamente');
    } catch (error) {
      this.log(`✗ Error en seed de monedas: ${error.message}`);
      throw error;
    }
  }
}
