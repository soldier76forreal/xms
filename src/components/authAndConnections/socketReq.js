import React, { useContext, useState  , useEffect} from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { Redirect , useHistory } from 'react-router-dom';
import AxiosGlobal from './axiosGlobalUrl';
import { io } from 'socket.io-client';
import AuthContext from './auth';

const SocketContext = React.createContext({
    sendToContactsIo:(to ,from ,document ,type)=>{},
    updateRequestIo:(to ,from ,document ,type)=>{},
    requestUpdatedIo:(to ,from ,document ,type)=>{},
    requestDeletedIo:(to ,from ,document ,type)=>{}
})
export const SocketContextProvider = (props) =>{
    const authCtx = useContext(AuthContext);
    const axiosGlobal = useContext(AxiosGlobal);


    const multiFunc = async(to ,from ,document ,type) =>{
        authCtx.socket.emit("sendRequest", {
            to :to,
            from:from,
            document:document,
            type:type
            
        });
        try{
            const response = await authCtx.jwtInst({
                method:'post',
                url:`${axiosGlobal.defaultTargetApi}/notfication/saveNotif`,
                data:{to:to , from:from , document:document , type:type },
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            
        }catch(err){
            console.log(err);
        }
    }
    const contextValue = {
        sendToContactsIo:multiFunc,
        updateRequestIo:multiFunc,
        requestUpdatedIo:multiFunc,
        requestDeletedIo:multiFunc

    };


    return(
        <SocketContext.Provider value={contextValue}>{props.children}</SocketContext.Provider>
    )   
}


export default SocketContext;