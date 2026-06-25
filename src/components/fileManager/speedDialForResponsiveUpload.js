import { Fragment } from "react"
import * as React from 'react';
import Box from '@mui/material/Box';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import FileCopyIcon from '@mui/icons-material/FileCopyOutlined';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import ReactDom from 'react-dom';
import { CreateNewFolder, Upload } from "@mui/icons-material";
import S from '../../tools/buttons/speedDial.module.scss'




const actions = [
    { icon: <Upload  sx={{color:'white'}}/>, name: 'Upload' },
    { icon: <CreateNewFolder   sx={{color:'white'}} />, name: 'NewFolder' },
  ];
const SpeedDialForResponsiveUploadPortal = (props) =>{
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);

    const handleClose = ()=>{
        setOpen(false)
    }

    return(
        <Fragment>
            <div className={S.dialDivFileRes}>
                <SpeedDial
                    ariaLabel="SpeedDial tooltip example"
                    sx={{ position: 'absolute', bottom: 16, right: 16 }}
                    icon={<SpeedDialIcon />}
                    onClose={handleClose}
                    onOpen={handleOpen}
                    open={open}
                >
                    {actions.map((action) => (
                    <SpeedDialAction
                        key={action.name}
                        icon={action.icon}
                        tooltipTitle={action.name}
                        tooltipOpen
                        onClick={action.name === 'NewFolder'?props.newFolder:action.name === 'Upload'?props.handleFileSelect:null}
                    />
                    ))}
                </SpeedDial>
                
            </div>

        </Fragment>
    )
}
const SpeedDialForResponsiveUpload = (props)=>{

    return(
        <Fragment>
          <div style={{position:'absolute' , bottom:'0px'}}>
  
            {ReactDom.createPortal(
                <SpeedDialForResponsiveUploadPortal handleFileSelect={props.handleFileSelect} newFolder={props.newFolder}></SpeedDialForResponsiveUploadPortal>
            ,
            document.getElementById('speedDial')
            
            )}
          </div>
  
        </Fragment>
    );
  }
  export default SpeedDialForResponsiveUpload;

