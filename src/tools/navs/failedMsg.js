import './failedMsg.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Fragment } from 'react';
import ReactDom from 'react-dom';
const FailedMsgPortal =(props)=>{
    // const [failedOpenToast , setFailedOpenToast] = useState(false);
    // const [failedMsgToast , setFailedMsgToast] = useState('');
    // const closeSuccessMsg = () =>{
    //     setSuccessOpenToast(false);
    // }
        //             setSuccessOpenToast(true);
        //             setSuccessMsgToast(data.msg);
        //             const closingSuccessMsgTimeOut = setTimeout(closeSuccessMsg, 3000);
    const cssClass = ['failedMsg' , props.openMsg === true? 'failedMsgAnimateIn' : 'failedMsgAnimateOut'];
    return(
        <Fragment>
                <div dir='rtl' className={cssClass.join(' ')}>
                    <div className='failedMsgDiv'> 
                        <div className='failedIconMsg'>
                            <FontAwesomeIcon style={{fontSize:'35px'}} color='#5f000d' icon='times'></FontAwesomeIcon>
                        </div>
                        <div className='failedMsgTextDiv'>
                            <h4>{props.msg}</h4>
                        </div>
                    </div>
                </div>
        </Fragment>
    )
}
const FailedMsg = (props)=>{

    return(
        <Fragment>
            {ReactDom.createPortal(
                <FailedMsgPortal openMsg={props.openMsg} msg={props.msg} ></FailedMsgPortal>
            ,
            document.getElementById('toast')
            
            )}

        </Fragment>
    );
}
export default FailedMsg;
