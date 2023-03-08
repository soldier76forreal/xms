



export default function CustomerOrigin (value){
    var res = customerOrigin.filter(e=> {return JSON.stringify(e.id) === JSON.stringify(value)})
    return res[0].text;
}
var customerOrigin = [
    {id:'call' , text:'بازاریابی تلفنی'},
    {id:'ref' , text:'معرفی مشتریان'},
    {id:'web' , text:'وب سایت'},
    {id:'in' , text:'اینستاگرام'},
    {id:'wa' , text:'واتساپ'},
    {id:'fa' , text:'فیسبوک'},
    {id:'bt' , text:'باتم'},
    {id:'con' , text:'کنفرانس'},
    {id:'wor' , text:'معرفی پرسنل'},
    {id:'oth' , text:'معرفی دیگران'},
    {id:'ipm' , text:'بازار یابی حضوری'},
    {id:'em' , text:'بازاریابی ایمیلی'},
    {id:'sr' , text:'نمایشگاه'}
  ]
  