
import { ArrowBackIos, Call, Cancel, Done, Edit, Email, Facebook, Instagram, LinkedIn, Web, WebStories, WhatsApp } from '@mui/icons-material';
import Botim from '../../assets/botim.png'
const IconRender = props =>{
        var size = {width:props.botimSize , height:props.botimSize}
        var platformWithIcon = [
            {id:'call' , text:'Phone call' , icon:<Call sx={{color:'#007BFF' , fontSize:props.size}}></Call>},
            {id:'web' , text:'Website' , icon:<Web sx={{color:'black' , fontSize:props.size}}></Web>},
            {id:'in' , text:'Instagram' , icon:<Instagram sx={{color:'#BC2A8D' , fontSize:props.size}}></Instagram>},
            {id:'li' , text:'Linked In' , icon:<LinkedIn sx={{color:'#1877F2' , fontSize:props.size}}></LinkedIn>},
            {id:'wa' , text:'WhatsApp' , icon:<WhatsApp sx={{color:'green' , fontSize:props.size}}></WhatsApp>},
            {id:'fa' , text:'Facebook' , icon:<Facebook sx={{color:'#1877F2' , fontSize:props.size}}></Facebook>},
            {id:'bt' , text:'Botim' , icon:<img src={Botim} style={size}></img>},
            {id:'em' , text:'Email' , icon:<Email sx={{color:'#77DD77' , fontSize:props.size}}> </Email>}
          ]
          const filterTheArryForIcon = platformWithIcon.filter(event =>{
            return props.iconName === event.id
          })[0]
          return filterTheArryForIcon.icon
    
}
export default IconRender