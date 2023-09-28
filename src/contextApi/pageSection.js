import React ,{useState} from "react";
import { useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";


const PageSection = React.createContext({
    selectedSection:null,
    selectedSectionFunc:(value)=>{}

});
export const PageSectionProvider = (props) =>{
    const history = useHistory()

    const [pageState , setPageState] = useState(null)
    const selectedSectionFunc = (value) =>{
        setPageState(value)
        localStorage.setItem("pageState" , value)
    }
    useEffect(() => {
        if (localStorage.getItem("pageState") !== null) {
            setPageState(parseInt(localStorage.getItem("pageState")))
        } else {
            localStorage.setItem("pageState" , 0)
        }

    }, []);
    
    const contextValue ={
        selectedSectionFunc:selectedSectionFunc,
        selectedSection:pageState
    }
    return <PageSection.Provider value={contextValue}>{props.children}</PageSection.Provider>
}
export default PageSection;
