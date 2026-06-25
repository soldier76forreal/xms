import { Fragment } from "react";
import Style from "./bigOneWithDot.module.scss";



const BigOneWithDot = (props) =>{
    return(
        <Fragment>
            <div className={Style.titleDiv}>
                <h3><span></span>{props.text}</h3>
            </div>
        </Fragment>
    )
}
export default BigOneWithDot;