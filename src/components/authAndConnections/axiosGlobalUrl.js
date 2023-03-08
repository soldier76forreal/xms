import React ,{useState} from "react";
const AxiosGlobal = React.createContext({
    defaultTargetApi:'',
    authTargetApi:''
});
export const AxiosGlobalProvider = (props) =>{
    const contextValue ={
        defaultTargetApi:'http://localhost:3001',
        authTargetApi:'http://localhost:3002'
    }
    return <AxiosGlobal.Provider value={contextValue}>{props.children}</AxiosGlobal.Provider>
}
export default AxiosGlobal;
