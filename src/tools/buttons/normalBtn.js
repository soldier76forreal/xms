import Button from '@mui/material/Button';

const NormalBtn = (props) => {
  return (
    <Button
      onClick={props.onClick}
      disabled={props.disable}
      variant={props.variant ?? 'contained'}
      color={props.color ?? 'primary'}
      fullWidth={props.fullWidth !== false}
      startIcon={props.startIcon}
      size={props.size ?? 'medium'}
    >
      {props.name}
    </Button>
  );
};

export default NormalBtn;
