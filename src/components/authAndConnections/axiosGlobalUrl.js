import React ,{useState} from "react";
const AxiosGlobal = React.createContext({
    defaultTargetApi:'',
    authTargetApi:'',
    externalLink:'',
    originLink:''
});
export const AxiosGlobalProvider = (props) =>{
    const contextValue ={
        defaultTargetApi:'https://api.iliyaapp.ir',
        authTargetApi:'https://auth.iliyaapp.ir',
        externalLink:'https://iliyaapp.ir',
        originLink:window.location.origin
    }
    return <AxiosGlobal.Provider value={contextValue}>{props.children}</AxiosGlobal.Provider>
}

export default AxiosGlobal;
