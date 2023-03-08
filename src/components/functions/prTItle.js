



export default function PrTitle (value){
    var res = prTitles.filter(e=> {return JSON.stringify(e.id) === JSON.stringify(value)})
    return res[0].text;

      
}
var prTitles = [
    {id:'mr' , text:'آقای'},
    {id:'mis' , text:'خانوم'},
    {id:'en' , text:'مهندس'},
    {id:'dr' , text:'دکتر'},
    {id:'po' , text:'استاد'},
    {id:'mrDoc' , text:'آقای دکتر'},
    {id:'misDoc' , text:'خانوم دکتر'},
    {id:'mrEn' , text:'آقای مهندس'},
    {id:'misEn' , text:'خانوم مهندس'}
  ]