import React ,{useState} from "react";
const WebSections = React.createContext({
    listOfSections:[],
    checkWebSections:(value)=>{}

});
export const WebSectionsProvider = (props) =>{
    var tempArr = [
        { title:'request' , value:'req' , name:'پیش فاکتور' , jobTitle:'فروشنده'},
        {title:'invoice' , value:'inv' ,name:'فاکتور' , jobTitle:'مدیر فروش' }
    ]
    const checkWebSections = (value) =>{
        var is;
        tempArr.forEach(element => {
            if(JSON.stringify(element.value) === JSON.stringify(value)){
                is = true;
            }else{
                is = false;
            }
        });
        return is
    }
    const contextValue ={
        listOfSections:tempArr,
        checkWebSections:checkWebSections
    }
    return <WebSections.Provider value={contextValue}>{props.children}</WebSections.Provider>
}
export default WebSections;
