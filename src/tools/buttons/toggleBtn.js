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
            <ToggleButton  style={{padding:'6px 10px 5px 10px' , fontSize:'13px' , borderColor:'#000' , color:'#000'}}  value="edited">ویرایش شده ها</ToggleButton>
            <ToggleButton  style={{padding:'6px 10px 5px 10px' , fontSize:'13px' , borderColor:'#000' , color:'#000'}}  value="sendRequest">دریافتی ها</ToggleButton>
            <ToggleButton  style={{padding:'6px 10px 5px 10px' , fontSize:'13px' , borderColor:'#000' , color:'#000'}}  value="newInvoice">تکمیل شده ها</ToggleButton>
            <ToggleButton  style={{padding:'6px 10px 5px 10px' , fontSize:'13px' , borderColor:'#000' , color:'#000'}}  value="all">همه</ToggleButton>
          </ToggleButtonGroup>
        :props.type === 'sort'?
          <ToggleButtonGroup
            color="primary"
            
            value={sort}
            exclusive
            onChange={handleChangeSort}
            aria-label="Platform"
          >
              <ToggleButton className={Style.toggleBtn} sx={{padding:'6px 10px 5px 10px' , fontSize:'13px' , borderColor:'#000', color:'#000'}} value="notVisited">اعلان های مشاهده نشده</ToggleButton>
              <ToggleButton className={Style.toggleBtn} sx={{padding:'6px 10px 5px 10px' , fontSize:'13px' , borderColor:'#000', color:'#000'}} value="visited">اعلان های مشاهده شده</ToggleButton>
              <ToggleButton className={Style.toggleBtn} sx={{padding:'6px 10px 5px 10px' , fontSize:'13px' , borderColor:'#000' , color:'#000'}} value="all">همه</ToggleButton>

          </ToggleButtonGroup>    
        :props.type === 'callType'?
          <ToggleButtonGroup
              color="primary"
              
              value={callType}
              exclusive
              onChange={handleChangeCallType}
              aria-label="Platform"
            >
              <ToggleButton className={Style.toggleBtn} sx={{padding:'6px 10px 5px 10px' , fontSize:'13px' , borderColor:'#000', color:'#000'}} value="sales">فروش</ToggleButton>
              <ToggleButton className={Style.toggleBtn} sx={{padding:'6px 10px 5px 10px' , fontSize:'13px' , borderColor:'#000', color:'#000'}} value="requestFollowUp">پی گیری درخواست</ToggleButton>
              <ToggleButton className={Style.toggleBtn} sx={{padding:'6px 10px 5px 10px' , fontSize:'13px' , borderColor:'#000' , color:'#000'}} value="invoiceFollowUp">پی گیری فاکتور</ToggleButton>
              <ToggleButton className={Style.toggleBtn} sx={{padding:'6px 10px 5px 10px' , fontSize:'13px' , borderColor:'#000' , color:'#000'}} value="customerSatisfaction">رضایت مشتری</ToggleButton>
          </ToggleButtonGroup>
          :props.type === 'callStatus'?
          <ToggleButtonGroup
              color="primary"
              value={callStatus}
              exclusive
              onChange={handleChangeCallStatus}
              aria-label="Platform"
            >
              <ToggleButton className={Style.toggleBtn} sx={{padding:'6px 10px 5px 10px' , fontSize:'13px' , borderColor:'#000', color:'#000'}} value={true}>پاسخ داده شد</ToggleButton>
              <ToggleButton className={Style.toggleBtn} sx={{padding:'6px 10px 5px 10px' , fontSize:'13px' , borderColor:'#000', color:'#000'}} value={false}>پاسخ داده نشد</ToggleButton>        
          </ToggleButtonGroup>     
        :props.type === 'prInfos'?
          <ToggleButtonGroup
              color="primary"
              value={prInfos}
              exclusive
              onChange={handleChangePrInfos}
              aria-label="Platform"
            >
              <ToggleButton className={Style.toggleBtn} sx={{padding:'6px 10px 5px 10px' , fontSize:'13px' , borderColor:'#000', color:'#000'}} value='prRequests'>درخواست ها</ToggleButton>        
              <ToggleButton className={Style.toggleBtn} sx={{padding:'6px 10px 5px 10px' , fontSize:'13px' , borderColor:'#000', color:'#000'}} value='prCalls'>تماس ها</ToggleButton>
              <ToggleButton className={Style.toggleBtn} sx={{padding:'6px 10px 5px 10px' , fontSize:'13px' , borderColor:'#000', color:'#000'}} value='prInformation'>مشخصات</ToggleButton>
          </ToggleButtonGroup> 
        :null
  );
}