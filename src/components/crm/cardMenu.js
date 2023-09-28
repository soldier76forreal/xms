import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const options = [
    'حذف',
    'ویرایش'
  ];
const ITEM_HEIGHT = 48;

export default function CardMenu(props) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    event.stopPropagation()
  };
  const handleClose = (event) => {
    setAnchorEl(null);
    event.stopPropagation()
  };

  return (
    <div>
      <IconButton
        aria-label="more"
        id="long-button"
        aria-controls={open ? 'long-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="long-menu"
        MenuListProps={{
          'aria-labelledby': 'long-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4.5,
            width: '20ch',
          },
        }}
      >
          <MenuItem   onClick={(e)=>{ props.deleteModal(props.id); e.stopPropagation(); handleClose()}}>
            Delete
          </MenuItem>
          <MenuItem   onClick={(e)=>{props.setEditCustomer({status:true , theCustomer:props.data});e.stopPropagation(); handleClose()}}>
            Edit
          </MenuItem>
          
      </Menu>
    </div>
  );
}