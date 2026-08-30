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

function parseBody(contentType, response) {
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text().then((text) => {
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return text;
    }
  });
}

// 统一错误提示（toast），优先使用后端返回的中文 title
function showError(body, status) {
  if (body && typeof body === "object") {
    const title = body.title || body.msg;
    if (title) {
      ElMessage.error(title);
      return;
    }
  }
  ElMessage.error(`请求失败 (${status})`);
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
          .res(async (response) => {
            const contentType = response.headers.get("content-type") || "";
            const body = await parseBody(contentType, response);
            const isHttpError = response.status >= 400;
            const businessError =
              body &&
              typeof body === "object" &&
              typeof body.code === "number" &&
              body.code !== 200
                ? body
                : null;
            if (isHttpError || businessError) {
              const errBody =
                businessError || (body && typeof body === "object" ? body : {});
              const err = new Error(
                errBody.title || errBody.msg || `HTTP ${response.status}`
              );
              err.code = errBody.code || response.status;
              err.data = errBody;
              // 401 登录过期不弹 toast，其余错误统一在此提示
              if (err.code !== 401) {
                showError(errBody, response.status);
              }
              throw err;
            }
            return { data: body };
          })
          .then(({ data }) => {
            resolve(data);
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
