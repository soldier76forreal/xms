import { Fragment } from "react"

import CloudOffIcon from '@mui/icons-material/CloudOff';
import { Button } from "@mui/material";


const RetryError = (props) =>{
    return(
        <Fragment>
            <div>
                <CloudOffIcon sx={{fontSize:'50px' , marginBottom:'5px'}}></CloudOffIcon>
                <div style={{fontFamily:'YekanBold' , fontSize:'16px'}}>خطا در شبکه</div>
                <Button onClick={props.onClick} style={{fontSize:'13px'}} variant="outlined" color="error">
                تلاش مجدد
                </Button>
            </div>
        </Fragment>
    )
}

export default RetryError;