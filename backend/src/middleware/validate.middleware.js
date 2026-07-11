const { sendError } = require('../utils/response');

const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return sendError(res, 'Validation failed', 400, errors);
    }
    
    req.body = result.data;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    
    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return sendError(res, 'Query validation failed', 400, errors);
    }
    
    req.query = result.data;
    next();
  };
};

module.exports = { validate, validateQuery };