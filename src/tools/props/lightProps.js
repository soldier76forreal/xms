import { Fragment } from 'react'
import Style from './lightProps.module.scss'
import ReactDom from 'react-dom';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

const LightPropsPortal = (props)=>{
    return(
        <Fragment>
            <div className={Style.divForProp}>
                <div className={Style.topBack}>
                    <div className={Style.backBtbDiv}>
                        <ArrowBackIosNewIcon sx={{fontSize:'30px'}}></ArrowBackIosNewIcon>
                        
                    </div>
                    <div className={Style.headerTopDiv}>
                        About
                    </div>
                </div>
                <div className={Style.contentDiv}>
                    {props.content}
                </div>
            </div>
        </Fragment>
    )
}

const LightProps = (props)=>{
    
    return(
      <Fragment>
          {ReactDom.createPortal(
              <LightPropsPortal content={props.content}></LightPropsPortal>
          ,
          document.getElementById('ovForms')
          
          )}

      </Fragment>
  );
}

export default LightProps