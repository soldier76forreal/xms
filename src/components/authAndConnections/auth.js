import React, { useContext, useState  , useEffect} from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

import { Redirect , useHistory } from 'react-router-dom';
import AxiosGlobal from './axiosGlobalUrl';
import { io } from 'socket.io-client';
axios.defaults.withCredentials = true

const AuthContext = React.createContext({
    token:null,
    userId:'',
    decoded:{},
    access:[],
    isLoggedIn : false,
    login:(token)=>{},
    logout:()=>{},
    jwtInst : null,
    defaultTargetApi:''
})

export const AuthContextProvider = (props) =>{
    const savedToken = localStorage.getItem('accessToken');
    const axiosGlobal = useContext(AxiosGlobal)
    const [accessSection , setAccessSection] = useState([]);
    const [userId , setUserId] = useState('');
    const [socket, setSocket] = useState(null);
    const [token , setToken] = useState(savedToken);
    const [notifications, setNotifications] = useState([]);
    const userIsLoggedIn = !!token;
    const history = useHistory();
    var dwtdc
    const logOutHandler = () =>{
        setToken(null)
        localStorage.removeItem('accessToken');
        deleteRefreshToken()
        history.push('/logIn');
    }
    const logInHandler = async(token) =>{
        localStorage.setItem('accessToken' , token);
        setToken(token);
         dwtdc = jwtDecode(token);
        setUserId(dwtdc.id);
        setAccessSection([...dwtdc.access]);
    }
    const jwt = axios.create(
        ({
            baseURL:`${axiosGlobal.authTargetApi}`,
            withCredentials:true,
            headers:{
                Authorization : `Bearer ${token}`
            }
        })
    );



      
    const contextValue = {
        token :token,
        decode:dwtdc,
        access:accessSection,
        userId:userId,
        isLoggedIn: userIsLoggedIn,
        login:logInHandler,
        logout:logOutHandler,
        jwtInst:jwt,
        socket:socket
    };

    jwt.interceptors.request.use(async (config)=>{
        let currentDate = new Date();
        const decodedToken = jwtDecode(token);
        if(decodedToken.exp * 1000 < currentDate.getTime()){
            const toke = await postRefreshToken();
            localStorage.setItem('accessToken' , toke.accessToken);
            setToken(toke.accessToken);
            config.headers["Authorization"] = `Bearer ${toke.accessToken}`;
        }
        return config;
    },(error)=>{
        logOutHandler();
    })
    const postRefreshToken = async() =>{
        try{
            const response = await axios({
                withCredentials:true,
                method:"post",
                url:`${axiosGlobal.authTargetApi}/auth/refreshToken`,
            })
            const data =  response.data; 
            return data;
        }catch(error){
            console.log(error);
            logOutHandler();
        }

        
    }
    useEffect(() => {
    setSocket(io(`${axiosGlobal.defaultTargetApi}`));
    }, []);
    useEffect(() => {   
        if(token){
            socket?.emit("newUser", jwtDecode(token).id);
        }
      }, [socket, token]);

    const deleteRefreshToken =  async () =>{
        try{
            const response = await axios({
                withCredentials:true,
                method:"post",
                url:`${axiosGlobal.authTargetApi}/auth/deleteRefreshToken`,
            })
            const data =  response.data; 
        }catch(error){
            console.log(error);
        }
    }
    
    return(
        <AuthContext.Provider value={contextValue}>{props.children}</AuthContext.Provider>
    )   
}


export default AuthContext;



