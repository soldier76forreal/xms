import { Fragment } from "react"


import Lottie from "lottie-react";

import xLoadingWhite from "../../assets/white.json";
import xLoadingBlack from "../../assets/xcapitalLoading.json";

const Loader = (props)=>{
    return(
        <Fragment>
            <Lottie style={{width:props.width}} animationData={props.color === 'black'?xLoadingBlack:props.color === 'white'?xLoadingWhite:null} loop={true} ></Lottie>
        </Fragment>
    )
}
export default Loader