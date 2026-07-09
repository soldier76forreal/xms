import * as React from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from '../../store/store';

export default function SnackBar() {
  const showSnackBar = useSelector((state) => state.showSnackBar);
  const dispatch = useDispatch();

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    dispatch(actions.setShowSnackBar({ status: false, msg: showSnackBar.msg, type: showSnackBar.type }));
  };

  const handleExited = () => {
    dispatch(actions.setShowSnackBar({ status: false, msg: undefined, type: '' }));
  };

  return (
    <Snackbar
      open={showSnackBar.status}
      autoHideDuration={4000}
      onClose={handleClose}
      TransitionProps={{ onExited: handleExited }}
    >
      {/* type is '' in the initial/reset state — fall back to a valid severity */}
      <Alert onClose={handleClose} severity={showSnackBar.type || 'info'} sx={{ width: '100%' }}>
        {showSnackBar.msg}
      </Alert>
    </Snackbar>
  );
}
