

export default function DateType (value){
    var res = customerOrigin.filter(e=> {return JSON.stringify(e.id) === JSON.stringify(value)})
    return res[0].text;
}
var customerOrigin = [
    {id:'shamsi' , text:'َشمسی'},
    {id:'hejri' , text:'حجری'},
    {id:'miladi' , text:'میلادی'}
  ]
  