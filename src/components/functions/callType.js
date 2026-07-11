



export default function CallType (value){
    var res = callType.filter(e=> {return JSON.stringify(e.value) === JSON.stringify(value)})
    return res[0].name;
}
var callType =[
    {value:'sales' , name:'Sale'},
    {value:'requestFollowUp' , name:'Request follow-up'},
    {value:'invoiceFollowUp' , name:'Invoice follow-up'},
    {value:'customerSatisfaction' , name:'Customer satisfaction'}
  ]