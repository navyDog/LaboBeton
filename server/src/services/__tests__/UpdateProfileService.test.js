import { prepareUserUpdates, validateLogoSize, handlePasswordUpdate } from '../UpdateProfileService.js';
import bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('prepareUserUpdates', () => {
    test('should return updates with all fields defined', () => {
        const body = {
            companyName: 'Company Name',
            address: 'Address',
            contact: 'Contact',
            siret: 'Siret',
            apeCode: 'ApeCode',
            legalInfo: 'Legal Info'
        };
        const updates = prepareUserUpdates(body);
        expect(updates).toEqual({
            companyName: 'Company Name',
            address: 'Address',
            contact: 'Contact',
            siret: 'Siret',
            apeCode: 'ApeCode',
            legalInfo: 'Legal Info'
        });
    });

    test('should ignore undefined fields', () => {
        const body = {
            companyName: 'Company Name',
            address: undefined,
            contact: 'Contact',
            siret: undefined,
            apeCode: 'ApeCode',
            legalInfo: undefined
        };
        const updates = prepareUserUpdates(body);
        expect(updates).toEqual({
            companyName: 'Company Name',
            contact: 'Contact',
            apeCode: 'ApeCode'
        });
    });

    test('should truncate fields to max length', () => {
        const body = {
            companyName: 'A'.repeat(150),
            address: 'A'.repeat(350),
            contact: 'A'.repeat(150),
            siret: 'A'.repeat(60),
            apeCode: 'A'.repeat(30),
            legalInfo: 'A'.repeat(250)
        };
        const updates = prepareUserUpdates(body);
        expect(updates).toEqual({
            companyName: 'A'.repeat(100),
            address: 'A'.repeat(300),
            contact: 'A'.repeat(100),
            siret: 'A'.repeat(50),
            apeCode: 'A'.repeat(20),
            legalInfo: 'A'.repeat(200)
        });
    });
});

describe('validateLogoSize', () => {
    test('should return null when logo is undefined', () => {
        expect(validateLogoSize(undefined)).toBeNull();
    });

    test('should return null when logo size is less than or equal to 1MB', () => {
        const logo = 'A'.repeat(1400000);
        expect(validateLogoSize(logo)).toBeNull();
    });

    test('should return error message when logo size is greater than 1MB', () => {
        const logo = 'A'.repeat(1400001);
        expect(validateLogoSize(logo)).toEqual({ message: "Logo trop volumineux (max 1MB)" });
    });
});

describe('handlePasswordUpdate', () => {
    test('should return null error and empty fields when password is null or empty', async () => {
        const result = await handlePasswordUpdate(null, {});
        expect(result).toEqual({ error: null, fields: {} });
    });

    test('should return error message when password is too short', async () => {
        const result = await handlePasswordUpdate('short', {});
        expect(result).toEqual({ error: { message: "Mot de passe trop court." }, fields: {} });
    });

    test('should return hashed password and incremented tokenVersion when password is valid', async () => {
        const user = { tokenVersion: 1 };
        const password = 'validpassword';
        const salt = 'salt';
        const hashedPassword = 'hashedpassword';

        bcrypt.genSalt.mockResolvedValue(salt);
        bcrypt.hash.mockResolvedValue(hashedPassword);

        const result = await handlePasswordUpdate(password, user);
        expect(result).toEqual({
            error: null,
            fields: {
                password: hashedPassword,
                tokenVersion: 2
            }
        });
    });
});