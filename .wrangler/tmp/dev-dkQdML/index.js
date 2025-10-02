var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-iZJp1F/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/index.js
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(generateToken, "generateToken");
var adminSessions = /* @__PURE__ */ new Map();
var src_default = {
  /**
   * Handles incoming requests to the Cloudflare Worker.
   * It routes requests to either load or save story data based on the URL path and HTTP method.
   *
   * @param {Request} request - The incoming HTTP request.
   * @param {object} env - The environment variables, including the STORY_STORAGE KV namespace.
   * @param {object} ctx - The execution context of the request.
   * @returns {Response} The response to the request.
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const verifyAdminToken = /* @__PURE__ */ __name((token) => {
      if (!token) return false;
      if (token === env.ADMIN_KEY) return true;
      const session = adminSessions.get(token);
      if (!session) return false;
      if (session.expiresAt < Date.now()) {
        adminSessions.delete(token);
        return false;
      }
      return true;
    }, "verifyAdminToken");
    if (url.pathname === "/api/admin/auth" && request.method === "POST") {
      try {
        const { accessCode } = await request.json();
        if (accessCode === env.ADMIN_ACCESS_CODE) {
          const token = generateToken();
          const expiresAt = Date.now() + 2 * 60 * 60 * 1e3;
          adminSessions.set(token, { expiresAt });
          for (const [key, value] of adminSessions.entries()) {
            if (value.expiresAt < Date.now()) {
              adminSessions.delete(key);
            }
          }
          return new Response(JSON.stringify({
            success: true,
            token,
            expiresAt
          }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }
        return new Response(JSON.stringify({
          success: false,
          error: "Invalid access code"
        }), {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          error: "Authentication failed"
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }
    if (url.pathname.startsWith("/editor/") || url.pathname === "/editor") {
      const token = request.headers.get("X-Admin-Token") || url.searchParams.get("token") || url.searchParams.get("phoenixadmin");
      const isValid = verifyAdminToken(token) || url.searchParams.get("phoenixadmin") === env.ADMIN_ACCESS_CODE;
      if (!isValid) {
        return Response.redirect(new URL("/", url.origin).toString(), 302);
      }
    }
    if (url.pathname === "/api/generate-image" && request.method === "POST") {
      try {
        const token = request.headers.get("X-Admin-Token") || request.headers.get("X-Admin-Key");
        if (!verifyAdminToken(token)) {
          return new Response(JSON.stringify({
            error: "Image generation not available",
            message: "This is the end of the currently rendered narrative. More content coming soon!"
          }), {
            status: 403,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }
        if (!env.GEMINI_API_KEY) {
          return new Response(JSON.stringify({ error: "API key not configured" }), {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }
        const requestData = await request.json();
        const { prompt, contextImage } = requestData;
        const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";
        const parts = [{
          text: prompt
        }];
        if (contextImage) {
          parts.push({
            inlineData: {
              mimeType: "image/png",
              data: contextImage
            }
          });
        }
        const response = await fetch(`${apiUrl}?key=${env.GEMINI_API_KEY}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{
              parts
            }],
            generationConfig: {
              temperature: 0.9,
              topK: 32,
              topP: 1,
              maxOutputTokens: 8192,
              responseMimeType: "application/json",
              responseSchema: {
                type: "object",
                properties: {
                  image: {
                    type: "string"
                  }
                }
              }
            }
          })
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Gemini API error:", errorText);
          return new Response(JSON.stringify({ error: "Generation failed" }), {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }
        const result = await response.json();
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (err) {
        console.error("Image generation error:", err);
        return new Response(JSON.stringify({
          error: "Generation failed",
          message: err.message
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }
    if (url.pathname === "/api/load" && request.method === "GET") {
      try {
        const storyObject = await env.STORY_STORAGE.get("story.json");
        if (storyObject === null) {
          return new Response(JSON.stringify({ status: "not_found", message: "No saved story found in cloud storage." }), {
            headers: { "Content-Type": "application/json" },
            status: 404
          });
        }
        const storyData = await storyObject.text();
        return new Response(storyData, {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
          status: 200
        });
      } catch (err) {
        console.error(err);
        return new Response("Error: Could not load story data.", { status: 500 });
      }
    }
    if (url.pathname.startsWith("/api/images/") && request.method === "PUT") {
      try {
        const token = request.headers.get("X-Admin-Token") || request.headers.get("X-Admin-Key");
        if (!verifyAdminToken(token)) {
          return new Response("Unauthorized", {
            status: 403,
            headers: { "Access-Control-Allow-Origin": "*" }
          });
        }
        const nodeId = decodeURIComponent(url.pathname.split("/").pop());
        const imageData = await request.arrayBuffer();
        if (imageData.byteLength > 10 * 1024 * 1024) {
          return new Response("Image too large (max 10MB)", {
            status: 413,
            headers: { "Access-Control-Allow-Origin": "*" }
          });
        }
        const imagePath = `images/${encodeURIComponent(nodeId)}.png`;
        await env.STORY_STORAGE.put(imagePath, imageData, {
          httpMetadata: {
            contentType: "image/png"
          }
        });
        return new Response(JSON.stringify({
          success: true,
          path: imagePath
        }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (err) {
        console.error("Image upload error:", err);
        return new Response(JSON.stringify({
          error: "Upload failed",
          message: err.message
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }
    if (url.pathname.startsWith("/api/images/") && request.method === "GET") {
      try {
        const nodeId = decodeURIComponent(url.pathname.split("/").pop());
        const imagePath = `images/${encodeURIComponent(nodeId)}.png`;
        const imageObject = await env.STORY_STORAGE.get(imagePath);
        if (!imageObject) {
          return new Response("Image not found", {
            status: 404,
            headers: { "Access-Control-Allow-Origin": "*" }
          });
        }
        const imageData = await imageObject.arrayBuffer();
        return new Response(imageData, {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (err) {
        console.error("Image retrieval error:", err);
        return new Response("Error retrieving image", {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      }
    }
    if (url.pathname === "/api/save" && request.method === "POST") {
      try {
        const token = request.headers.get("X-Admin-Token") || request.headers.get("X-Admin-Key");
        if (!verifyAdminToken(token)) {
          return new Response("Unauthorized", {
            status: 403,
            headers: {
              "Content-Type": "text/plain",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }
        const storyData = await request.json();
        await env.STORY_STORAGE.put("story.json", JSON.stringify(storyData, null, 2));
        return new Response("Story saved successfully!", {
          status: 200,
          headers: {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (err) {
        console.error("Save error:", err);
        return new Response("Error: Could not save story data.", { status: 500 });
      }
    }
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token, X-Admin-Key"
        }
      });
    }
    return new Response("Not Found", { status: 404 });
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-iZJp1F/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-iZJp1F/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
