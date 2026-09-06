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

    // Production (DamoonCars re-scope, 2026-09-06 — placeholder domains, update
    // once the real DamoonCars domain is registered): the app lives at
    // xms.damooncars.com and talks to the two HTTPS APIs below (reverse-proxied
    // to local ports 8130/8256 on the server). Local dev keeps host-based URLs
    // so the same build works via localhost or a LAN IP.
    const contextValue = {
        defaultTargetApi: local ? `http://${host}:8130` : 'https://api.damooncars.com',
        authTargetApi:    local ? `http://${host}:8256` : 'https://auth.damooncars.com',
        externalLink:'https://xms.damooncars.com',
        originLink:window.location.origin
    }
    return <AxiosGlobal.Provider value={contextValue}>{props.children}</AxiosGlobal.Provider>
}

export default AxiosGlobal;
