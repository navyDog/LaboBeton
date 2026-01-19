import { getSafeObjectId, validateParamId } from '../SecureIdService.js';
import mongoose from 'mongoose';

describe('getSafeObjectId', () => {
    test('should return null when id is null or undefined', () => {
        expect(getSafeObjectId(null)).toBeNull();
        expect(getSafeObjectId(undefined)).toBeNull();
    });

    test('should return null when id is not a string', () => {
        expect(getSafeObjectId(123)).toBeNull();
        expect(getSafeObjectId({})).toBeNull();
        expect(getSafeObjectId([])).toBeNull();
    });

    test('should return null when id is not a valid ObjectId', () => {
        expect(getSafeObjectId('invalidid')).toBeNull();
    });

    test('should return a new ObjectId when id is a valid ObjectId', () => {
        const validId = '507f191e810c19729de860ea';
        const objectId = getSafeObjectId(validId);
        expect(objectId).toBeInstanceOf(mongoose.Types.ObjectId);
        expect(objectId.toString()).toBe(validId);
    });
});

describe('validateParamId', () => {
    let req, res, next;

    beforeEach(() => {
        req = { params: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
    });

    test('should return 400 when id is null or undefined', () => {
        req.params.id = null;
        validateParamId()(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'ID invalide' });
    });

    test('should return 400 when id is not a string', () => {
        req.params.id = 123;
        validateParamId()(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'ID invalide' });
    });

    test('should return 400 when id is not a valid ObjectId', () => {
        req.params.id = 'invalidid';
        validateParamId()(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'ID invalide' });
    });

    test('should call next and update req.params when id is a valid ObjectId', () => {
        const validId = '507f191e810c19729de860ea';
        req.params.id = validId;
        validateParamId()(req, res, next);
        expect(req.params.id).toBeInstanceOf(mongoose.Types.ObjectId);
        expect(req.params.id.toString()).toBe(validId);
        expect(next).toHaveBeenCalled();
    });
});