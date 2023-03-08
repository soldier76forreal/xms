import momentJalaali from 'moment-jalaali';
import React from 'react';

import Style from './datepicker.module.scss'
import moment from 'jalali-moment'
import TextField from '@mui/material/TextField';
import AdapterJalali from '@date-io/date-fns-jalali';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
const Datep = (props)=>{
  return(
    <div className={Style.datePickerDiv}>
      <LocalizationProvider dateAdapter={AdapterJalali}>
        <DatePicker
          disabled={props.insertFactor}
          mask="____/__/__"
          value={props.value}
          style={{width:'100%'}}
          onChange={props.onChange}
          renderInput={(params) => <TextField  style={{width:'100%'}} {...params} />}
        />
      </LocalizationProvider>   
    </div>
  )
}
export default Datep;   