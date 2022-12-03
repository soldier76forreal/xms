import React,{ useState , useContext , useEffect} from "react";
import axios from "axios";
import AxiosGlobal from "../components/authAndConnections/axiosGlobalUrl";

const GetDatas = React.createContext({
    userData:[]
});
export const GetDatasProvider = (props) =>{
    const urlContext = useContext(AxiosGlobal);
    const [userDataState , setUserDataState] = useState([]);
    const getUserData = async() =>{
        try{
            const response = await axios({
                method:'get',
                url:`${urlContext.defaultTargetApi}/auth/getAllUsers`,
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            setUserDataState([...response.data.rs])
        }catch(err){
            console.log(err);
        }
    }
    useEffect(() => {
        getUserData()
    }, []);
    const contextValue ={
        userData:userDataState
    }
    return <GetDatas.Provider value={contextValue}>{props.children}</GetDatas.Provider>
}
export default GetDatas;
