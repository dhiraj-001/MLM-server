const errorMiddleware = (err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage =
    err.message ||
    "Something went wrong. Server error. Please try again later.";
  return res.status(errorStatus).json({ message: errorMessage });
};

export default errorMiddleware;
