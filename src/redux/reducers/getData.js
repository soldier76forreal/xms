import { useContext } from "react";

import axios from "axios";
import AxiosGlobal from "../../components/authAndConnections/axiosGlobalUrl";

const GetCustomerData = async (state , action)=>{
    const authCtx = useContext(AxiosGlobal);
    switch (action.type) {
        
        case "getAllCustomer":
            
            try{
                const getCustomers = 
               await axios({
                    method:"get",
                    url:`${authCtx.defaultTargetApi}/crm/getAllCustomer`,
                    config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                });
                state = getCustomers.data;
                console.log( getCustomers.data)
                return state;
            }catch{

            }
            break;
    
        default:
            break;
    }
}

export default GetCustomerData; 