export function validate(schema) {
  return function validateRequest(req, res, next) {
    try {
      const parsed = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      })

      req.validated = parsed

      return next()
    } catch (error) {
      return next(error)
    }
  }
}
