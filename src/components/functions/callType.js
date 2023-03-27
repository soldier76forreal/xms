



export default function CallType (value){
    var res = callType.filter(e=> {return JSON.stringify(e.value) === JSON.stringify(value)})
    return res[0].name;
}
var callType =[
    {value:'sales' , name:'فروش'},
    {value:'requestFollowUp' , name:'پی گیری درخواست'},
    {value:'invoiceFollowUp' , name:'پی گیری فاکتور'},
    {value:'customerSatisfaction' , name:'رضایت مشتری'}
  ]