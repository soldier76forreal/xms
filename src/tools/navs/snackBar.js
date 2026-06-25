import * as React from 'react';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../../store/store';
import { Alert } from '@mui/material';

export default function SnackBar(props) {
  const [snackPack, setSnackPack] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [messageInfo, setMessageInfo] = React.useState(undefined);
  const showSnackBar = useSelector((state) => state.showSnackBar);
    const dispatch = useDispatch()


  const handleClick = (message) => () => {
    setSnackPack((prev) => [...prev, { message, key: new Date().getTime() }]);
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(actions.setShowSnackBar({status:false,msg:showSnackBar.msg,type:showSnackBar.type}))
  };

  const handleExited = () => {
    dispatch(actions.setShowSnackBar({status:false,msg:undefined,type:''}))

  };

  return (
    <div>
      <Snackbar anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} sx={{zIndex:'111111111111111111111'}} open={showSnackBar.status} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={showSnackBar.type} sx={{ width: '100%' }}>
          {showSnackBar.msg}
        </Alert>
      </Snackbar>


    </div>
  );
}