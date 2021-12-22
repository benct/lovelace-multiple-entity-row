// Source: https://github.com/home-assistant/frontend/blob/dev/src/common/number/format_number.ts

import { NumberFormat } from './constants';

export const round = (value, precision = 2) => Math.round(value * 10 ** precision) / 10 ** precision;

export const isNumericState = (stateObj) =>
    !!stateObj.attributes.unit_of_measurement || !!stateObj.attributes.state_class;

export const numberFormatToLocale = (localeOptions) => {
    switch (localeOptions.number_format) {
        case NumberFormat.comma_decimal:
            return ['en-US', 'en']; // Use United States with fallback to English formatting 1,234,567.89
        case NumberFormat.decimal_comma:
            return ['de', 'es', 'it']; // Use German with fallback to Spanish then Italian formatting 1.234.567,89
        case NumberFormat.space_comma:
            return ['fr', 'sv', 'cs']; // Use French with fallback to Swedish and Czech formatting 1 234 567,89
        case NumberFormat.system:
            return undefined;
        default:
            return localeOptions.language;
    }
};

export const formatNumber = (num, localeOptions, options) => {
    const locale = localeOptions ? numberFormatToLocale(localeOptions) : undefined;

    // Polyfill for Number.isNaN, which is more reliable than the global isNaN()
    Number.isNaN =
        Number.isNaN ||
        function isNaN(input) {
            return typeof input === 'number' && isNaN(input);
        };

    if (localeOptions?.number_format !== NumberFormat.none && !Number.isNaN(Number(num)) && Intl) {
        try {
            return new Intl.NumberFormat(locale, getDefaultFormatOptions(num, options)).format(Number(num));
        } catch (err) {
            // Don't fail when using "TEST" language
            // eslint-disable-next-line no-console
            console.error(err);
            return new Intl.NumberFormat(undefined, getDefaultFormatOptions(num, options)).format(Number(num));
        }
    }
    if (typeof num === 'string') {
        return num;
    }
    return `${round(num, options?.maximumFractionDigits).toString()}${
        options?.style === 'currency' ? ` ${options.currency}` : ''
    }`;
};

const getDefaultFormatOptions = (num, options) => {
    const defaultOptions = {
        maximumFractionDigits: 2,
        ...options,
    };

    if (typeof num !== 'string') {
        return defaultOptions;
    }

    // Keep decimal trailing zeros if they are present in a string numeric value
    if (!options || (!options.minimumFractionDigits && !options.maximumFractionDigits)) {
        const digits = num.indexOf('.') > -1 ? num.split('.')[1].length : 0;
        defaultOptions.minimumFractionDigits = digits;
        defaultOptions.maximumFractionDigits = digits;
    }

    return defaultOptions;
};
