import { Fragment } from "react";
import Style from "./iconBtn.module.scss";
const IconBotton = (props) =>{
    return(
        <Fragment>
            {props.text === true?
                <button className={Style.iconButtonWithText}>{props.icon} شماره تماس جدید</button>
            :props.text === false?
                <button className={Style.iconButton}>{props.icon}</button>
            :null}
        </Fragment>
    )
}


export default IconBotton;