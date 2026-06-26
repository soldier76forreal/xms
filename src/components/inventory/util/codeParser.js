// Frontend mirror of api/utils/stoneCodeParser.js — keep in sync

const CODE_REGEX = /^([A-Z]{2})(\d{2})([A-Z]{1,2})(\d{4})(\d{2})(\d{2})([VC]?)([FU]?)([PH]?)$/;

const STONE_TYPES = {
  TR:'Travertine', MA:'Marble', GR:'Granite', ON:'Onyx', QU:'Chinese Quartz',
  LI:'Limestone', BA:'Basalt', AL:'Alabaster', CR:'Crystal', AN:'Andesite',
  TO:'Traonyx', TM:'Tramite', OT:'Other',
};

const GRADES = {
  Q:  { name:'Super',    rank:5 },
  QS: { name:'Super+',   rank:6 },
  W:  { name:'Momtaz',   rank:4 },
  E:  { name:'Grade 1',  rank:3 },
  R:  { name:'Grade 2',  rank:2 },
  T:  { name:'Grade 3',  rank:1 },
};

const CUT_NAMES    = { V:'Veincut',   C:'Crosscut' };
const FILL_NAMES   = { F:'Filled',    U:'Unfilled' };
const FINISH_NAMES = { P:'Polished',  H:'Honed' };

export function parseStoneCode(rawCode) {
  if (!rawCode) return null;
  const code = rawCode.trim().toUpperCase();
  const match = CODE_REGEX.exec(code);
  const warnings = [];

  if (!match) {
    return { raw: rawCode, valid: false, parseWarnings: ['Code does not match expected format XX##GLLLLWWTT'] };
  }

  const [, stoneType, quarryCode, grade, llll, ww, tt, cut, fill, finish] = match;
  const lengthCm    = parseInt(llll, 10) / 10;
  const widthCm     = parseInt(ww,   10);
  const thicknessMm = parseInt(tt,   10);
  const productCode = `${stoneType}${quarryCode}`;

  if (!STONE_TYPES[stoneType])  warnings.push(`Unknown stone type: ${stoneType}`);
  if (!GRADES[grade])           warnings.push(`Non-standard grade: ${grade}`);

  const unsized = lengthCm === 0 && widthCm === 0;
  if (unsized) warnings.push('Zero length and width — unsized slab (sold by area/ML)');
  else if (lengthCm === 0 || widthCm === 0) warnings.push('One dimension is zero — verify code');

  return {
    raw: rawCode,
    valid: true,
    productCode,
    stoneType,
    stoneTypeName: STONE_TYPES[stoneType] || stoneType,
    quarryCode,
    grade,
    gradeName:    GRADES[grade]?.name || grade,
    gradeRank:    GRADES[grade]?.rank ?? 0,
    lengthCm,
    widthCm,
    thicknessMm,
    unsized,
    cut:        cut    || null,
    cutName:    CUT_NAMES[cut]    || null,
    fill:       fill   || null,
    fillName:   FILL_NAMES[fill]  || null,
    finish:     finish || null,
    finishName: FINISH_NAMES[finish] || null,
    parseWarnings: warnings,
  };
}

export { STONE_TYPES, GRADES, CUT_NAMES, FILL_NAMES, FINISH_NAMES };
