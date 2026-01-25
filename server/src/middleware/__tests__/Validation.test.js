import { checkValidation } from '../Validation';
import { validationResult } from 'express-validator';

jest.mock('express-validator');

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call next if there are no validation errors', () => {
    validationResult.mockReturnValueOnce({ isEmpty: () => true });

    checkValidation(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should return 400 and validation errors if there are validation errors', () => {
    const errors = {
      isEmpty: () => false,
      array: () => [{ msg: 'Invalid data', param: 'param1' }]
    };
    validationResult.mockReturnValueOnce(errors);

    checkValidation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Données invalides",
      errors: [{ msg: 'Invalid data', param: 'param1' }]
    });
    expect(next).not.toHaveBeenCalled();
  });
});