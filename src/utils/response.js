export function successEnvelope(data = {}, meta = {}) {
  return {
    success: true,
    data,
    meta,
    error: null
  };
}

export function errorEnvelope(error, meta = {}) {
  return {
    success: false,
    data: null,
    meta,
    error: {
      code: error.code,
      message: error.message,
      details: error.details ?? {}
    }
  };
}

export function sendSuccess(res, data = {}, { statusCode = 200, meta = {} } = {}) {
  return res.status(statusCode).json(successEnvelope(data, meta));
}

export function sendError(res, error, { requestId } = {}) {
  return res.status(error.statusCode || 500).json(errorEnvelope(error, { requestId }));
}
