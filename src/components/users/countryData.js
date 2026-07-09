// Priority order: Middle East first (this app's primary market), then broader regions.
export const COUNTRIES = [
  { code: 'IR', dial: '+98',  flag: '🇮🇷', name: 'Iran'         },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE'          },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'TR', dial: '+90',  flag: '🇹🇷', name: 'Turkey'       },
  { code: 'IQ', dial: '+964', flag: '🇮🇶', name: 'Iraq'         },
  { code: 'KW', dial: '+965', flag: '🇰🇼', name: 'Kuwait'       },
  { code: 'QA', dial: '+974', flag: '🇶🇦', name: 'Qatar'        },
  { code: 'OM', dial: '+968', flag: '🇴🇲', name: 'Oman'         },
  { code: 'BH', dial: '+973', flag: '🇧🇭', name: 'Bahrain'      },
  { code: 'YE', dial: '+967', flag: '🇾🇪', name: 'Yemen'        },
  { code: 'JO', dial: '+962', flag: '🇯🇴', name: 'Jordan'       },
  { code: 'LB', dial: '+961', flag: '🇱🇧', name: 'Lebanon'      },
  { code: 'SY', dial: '+963', flag: '🇸🇾', name: 'Syria'        },
  { code: 'AF', dial: '+93',  flag: '🇦🇫', name: 'Afghanistan'  },
  { code: 'PK', dial: '+92',  flag: '🇵🇰', name: 'Pakistan'     },
  { code: 'IN', dial: '+91',  flag: '🇮🇳', name: 'India'        },
  { code: 'CN', dial: '+86',  flag: '🇨🇳', name: 'China'        },
  { code: 'RU', dial: '+7',   flag: '🇷🇺', name: 'Russia'       },
  { code: 'DE', dial: '+49',  flag: '🇩🇪', name: 'Germany'      },
  { code: 'IT', dial: '+39',  flag: '🇮🇹', name: 'Italy'        },
  { code: 'FR', dial: '+33',  flag: '🇫🇷', name: 'France'       },
  { code: 'GB', dial: '+44',  flag: '🇬🇧', name: 'UK'           },
  { code: 'ES', dial: '+34',  flag: '🇪🇸', name: 'Spain'        },
  { code: 'NL', dial: '+31',  flag: '🇳🇱', name: 'Netherlands'  },
  { code: 'US', dial: '+1',   flag: '🇺🇸', name: 'USA'          },
  { code: 'CA', dial: '+1',   flag: '🇨🇦', name: 'Canada'       },
  { code: 'AU', dial: '+61',  flag: '🇦🇺', name: 'Australia'    },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Iran

export const findByCode = (code) =>
  COUNTRIES.find(c => c.code === code) || DEFAULT_COUNTRY;
