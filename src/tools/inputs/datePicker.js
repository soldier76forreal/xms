import momentJalaali from 'moment-jalaali';
import React from 'react';

import Style from './datepicker.module.scss'
import moment from 'jalali-moment'
import TextField from '@mui/material/TextField';
import AdapterJalali from '@date-io/date-fns-jalali';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
const Datep = ()=>{
  return(
    <div className={Style.datePickerDiv}>
      <LocalizationProvider dateAdapter={AdapterJalali}>
        <DatePicker
            mask="____/__/__"
            // value={value}
            onChange={(newValue) => console.log(newValue)}
            renderInput={(params) => <TextField {...params} />}
          />
      </LocalizationProvider>   
    </div>
  )
}
export default Datep;   