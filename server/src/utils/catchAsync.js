// Wrapper pour capturer les erreurs async/await automatiquement
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};