// Report & Info calls. Always through authCtx.jwtInst — never bare axios, or a
// 401 would not refresh the token and retry.
const base = (axiosGlobal) => `${axiosGlobal.defaultTargetApi}/feedback`;

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
