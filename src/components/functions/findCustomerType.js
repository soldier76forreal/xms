var customerType = [
  {id:'le' , text:'Lead'},
  {id:'pc' , text:'Potential customer'},
  {id:'cc' , text:'Confirmed customer'}
]

  export default function FindCustomerType (value){
    var res = customerType.filter(e=> {return JSON.stringify(e.id) === JSON.stringify(value)})
    return res[0].text;

      
}
