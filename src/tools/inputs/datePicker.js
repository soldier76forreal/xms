import momentJalaali from 'moment-jalaali';
import React from 'react';
import DatePicker from 'react-datepicker2';
import Style from './datepicker.module.scss'
class Datep extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        value: momentJalaali(),
        isGregorian:false,
        
      };
    }
    render() {
      return <div className={Style.datePickerDiv}>
              <DatePicker
                value={this.state.value}
                timePicker={false}
                isGregorian={this.state.isGregorian}
                placeholder='تاریخ'
                onChange={value => {this.props.onChange( value._d);}}
              />
              <br />
            </div>
    }
  }

  export default Datep;