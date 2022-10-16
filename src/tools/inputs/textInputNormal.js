import { Fragment } from 'react';
import Style from './textInputNormal.module.scss';


const TextInputNormal = (props) =>{
    return(
        <Fragment>
            <div className={Style.textInputDiv}>
                <input placeholder={props.placeholder} type='text' ></input>
            </div>
        </Fragment>
    )
}
export default TextInputNormal;