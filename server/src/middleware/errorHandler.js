// Runs when no route matched the request.
export function notFoundHandler(req, res) {
  res.status(404).json({ error: "Not found" });
}

// Runs when any route/middleware calls next(err), or throws inside an
// async handler wrapped correctly. Keeping this in one place means every
// route returns errors in the same JSON shape instead of leaking stack
// traces or inconsistent formats to the client.
export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal server error",
  });
}
