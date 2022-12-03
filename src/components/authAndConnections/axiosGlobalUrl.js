import React ,{useState} from "react";
const AxiosGlobal = React.createContext({
    defaultTargetApi:''
});
export const AxiosGlobalProvider = (props) =>{
    const contextValue ={
        defaultTargetApi:'http://localhost:3001'
    }
    return <AxiosGlobal.Provider value={contextValue}>{props.children}</AxiosGlobal.Provider>
}
export default AxiosGlobal;
