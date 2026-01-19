import { sanitizeCSV } from '../CsvService.js';

describe('sanitizeCSV', () => {
    test('should return empty string when value is null or undefined', () => {
        expect(sanitizeCSV(null)).toBe('');
        expect(sanitizeCSV(undefined)).toBe('');
    });

    test('should add apostrophe when value starts with =, +, -, or @', () => {
        expect(sanitizeCSV('=value')).toBe("'=value");
        expect(sanitizeCSV('+value')).toBe("'+value");
        expect(sanitizeCSV('-value')).toBe("'-value");
        expect(sanitizeCSV('@value')).toBe("'@value");
    });

    test('should replace semicolons with commas', () => {
        expect(sanitizeCSV('a;b;c')).toBe('a,b,c');
    });

    test('should replace double quotes with two double quotes', () => {
        expect(sanitizeCSV('a"b"c')).toBe('a""b""c');
    });

    test('should return the string as is for general cases', () => {
        expect(sanitizeCSV('general case')).toBe('general case');
    });
});