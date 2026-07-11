import * as React from 'react';
import { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import FilledInput from '@mui/material/FilledInput';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function MultilineTextFields(props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Box sx={{ '& .MuiTextField-root': { width: props.width ?? '100%' } }}>

      {props.type === 'normal' ? (
        <TextField
          disabled={props.insertFactor}
          label={props.err?.status === true ? 'Error' : props.name}
          value={props.value ?? ''}
          error={props.err?.status === true}
          helperText={props.err?.status === true ? props.err.msg : null}
          multiline
          onChange={props.onChange}
          maxRows={4}
          inputProps={{ style: { textAlign: 'right' } }}
          fullWidth
          size="small"
        />
      ) : props.type === 'meter' ? (
        <TextField
          label={props.err?.status === true ? 'Error' : props.name}
          disabled={props.insertFactor}
          error={props.err?.status === true}
          helperText={props.err?.status === true ? props.err.msg : null}
          value={props.value ?? ''}
          onChange={props.onChange}
          InputProps={{
            startAdornment: <InputAdornment position="start">unit</InputAdornment>,
          }}
          size="small"
        />
      ) : props.type === 'cm' ? (
        <TextField
          label={props.err?.status === true ? 'Error' : props.name}
          disabled={props.insertFactor}
          error={props.err?.status === true}
          helperText={props.err?.status === true ? props.err.msg : null}
          value={props.value ?? ''}
          onChange={props.onChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <span style={{ fontSize: '7px' }}>cm</span>
              </InputAdornment>
            ),
          }}
          size="small"
        />
      ) : props.type === 'password' ? (
        <FormControl dir="rtl" sx={{ width: props.width ?? '100%' }} variant="outlined" size="small">
          <InputLabel htmlFor="outlined-adornment-password">{props.name}</InputLabel>
          <OutlinedInput
            disabled={props.insertFactor}
            id="outlined-adornment-password"
            type={showPassword ? 'text' : 'password'}
            onChange={props.onChange}
            label={props.name}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword((prev) => !prev)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
          />
        </FormControl>
      ) : props.type === 'price' ? (
        <TextField
          disabled={props.insertFactor}
          label={props.err?.status === true ? 'Error' : props.name}
          value={props.value ?? ''}
          error={props.err?.status === true}
          helperText={props.err?.status === true ? props.err.msg : null}
          onChange={props.onChange}
          InputProps={{
            startAdornment: <InputAdornment position="start">AED</InputAdornment>,
          }}
          size="small"
        />
      ) : null}

    </Box>
  );
}
