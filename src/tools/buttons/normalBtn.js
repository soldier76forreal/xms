import { Fragment } from 'react';
import Style from './normalBtn.module.scss';


const NormalBtn = (props) =>{
    <Fragment>
        <button style={{width:'100%'}} className={Style.normalBtn}>props.name</button>
    </Fragment>
}
export default NormalBtn;