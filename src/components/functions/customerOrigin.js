



export default function CustomerOrigin (value){
    var res = customerOrigin.filter(e=> {return JSON.stringify(e.id) === JSON.stringify(value)})
    return res[0].text;
}
var customerOrigin = [
    {id:'null' , text:'None'},
    {id:'call' , text:'Phone call marketing'},
    {id:'ref' , text:'Refer by other customers'},
    {id:'web' , text:'Website'},
    {id:'in' , text:'Instagram'},
    {id:'li' , text:'Linked In'},
    {id:'wa' , text:'WhatsApp'},
    {id:'fa' , text:'Facebook'},
    {id:'bt' , text:'Bottom'},
    {id:'con' , text:'Conference'},
    {id:'wor' , text:'Refer by Personnel'},
    {id:'oth' , text:'Refer by other people'},
    {id:'ipm' , text:'Field marketing'},
    {id:'em' , text:'Email marketing'},
    {id:'sr' , text:'Exhibition'}
  ]
  