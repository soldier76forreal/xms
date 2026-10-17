// Report & Info calls. Always through authCtx.jwtInst — never bare axios, or a
// 401 would not refresh the token and retry.
const base = (axiosGlobal) => `${axiosGlobal.defaultTargetApi}/feedback`;
const adminBase = (axiosGlobal) => `${base(axiosGlobal)}/admin`;

export const fetchAppInfo = async (authCtx, axiosGlobal) => {
  const res = await authCtx.jwtInst({ method: 'get', url: `${base(axiosGlobal)}/app-info` });
  return res.data.data;
};

// → { data: [tickets], total, page, pages, scope, statusCounts }
export const fetchTickets = async (authCtx, axiosGlobal, params) => {
  const res = await authCtx.jwtInst({ method: 'get', url: `${base(axiosGlobal)}/tickets`, params });
  return res.data;
};

export const fetchTicket = async (authCtx, axiosGlobal, id) => {
  const res = await authCtx.jwtInst({ method: 'get', url: `${base(axiosGlobal)}/tickets/${id}` });
  return res.data.data;
};

export const createTicket = async (authCtx, axiosGlobal, formData, onProgress) => {
  const res = await authCtx.jwtInst({
    method: 'post',
    url: `${base(axiosGlobal)}/tickets`,
    data: formData,
    ...(onProgress ? { onUploadProgress: onProgress } : {}),
  });
  return res.data.data;
};

// Edit YOUR OWN ticket while it is still Open. Same multipart shape as create,
// plus `removeFileIds` (a JSON array of attachment ids to drop).
export const updateTicket = async (authCtx, axiosGlobal, id, formData, onProgress) => {
  const res = await authCtx.jwtInst({
    method: 'put',
    url: `${base(axiosGlobal)}/tickets/${id}`,
    data: formData,
    ...(onProgress ? { onUploadProgress: onProgress } : {}),
  });
  return res.data.data;
};

export const deleteTicket = async (authCtx, axiosGlobal, id) => {
  const res = await authCtx.jwtInst({ method: 'delete', url: `${base(axiosGlobal)}/tickets/${id}` });
  return res.data.data;
};

// ── the developers' dashboard ─────────────────────────────────────────────────
// The server decides who is a developer (a phone allowlist). The browser only
// asks, to know whether to offer the tab — every route below is refused for
// anyone else regardless of what this returns.
export const fetchDeveloperStatus = async (authCtx, axiosGlobal) => {
  const res = await authCtx.jwtInst({ method: 'get', url: `${adminBase(axiosGlobal)}/me` });
  return res.data.data.developer === true;
};

export const fetchAdminOverview = async (authCtx, axiosGlobal, days = 30) => {
  const res = await authCtx.jwtInst({ method: 'get', url: `${adminBase(axiosGlobal)}/overview`, params: { days } });
  return res.data.data;
};

export const fetchAdminTickets = async (authCtx, axiosGlobal, params) => {
  const res = await authCtx.jwtInst({ method: 'get', url: `${adminBase(axiosGlobal)}/tickets`, params });
  return res.data;
};

export const fetchAdminTicket = async (authCtx, axiosGlobal, id) => {
  const res = await authCtx.jwtInst({ method: 'get', url: `${adminBase(axiosGlobal)}/tickets/${id}` });
  return res.data.data;
};

// { status, note } — a note on an unchanged status is a reply.
export const setAdminStatus = async (authCtx, axiosGlobal, id, body) => {
  const res = await authCtx.jwtInst({ method: 'put', url: `${adminBase(axiosGlobal)}/tickets/${id}/status`, data: body });
  return res.data.data;
};

export const deleteAdminTicket = async (authCtx, axiosGlobal, id) => {
  const res = await authCtx.jwtInst({ method: 'delete', url: `${adminBase(axiosGlobal)}/tickets/${id}` });
  return res.data.data;
};

export const restoreAdminTicket = async (authCtx, axiosGlobal, id) => {
  const res = await authCtx.jwtInst({ method: 'post', url: `${adminBase(axiosGlobal)}/tickets/${id}/restore` });
  return res.data.data;
};
