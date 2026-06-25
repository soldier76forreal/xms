import { Fragment } from 'react';
import { useHistory } from 'react-router-dom';
import Style from './topPageNav.module.scss';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';



const TopPageNav = (props)=>{
    const history = useHistory()
    return(
        <Fragment>
            <div className={Style.topSection}>
                <div onClick={props.close} className={Style.backBtn}><ArrowBackIosIcon className={Style.arrowIcon} sx={{color:'#000' , fontSize:'30px'}}></ArrowBackIosIcon></div>
                <div className={Style.topTitle}>پیش فاکتور جدید</div>
            </div>
        </Fragment>
    )
}


export default TopPageNav;