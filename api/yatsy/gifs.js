import { runGifSearch } from "../_lib/giphy.js";
import { sendError, sendJson, withErrorHandling } from "../_lib/http.js";
import { clientKey, isRateLimited } from "../_lib/rateLimit.js";

const THROTTLE = { maxHits: 30, windowMs: 60000 };

async function handler(req, res) {
  if (req.method !== "GET") {
    sendError(res, "method-not-allowed", "Use GET to search GIFs.");
    return;
  }

  if (isRateLimited(`gifs:${clientKey(req)}`, THROTTLE)) {
    sendError(
      res,
      "too-many-requests",
      "Too many GIF searches. Try again later."
    );
    return;
  }

  const query = typeof req.query?.q === "string" ? req.query.q : "";
  const lang = typeof req.query?.lang === "string" ? req.query.lang : "fr";
  const result = await runGifSearch({
    query,
    lang,
    apiKey: process.env.GIPHY_API_KEY
  });
  sendJson(res, result.status, result.body);
}

export default withErrorHandling(handler);
