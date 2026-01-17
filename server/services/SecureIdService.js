import mongoose from 'mongoose';

export function getSafeObjectId(id) {
  if (!id || typeof id !== 'string') return null;
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
}

export const validateParamId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName];
  const objectId = getSafeObjectId(id);
  if (!objectId) return res.status(400).json({ message: 'ID invalide' });
  req.params[paramName] = objectId;
  next();
}