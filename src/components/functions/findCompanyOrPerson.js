var companyOrPerson = [
    {id:'pr' , text:'Person'},
    {id:'com' , text:'Company'}
  ]
  

  export default function FindCompanyOrPerson (value){
    var res = companyOrPerson.filter(e=> {return JSON.stringify(e.id) === JSON.stringify(value)})
    return res[0].text;

      
}
