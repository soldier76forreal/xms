



export default function PrTitle (value){
    var res = prTitles.filter(e=> {return JSON.stringify(e.id) === JSON.stringify(value)})
    return res[0].text;

      
}
var prTitles = [
    {id:'mr' , text:'Mr'},
    {id:'mis' , text:'Ms'},
    {id:'en' , text:'Eng'},
    {id:'dr' , text:'Dr'},
    {id:'po' , text:'Master'},
    {id:'mrDoc' , text:'Dr (Mr)'},
    {id:'misDoc' , text:'Dr (Ms)'},
    {id:'mrEn' , text:'Eng (Mr)'},
    {id:'misEn' , text:'Eng (Ms)'}
  ]