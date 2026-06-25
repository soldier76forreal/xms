import TextField from '@mui/material/TextField';

const TextInputNormal = (props) => {
  return (
    <TextField
      disabled={props.disable}
      onChange={props.onChange}
      value={props.value ?? ''}
      name={props.name}
      placeholder={props.placeholder}
      type="text"
      fullWidth
      size="small"
    />
  );
};

export default TextInputNormal;
