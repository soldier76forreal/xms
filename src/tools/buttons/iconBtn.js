import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

const IconBotton = (props) => {
  if (props.text === false) {
    return (
      <IconButton
        onClick={props.onClick}
        disabled={props.disable}
        sx={props.backgroundColor ? { backgroundColor: props.backgroundColor } : undefined}
      >
        {props.icon}
      </IconButton>
    );
  }

  return (
    <Button
      onClick={props.onClick}
      disabled={props.disable}
      variant={props.color === 'black' ? 'contained' : 'outlined'}
      startIcon={props.icon}
    >
      {props.name}
    </Button>
  );
};

export default IconBotton;
