import * as React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import '../../assets/flags/flag.min.css';
import '../../assets/flags/flag.css';
import './dropDownMenu.scss'
export default function DropDownMenu(props) {
  const [age, setAge] = React.useState('');

  const handleChange = (event) => {
    setAge(event.target.value);
  };

  return (
    <div>

      <FormControl sx={{ m: 1, minWidth: props.width }}>
        <Select
          value={age}
          onChange={handleChange}
          displayEmpty
          inputProps={{ 'aria-label': 'Without label' }}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          <MenuItem value={10}>اوزبکستان</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
      </FormControl>
    </div>
  );
}



















var countryLists = [
  { id: "al", text: "Albania" },
  { id: "dz", text: "Algeria" },
  { id: "as", text: "American Samoa" },
  { id: "ad", text: "Andorra" },
  { id: "ao", text: "Angola" },
  { id: "ai", text: "Anguilla" },
  { id: "ag", text: "Antigua" },
  { id: "ar", text: "Argentina" },
  { id: "am", text: "Armenia" },
  { id: "aw", text: "Aruba" },
  { id: "au", text: "Australia" },
  { id: "at", text: "Austria" },
  { id: "az", text: "Azerbaijan" },
  { id: "bs", text: "Bahamas" },
  { id: "bh", text: "Bahrain" },
  { id: "bd", text: "Bangladesh" },
  { id: "bb", text: "Barbados" },
  { id: "by", text: "Belarus" },
  { id: "be", text: "Belgium" },
  { id: "bz", text: "Belize" },
  { id: "bj", text: "Benin" },
  { id: "bm", text: "Bermuda" },
  { id: "bt", text: "Bhutan" },
  { id: "bo", text: "Bolivia" },
  { id: "ba", text: "Bosnia" },
  { id: "bw", text: "Botswana" },
  { id: "bv", text: "Bouvet Island" },
  { id: "br", text: "Brazil" },
  { id: "vg", text: "British Virgin Islands" },
  { id: "bn", text: "Brunei" },
  { id: "bg", text: "Bulgaria" },
  { id: "bf", text: "Burkina Faso" },
  { id: "mm", text: "Burma" },
  { id: "bi", text: "Burundi" },
  { id: "tc", text: "Caicos Islands" },
  { id: "kh", text: "Cambodia" },
  { id: "cm", text: "Cameroon" },
  { id: "ca", text: "Canada" },
  { id: "cv", text: "Cape Verde" },
  { id: "ky", text: "Cayman Islands" },
  { id: "cf", text: "Central African Republic" },
  { id: "td", text: "Chad" },
  { id: "cl", text: "Chile" },
  { id: "cn", text: "China" },
  { id: "cx", text: "Christmas Island" },
  { id: "cc", text: "Cocos Islands" },
  { id: "co", text: "Colombia" },
  { id: "km", text: "Comoros" },
  { id: "cg", text: "Congo Brazzaville" },
  { id: "cd", text: "Congo" },
  { id: "ck", text: "Cook Islands" },
  { id: "cr", text: "Costa Rica" },
  { id: "ci", text: "Cote Divoire" },
  { id: "hr", text: "Croatia" },
  { id: "cu", text: "Cuba" },
  { id: "cy", text: "Cyprus" },
  { id: "cz", text: "Czech Republic" },
  { id: "dk", text: "Denmark" },
  { id: "dj", text: "Djibouti" },
  { id: "dm", text: "Dominica" },
  { id: "do", text: "Dominican Republic" },
  { id: "ec", text: "Ecuador" },
  { id: "eg", text: "Egypt" },
  { id: "sv", text: "El Salvador" },
  { id: "gb", text: "England" },
  { id: "gq", text: "Equatorial Guinea" },
  { id: "er", text: "Eritrea" },
  { id: "ee", text: "Estonia" },
  { id: "et", text: "Ethiopia" },
  { id: "eu", text: "European Union" },
  { id: "fk", text: "Falkland Islands" },
  { id: "fo", text: "Faroe Islands" },
  { id: "fj", text: "Fiji" },
  { id: "fi", text: "Finland" },
  { id: "fr", text: "France" },
  { id: "gf", text: "French Guiana" },
  { id: "pf", text: "French Polynesia" },
  { id: "tf", text: "French Territories" },
  { id: "ga", text: "Gabon" },
  { id: "gm", text: "Gambia" },
  { id: "ge", text: "Georgia" },
  { id: "de", text: "Germany" },
  { id: "gh", text: "Ghana" },
  { id: "gi", text: "Gibraltar" },
  { id: "gr", text: "Greece" },
  { id: "gl", text: "Greenland" },
  { id: "gd", text: "Grenada" },
  { id: "gp", text: "Guadeloupe" },
  { id: "gu", text: "Guam" },
  { id: "gt", text: "Guatemala" },
  { id: "gw", text: "Guinea-Bissau" },
  { id: "gn", text: "Guinea" },
  { id: "gy", text: "Guyana" },
  { id: "ht", text: "Haiti" },
  { id: "hm", text: "Heard Island" },
  { id: "hn", text: "Honduras" },
  { id: "hk", text: "Hong Kong" },
  { id: "hu", text: "Hungary" },
  { id: "is", text: "Iceland" },
  { id: "in", text: "India" },
  { id: "io", text: "Indian Ocean Territory" },
  { id: "id", text: "Indonesia" },
  { id: "ir", text: "Iran" },
  { id: "iq", text: "Iraq" },
  { id: "ie", text: "Ireland" },
  { id: "il", text: "Israel" },
  { id: "it", text: "Italy" },
  { id: "jm", text: "Jamaica" },
  { id: "jp", text: "Japan" },
  { id: "jo", text: "Jordan" },
  { id: "kz", text: "Kazakhstan" },
  { id: "ke", text: "Kenya" },
  { id: "ki", text: "Kiribati" },
  { id: "kw", text: "Kuwait" },
  { id: "kg", text: "Kyrgyzstan" },
  { id: "la", text: "Laos" },
  { id: "lv", text: "Latvia" },
  { id: "lb", text: "Lebanon" },
  { id: "ls", text: "Lesotho" },
  { id: "lr", text: "Liberia" },
  { id: "ly", text: "Libya" },
  { id: "li", text: "Liechtenstein" },
  { id: "lt", text: "Lithuania" },
  { id: "lu", text: "Luxembourg" },
  { id: "mo", text: "Macau" },
  { id: "mk", text: "Macedonia" },
  { id: "mg", text: "Madagascar" },
  { id: "mw", text: "Malawi" },
  { id: "my", text: "Malaysia" },
  { id: "mv", text: "Maldives" },
  { id: "ml", text: "Mali" },
  { id: "mt", text: "Malta" },
  { id: "mh", text: "Marshall Islands" },
  { id: "mq", text: "Martinique" },
  { id: "mr", text: "Mauritania" },
  { id: "mu", text: "Mauritius" },
  { id: "yt", text: "Mayotte" },
  { id: "mx", text: "Mexico" },
  { id: "fm", text: "Micronesia" },
  { id: "md", text: "Moldova" },
  { id: "mc", text: "Monaco" },
  { id: "mn", text: "Mongolia" },
  { id: "me", text: "Montenegro" },
  { id: "ms", text: "Montserrat" },
  { id: "ma", text: "Morocco" },
  { id: "mz", text: "Mozambique" },
  { id: "na", text: "Namibia" },
  { id: "nr", text: "Nauru" },
  { id: "np", text: "Nepal" },
  { id: "an", text: "Netherlands Antilles" },
  { id: "nl", text: "Netherlands" },
  { id: "nc", text: "New Caledonia" },
  { id: "pg", text: "New Guinea" },
  { id: "nz", text: "New Zealand" },
  { id: "ni", text: "Nicaragua" },
  { id: "ne", text: "Niger" },
  { id: "ng", text: "Nigeria" },
  { id: "nu", text: "Niue" },
  { id: "nf", text: "Norfolk Island" },
  { id: "kp", text: "North Korea" },
  { id: "mp", text: "Northern Mariana Islands" },
  { id: "no", text: "Norway" },
  { id: "om", text: "Oman" },
  { id: "pk", text: "Pakistan" },
  { id: "pw", text: "Palau" },
  { id: "ps", text: "Palestine" },
  { id: "pa", text: "Panama" },
  { id: "py", text: "Paraguay" },
  { id: "pe", text: "Peru" },
  { id: "ph", text: "Philippines" },
  { id: "pn", text: "Pitcairn Islands" },
  { id: "pl", text: "Poland" },
  { id: "pt", text: "Portugal" },
  { id: "pr", text: "Puerto Rico" },
  { id: "qa", text: "Qatar" },
  { id: "re", text: "Reunion" },
  { id: "ro", text: "Romania" },
  { id: "ru", text: "Russia" },
  { id: "rw", text: "Rwanda" },
  { id: "sh", text: "Saint Helena" },
  { id: "kn", text: "Saint Kitts and Nevis" },
  { id: "lc", text: "Saint Lucia" },
  { id: "pm", text: "Saint Pierre" },
  { id: "vc", text: "Saint Vincent" },
  { id: "ws", text: "Samoa" },
  { id: "sm", text: "San Marino" },
  { id: "gs", text: "Sandwich Islands" },
  { id: "st", text: "Sao Tome" },
  { id: "sa", text: "Saudi Arabia" },
  { id: "sn", text: "Senegal" },
  { id: "cs", text: "Serbia" },
  { id: "rs", text: "Serbia" },
  { id: "sc", text: "Seychelles" },
  { id: "sl", text: "Sierra Leone" },
  { id: "sg", text: "Singapore" },
  { id: "sk", text: "Slovakia" },
  { id: "si", text: "Slovenia" },
  { id: "sb", text: "Solomon Islands" },
  { id: "so", text: "Somalia" },
  { id: "za", text: "South Africa" },
  { id: "kr", text: "South Korea" },
  { id: "es", text: "Spain" },
  { id: "lk", text: "Sri Lanka" },
  { id: "sd", text: "Sudan" },
  { id: "sr", text: "Suriname" },
  { id: "sj", text: "Svalbard" },
  { id: "sz", text: "Swaziland" },
  { id: "se", text: "Sweden" },
  { id: "ch", text: "Switzerland" },
  { id: "sy", text: "Syria" },
  { id: "tw", text: "Taiwan" },
  { id: "tj", text: "Tajikistan" },
  { id: "tz", text: "Tanzania" },
  { id: "th", text: "Thailand" },
  { id: "tl", text: "Timorleste" },
  { id: "tg", text: "Togo" },
  { id: "tk", text: "Tokelau" },
  { id: "to", text: "Tonga" },
  { id: "tt", text: "Trinidad" },
  { id: "tn", text: "Tunisia" },
  { id: "tr", text: "Turkey" },
  { id: "tm", text: "Turkmenistan" },
  { id: "tv", text: "Tuvalu" },
  { id: "ug", text: "Uganda" },
  { id: "ua", text: "Ukraine" },
  { id: "ae", text: "United Arab Emirates" },
  { id: "us", text: "United States" },
  { id: "uy", text: "Uruguay" },
  { id: "um", text: "Us Minor Islands" },
  { id: "vi", text: "Us Virgin Islands" },
  { id: "uz", text: "Uzbekistan" },
  { id: "vu", text: "Vanuatu" },
  { id: "va", text: "Vatican City" },
  { id: "ve", text: "Venezuela" },
  { id: "vn", text: "Vietnam" },
  { id: "wf", text: "Wallis and Futuna" },
  { id: "eh", text: "Western Sahara" },
  { id: "ye", text: "Yemen" },
  { id: "zm", text: "Zambia" },
  { id: "zw", text: "Zimbabwe" }
]