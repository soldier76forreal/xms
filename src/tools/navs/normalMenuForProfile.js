import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

export default function NormalMenuForProfile(props) {


  return (
    <div>

      <Menu
        id="demo-positioned-menu"
        aria-labelledby="demo-positioned-button"
        anchorEl={props.anchorEl}
        open={props.open}
        onClose={props.handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{marginTop:'38px'}}
      >
        <MenuItem onClick={props.handleClose}>تنظیمات</MenuItem>
        <MenuItem onClick={props.handleClose}>خروج از حساب کاربری</MenuItem>
      </Menu>
    </div>
  );
}