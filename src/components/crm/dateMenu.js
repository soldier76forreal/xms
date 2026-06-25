import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

export default function DateMenu(props) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    props.setDateMenu(false)
  };

  return (
    <div>
      <Button
        id="demo-positioned-button"
        aria-controls={props.dateMenu ? 'demo-positioned-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={props.dateMenu ? 'true' : undefined}
        onClick={()=>{props.setDateMenu(true)}}
        sx={{color:'black' , padding:'0px' , marginTop:'-2px'}}
      >
        نوع تقویم
      </Button>
      <Menu
        id="demo-positioned-menu"
        aria-labelledby="demo-positioned-button"
        anchorEl={anchorEl}
        open={props.dateMenu}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem  onClick={()=>{handleClose(); props.setCalenderType('shamsi')}}>شمسی</MenuItem>
        <MenuItem  onClick={()=>{handleClose(); props.setCalenderType('hejri')}}>حجری</MenuItem>
        <MenuItem value='miladi' onClick={()=>{handleClose(); props.setCalenderType('miladi')}}>میلادی</MenuItem>
      </Menu>
    </div>
  );
}