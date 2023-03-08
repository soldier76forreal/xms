import { Fragment } from "react"
import Style from './noData.module.scss';
import DvrIcon from '@mui/icons-material/Dvr';




const NoData = (props) =>{
    return(
        <Fragment>
            <div className={Style.mainDiv}>
                <div style={{margin:'0px auto 0px 10px auto' , display:'flex', justifyContent:'center'}}>
                    <DvrIcon  className={Style.noDataIcon}></DvrIcon>
                </div>
                <div className={Style.title}>{props.caption}</div>
            </div> 
        </Fragment>
    )
}
export default NoData;