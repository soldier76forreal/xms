



export default function CountriesInFarsi (value){
    let searchKey = 'age';
    let result = Object.keys(countries).find(key => key === value);

    return countries[result]
}






















let countries = {
    'AD' : 'آندورا',
    'AE' : 'امارات متحده عربی',
    'AF' : 'افغانستان',
    'AG' : 'آنتیگوا و باربودا',
    'AI' : 'آنگویلا',
    'AL' : 'آلبانی',
    'AM' : 'ارمنستان',
    'AO' : 'آنگولا',
    'AQ' : 'جنوبگان',
    'AR' : 'آرژانتین',
    'AS' : 'ساموآی آمریکا',
    'AT' : 'اتریش',
    'AU' : 'استرالیا',
    'AW' : 'آروبا',
    'AX' : 'جزایر آلند',
    'AZ' : 'جمهوری آذربایجان',
    'BA' : 'بوسنی و هرزگوین',
    'BB' : 'باربادوس',
    'BD' : 'بنگلادش',
    'BE' : 'بلژیک',
    'BF' : 'بورکینا فاسو',
    'BG' : 'بلغارستان',
    'BH' : 'بحرین',
    'BI' : 'بوروندی',
    'BJ' : 'بنین',
    'BL' : 'سنت بارثلمی',
    'BM' : 'برمودا',
    'BN' : 'برونئی',
    'BO' : 'بولیوی',
    'BQ' : 'هلند کارائیب',
    'BR' : 'برزیل',
    'BS' : 'باهاما',
    'BT' : 'بوتان',
    'BV' : 'جزیره بووه',
    'BW' : 'بوتسوانا',
    'BY' : 'بلاروس',
    'BZ' : 'بلیز',
    'CA' : 'کانادا',
    'CC' : 'جزایر کوکوس',
    'CD' : 'جمهوری دموکراتیک کنگو',
    'CF' : 'جمهوری آفریقای مرکزی',
    'CG' : 'جمهوری کنگو',
    'CH' : 'سوئیس',
    'CI' : 'ساحل عاج',
    'CK' : 'جزایر کوک',
    'CL' : 'شیلی',
    'CM' : 'کامرون',
    'CN' : 'چین',
    'CO' : 'کلمبیا',
    'CR' : 'کاستاریکا',
    'CU' : 'کوبا',
    'CV' : 'کیپ ورد',
    'CW' : 'کوراسائو',
    'CX' : 'جزیره کریسمس',
    'CY' : 'قبرس',
    'CZ' : 'جمهوری چک',
    'DE' : 'آلمان',
    'DJ' : 'جیبوتی',
    'DK' : 'دانمارک',
    'DM' : 'دومینیکا',
    'DO' : 'دومینیکا',
    'DZ' : 'الجزایر',
    'EC' : 'اکوادور',
    'EE' : 'استونی',
    'EG' : 'مصر',
    'EH' : 'صحرای غربی',
    'ER' : 'اریتره',
    'ES' : 'اسپانیا',
    'ET' : 'اتیوپی',
    'FI' : 'فنلاند',
    'FJ' : 'فیجی',
    'FK' : 'جزایر فالکلند',
    'FM' : 'ایالات فدرال میکرونزی',
    'FO' : 'جزایر فارو',
    'FR' : 'فرانسه',
    'GA' : 'گابن',
    'GB' : 'انگلستان',
    'GD' : 'گرانادا',
    'GE' : 'گرجستان',
    'GF' : 'گویان فرانسه',
    'GG' : 'گرنزی',
    'GH' : 'غنا',
    'GI' : 'جبل الطارق',
    'GL' : 'گرینلند',
    'GM' : 'گامبیا',
    'GN' : 'گینه',
    'GP' : 'جزیره گوادلوپ',
    'GQ' : 'گینه استوایی',
    'GR' : 'یونان',
    'GS' : 'جزایر جورجیای جنوبی و ساندویچ جنوبی',
    'GT' : 'گواتمالا',
    'GU' : 'گوام',
    'GW' : 'گینه بیسائو',
    'GY' : 'گویان',
    'HK' : 'هنگ کنگ',
    'HM' : 'جزیره هرد و جزایر مک دونالد',
    'HN' : 'هندوراس',
    'HR' : 'کرواسی',
    'HT' : 'هائیتی',
    'HU' : 'مجارستان',
    'ID' : 'اندونزی',
    'IE' : 'جمهوری ایرلند',
    'IL' : 'فلسطین اشغالی (اسرائیل)',
    'IM' : 'جزیره من',
    'IN' : 'هند',
    'IO' : 'قلمروی اقیانوس هند بریتانیا',
    'IQ' : 'عراق',
    'IR' : 'ایران',
    'IS' : 'ایسلند',
    'IT' : 'ایتالیا',
    'JE' : 'ادبیات',
    'JM' : 'جامائیکا',
    'JO' : 'اردن',
    'JP' : 'ژاپن',
    'KE' : 'کنیا',
    'KG' : 'قرقیزستان',
    'KH' : 'کامبوج',
    'KI' : 'کیریباتی',
    'KM' : 'کومور',
    'KN' : 'سنت کیتس و نویس',
    'KP' : 'کره شمالی',
    'KR' : 'کره جنوبی',
    'KW' : 'کویت',
    'KY' : 'جزایر کیمن',
    'KZ' : 'قزاقستان',
    'LA' : 'لائوس',
    'LB' : 'لبنان',
    'LC' : 'سنت لوسیا',
    'LI' : 'لیختن اشتاین',
    'LK' : 'سری لانکا',
    'LR' : 'لیبریا',
    'LS' : 'لسوتو',
    'LT' : 'لیتوانی',
    'LU' : 'لوکزامبورگ',
    'LV' : 'لتونی',
    'LY' : 'لیبی',
    'MA' : 'مراکش',
    'MC' : 'موناکو',
    'MD' : 'مولداوی',
    'ME' : 'مونته نگرو',
    'MF' : 'سنت مارتین فرانسه',
    'MG' : 'ماداگاسکار',
    'MH' : 'جزایر مارشال',
    'MK' : 'جمهوری مقدونیه',
    'ML' : 'مالی',
    'MM' : 'میانمار',
    'MN' : 'مغولستان',
    'MO' : 'ماکائو',
    'MP' : 'جزایر ماریانای شمالی',
    'MQ' : 'مارتینیک',
    'MR' : 'موریتانی',
    'MS' : 'مونتسرات',
    'MT' : 'مالت',
    'MU' : 'موریس',
    'MV' : 'مالدیو',
    'MW' : 'مالاوی',
    'MX' : 'مکزیک',
    'MY' : 'مالزی',
    'MZ' : 'موزامبیک',
    'NA' : 'نامیبیا',
    'NC' : 'کالدونیای جدید',
    'NE' : 'نیجر',
    'NF' : 'جزیره نورفولک',
    'NG' : 'نیجریه',
    'NI' : 'نیکاراگوئه',
    'NL' : 'هلند',
    'NO' : 'نروژ',
    'NP' : 'نپال',
    'NR' : 'نائورو',
    'NU' : 'نیوئه',
    'NZ' : 'نیوزلند',
    'OM' : 'عمان',
    'PA' : 'پاناما',
    'PE' : 'پرو',
    'PF' : 'پلینزی فرانسه',
    'PG' : 'پاپوآ گینه نو',
    'PH' : 'فیلیپین',
    'PK' : 'پاکستان',
    'PL' : 'لهستان',
    'PM' : 'سنت پیر و ماژلان',
    'PN' : 'جزایر پیت‌کرن',
    'PR' : 'پورتوریکو',
    'PS' : 'فلسطین',
    'PT' : 'پرتغال',
    'PW' : 'پالائو',
    'PY' : 'پاراگوئه',
    'QA' : 'قطر',
    'RE' : 'ریونیون',
    'RO' : 'رومانی',
    'RS' : 'صربستان',
    'RU' : 'روسیه',
    'RW' : 'رواندا',
    'SA' : 'عربستان سعودی',
    'SB' : 'جزایر سلیمان',
    'SC' : 'سیشل',
    'SD' : 'سودان',
    'SE' : 'سوئد',
    'SG' : 'سنگاپور',
    'SH' : 'سینت هلینا',
    'SI' : 'اسلوونی',
    'SJ' : 'سوالبارد و یان ماین',
    'SK' : 'اسلواکی',
    'SL' : 'سیرالئون',
    'SM' : 'سن مارینو',
    'SN' : 'سنگال',
    'SO' : 'سومالی',
    'SR' : 'سورینام',
    'ST' : 'سائوتومه و پرینسیپ',
    'SV' : 'السالوادور',
    'SX' : 'سنت مارتین هلند',
    'SY' : 'سوریه',
    'SZ' : 'سوازیلند',
    'TC' : 'جزایر تورکس و کایکوس',
    'TD' : 'چاد',
    'TF' : 'سرزمین‌های قطب جنوب و جنوبی فرانسه',
    'TG' : 'توگو',
    'TH' : 'تایلند',
    'TJ' : 'تاجیکستان',
    'TK' : 'توکلائو',
    'TL' : 'تیمور شرقی',
    'TM' : 'ترکمنستان',
    'TN' : 'تونس',
    'TO' : 'تونگا',
    'TR' : 'ترکیه',
    'TT' : 'ترینیداد و توباگو',
    'TV' : 'تووالو',
    'TW' : 'تایوان',
    'TZ' : 'تانزانیا',
    'UA' : 'اوکراین',
    'UG' : 'اوگاندا',
    'UM' : 'جزایر کوچک حاشیه‌ای آمریکا',
    'US' : 'ایالات متحده',
    'UY' : 'اروگوئه',
    'UZ' : 'ازبکستان',
    'VA' : 'شهر واتیکان',
    'VC' : 'سنت وینسنت و گرنادین',
    'VE' : 'ونزوئلا',
    'VG' : 'جزایر ویرجین بریتانیا',
    'VI' : 'جزایر ویرجین ایالات متحده آمریکا',
    'VN' : 'ویتنام',
    'VU' : 'وانواتو',
    'WF' : 'والیس و فوتونا',
    'WS' : 'ساموآ',
    'YE' : 'یمن',
    'YT' : 'مایوت',
    'ZA' : 'آفریقای جنوبی',
    'ZM' : 'زامبیا',
    'ZW' : 'زیمبابوه',
  }