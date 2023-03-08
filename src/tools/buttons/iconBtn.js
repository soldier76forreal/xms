import { Fragment } from "react";
import Style from "./iconBtn.module.scss";
const IconBotton = (props) =>{
    return(
        <Fragment>
            {props.text === true?
                <button onClick={props.onClick} className={props.color === 'black'? Style.iconButtonWithTextBlack :props.color === 'white'? Style.iconButtonWithText:null}>{props.icon}{props.name}</button>
            :props.text === false?
                <button style={{backgroundColor:`${props.backgroundColor}`}} onClick={props.onClick} className={Style.iconButton}>{props.icon}</button>
            :null}
        </Fragment>
    )
}


export default IconBotton;