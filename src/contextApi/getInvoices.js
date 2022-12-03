import React,{ useState , useContext , useEffect} from "react";
import axios from "axios";
import AxiosGlobal from "../components/authAndConnections/axiosGlobalUrl";

const GetInvoices = React.createContext({
    invoiceData:[],
});
export const GetInvoicesProvider = (props) =>{
    const urlContext = useContext(AxiosGlobal);
    const [invoiceState , setInvoiceState] = useState([]);
    const getInvoiceData = async() =>{
        try{
            const response = await axios({
                method:'get',
                url:`${urlContext.defaultTargetApi}/auth/getAllUsers`,
                config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            setInvoiceState([...response.data.rs])
        }catch(err){
            console.log(err);
        }
    }
    useEffect(() => {
        getInvoiceData()
    }, []);
    const contextValue ={
        invoiceData:invoiceState
    }
    return <GetInvoices.Provider value={contextValue}>{props.children}</GetInvoices.Provider>
}
export default GetInvoices;
