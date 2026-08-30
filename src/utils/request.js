import wretch from "wretch";

function buildUrl(url, params) {
  if (!params || Object.keys(params).length === 0) return url;
  const usp = new URLSearchParams();
  for (const key of Object.keys(params)) {
    const value = params[key];
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) usp.append(key, v == null ? "" : String(v));
    } else {
      usp.append(key, String(value));
    }
  }
  const qs = usp.toString();
  if (!qs) return url;
  return url.includes("?") ? `${url}&${qs}` : `${url}?${qs}`;
}

function request(BASE_URL, config) {
  const token = localStorage.getItem("token") || "";
  const params = { ...(config.params || {}) };
  if (token) {
    params["access_token"] = token;
  }

  const method = (config.method || "GET").toUpperCase();
  const rawUrl = BASE_URL + config.url;
  const finalUrl = buildUrl(rawUrl, params);

  let w = wretch(finalUrl, { credentials: "include" }).headers({
    Authorization: token || "",
  });

  const attachBody = (instance, data) => {
    if (data === undefined || data === null) return instance;
    if (
      typeof data === "string" ||
      data instanceof FormData ||
      data instanceof URLSearchParams ||
      data instanceof Blob ||
      ArrayBuffer.isView(data)
    ) {
      return instance.body(data);
    }
    return instance.json(data);
  };

  return new Promise((resolve, reject) => {
    const run = (req) => {
      try {
        req
          .res((response) => {
            const contentType = response.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
              return response.json().then((data) => ({ data }));
            }
            return response.text().then((text) => ({ data: text }));
          })
          .then(({ data }) => {
            if (data && data.code == 401) {
              // 处理登录状态过期的情况
            } else {
              resolve(data);
            }
          })
          .catch((err) => {
            reject(err);
          });
      } catch (err) {
        reject(err);
      }
    };

    try {
      switch (method) {
        case "GET":
          run(w.get());
          break;
        case "POST":
          run(attachBody(w, config.data).post());
          break;
        case "PUT":
          run(attachBody(w, config.data).put());
          break;
        case "DELETE":
          run(w.delete());
          break;
        case "HEAD":
          run(w.head());
          break;
        case "PATCH":
          run(attachBody(w, config.data).patch());
          break;
        case "OPTIONS":
          run(w.options());
          break;
        default:
          reject(new Error(`Unsupported HTTP method: ${method}`));
      }
    } catch (err) {
      reject(err);
    }
  });
}

export default request;
