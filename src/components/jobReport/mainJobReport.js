import { Fragment } from 'react';
import ReactDom from 'react-dom';
import Style from './mainJobReport.module.scss'
import SearchBar from '../../tools/navs/searchModule';
import { Divider } from '@mui/material';
import ReportForm from './reportForm';
import { useState } from 'react';
const MainJobReportPortal = (props) =>{
    const [jobReportFormView, setJobReportFormView] = useState(true)
    return(
        <Fragment>
            <ReportForm jobReportFormView={jobReportFormView} setJobReportFormView={setJobReportFormView}></ReportForm>
            <div style={{maxWidth:'700px' , height:'98vh' , padding:'0px 5px 0px 5px'}}  className={Style.ovDiv}>
                <div style={{marginTop:'6px'}} className={Style.topToolsDiv}>
                    <div className={Style.searchDiv}> 
                        <SearchBar></SearchBar>
                    </div>

                </div>
                <div style={{width:'100%', height:'100%'}}>
                    <div className={Style.todayJobReport}>
                        <div>
                            <h3>Your today job report</h3>
                            <div className={Style.cardItemForToday}>
                                <div className={Style.cardItemTodayTitle}>Today-Sunday 2023/02/25<span>not filled</span></div>
                            </div>
                        </div>
                        <Divider sx={{borderBottomWidth:'1px' , opacity:'1' , borderColor:'rgb(194, 194, 194)' , margin:'10px 0px 10px 0px'}}></Divider>
                        <div>
                            <div className={Style.cardItemForNorm}>
                                <div className={Style.cardItemNormTitle}>Today-Sunday 2023/02/25<span>not filled</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    )
}

const MainJobReport = (props)=>{
    return(
        <Fragment>
            {ReactDom.createPortal(
                <MainJobReportPortal>

                </MainJobReportPortal>
                ,
                document.getElementById('jobReport')
            )}
        </Fragment>
    )
}

export default MainJobReport;