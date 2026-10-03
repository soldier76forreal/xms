import React from "react";
const AxiosGlobal = React.createContext({
    defaultTargetApi:'',
    authTargetApi:'',
    externalLink:'',
    originLink:'',
    publicWebsiteUrl:''
});

// A host is "local development" when the page is served from localhost or a
// private LAN IP (phone testing) — anything else is the live deployment.
const isLocalHost = (host) =>
    host === 'localhost' || host === '127.0.0.1' ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);

export const AxiosGlobalProvider = (props) =>{
    const host = window.location.hostname;
    const local = isLocalHost(host);

    // Production (launched 2026-07-12): the app lives at xms.lazulitemarble.com
    // and talks to the two HTTPS APIs below (reverse-proxied to local ports
    // 7130/7256 on the server). Local dev keeps host-based URLs so the same
    // build works via localhost or a LAN IP.
    // Local dev ports are overridable via a gitignored .env.local, the same
    // philosophy the backends already use for PORT — so a machine whose
    // ephemeral port range collides with the defaults can move them without
    // touching committed code. Production never reads these: it uses the HTTPS
    // domains below regardless.
    const apiPort  = process.env.REACT_APP_API_PORT  || '4789';
    const authPort = process.env.REACT_APP_AUTH_PORT || '2681';

    const contextValue = {
        defaultTargetApi: local ? `http://${host}:${apiPort}` : 'https://api.lazulitemarble.com',
        authTargetApi:    local ? `http://${host}:${authPort}` : 'https://auth.lazulitemarble.com',
        externalLink:'https://xms.lazulitemarble.com',
        originLink:window.location.origin,
        // The SEPARATE public Next.js site (website/, Phase D) — not xms itself.
        // Local dev runs it on :3001 (xms's own CRA dev server owns :3000).
        publicWebsiteUrl: local ? `http://${host}:3001` : 'https://lazulitemarble.com'
    }
    return <AxiosGlobal.Provider value={contextValue}>{props.children}</AxiosGlobal.Provider>
}

export default AxiosGlobal;

