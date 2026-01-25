import { getSettings, updateSettings } from '../SettingsController';
import Settings from '../../models/Settings';
import logger from '../../config/Logger';
import { getSafeObjectId } from '../../services/SecureIdService';

jest.mock('../../models/Settings');
jest.mock('../../config/Logger');
jest.mock('../../services/SecureIdService');

describe('SettingsController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 'user-id' },
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return settings if found', async () => {
      getSafeObjectId.mockReturnValue('safe-object-id');
      Settings.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          specimenTypes: ['Cylindrique 16x32'],
          deliveryMethods: ['Toupie'],
          manufacturingPlaces: ['Centrale BPE'],
          mixTypes: [],
          concreteClasses: [],
          consistencyClasses: [],
          curingMethods: [],
          testTypes: [],
          preparations: [],
          nfStandards: []
        })
      });

      await getSettings(req, res);

      expect(Settings.findOne).toHaveBeenCalledWith({ userId: 'safe-object-id' });
      expect(res.json).toHaveBeenCalledWith({
        specimenTypes: ['Cylindrique 16x32'],
        deliveryMethods: ['Toupie'],
        manufacturingPlaces: ['Centrale BPE'],
        mixTypes: [],
        concreteClasses: [],
        consistencyClasses: [],
        curingMethods: [],
        testTypes: [],
        preparations: [],
        nfStandards: []
      });
    });

    it('should return default settings if not found', async () => {
      getSafeObjectId.mockReturnValue('safe-object-id');
      Settings.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      await getSettings(req, res);

      expect(Settings.findOne).toHaveBeenCalledWith({ userId: 'safe-object-id' });
      expect(res.json).toHaveBeenCalledWith({
        specimenTypes: ['Cylindrique 16x32', 'Cylindrique 11x22', 'Cubique 15x15'],
        deliveryMethods: ['Toupie', 'Benne', 'Mixer'],
        manufacturingPlaces: ['Centrale BPE', 'Centrale Chantier'],
        mixTypes: [],
        concreteClasses: [],
        consistencyClasses: [],
        curingMethods: [],
        testTypes: [],
        preparations: [],
        nfStandards: []
      });
    });

    it('should return 403 if session is invalid', async () => {
      getSafeObjectId.mockReturnValue(null);

      await getSettings(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Session invalide' });
    });

    it('should return 500 if an error occurs', async () => {
      getSafeObjectId.mockReturnValue('safe-object-id');
      Settings.findOne.mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await getSettings(req, res);

      expect(logger.error).toHaveBeenCalledWith('Get Settings Error: Database error');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Erreur serveur" });
    });
  });

  describe('updateSettings', () => {
    it('should update settings and return the updated settings', async () => {
      getSafeObjectId.mockReturnValue('safe-object-id');
      req.body = {
        specimenTypes: ['Cylindrique 16x32'],
        deliveryMethods: ['Toupie']
      };
      Settings.findOneAndUpdate.mockResolvedValue({
        specimenTypes: ['Cylindrique 16x32'],
        deliveryMethods: ['Toupie'],
        manufacturingPlaces: [],
        mixTypes: [],
        concreteClasses: [],
        consistencyClasses: [],
        curingMethods: [],
        testTypes: [],
        preparations: [],
        nfStandards: []
      });

      await updateSettings(req, res);

      expect(Settings.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: 'safe-object-id' },
        { $set: { specimenTypes: ['Cylindrique 16x32'], deliveryMethods: ['Toupie'] } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        specimenTypes: ['Cylindrique 16x32'],
        deliveryMethods: ['Toupie'],
        manufacturingPlaces: [],
        mixTypes: [],
        concreteClasses: [],
        consistencyClasses: [],
        curingMethods: [],
        testTypes: [],
        preparations: [],
        nfStandards: []
      });
    });

    it('should return 403 if session is invalid', async () => {
      getSafeObjectId.mockReturnValue(null);

      await updateSettings(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Session invalide' });
    });

    it('should return 500 if an error occurs', async () => {
      getSafeObjectId.mockReturnValue('safe-object-id');
      Settings.findOneAndUpdate.mockRejectedValue(new Error('Database error'));

      await updateSettings(req, res);

      expect(logger.error).toHaveBeenCalledWith('Update Settings Error: Database error');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Erreur serveur" });
    });
  });
});