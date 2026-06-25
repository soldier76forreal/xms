import React ,{useState} from "react";
const AxiosGlobal = React.createContext({
    defaultTargetApi:'',
    authTargetApi:'',
    externalLink:'',
    originLink:''
});
export const AxiosGlobalProvider = (props) =>{
    const contextValue ={
        defaultTargetApi:'http://localhost:3003',
        authTargetApi:'http://localhost:3002',
        externalLink:'https://xms.lazulitemarble.com',
        originLink:window.location.origin
    }
    return <AxiosGlobal.Provider value={contextValue}>{props.children}</AxiosGlobal.Provider>
}

export default AxiosGlobal;
