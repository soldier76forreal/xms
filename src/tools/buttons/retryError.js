import { Fragment } from "react"

import CloudOffIcon from '@mui/icons-material/CloudOff';
import { Button } from "@mui/material";


const RetryError = (props) =>{
    return(
        <Fragment>
            <div>
                <CloudOffIcon sx={{fontSize:'50px' , marginBottom:'5px'}}></CloudOffIcon>
                <div style={{fontFamily:'YekanBold' , fontSize:'16px'}}>Network error</div>
                <Button onClick={props.onClick} style={{fontSize:'13px'}} variant="outlined" color="error">
                Retry
                </Button>
            </div>
        </Fragment>
    )
}

export default RetryError;