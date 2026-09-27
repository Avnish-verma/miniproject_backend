const { ValidationError } = require('../errors/errorTypes');

const validate = (schema, source = 'body') => {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err.errors) {
        const errorMessages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        return next(new ValidationError('Request input validation failed', errorMessages));
      }
      return next(new ValidationError('Invalid request payload'));
    }
  };
};

module.exports = validate;
