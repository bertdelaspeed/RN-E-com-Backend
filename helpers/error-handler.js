function errorHandler(err, req, res, next) {
  // jwt authentication error
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({ success: false, message: err.message });
  }

  // internal server error
  return res.status(500).json({ success: false, message: err.message });
}

module.exports = errorHandler;
