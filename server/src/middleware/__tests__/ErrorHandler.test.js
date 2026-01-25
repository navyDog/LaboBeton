import { errorHandler } from '../ErrorHandler';
import logger from '../../config/Logger';

jest.mock('../../config/Logger');

describe('ErrorHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      originalUrl: '/test',
      method: 'GET'
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

  it('should log the error and send a response in development environment', () => {
    process.env.NODE_ENV = 'development';
    const err = new Error('Test error');
    err.statusCode = 400;
    err.status = 'fail';

    errorHandler(err, req, res, next);

    expect(logger.error).toHaveBeenCalledWith({
      message: 'Test error',
      stack: expect.any(String),
      url: '/test',
      method: 'GET'
    });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'fail',
      message: 'Test error',
      stack: expect.any(String),
      error: err
    });
  });

  it('should log the error and send a generic response in production environment', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('Test error');
    err.statusCode = 500;
    err.status = 'error';
    err.isOperational = false;

    errorHandler(err, req, res, next);

    expect(logger.error).toHaveBeenCalledWith({
      message: 'Test error',
      stack: expect.any(String),
      url: '/test',
      method: 'GET'
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Une erreur est survenue'
    });
  });

  it('should send the operational error message in production environment', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('Operational error');
    err.statusCode = 404;
    err.status = 'fail';
    err.isOperational = true;

    errorHandler(err, req, res, next);

    expect(logger.error).toHaveBeenCalledWith({
      message: 'Operational error',
      stack: expect.any(String),
      url: '/test',
      method: 'GET'
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: 'fail',
      message: 'Operational error'
    });
  });
});