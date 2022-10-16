import { Fragment } from "react";
import Style from "./littleOneNormal.module.scss";




const LittleOneNormal = (props) =>{
    return(
        <Fragment>
            <h4 className={Style.littleOneNormal}>{props.text}</h4>
        </Fragment>
    )
}
export default LittleOneNormal;