import './successMsg.css';
import { Fragment } from 'react';
import ReactDom from 'react-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
const SuccessMsgPortal =(props)=>{
    // const closeSuccessMsg = () =>{
    //     setSuccessOpenToast(false);
    // }
    //             setSuccessOpenToast(true);
    //             setSuccessMsgToast(data.msg);
    //             const closingSuccessMsgTimeOut = setTimeout(closeSuccessMsg, 3000);
    const cssClass = ['successMsg' , props.openMsg === true? 'successMsgAnimateIn' : 'successMsgAnimateOut'];
    return(
        <Fragment>
                <div dir='ltr' className={cssClass.join(' ')}>
                    <div className='msgDiv'> 
                        <div className='iconMsg'>
                            <CheckCircleIcon className='iconTick' sx={{ color:'rgb(126, 240, 97)'}}  icon='check-circle'></CheckCircleIcon>
                        </div>
                        <div className='msgTextDiv'>
                            <h4>{props.msg}</h4>
                        </div>
                    </div>
                </div>
        </Fragment>
    )
}
const SuccessMsg = (props)=>{

    return(
        <Fragment>
            {ReactDom.createPortal(
                <SuccessMsgPortal openMsg={props.openMsg} msg={props.msg} ></SuccessMsgPortal>
            ,
            document.getElementById('toast')
            
            )}

        </Fragment>
    );
}
export default SuccessMsg;
