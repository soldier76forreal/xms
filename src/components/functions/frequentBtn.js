import { useContext, useEffect, useState } from "react";
import { ExternalLink } from "react-external-link";
import { useDispatch } from "react-redux";
import { actions, frequentBtnClickForCrmAxios } from "../../store/store";
import AuthContext from "../authAndConnections/auth";
import AxiosGlobal from "../authAndConnections/axiosGlobalUrl";
import { Call, Email, Facebook, Instagram, LinkedIn, Web, WhatsApp } from "@mui/icons-material";
import Style from './frequentBtn.module.css';
import Botim from '../../assets/botim.png';

const FrequentBtn = (props) => {
    const [fqBtn, setFqBtn] = useState('call');
    const axiosCtx = useContext(AuthContext);
    const authCtx = useContext(AxiosGlobal);
    const dispatch = useDispatch();

    // 1. Logic to determine the most frequent button
    useEffect(() => {
        const fq = props.data?.frequentBtnClick || [];
        
        if (fq.length === 0) {
            setFqBtn('call');
        } else {
            let modeMap = {};
            let maxEl = fq[0], maxCount = 1;
            for (let i = 0; i < fq.length; i++) {
                let el = fq[i];
                modeMap[el] = (modeMap[el] || 0) + 1;
                if (modeMap[el] > maxCount) {
                    maxEl = el;
                    maxCount = modeMap[el];
                }
            }
            setFqBtn(maxEl);
        }
    }, [props.data]);

    // 2. Helper to safely extract data and prevent "reading property of null"
    const getSafeData = (path, field) => {
        const list = props.data?.contactInfo?.[path];
        return (list && list.length > 0) ? list[0][field] : null;
    };

    // Extract values safely
    const phoneNumberRaw = props.data?.contactInfo?.phoneNumbers?.[0];
    const phone = phoneNumberRaw ? `+${phoneNumberRaw.countryCode}${phoneNumberRaw.number}` : null;
    const email = getSafeData('emails', 'email');
    const website = getSafeData('websites', 'website');
    const instagram = getSafeData('instagrams', 'instagram');
    const linkedIn = getSafeData('linkedIns', 'linkedIn');
    const facebook = getSafeData('facebooks', 'facebook');
    const botim = getSafeData('botims', 'botim');

    // 3. Centralized Button Configuration
    // If a specific platform is missing data, it defaults to the 'call' configuration
    const btnConfigs = {
        call: {
            id: 'call',
            platform: 'call',
            channel: phone,
            href: `tel:${phone}`,
            icon: <Call sx={{ color: '#fff' }} />
        },
        web: {
            id: 'web',
            platform: 'web',
            channel: website,
            href: `https://${website}`,
            icon: <Web sx={{ color: '#fff' }} />,
            isValid: !!website
        },
        in: {
            id: 'in',
            platform: 'in',
            channel: instagram,
            href: `https://${instagram}`,
            icon: <Instagram sx={{ color: '#fff' }} />,
            isValid: !!instagram
        },
        li: {
            id: 'li',
            platform: 'li',
            channel: linkedIn,
            href: `https://${linkedIn}`,
            icon: <LinkedIn sx={{ color: '#fff' }} />,
            isValid: !!linkedIn
        },
        fa: {
            id: 'fa',
            platform: 'fa',
            channel: facebook,
            href: `https://${facebook}`,
            icon: <Facebook sx={{ color: '#fff' }} />,
            isValid: !!facebook
        },
        bt: {
            id: 'bt',
            platform: 'bt',
            channel: botim,
            href: `https://${botim}`,
            icon: <img style={{ width: '23px', height: '23px' }} src={Botim} alt="Botim" />,
            isValid: !!botim
        },
        em: {
            id: 'em',
            platform: 'em',
            channel: email,
            href: `mailto:${email}`,
            icon: <Email sx={{ color: '#fff' }} />,
            isValid: !!email
        }
    };

    // 4. Determine which button to render
    // If the frequent button is missing data (e.g., fq is 'web' but there is no URL), fallback to 'call'
    const activeConfig = (btnConfigs[fqBtn]?.isValid || fqBtn === 'call') 
        ? btnConfigs[fqBtn] 
        : btnConfigs['call'];

    // Final safety check: if even the phone is missing, don't render to avoid crash
    if (!activeConfig.channel) return null;

    return (
        <ExternalLink
            onClick={(e) => {
                e.stopPropagation();
                dispatch(frequentBtnClickForCrmAxios({ 
                    authCtx, 
                    axiosCtx, 
                    customerId: props.data?._id, 
                    btn: activeConfig.id 
                }));
                dispatch(actions.setTargetDocForCommunication({
                    status: true,
                    docItSelf: props.data,
                    channel: activeConfig.channel,
                    platform: activeConfig.platform
                }));
            }}
            href={activeConfig.href}
        >
            <div className={Style.call}>
                {activeConfig.icon}
            </div>
        </ExternalLink>
    );
};

export default FrequentBtn;