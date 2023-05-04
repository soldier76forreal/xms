import * as React from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Style from './toggleBtn.module.scss'
export default function ToggleBtn (props) {
  const [listType, setListType] = React.useState('all');
  const [sort, setSort] = React.useState('all');
  const [callType, setCallType] = React.useState('');
  const [callStatus, setCallStatus] = React.useState('');
  const [prInfos, setPrInfos] = React.useState('prRequests');

  const handleChangePrInfos = (event, newAlignment) => {
    setPrInfos(newAlignment);
    props.setListType(newAlignment);
  };
  const handleChangeType = (event, newAlignment) => {
    setListType(newAlignment);
    props.setListType(newAlignment);
  };
  const handleChangeSort = (event, newAlignment) => {
    setSort(newAlignment);
    props.setListSort(newAlignment);
  };
  const handleChangeCallType = (event, newAlignment) => {
    setCallType(newAlignment);
    props.setCallReason(newAlignment);
  };
  const handleChangeCallStatus = (event, newAlignment) => {
    setCallStatus(newAlignment);
    props.setCallStatus(newAlignment);
  };
  return (
      props.type === 'type'?
          <ToggleButtonGroup
            color="primary"
            sx={{borderColor:'#000'}}
            value={listType}
            exclusive
            onChange={handleChangeType}
            aria-label="Platform"
          >
            <ToggleButton className={Style.toggleBtn}    value="edited">ویرایش شده ها</ToggleButton>
            <ToggleButton className={Style.toggleBtn}    value="sendRequest">دریافتی ها</ToggleButton>
            <ToggleButton className={Style.toggleBtn}    value="newInvoice">تکمیل شده ها</ToggleButton>
            <ToggleButton className={Style.toggleBtn}    value="all">همه</ToggleButton>
          </ToggleButtonGroup>
        :props.type === 'sort'?
          <ToggleButtonGroup
            color="primary"
            
            value={sort}
            exclusive
            onChange={handleChangeSort}
            aria-label="Platform"
          >
              <ToggleButton className={Style.toggleBtn}  value="notVisited">اعلان های مشاهده نشده</ToggleButton>
              <ToggleButton className={Style.toggleBtn}  value="visited">اعلان های مشاهده شده</ToggleButton>
              <ToggleButton className={Style.toggleBtn}  value="all">همه</ToggleButton>

          </ToggleButtonGroup>    
        :props.type === 'callType'?
          <ToggleButtonGroup
              color="primary"
              
              value={callType}
              exclusive
              onChange={handleChangeCallType}
              aria-label="Platform"
            >
              <ToggleButton className={Style.toggleBtn}  value="sales">فروش</ToggleButton>
              <ToggleButton className={Style.toggleBtn}  value="requestFollowUp">پی گیری درخواست</ToggleButton>
              <ToggleButton className={Style.toggleBtn}  value="invoiceFollowUp">پی گیری فاکتور</ToggleButton>
              <ToggleButton className={Style.toggleBtn}  value="customerSatisfaction">رضایت مشتری</ToggleButton>
          </ToggleButtonGroup>
          :props.type === 'callStatus'?
          <ToggleButtonGroup
              color="primary"
              value={callStatus}
              exclusive
              onChange={handleChangeCallStatus}
              aria-label="Platform"
            >
              <ToggleButton className={Style.toggleBtn}  value={true}>پاسخ داده شد</ToggleButton>
              <ToggleButton className={Style.toggleBtn}  value={false}>پاسخ داده نشد</ToggleButton>        
          </ToggleButtonGroup>     
        :props.type === 'prInfos'?
          <ToggleButtonGroup
              color="primary"
              value={prInfos}
              exclusive
              onChange={handleChangePrInfos}
              aria-label="Platform"
            >
              <ToggleButton className={Style.toggleBtn}  value='prRequests'>درخواست ها</ToggleButton>        
              <ToggleButton className={Style.toggleBtn}  value='prCalls'>تماس ها</ToggleButton>
              <ToggleButton className={Style.toggleBtn}  value='prInformation'>مشخصات</ToggleButton>
          </ToggleButtonGroup> 
        :null
  );
}