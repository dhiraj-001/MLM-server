const validate = (Schema) => async (req, res, next) => {
  try {
    const parsedBody = Schema.parse(req.body); 
    req.body = parsedBody; 
    next(); 
  } catch (error) {
    const status = 400;
    const message = error.errors;

    const err = {
      status,
      message,
    };
    next(err);
  }
};

export default validate;
