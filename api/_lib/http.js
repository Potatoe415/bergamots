const ERROR_STATUS = {
  "invalid-code": 400,
  "missing-code": 400,
  "game-not-found": 404,
  "game-expired": 410,
  "resume-denied": 403,
  "code-exhausted": 503,
  "method-not-allowed": 405,
  "server-error": 500
};

export function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

export function sendError(res, code, message) {
  const status = ERROR_STATUS[code] || 500;
  res.status(status).json({ error: { code, message } });
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string" && req.body.length > 0) {
    return JSON.parse(req.body);
  }

  return {};
}
