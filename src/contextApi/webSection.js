import React ,{useState} from "react";
const WebSections = React.createContext({
    listOfSections:[]
});
export const WebSectionsProvider = (props) =>{
    var tempArr = [
        { title:'request' , value:'req' , name:'پیش فاکتور' , jobTitle:'فروشنده'},
        {title:'invoice' , value:'inv' ,name:'فاکتور' , jobTitle:'مدیر فروش' }
    ]
    const contextValue ={
        listOfSections:tempArr
    }
    return <WebSections.Provider value={contextValue}>{props.children}</WebSections.Provider>
}
export default WebSections;
