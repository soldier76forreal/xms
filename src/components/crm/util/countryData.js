/**
 * Country data for CRM forms and cards.
 * Each entry: { code, name, dialCode, flag (emoji), cities[] }
 */
const COUNTRIES = [
  // Middle East & Gulf
  { code:'AE', name:'UAE',           dialCode:'+971', flag:'🇦🇪', cities:['Abu Dhabi','Dubai','Sharjah','Ajman','Ras Al Khaimah','Fujairah','Al Ain'] },
  { code:'SA', name:'Saudi Arabia',  dialCode:'+966', flag:'🇸🇦', cities:['Riyadh','Jeddah','Mecca','Medina','Dammam','Khobar','Tabuk','Abha'] },
  { code:'QA', name:'Qatar',         dialCode:'+974', flag:'🇶🇦', cities:['Doha','Al Wakrah','Al Khor','Umm Salal'] },
  { code:'KW', name:'Kuwait',        dialCode:'+965', flag:'🇰🇼', cities:['Kuwait City','Hawalli','Salmiya','Ahmadi','Farwaniya'] },
  { code:'BH', name:'Bahrain',       dialCode:'+973', flag:'🇧🇭', cities:['Manama','Muharraq','Riffa','Isa Town','Hamad Town'] },
  { code:'OM', name:'Oman',          dialCode:'+968', flag:'🇴🇲', cities:['Muscat','Salalah','Sohar','Nizwa','Sur','Ibri'] },
  { code:'IR', name:'Iran',          dialCode:'+98',  flag:'🇮🇷', cities:['Tehran','Mashhad','Isfahan','Shiraz','Tabriz','Karaj','Ahvaz','Qom','Kermanshah','Rasht'] },
  { code:'IQ', name:'Iraq',          dialCode:'+964', flag:'🇮🇶', cities:['Baghdad','Basra','Mosul','Erbil','Najaf','Karbala','Sulaymaniyah','Kirkuk'] },
  { code:'JO', name:'Jordan',        dialCode:'+962', flag:'🇯🇴', cities:['Amman','Zarqa','Irbid','Aqaba','Mafraq','Jerash'] },
  { code:'LB', name:'Lebanon',       dialCode:'+961', flag:'🇱🇧', cities:['Beirut','Tripoli','Sidon','Tyre','Jounieh','Zahle'] },
  { code:'SY', name:'Syria',         dialCode:'+963', flag:'🇸🇾', cities:['Damascus','Aleppo','Homs','Latakia','Hama','Deir ez-Zor'] },
  { code:'YE', name:'Yemen',         dialCode:'+967', flag:'🇾🇪', cities:["Sana'a",'Aden','Taiz','Hodeidah','Ibb'] },
  { code:'TR', name:'Turkey',        dialCode:'+90',  flag:'🇹🇷', cities:['Istanbul','Ankara','Izmir','Bursa','Adana','Gaziantep','Konya','Antalya','Kayseri'] },
  // North Africa
  { code:'EG', name:'Egypt',         dialCode:'+20',  flag:'🇪🇬', cities:['Cairo','Alexandria','Giza','Shubra el-Kheima','Port Said','Suez','Luxor','Aswan','Hurghada'] },
  { code:'LY', name:'Libya',         dialCode:'+218', flag:'🇱🇾', cities:['Tripoli','Benghazi','Misrata','Sabha','Tobruk'] },
  { code:'TN', name:'Tunisia',       dialCode:'+216', flag:'🇹🇳', cities:['Tunis','Sfax','Sousse','Kairouan','Bizerte','Gabes'] },
  { code:'DZ', name:'Algeria',       dialCode:'+213', flag:'🇩🇿', cities:['Algiers','Oran','Constantine','Annaba','Blida','Batna'] },
  { code:'MA', name:'Morocco',       dialCode:'+212', flag:'🇲🇦', cities:['Casablanca','Rabat','Fez','Marrakesh','Agadir','Tangier','Meknes','Oujda'] },
  // South & Central Asia
  { code:'IN', name:'India',         dialCode:'+91',  flag:'🇮🇳', cities:['Mumbai','Delhi','Bangalore','Hyderabad','Ahmedabad','Chennai','Kolkata','Pune','Jaipur','Surat','Lucknow','Kanpur','Nagpur'] },
  { code:'PK', name:'Pakistan',      dialCode:'+92',  flag:'🇵🇰', cities:['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Gujranwala','Peshawar','Quetta'] },
  { code:'AF', name:'Afghanistan',   dialCode:'+93',  flag:'🇦🇫', cities:['Kabul','Kandahar','Herat','Mazar-i-Sharif','Jalalabad'] },
  { code:'BD', name:'Bangladesh',    dialCode:'+880', flag:'🇧🇩', cities:['Dhaka','Chittagong','Khulna','Rajshahi','Sylhet'] },
  { code:'NP', name:'Nepal',         dialCode:'+977', flag:'🇳🇵', cities:['Kathmandu','Pokhara','Lalitpur','Bharatpur','Biratnagar'] },
  { code:'KZ', name:'Kazakhstan',    dialCode:'+7',   flag:'🇰🇿', cities:['Almaty','Nur-Sultan (Astana)','Shymkent','Karaganda','Aktobe'] },
  { code:'UZ', name:'Uzbekistan',    dialCode:'+998', flag:'🇺🇿', cities:['Tashkent','Samarkand','Bukhara','Namangan','Andijan'] },
  // East Asia
  { code:'CN', name:'China',         dialCode:'+86',  flag:'🇨🇳', cities:['Beijing','Shanghai','Guangzhou','Shenzhen','Chengdu','Hangzhou','Wuhan','Tianjin','Nanjing','Xi\'an'] },
  { code:'JP', name:'Japan',         dialCode:'+81',  flag:'🇯🇵', cities:['Tokyo','Osaka','Yokohama','Nagoya','Sapporo','Kobe','Kyoto','Fukuoka'] },
  { code:'KR', name:'South Korea',   dialCode:'+82',  flag:'🇰🇷', cities:['Seoul','Busan','Incheon','Daegu','Daejeon','Gwangju'] },
  // Southeast Asia
  { code:'TH', name:'Thailand',      dialCode:'+66',  flag:'🇹🇭', cities:['Bangkok','Chiang Mai','Pattaya','Phuket','Hat Yai','Nakhon Ratchasima'] },
  { code:'MY', name:'Malaysia',      dialCode:'+60',  flag:'🇲🇾', cities:['Kuala Lumpur','George Town','Johor Bahru','Ipoh','Shah Alam','Petaling Jaya'] },
  { code:'SG', name:'Singapore',     dialCode:'+65',  flag:'🇸🇬', cities:['Singapore'] },
  { code:'ID', name:'Indonesia',     dialCode:'+62',  flag:'🇮🇩', cities:['Jakarta','Surabaya','Bandung','Medan','Semarang','Makassar','Palembang'] },
  { code:'PH', name:'Philippines',   dialCode:'+63',  flag:'🇵🇭', cities:['Manila','Quezon City','Davao','Caloocan','Cebu'] },
  { code:'VN', name:'Vietnam',       dialCode:'+84',  flag:'🇻🇳', cities:['Hanoi','Ho Chi Minh City','Da Nang','Hai Phong','Can Tho'] },
  // Europe
  { code:'GB', name:'United Kingdom',dialCode:'+44',  flag:'🇬🇧', cities:['London','Birmingham','Manchester','Glasgow','Leeds','Liverpool','Sheffield','Edinburgh','Bristol'] },
  { code:'DE', name:'Germany',       dialCode:'+49',  flag:'🇩🇪', cities:['Berlin','Hamburg','Munich','Cologne','Frankfurt','Stuttgart','Düsseldorf','Leipzig','Dortmund'] },
  { code:'FR', name:'France',        dialCode:'+33',  flag:'🇫🇷', cities:['Paris','Marseille','Lyon','Toulouse','Nice','Nantes','Strasbourg','Montpellier','Bordeaux'] },
  { code:'IT', name:'Italy',         dialCode:'+39',  flag:'🇮🇹', cities:['Rome','Milan','Naples','Turin','Palermo','Genoa','Bologna','Florence','Bari','Venice'] },
  { code:'ES', name:'Spain',         dialCode:'+34',  flag:'🇪🇸', cities:['Madrid','Barcelona','Valencia','Seville','Zaragoza','Málaga','Murcia','Palma','Bilbao'] },
  { code:'NL', name:'Netherlands',   dialCode:'+31',  flag:'🇳🇱', cities:['Amsterdam','Rotterdam','The Hague','Utrecht','Eindhoven','Groningen'] },
  { code:'BE', name:'Belgium',       dialCode:'+32',  flag:'🇧🇪', cities:['Brussels','Antwerp','Ghent','Bruges','Liège','Namur'] },
  { code:'CH', name:'Switzerland',   dialCode:'+41',  flag:'🇨🇭', cities:['Zurich','Geneva','Basel','Bern','Lausanne','Winterthur'] },
  { code:'AT', name:'Austria',       dialCode:'+43',  flag:'🇦🇹', cities:['Vienna','Graz','Linz','Salzburg','Innsbruck'] },
  { code:'PL', name:'Poland',        dialCode:'+48',  flag:'🇵🇱', cities:['Warsaw','Kraków','Łódź','Wrocław','Poznań','Gdańsk'] },
  { code:'RU', name:'Russia',        dialCode:'+7',   flag:'🇷🇺', cities:['Moscow','Saint Petersburg','Novosibirsk','Yekaterinburg','Kazan','Nizhny Novgorod','Chelyabinsk','Ufa','Samara'] },
  { code:'UA', name:'Ukraine',       dialCode:'+380', flag:'🇺🇦', cities:['Kyiv','Kharkiv','Odessa','Dnipro','Donetsk','Zaporizhzhia','Lviv'] },
  { code:'GR', name:'Greece',        dialCode:'+30',  flag:'🇬🇷', cities:['Athens','Thessaloniki','Patras','Heraklion','Larissa','Volos'] },
  { code:'PT', name:'Portugal',      dialCode:'+351', flag:'🇵🇹', cities:['Lisbon','Porto','Amadora','Braga','Setúbal','Funchal'] },
  { code:'SE', name:'Sweden',        dialCode:'+46',  flag:'🇸🇪', cities:['Stockholm','Gothenburg','Malmö','Uppsala','Linköping'] },
  { code:'NO', name:'Norway',        dialCode:'+47',  flag:'🇳🇴', cities:['Oslo','Bergen','Trondheim','Stavanger','Drammen'] },
  { code:'DK', name:'Denmark',       dialCode:'+45',  flag:'🇩🇰', cities:['Copenhagen','Aarhus','Odense','Aalborg','Esbjerg'] },
  // Americas
  { code:'US', name:'United States', dialCode:'+1',   flag:'🇺🇸', cities:['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','San Jose','Austin','Miami','Atlanta','Seattle'] },
  { code:'CA', name:'Canada',        dialCode:'+1',   flag:'🇨🇦', cities:['Toronto','Montreal','Vancouver','Calgary','Edmonton','Ottawa','Winnipeg','Quebec City'] },
  { code:'BR', name:'Brazil',        dialCode:'+55',  flag:'🇧🇷', cities:['São Paulo','Rio de Janeiro','Brasília','Salvador','Fortaleza','Belo Horizonte','Manaus','Curitiba'] },
  { code:'MX', name:'Mexico',        dialCode:'+52',  flag:'🇲🇽', cities:['Mexico City','Guadalajara','Monterrey','Puebla','Toluca','Tijuana','León','Ciudad Juárez'] },
  { code:'AR', name:'Argentina',     dialCode:'+54',  flag:'🇦🇷', cities:['Buenos Aires','Córdoba','Rosario','Mendoza','La Plata','San Miguel de Tucumán'] },
  // Africa
  { code:'ZA', name:'South Africa',  dialCode:'+27',  flag:'🇿🇦', cities:['Johannesburg','Cape Town','Durban','Pretoria','Port Elizabeth','Bloemfontein'] },
  { code:'NG', name:'Nigeria',       dialCode:'+234', flag:'🇳🇬', cities:['Lagos','Kano','Ibadan','Abuja','Port Harcourt','Benin City'] },
  { code:'KE', name:'Kenya',         dialCode:'+254', flag:'🇰🇪', cities:['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret'] },
  { code:'GH', name:'Ghana',         dialCode:'+233', flag:'🇬🇭', cities:['Accra','Kumasi','Tamale','Sekondi-Takoradi'] },
  { code:'ET', name:'Ethiopia',      dialCode:'+251', flag:'🇪🇹', cities:['Addis Ababa','Dire Dawa','Mek\'ele','Gondar','Hawassa'] },
  // Oceania
  { code:'AU', name:'Australia',     dialCode:'+61',  flag:'🇦🇺', cities:['Sydney','Melbourne','Brisbane','Perth','Adelaide','Gold Coast','Canberra','Hobart','Darwin'] },
  { code:'NZ', name:'New Zealand',   dialCode:'+64',  flag:'🇳🇿', cities:['Auckland','Wellington','Christchurch','Hamilton','Tauranga','Dunedin'] },
];

/** Fast lookup: dial code → country (first match) */
const DIAL_CODE_MAP = {};
COUNTRIES.forEach(c => {
  if (!DIAL_CODE_MAP[c.dialCode]) DIAL_CODE_MAP[c.dialCode] = c;
});

/** Fast lookup: ISO code → country */
const ISO_MAP = {};
COUNTRIES.forEach(c => { ISO_MAP[c.code] = c; });

/** Fast lookup: country name → country */
const NAME_MAP = {};
COUNTRIES.forEach(c => { NAME_MAP[c.name.toLowerCase()] = c; });

export { COUNTRIES, DIAL_CODE_MAP, ISO_MAP, NAME_MAP };
export default COUNTRIES;
