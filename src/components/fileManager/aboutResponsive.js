import { Fragment } from 'react'
import Style from './aboutResponsive.module.scss'
import { Folder } from '@mui/icons-material'
import Img from '../../assets/Artboard 1.png'

const AboutResponsive = () =>{
    return(
        <Fragment>
            <div className={Style.ovDiv}>
                <div className={Style.imageFolderIconDiv}>
                    <div>
                        <Folder sx={{fontSize:'130px'}}></Folder>
                        <div className={Style.imageDiv}>
                            <img src={Img}></img>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    )
}
export default AboutResponsive