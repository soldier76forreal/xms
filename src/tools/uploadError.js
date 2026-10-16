// Why an upload failed, in words the person can act on.
//
// An upload passes TWO size limits and only one of them belongs to this app.
// The reverse proxy in front of the API enforces its own body-size cap FIRST
// (nginx `client_max_body_size`, which defaults to 1 MB) and answers 413 with
// an HTML error page — not JSON. So `err.response.data.message` is undefined,
// every caller fell back to its own generic "Failed to upload…", and a server
// limit was indistinguishable from a bug. The app's own limit is 5 GB by
// default, so in practice a refused upload is almost always the proxy.
//
// Also covers the other way a large upload dies: the connection being closed
// or timing out partway through, which arrives with no response at all.
const uploadErrorMessage = (err, fallback) => {
  // The API's own errors are JSON and already say the real limit — prefer them.
  const fromServer = err?.response?.data?.message;
  if (typeof fromServer === 'string' && fromServer) return fromServer;

  const status = err?.response?.status;

  if (status === 413) {
    return 'The file is too large for the server to accept. The upload size '
      + 'limit on the server is lower than this file — an administrator needs '
      + 'to raise it.';
  }

  // No response at all: the request never completed. For a big file this is
  // usually the connection being dropped mid-body rather than a dead server.
  if (!err?.response) {
    if (err?.code === 'ECONNABORTED') {
      return 'The upload timed out before it finished. A smaller file, or a '
        + 'steadier connection, should get through.';
    }
    return 'The connection dropped while uploading. Nothing was saved — you '
      + 'can try again.';
  }

  if (status === 502 || status === 503 || status === 504) {
    return 'The server closed the connection while receiving the file. If this '
      + 'happens only with large files, the server\'s upload limit is the cause.';
  }

  return fallback;
};

export default uploadErrorMessage;
