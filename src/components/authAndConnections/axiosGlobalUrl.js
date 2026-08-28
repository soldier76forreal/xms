import React from "react";
const AxiosGlobal = React.createContext({
    defaultTargetApi:'',
    authTargetApi:'',
    externalLink:'',
    originLink:''
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
    const contextValue = {
        defaultTargetApi: local ? `http://${host}:4789` : 'https://api.lazulitemarble.com',
        authTargetApi:    local ? `http://${host}:2681` : 'https://auth.lazulitemarble.com',
        externalLink:'https://xms.lazulitemarble.com',
        originLink:window.location.origin
    }
    return <AxiosGlobal.Provider value={contextValue}>{props.children}</AxiosGlobal.Provider>
}

export default AxiosGlobal;
