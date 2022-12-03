import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

import IconButton from '@mui/material/IconButton';
import Input from '@mui/material/Input';
import FilledInput from '@mui/material/FilledInput';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Style from './muiInput.module.scss';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useState } from 'react';
export default function MultilineTextFields(props) {
  const [value, setValue] = React.useState('Controlled');
  const [showPassword , setShowPassword] = useState(false);

  return (
    <Box
      component="form"
      sx={{
        '& .MuiTextField-root': { m: 1, width: props.width  },
      }}
      noValidate
      autoComplete="off"
    >

        {props.type === 'normal'?
          <div className={Style.normalDiv}>
            <TextField
              id="filled-multiline-flexible"
              label={props.name}
              multiline
              onChange={props.onChange}
              maxRows={4}
              inputProps={{min: 0, style: { textAlign: 'right' }}} // the change is here
              variant="filled"
            />
          </div>
          :props.type === 'meter'?

          <div className={Style.meterDiv}>
          <TextField
              label={props.name}
              id="filled-start-adornment"
              
              sx={{ m: 1, width: '25ch' }}
              onChange={props.onChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">متر</InputAdornment>,
              }}
              variant="filled"
            />
          </div>
        :props.type === 'password'?
          <div  className={Style.passwordDiv}>

            <FormControl dir='rtl' sx={{ m: 1, width: props.width }} variant="filled">
              <InputLabel htmlFor="filled-adornment-password">{props.name}</InputLabel>
              <FilledInput
                id="filled-adornment-password"
                type={showPassword ? 'text' : 'password'}
                onChange={props.onChange}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={()=>{if(showPassword === true){setShowPassword(false)}else if(showPassword === false){setShowPassword(true)}}}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>
          </div>      
      :props.type === 'price'?

      <div className={Style.meterDiv}>
      <TextField
          label={props.name}
          id="filled-start-adornment"
          
          sx={{ m: 1, width: '25ch' }}
          onChange={props.onChange}
          InputProps={{
            startAdornment: <InputAdornment position="start">تومان</InputAdornment>,
          }}
          variant="filled"
        />
      </div>:null}
     
    </Box>
  );
}