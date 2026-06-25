import React  , {Fragment} from 'react';
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
import { Style } from '@mui/icons-material';
import S from './speedDial.module.scss'
const actions = [
  { icon: <FileCopyIcon />, name: 'Copy' },
  { icon: <SaveIcon />, name: 'Save' },
  { icon: <PrintIcon />, name: 'Print' },
  { icon: <ShareIcon />, name: 'Share' },
];

function OpenIconSpeedDialPortal(props) {
  return (
    <div className={S.dialDiv}>

      <SpeedDial
        onClick={props.onClick}
        ariaLabel="SpeedDial openIcon example"
        sx={{ zIndex:'10', position: 'absolute', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon openIcon={<EditIcon />} />}
      >
      </SpeedDial>
    </div>
  );
}


const OpenIconSpeedDial = (props)=>{

  return(
      <Fragment>
        <div style={{position:'absolute' , bottom:'0px'}}>

          {ReactDom.createPortal(
              <OpenIconSpeedDialPortal onClick={props.onClick} ></OpenIconSpeedDialPortal>
          ,
          document.getElementById('speedDial')
          
          )}
        </div>

      </Fragment>
  );
}
export default OpenIconSpeedDial;