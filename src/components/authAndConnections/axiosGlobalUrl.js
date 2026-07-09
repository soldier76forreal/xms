import React ,{useState} from "react";
const AxiosGlobal = React.createContext({
    defaultTargetApi:'',
    authTargetApi:'',
    externalLink:'',
    originLink:''
});
export const AxiosGlobalProvider = (props) =>{
    // Derived from the page's own host (not hardcoded 'localhost') so the same
    // build works when opened via localhost, 127.0.0.1, or a LAN IP (e.g. phone
    // testing at http://192.168.x.x:3000) — the API ports stay fixed, only the
    // host changes to match whatever host served this page.
    const host = window.location.hostname;
    const contextValue ={
        defaultTargetApi:`http://${host}:3003`,
        authTargetApi:`http://${host}:3002`,
        externalLink:'https://xms.lazulitemarble.com',
        originLink:window.location.origin
    }
    return <AxiosGlobal.Provider value={contextValue}>{props.children}</AxiosGlobal.Provider>
}

export default AxiosGlobal;
