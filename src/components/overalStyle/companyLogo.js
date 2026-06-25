
import { Link, useHistory } from 'react-router-dom/cjs/react-router-dom.min'
import logo from '../../assets/xcapitalLogo.jpg'


const CompanyLogo = (props) =>{
    const history = useHistory()
    return(
        <a href={props.link}>
            <img  style={{width:props.width}} src={logo}></img>

        </a>
        
    )
}
export default CompanyLogo