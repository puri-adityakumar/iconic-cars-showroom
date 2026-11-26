export type VehicleId =
  | 'porsche-911-rs'
  | 'bmw-e30-m3'
  | 'bmw-e39-m5'
  | 'nissan-r35-gtr';

export type SubsystemId =
  | 'all'
  | 'body'
  | 'engine'
  | 'transaxle'
  | 'chassis'
  | 'wheels';

export type CutawayMode = 'solid' | 'xray' | 'section';

export type CameraPresetId = 'hero' | 'engine' | 'chassis' | 'front' | 'side';

export type EnvironmentId = 'sakura' | 'canada' | 'india' | 'studio';

export type LiveryId = string;

export interface EnvironmentSpec {
  id: EnvironmentId;
  label: string;
  swatchHex: string;
  isOutdoor: boolean;
  skyTopHex: string;
  skyMidHex: string;
  skyHorizonHex: string;
  fogHex: string;
  fogDensity: number;
  sunColorHex: string;
  sunIntensity: number;
  sunPos: [number, number, number];
  hemiSkyHex: string;
  hemiGroundHex: string;
  hemiIntensity: number;
  rimColorHex: string;
  rimIntensity: number;
  floorHex: string;
  floorRoughness: number;
  floorMetalness: number;
  ringHex: string;
  softboxHex: string;
  shoulderHex: string;
  mountainFarHex: string;
  mountainNearHex: string;
  exposure: number;
}

export const ENVIRONMENTS: EnvironmentSpec[] = [
  {
    id: 'sakura',
    label: 'Sakura',
    swatchHex: '#f2a7bf',
    isOutdoor: true,
    skyTopHex: '#2f3557',
    skyMidHex: '#997b98',
    skyHorizonHex: '#f5c7bd',
    fogHex: '#e7bfb9',
    fogDensity: 0.0105,
    sunColorHex: '#ffe4cc',
    sunIntensity: 2.15,
    sunPos: [12, 8.5, -14],
    hemiSkyHex: '#f7dce6',
    hemiGroundHex: '#383c45',
    hemiIntensity: 0.88,
    rimColorHex: '#ffd1de',
    rimIntensity: 1.08,
    floorHex: '#1c1f25',
    floorRoughness: 0.44,
    floorMetalness: 0.12,
    ringHex: '#5a5f6b',
    softboxHex: '#fff4f7',
    shoulderHex: '#4f5a44',
    mountainFarHex: '#7d7591',
    mountainNearHex: '#4d4d63',
    exposure: 1.06,
  },
  {
    id: 'canada',
    label: 'Canada',
    swatchHex: '#d94d26',
    isOutdoor: true,
    skyTopHex: '#234773',
    skyMidHex: '#6c91b2',
    skyHorizonHex: '#f2c896',
    fogHex: '#dfb98e',
    fogDensity: 0.010,
    sunColorHex: '#ffd99e',
    sunIntensity: 2.25,
    sunPos: [14, 8.5, 10],
    hemiSkyHex: '#c8def2',
    hemiGroundHex: '#3c3e45',
    hemiIntensity: 0.84,
    rimColorHex: '#ffe3b3',
    rimIntensity: 1.02,
    floorHex: '#1e2025',
    floorRoughness: 0.46,
    floorMetalness: 0.11,
    ringHex: '#5e636e',
    softboxHex: '#fff7eb',
    shoulderHex: '#6c5838',
    mountainFarHex: '#6c7c8f',
    mountainNearHex: '#504b46',
    exposure: 1.05,
  },
  {
    id: 'india',
    label: 'India',
    swatchHex: '#2e7d47',
    isOutdoor: true,
    skyTopHex: '#23444e',
    skyMidHex: '#679192',
    skyHorizonHex: '#c9ded2',
    fogHex: '#b9cfc4',
    fogDensity: 0.0125,
    sunColorHex: '#fff2d4',
    sunIntensity: 2.1,
    sunPos: [-10, 10, 12],
    hemiSkyHex: '#d8ece2',
    hemiGroundHex: '#333b37',
    hemiIntensity: 0.92,
    rimColorHex: '#c8f0d8',
    rimIntensity: 0.98,
    floorHex: '#1d2122',
    floorRoughness: 0.36,
    floorMetalness: 0.14,
    ringHex: '#56605c',
    softboxHex: '#f2fcf6',
    shoulderHex: '#2b5933',
    mountainFarHex: '#5d7c78',
    mountainNearHex: '#2a563a',
    exposure: 1.06,
  },
  {
    id: 'studio',
    label: 'Studio',
    swatchHex: '#262930',
    isOutdoor: false,
    skyTopHex: '#111317',
    skyMidHex: '#1f2229',
    skyHorizonHex: '#31353e',
    fogHex: '#2c3039',
    fogDensity: 0.030,
    sunColorHex: '#fff7ea',
    sunIntensity: 2.0,
    sunPos: [4.5, 6.5, 4.2],
    hemiSkyHex: '#eef3fa',
    hemiGroundHex: '#23262d',
    hemiIntensity: 0.76,
    rimColorHex: '#dce8ff',
    rimIntensity: 1.15,
    floorHex: '#14161a',
    floorRoughness: 0.48,
    floorMetalness: 0.10,
    ringHex: '#4f5560',
    softboxHex: '#ffffff',
    shoulderHex: '#14161a',
    mountainFarHex: '#2c3039',
    mountainNearHex: '#2c3039',
    exposure: 1.10,
  },
];

export interface LiverySpec {
  id: string;
  name: string;
  bodyHex: string;
  scriptHex: string;
  wheelAccentHex: string;
  swatchHex: string;
}

export interface SubsystemSpec {
  id: SubsystemId;
  label: string;
  shortLabel: string;
  specLine: string;
  calloutWorld: [number, number, number];
}

export interface CameraPreset {
  id: CameraPresetId;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}

export type EngineLayout = 'flat6' | 'i4' | 'v8' | 'v6';

export interface VehicleEngineSpec {
  layout: EngineLayout;
  engineCode: string;
  summary: string;
  cylinders: number;
  boreMm: number;
  strokeMm: number;
  bore: number;
  stroke: number;
  crankRadius: number;
  rodLength: number;
  bankAngleDeg: number;
  compressionRatio: number;
  firingOrder: readonly number[];
  firingOrderLabel: string;
  idleRpm: number;
  redlineRpm: number;
  maxRpm: number;
  powerPs: number;
  powerRpm: number;
  torqueNm: number;
  torqueRpm: number;
  fanDriveRatio: number;
  distributorRatio: number;
}

export interface VehicleSpec {
  id: VehicleId;
  shortName: string;
  model: string;
  edition: string;
  year: number;
  chassisCode: string;
  accentHex: string;
  length: number;
  width: number;
  height: number;
  wheelbase: number;
  frontAxleZ: number;
  rearAxleZ: number;
  frontTrack: number;
  rearTrack: number;
  curbWeightKg: number;
  groundClearance: number;
  wheelRimDiameter: number;
  frontTireRadius: number;
  frontTireWidth: number;
  rearTireRadius: number;
  rearTireWidth: number;
  frontDiscDiameter: number;
  rearDiscDiameter: number;
  transaxleShort: string;
  engine: VehicleEngineSpec;
  liveries: LiverySpec[];
  subsystems: Record<SubsystemId, SubsystemSpec>;
  cameraPresets: Record<CameraPresetId, CameraPreset>;
  subsystemCameras: Record<
    SubsystemId,
    { pos: [number, number, number]; look: [number, number, number] }
  >;
}

/**
 * 1973 Porsche 911 Carrera RS 2.7 (Type 911/83) dimensional source of truth.
 * All units in meters (m) unless noted.
 * Vehicle coordinate frame: +Z = Front, -Z = Rear, +Y = Up, +X = Left (Port).
 */
export const PORSCHE_SPECS = {
  model: 'Porsche 911 Carrera RS 2.7',
  year: 1973,
  chassisCode: 'Type 911/83 · F-Body',

  length: 4.147,
  width: 1.652,
  rearFlareWidth: 1.706,
  height: 1.320,
  wheelbase: 2.271,
  frontAxleZ: 1.1355,
  rearAxleZ: -1.1355,
  frontBumperZ: 2.01,
  rearBumperZ: -2.14,
  frontTrack: 1.416,
  rearTrack: 1.474,
  groundClearance: 0.128,

  wheelRimDiameter: 0.381, // 15"
  frontTireRadius: 0.312, // 185/70 VR15
  frontTireWidth: 0.185,
  rearTireRadius: 0.312, // 215/60 VR15
  rearTireWidth: 0.215,

  frontDiscDiameter: 0.2825,
  rearDiscDiameter: 0.290,

  engine: {
    cylinders: 6,
    boreMm: 90.0,
    strokeMm: 70.4,
    bore: 0.090,
    stroke: 0.0704,
    crankRadius: 0.0352,
    rodLength: 0.1278,
    compressionRatio: 8.5,
    firingOrder: [1, 6, 2, 4, 3, 5] as const,
    maxRpm: 7300,
    idleRpm: 950,
    redlineRpm: 7200,
    powerPs: 210,
    powerRpm: 6300,
    torqueNm: 255,
    torqueRpm: 5100,
    fanDriveRatio: 1.8,
    distributorRatio: 0.5,
    cylinderSpacingZ: 0.118,
    bankOffsetZ: 0.022,
  },

  transaxle: {
    code: 'Type 915',
    gears: 5,
    finalDrive: 4.428,
  },
} as const;

export const LIVERIES: LiverySpec[] = [
  {
    id: 'gp-white-red',
    name: 'Grand Prix White',
    bodyHex: '#f3f2ed',
    scriptHex: '#d6182b',
    wheelAccentHex: '#c81828',
    swatchHex: '#f3f2ed',
  },
  {
    id: 'gp-white-blue',
    name: 'White / Carrera Blue',
    bodyHex: '#f3f2ed',
    scriptHex: '#185399',
    wheelAccentHex: '#185399',
    swatchHex: '#185399',
  },
  {
    id: 'guards-red',
    name: 'Guards Red',
    bodyHex: '#c81c22',
    scriptHex: '#15171a',
    wheelAccentHex: '#17191c',
    swatchHex: '#c81c22',
  },
  {
    id: 'signal-yellow',
    name: 'Signal Yellow',
    bodyHex: '#e3a818',
    scriptHex: '#15171a',
    wheelAccentHex: '#17191c',
    swatchHex: '#e3a818',
  },
  {
    id: 'irish-green',
    name: 'Irish Green',
    bodyHex: '#1c442d',
    scriptHex: '#d8b24c',
    wheelAccentHex: '#17191c',
    swatchHex: '#1c442d',
  },
];

export const SUBSYSTEM_SPECS: Record<SubsystemId, SubsystemSpec> = {
  all: {
    id: 'all',
    label: 'Complete Vehicle',
    shortLabel: 'Full Car',
    specLine: '4,147 × 1,652 × 1,320 mm · Wheelbase 2,271 mm · 975 kg',
    calloutWorld: [0, 0.72, 0],
  },
  body: {
    id: 'body',
    label: 'Steel Unibody & Ducktail',
    shortLabel: 'Body',
    specLine: 'Thin-gauge steel shell · Fiberglass Burzel ducktail · Cd 0.40',
    calloutWorld: [0, 1.04, -1.98],
  },
  engine: {
    id: 'engine',
    label: 'Type 911/83 Flat-6',
    shortLabel: 'Flat-6',
    specLine: '2,687 cc Air-Cooled Boxer · 90.0 × 70.4 mm · 210 PS · 1-6-2-4-3-5',
    calloutWorld: [0, 0.52, -1.62],
  },
  transaxle: {
    id: 'transaxle',
    label: 'Type 915 Transaxle',
    shortLabel: '915',
    specLine: '5-Speed Manual · Magnesium Case · 4.428 Final Drive',
    calloutWorld: [0, 0.36, -0.82],
  },
  chassis: {
    id: 'chassis',
    label: 'Chassis & Torsion Suspension',
    shortLabel: 'Chassis',
    specLine: 'Front MacPherson Strut · Rear Semi-Trailing Arm · Torsion Bars',
    calloutWorld: [0.35, 0.54, 0.96],
  },
  wheels: {
    id: 'wheels',
    label: 'Forged Fuchs & Brakes',
    shortLabel: 'Wheels',
    specLine: '6Jx15 / 7Jx15 Forged Alloy · 282.5 / 290 mm Ventilated Discs',
    calloutWorld: [0.80, 0.32, 1.135],
  },
};

export const CAMERA_PRESETS: Record<CameraPresetId, CameraPreset> = {
  hero: {
    id: 'hero',
    label: 'Hero',
    position: [3.86, 1.08, 3.55],
    target: [-0.04, 0.56, -0.04],
  },
  engine: {
    id: 'engine',
    label: 'Engine',
    position: [1.55, 1.06, -3.28],
    target: [0, 0.52, -1.75],
  },
  chassis: {
    id: 'chassis',
    label: 'Chassis',
    position: [3.15, 1.75, 1.95],
    target: [0, 0.42, 0.0],
  },
  front: {
    id: 'front',
    label: 'Front',
    position: [0.95, 0.84, 3.85],
    target: [0, 0.48, 0.20],
  },
  side: {
    id: 'side',
    label: 'Side',
    position: [5.05, 0.80, -0.05],
    target: [0, 0.50, -0.05],
  },
};

export const VEHICLES: Record<VehicleId, VehicleSpec> = {
  'porsche-911-rs': {
    id: 'porsche-911-rs',
    shortName: '911 RS 2.7',
    model: 'Porsche 911 Carrera RS 2.7',
    edition: 'Type 911/83',
    year: 1973,
    chassisCode: 'Type 911/83 · F-Body',
    accentHex: '#d6182b',
    length: PORSCHE_SPECS.length,
    width: PORSCHE_SPECS.width,
    height: PORSCHE_SPECS.height,
    wheelbase: PORSCHE_SPECS.wheelbase,
    frontAxleZ: PORSCHE_SPECS.frontAxleZ,
    rearAxleZ: PORSCHE_SPECS.rearAxleZ,
    frontTrack: PORSCHE_SPECS.frontTrack,
    rearTrack: PORSCHE_SPECS.rearTrack,
    curbWeightKg: 975,
    groundClearance: PORSCHE_SPECS.groundClearance,
    wheelRimDiameter: PORSCHE_SPECS.wheelRimDiameter,
    frontTireRadius: PORSCHE_SPECS.frontTireRadius,
    frontTireWidth: PORSCHE_SPECS.frontTireWidth,
    rearTireRadius: PORSCHE_SPECS.rearTireRadius,
    rearTireWidth: PORSCHE_SPECS.rearTireWidth,
    frontDiscDiameter: PORSCHE_SPECS.frontDiscDiameter,
    rearDiscDiameter: PORSCHE_SPECS.rearDiscDiameter,
    transaxleShort: '915',
    engine: {
      layout: 'flat6',
      engineCode: 'Type 911/83',
      summary: '2,687 cc Flat-6',
      cylinders: 6,
      boreMm: 90.0,
      strokeMm: 70.4,
      bore: 0.090,
      stroke: 0.0704,
      crankRadius: 0.0352,
      rodLength: 0.1278,
      bankAngleDeg: 180,
      compressionRatio: 8.5,
      firingOrder: PORSCHE_SPECS.engine.firingOrder,
      firingOrderLabel: '1-6-2-4-3-5',
      idleRpm: 950,
      redlineRpm: 7200,
      maxRpm: 7300,
      powerPs: 210,
      powerRpm: 6300,
      torqueNm: 255,
      torqueRpm: 5100,
      fanDriveRatio: 1.8,
      distributorRatio: 0.5,
    },
    liveries: LIVERIES,
    subsystems: SUBSYSTEM_SPECS,
    cameraPresets: CAMERA_PRESETS,
    subsystemCameras: {
      all: { pos: CAMERA_PRESETS.hero.position, look: CAMERA_PRESETS.hero.target },
      body: { pos: [3.25, 1.55, 2.85], look: [0, 0.72, -0.1] },
      engine: { pos: [1.32, 1.04, -3.22], look: [0, 0.50, -1.85] },
      transaxle: { pos: [1.45, 0.85, -0.55], look: [0, 0.32, -1.05] },
      chassis: { pos: [2.55, 1.55, 1.45], look: [0, 0.35, 0.0] },
      wheels: { pos: [1.85, 0.72, 1.65], look: [0.71, 0.32, 1.14] },
    },
  },

  'bmw-e30-m3': {
    id: 'bmw-e30-m3',
    shortName: 'M3 E30 Evo',
    model: 'BMW M3 Sport Evolution',
    edition: 'E30 Vintage Edition',
    year: 1990,
    chassisCode: 'E30 · S14B25',
    accentHex: '#d61c2c',
    length: 4.346,
    width: 1.680,
    height: 1.370,
    wheelbase: 2.565,
    frontAxleZ: 1.2825,
    rearAxleZ: -1.2825,
    frontTrack: 1.412,
    rearTrack: 1.433,
    curbWeightKg: 1200,
    groundClearance: 0.125,
    wheelRimDiameter: 0.4064, // 16"
    frontTireRadius: 0.305, // 225/45 ZR16
    frontTireWidth: 0.225,
    rearTireRadius: 0.305,
    rearTireWidth: 0.225,
    frontDiscDiameter: 0.280,
    rearDiscDiameter: 0.282,
    transaxleShort: 'Getrag 265',
    engine: {
      layout: 'i4',
      engineCode: 'S14B25',
      summary: '2,467 cc S14 I4',
      cylinders: 4,
      boreMm: 95.0,
      strokeMm: 87.0,
      bore: 0.095,
      stroke: 0.087,
      crankRadius: 0.0435,
      rodLength: 0.144,
      bankAngleDeg: 0,
      compressionRatio: 10.2,
      firingOrder: [1, 3, 4, 2] as const,
      firingOrderLabel: '1-3-4-2',
      idleRpm: 900,
      redlineRpm: 7250,
      maxRpm: 7500,
      powerPs: 238,
      powerRpm: 7000,
      torqueNm: 240,
      torqueRpm: 4750,
      fanDriveRatio: 1.4,
      distributorRatio: 0.5,
    },
    liveries: [
      {
        id: 'jet-black-evo',
        name: 'Jet Black (Sport Evo)',
        bodyHex: '#181a1e',
        scriptHex: '#d61c2c',
        wheelAccentHex: '#6c727d',
        swatchHex: '#181a1e',
      },
      {
        id: 'brilliant-red-evo',
        name: 'Brilliant Red (Sport Evo)',
        bodyHex: '#c91c24',
        scriptHex: '#181a1e',
        wheelAccentHex: '#6c727d',
        swatchHex: '#c91c24',
      },
      {
        id: 'alpine-white-m',
        name: 'Alpine White / Motorsport',
        bodyHex: '#f1f2ee',
        scriptHex: '#1d4ea8',
        wheelAccentHex: '#c4cad3',
        swatchHex: '#f1f2ee',
      },
      {
        id: 'macao-blue',
        name: 'Macao Blue Metallic',
        bodyHex: '#1b2c4e',
        scriptHex: '#d61c2c',
        wheelAccentHex: '#b8bec7',
        swatchHex: '#1b2c4e',
      },
      {
        id: 'lachs-silver',
        name: 'Lachs Silver Metallic',
        bodyHex: '#9ea5af',
        scriptHex: '#181a1e',
        wheelAccentHex: '#6c727d',
        swatchHex: '#9ea5af',
      },
    ],
    subsystems: {
      all: {
        id: 'all',
        label: 'Complete Vehicle',
        shortLabel: 'Full Car',
        specLine: '4,346 × 1,680 × 1,370 mm · Wheelbase 2,565 mm · 1,200 kg',
        calloutWorld: [0, 0.78, 0],
      },
      body: {
        id: 'body',
        label: 'Box-Flare Coupé & Bi-Plane Wing',
        shortLabel: 'Body',
        specLine: 'Flared Steel Arches · SMC Flattened C-Pillar · Adjustable Evo Wing',
        calloutWorld: [0, 1.06, -1.96],
      },
      engine: {
        id: 'engine',
        label: 'BMW S14B25 2.5L Inline-4',
        shortLabel: 'S14 I4',
        specLine: '2,467 cc DOHC 16V ITBs · 95.0 × 87.0 mm · 238 hp · 1-3-4-2',
        calloutWorld: [0, 0.64, 1.38],
      },
      transaxle: {
        id: 'transaxle',
        label: 'Getrag 265/5 Dogleg Manual',
        shortLabel: '265 5-Spd',
        specLine: 'Close-Ratio Dogleg 5-Speed · Alloy Propshaft · 25% Clutch LSD',
        calloutWorld: [0, 0.34, 0.25],
      },
      chassis: {
        id: 'chassis',
        label: 'E30 Motorsport Unibody & Struts',
        shortLabel: 'Chassis',
        specLine: 'Front MacPherson Strut · Rear Semi-Trailing Arm · Strut Brace',
        calloutWorld: [0.36, 0.56, 1.15],
      },
      wheels: {
        id: 'wheels',
        label: '16" BBS Cross-Spoke & Brakes',
        shortLabel: 'Wheels',
        specLine: '7.5Jx16 Nogaro Silver Basketweave · 280 / 282 mm Discs',
        calloutWorld: [0.76, 0.31, 1.28],
      },
    },
    cameraPresets: {
      hero: {
        id: 'hero',
        label: 'Hero',
        position: [3.95, 1.10, 3.68],
        target: [-0.04, 0.58, 0.0],
      },
      engine: {
        id: 'engine',
        label: 'Engine',
        position: [1.55, 1.15, 2.75],
        target: [0, 0.56, 1.28],
      },
      chassis: {
        id: 'chassis',
        label: 'Chassis',
        position: [3.25, 1.80, 2.10],
        target: [0, 0.42, 0.0],
      },
      front: {
        id: 'front',
        label: 'Front',
        position: [0.95, 0.85, 3.98],
        target: [0, 0.50, 0.20],
      },
      side: {
        id: 'side',
        label: 'Side',
        position: [5.20, 0.84, 0.0],
        target: [0, 0.52, 0.0],
      },
    },
    subsystemCameras: {
      all: { pos: [3.95, 1.10, 3.68], look: [-0.04, 0.58, 0.0] },
      body: { pos: [3.35, 1.56, 2.95], look: [0, 0.72, -0.05] },
      engine: { pos: [1.35, 1.10, 2.50], look: [0, 0.54, 1.28] },
      transaxle: { pos: [1.65, 0.90, -0.30], look: [0, 0.32, 0.25] },
      chassis: { pos: [2.65, 1.60, 1.65], look: [0, 0.38, 0.0] },
      wheels: { pos: [1.90, 0.72, 1.82], look: [0.71, 0.31, 1.28] },
    },
  },

  'bmw-e39-m5': {
    id: 'bmw-e39-m5',
    shortName: 'M5 E39 V8',
    model: 'BMW M5 (E39)',
    edition: 'S62 4.9L V8',
    year: 2002,
    chassisCode: 'E39 · S62B50',
    accentHex: '#1e5bc6',
    length: 4.775,
    width: 1.800,
    height: 1.435,
    wheelbase: 2.830,
    frontAxleZ: 1.415,
    rearAxleZ: -1.415,
    frontTrack: 1.516,
    rearTrack: 1.630,
    curbWeightKg: 1795,
    groundClearance: 0.120,
    wheelRimDiameter: 0.4572, // 18"
    frontTireRadius: 0.327, // 245/40 ZR18
    frontTireWidth: 0.245,
    rearTireRadius: 0.327, // 275/35 ZR18
    rearTireWidth: 0.275,
    frontDiscDiameter: 0.345,
    rearDiscDiameter: 0.328,
    transaxleShort: 'Getrag 420G',
    engine: {
      layout: 'v8',
      engineCode: 'S62B50',
      summary: '4,941 cc 90° V8',
      cylinders: 8,
      boreMm: 94.0,
      strokeMm: 89.0,
      bore: 0.094,
      stroke: 0.089,
      crankRadius: 0.0445,
      rodLength: 0.1415,
      bankAngleDeg: 90,
      compressionRatio: 11.0,
      firingOrder: [1, 5, 4, 8, 6, 3, 7, 2] as const,
      firingOrderLabel: '1-5-4-8-6-3-7-2',
      idleRpm: 700,
      redlineRpm: 7000,
      maxRpm: 7200,
      powerPs: 400,
      powerRpm: 6600,
      torqueNm: 500,
      torqueRpm: 3800,
      fanDriveRatio: 1.5,
      distributorRatio: 0.5,
    },
    liveries: [
      {
        id: 'lemans-blue',
        name: 'Le Mans Blue Metallic',
        bodyHex: '#183f8c',
        scriptHex: '#d5dde8',
        wheelAccentHex: '#777e88',
        swatchHex: '#183f8c',
      },
      {
        id: 'titanium-silver',
        name: 'Titanium Silver Metallic',
        bodyHex: '#b9c0c8',
        scriptHex: '#1c2026',
        wheelAccentHex: '#6c737d',
        swatchHex: '#b9c0c8',
      },
      {
        id: 'imola-red',
        name: 'Imola Red II',
        bodyHex: '#b21720',
        scriptHex: '#181a1f',
        wheelAccentHex: '#686e78',
        swatchHex: '#b21720',
      },
      {
        id: 'carbon-black',
        name: 'Carbon Black Metallic',
        bodyHex: '#111622',
        scriptHex: '#8d9bb2',
        wheelAccentHex: '#7d8590',
        swatchHex: '#111622',
      },
      {
        id: 'avus-blue',
        name: 'Avus Blue Metallic',
        bodyHex: '#142a56',
        scriptHex: '#cfd6e0',
        wheelAccentHex: '#808792',
        swatchHex: '#142a56',
      },
    ],
    subsystems: {
      all: {
        id: 'all',
        label: 'Complete Vehicle',
        shortLabel: 'Full Car',
        specLine: '4,775 × 1,800 × 1,435 mm · Wheelbase 2,830 mm · 1,795 kg',
        calloutWorld: [0, 0.84, 0],
      },
      body: {
        id: 'body',
        label: 'E39 Sedan & Quad-Tip Aero',
        shortLabel: 'Body',
        specLine: 'Angel Eyes · Oval M Bumper Intake · Hoffmeister Kink · Deck Lip',
        calloutWorld: [0, 1.14, -1.90],
      },
      engine: {
        id: 'engine',
        label: 'BMW S62B50 4.9L 90° V8',
        shortLabel: 'S62 V8',
        specLine: '4,941 cc Dual-VANOS 8 ITBs · 94.0 × 89.0 mm · 400 PS · 1-5-4-8-6-3-7-2',
        calloutWorld: [0, 0.68, 1.38],
      },
      transaxle: {
        id: 'transaxle',
        label: 'Getrag 420G 6-Speed & Diff',
        shortLabel: '420G 6-Spd',
        specLine: '6-Speed Manual · Dual-Mass Flywheel · 3.15 Limited-Slip Diff',
        calloutWorld: [0, 0.36, 0.20],
      },
      chassis: {
        id: 'chassis',
        label: 'Alloy Front Struts & Z-Axle',
        shortLabel: 'Chassis',
        specLine: 'Forged Aluminum Double-Pivot Front · Integral-Link Multi-Arm Rear',
        calloutWorld: [0.40, 0.56, 1.25],
      },
      wheels: {
        id: 'wheels',
        label: '18" Style 65 & Floating Discs',
        shortLabel: 'Wheels',
        specLine: '8Jx18 / 9.5Jx18 Chrome Shadow · 345 / 328 mm Two-Piece Rotors',
        calloutWorld: [0.85, 0.34, 1.415],
      },
    },
    cameraPresets: {
      hero: {
        id: 'hero',
        label: 'Hero',
        position: [4.25, 1.18, 3.98],
        target: [-0.04, 0.60, 0.0],
      },
      engine: {
        id: 'engine',
        label: 'Engine',
        position: [1.62, 1.18, 2.90],
        target: [0, 0.56, 1.34],
      },
      chassis: {
        id: 'chassis',
        label: 'Chassis',
        position: [3.50, 1.90, 2.25],
        target: [0, 0.44, 0.0],
      },
      front: {
        id: 'front',
        label: 'Front',
        position: [1.02, 0.88, 4.30],
        target: [0, 0.52, 0.20],
      },
      side: {
        id: 'side',
        label: 'Side',
        position: [5.60, 0.88, 0.0],
        target: [0, 0.56, 0.0],
      },
    },
    subsystemCameras: {
      all: { pos: [4.25, 1.18, 3.98], look: [-0.04, 0.60, 0.0] },
      body: { pos: [3.65, 1.62, 3.20], look: [0, 0.78, -0.05] },
      engine: { pos: [1.45, 1.14, 2.65], look: [0, 0.56, 1.34] },
      transaxle: { pos: [1.75, 0.94, -0.35], look: [0, 0.34, 0.20] },
      chassis: { pos: [2.85, 1.68, 1.80], look: [0, 0.40, 0.0] },
      wheels: { pos: [2.05, 0.74, 1.98], look: [0.76, 0.33, 1.42] },
    },
  },

  'nissan-r35-gtr': {
    id: 'nissan-r35-gtr',
    shortName: 'GT-R R35',
    model: 'Nissan GT-R (R35)',
    edition: 'VR38DETT Twin-Turbo',
    year: 2020,
    chassisCode: 'CBA / DBA · VR38DETT',
    accentHex: '#d91b24',
    length: 4.710,
    width: 1.895,
    height: 1.370,
    wheelbase: 2.780,
    frontAxleZ: 1.390,
    rearAxleZ: -1.390,
    frontTrack: 1.590,
    rearTrack: 1.600,
    curbWeightKg: 1752,
    groundClearance: 0.110,
    wheelRimDiameter: 0.508, // 20"
    frontTireRadius: 0.356, // 255/40 ZR20
    frontTireWidth: 0.255,
    rearTireRadius: 0.356, // 285/35 ZR20
    rearTireWidth: 0.285,
    frontDiscDiameter: 0.390,
    rearDiscDiameter: 0.380,
    transaxleShort: 'GR6 DCT AWD',
    engine: {
      layout: 'v6',
      engineCode: 'VR38DETT',
      summary: '3,799 cc Twin-Turbo V6',
      cylinders: 6,
      boreMm: 95.5,
      strokeMm: 88.4,
      bore: 0.0955,
      stroke: 0.0884,
      crankRadius: 0.0442,
      rodLength: 0.145,
      bankAngleDeg: 60,
      compressionRatio: 9.0,
      firingOrder: [1, 2, 3, 4, 5, 6] as const,
      firingOrderLabel: '1-2-3-4-5-6',
      idleRpm: 750,
      redlineRpm: 7100,
      maxRpm: 7200,
      powerPs: 570,
      powerRpm: 6800,
      torqueNm: 637,
      torqueRpm: 3300,
      fanDriveRatio: 1.2,
      distributorRatio: 0.5,
    },
    liveries: [
      {
        id: 'bayside-blue',
        name: 'Bayside Blue (RCB)',
        bodyHex: '#0f4ea8',
        scriptHex: '#d91b24',
        wheelAccentHex: '#4b5059',
        swatchHex: '#0f4ea8',
      },
      {
        id: 'pearl-white',
        name: 'Pearl White (QAB)',
        bodyHex: '#f2f3f0',
        scriptHex: '#d91b24',
        wheelAccentHex: '#2f333b',
        swatchHex: '#f2f3f0',
      },
      {
        id: 'gun-metallic',
        name: 'Gun Metallic (KAD)',
        bodyHex: '#434852',
        scriptHex: '#d91b24',
        wheelAccentHex: '#25282e',
        swatchHex: '#434852',
      },
      {
        id: 'katsura-orange',
        name: 'Katsura Orange (EBB)',
        bodyHex: '#d64b1a',
        scriptHex: '#181a1f',
        wheelAccentHex: '#262930',
        swatchHex: '#d64b1a',
      },
      {
        id: 'vibrant-red',
        name: 'Solid Red (A54)',
        bodyHex: '#c41820',
        scriptHex: '#181a1f',
        wheelAccentHex: '#262930',
        swatchHex: '#c41820',
      },
    ],
    subsystems: {
      all: {
        id: 'all',
        label: 'Complete Vehicle',
        shortLabel: 'Full Car',
        specLine: '4,710 × 1,895 × 1,370 mm · Wheelbase 2,780 mm · 1,752 kg',
        calloutWorld: [0, 0.80, 0],
      },
      body: {
        id: 'body',
        label: 'PM Chassis Aero Coupe & Wing',
        shortLabel: 'Body',
        specLine: 'V-Motion Nose · Floating C-Pillar · Quad Halo Taillights · Cd 0.26',
        calloutWorld: [0, 1.08, -1.96],
      },
      engine: {
        id: 'engine',
        label: 'Hand-Built VR38DETT Twin-Turbo V6',
        shortLabel: 'VR38 V6',
        specLine: '3,799 cc 60° Twin IHI Turbo · 95.5 × 88.4 mm · 570 PS · 1-2-3-4-5-6',
        calloutWorld: [0, 0.66, 1.18],
      },
      transaxle: {
        id: 'transaxle',
        label: 'Rear GR6 6-Spd DCT & ATTESA E-TS',
        shortLabel: 'GR6 AWD',
        specLine: 'Rear Dual-Clutch Transaxle · Twin Carbon/Steel Propshafts · AWD',
        calloutWorld: [0, 0.36, -1.35],
      },
      chassis: {
        id: 'chassis',
        label: 'Bilstein DampTronic Double-Wishbone',
        shortLabel: 'Chassis',
        specLine: 'Die-Cast Alloy Subframes · Twin-Intercooler Core · Carbon Support',
        calloutWorld: [0.42, 0.56, 1.20],
      },
      wheels: {
        id: 'wheels',
        label: '20" RAYS Forged & 390mm Brembo',
        shortLabel: 'Wheels',
        specLine: '20×9.5 / 20×10.5 RAYS Alloy · 390 / 380 mm Floating Brembos',
        calloutWorld: [0.90, 0.36, 1.39],
      },
    },
    cameraPresets: {
      hero: {
        id: 'hero',
        label: 'Hero',
        position: [4.22, 1.14, 3.92],
        target: [-0.04, 0.58, 0.0],
      },
      engine: {
        id: 'engine',
        label: 'Engine',
        position: [1.58, 1.16, 2.75],
        target: [0, 0.56, 1.18],
      },
      chassis: {
        id: 'chassis',
        label: 'Chassis',
        position: [3.48, 1.88, 2.22],
        target: [0, 0.42, 0.0],
      },
      front: {
        id: 'front',
        label: 'Front',
        position: [1.02, 0.86, 4.25],
        target: [0, 0.50, 0.20],
      },
      side: {
        id: 'side',
        label: 'Side',
        position: [5.55, 0.84, 0.0],
        target: [0, 0.52, 0.0],
      },
    },
    subsystemCameras: {
      all: { pos: [4.22, 1.14, 3.92], look: [-0.04, 0.58, 0.0] },
      body: { pos: [3.60, 1.58, 3.15], look: [0, 0.74, -0.05] },
      engine: { pos: [1.44, 1.12, 2.52], look: [0, 0.56, 1.18] },
      transaxle: { pos: [1.70, 0.92, -3.20], look: [0, 0.38, -1.39] },
      chassis: { pos: [2.82, 1.66, 1.78], look: [0, 0.38, 0.0] },
      wheels: { pos: [2.10, 0.74, 1.96], look: [0.80, 0.35, 1.39] },
    },
  },
};

export const VEHICLE_LIST: VehicleSpec[] = [
  VEHICLES['porsche-911-rs'],
  VEHICLES['bmw-e30-m3'],
  VEHICLES['bmw-e39-m5'],
  VEHICLES['nissan-r35-gtr'],
];

export function computeDisplacementCc(boreMm: number, strokeMm: number, cylinders: number): number {
  const radiusCm = boreMm / 20;
  const strokeCm = strokeMm / 10;
  return Math.round(Math.PI * radiusCm * radiusCm * strokeCm * cylinders);
}

export interface CylinderState {
  cylinderNumber: number;
  bank: 'left' | 'right' | 'center';
  /** Crank throw phase angle in radians */
  throwAngleRad: number;
  /** Piston radial distance from crank centerline along cylinder axis (meters) */
  pistonOffset: number;
  /** Connecting rod tilt angle in XY plane (radians) */
  rodAngleRad: number;
  /** Normalized 0..1 combustion flash intensity around power TDC */
  combustionIntensity: number;
  /** Normalized 0..1 stroke fraction (0 = TDC, 1 = BDC) */
  strokeFrac: number;
}

export interface EngineKinematics {
  crankDeg: number;
  crankRad: number;
  fanRad: number;
  distributorRad: number;
  cylinders: CylinderState[];
}

export type Flat6Kinematics = EngineKinematics;

const PORSCHE_CYL_CFG: Array<{ num: number; bank: 'left' | 'right'; firingDeg: number }> = [
  { num: 1, bank: 'left', firingDeg: 0 },
  { num: 2, bank: 'left', firingDeg: 240 },
  { num: 3, bank: 'left', firingDeg: 480 },
  { num: 4, bank: 'right', firingDeg: 360 },
  { num: 5, bank: 'right', firingDeg: 600 },
  { num: 6, bank: 'right', firingDeg: 120 },
];

const BMW_I4_CYL_CFG: Array<{ num: number; bank: 'center'; firingDeg: number }> = [
  { num: 1, bank: 'center', firingDeg: 0 },
  { num: 3, bank: 'center', firingDeg: 180 },
  { num: 4, bank: 'center', firingDeg: 360 },
  { num: 2, bank: 'center', firingDeg: 540 },
];

// BMW S62 90° V8: Bank 1 (Right -X) = 1,2,3,4; Bank 2 (Left +X) = 5,6,7,8; Firing 1-5-4-8-6-3-7-2
const BMW_V8_CYL_CFG: Array<{ num: number; bank: 'left' | 'right'; firingDeg: number }> = [
  { num: 1, bank: 'right', firingDeg: 0 },
  { num: 5, bank: 'left', firingDeg: 90 },
  { num: 4, bank: 'right', firingDeg: 180 },
  { num: 8, bank: 'left', firingDeg: 270 },
  { num: 6, bank: 'left', firingDeg: 360 },
  { num: 3, bank: 'right', firingDeg: 450 },
  { num: 7, bank: 'left', firingDeg: 540 },
  { num: 2, bank: 'right', firingDeg: 630 },
];

// Nissan VR38DETT 60° V6: Bank 1 (Right -X) = 1,3,5; Bank 2 (Left +X) = 2,4,6; Firing 1-2-3-4-5-6
const NISSAN_V6_CYL_CFG: Array<{ num: number; bank: 'left' | 'right'; firingDeg: number }> = [
  { num: 1, bank: 'right', firingDeg: 0 },
  { num: 2, bank: 'left', firingDeg: 120 },
  { num: 3, bank: 'right', firingDeg: 240 },
  { num: 4, bank: 'left', firingDeg: 360 },
  { num: 5, bank: 'right', firingDeg: 480 },
  { num: 6, bank: 'left', firingDeg: 600 },
];

function computeCombustionFlash(cycleDeg: number): number {
  if (cycleDeg >= 0 && cycleDeg <= 75) {
    const peakDist = Math.abs(cycleDeg - 16) / 48;
    return Math.max(0, 1 - peakDist * peakDist);
  }
  if (cycleDeg >= 712) {
    return (cycleDeg - 712) / 16;
  }
  return 0;
}

/**
 * Pure slider-crank solver supporting Flat-6 boxer, Inline-4, 90° V8, and 60° V6 engines.
 */
export function solveEngineKinematics(
  engineSpec: VehicleEngineSpec,
  crankDegInput: number,
): EngineKinematics {
  const crankDeg = ((crankDegInput % 720) + 720) % 720;
  const crankRad = (crankDeg * Math.PI) / 180;
  const r = engineSpec.crankRadius;
  const L = engineSpec.rodLength;
  const halfBankRad = ((engineSpec.bankAngleDeg * 0.5) * Math.PI) / 180;

  if (engineSpec.layout === 'flat6') {
    const cylinders: CylinderState[] = PORSCHE_CYL_CFG.map((cfg) => {
      const cycleDeg = ((crankDeg - cfg.firingDeg) % 720 + 720) % 720;
      const cycleRad = (cycleDeg * Math.PI) / 180;
      const bankSign = cfg.bank === 'left' ? 1 : -1;
      const throwAngleRad = cfg.bank === 'left' ? cycleRad : cycleRad + Math.PI;
      const sinTheta = Math.sin(cycleRad);
      const cosTheta = Math.cos(cycleRad);
      const sqrtTerm = Math.sqrt(Math.max(1e-6, L * L - r * r * sinTheta * sinTheta));
      const s = r * cosTheta + sqrtTerm;
      const rodAngleRad = Math.asin(Math.max(-0.99, Math.min(0.99, (r * sinTheta) / L))) * bankSign;
      const minS = L - r;
      const maxS = L + r;
      return {
        cylinderNumber: cfg.num,
        bank: cfg.bank,
        throwAngleRad,
        pistonOffset: s * bankSign,
        rodAngleRad,
        combustionIntensity: computeCombustionFlash(cycleDeg),
        strokeFrac: 1 - (s - minS) / (maxS - minS),
      };
    });

    return {
      crankDeg,
      crankRad,
      fanRad: crankRad * engineSpec.fanDriveRatio,
      distributorRad: crankRad * engineSpec.distributorRatio,
      cylinders,
    };
  }

  const cfgs =
    engineSpec.layout === 'i4'
      ? BMW_I4_CYL_CFG
      : engineSpec.layout === 'v8'
        ? BMW_V8_CYL_CFG
        : NISSAN_V6_CYL_CFG;

  const cylinders: CylinderState[] = cfgs.map((cfg) => {
    const cycleDeg = ((crankDeg - cfg.firingDeg) % 720 + 720) % 720;
    const cycleRad = (cycleDeg * Math.PI) / 180;
    const bankTiltRad =
      cfg.bank === 'center' ? 0 : cfg.bank === 'left' ? halfBankRad : -halfBankRad;
    const throwAngleRad = bankTiltRad + cycleRad;

    const sinTheta = Math.sin(cycleRad);
    const cosTheta = Math.cos(cycleRad);
    const sqrtTerm = Math.sqrt(Math.max(1e-6, L * L - r * r * sinTheta * sinTheta));
    const s = r * cosTheta + sqrtTerm;
    const rodAngleRad = Math.asin(Math.max(-0.99, Math.min(0.99, (r * sinTheta) / L)));

    const minS = L - r;
    const maxS = L + r;
    return {
      cylinderNumber: cfg.num,
      bank: cfg.bank,
      throwAngleRad,
      pistonOffset: s,
      rodAngleRad,
      combustionIntensity: computeCombustionFlash(cycleDeg),
      strokeFrac: 1 - (s - minS) / (maxS - minS),
    };
  });

  return {
    crankDeg,
    crankRad,
    fanRad: crankRad * engineSpec.fanDriveRatio,
    distributorRad: crankRad * engineSpec.distributorRatio,
    cylinders,
  };
}

/**
 * Pure slider-crank solver for the 180-degree horizontally opposed Flat-6 boxer engine.
 */
export function solveFlat6Kinematics(crankDegInput: number): Flat6Kinematics {
  return solveEngineKinematics(VEHICLES['porsche-911-rs'].engine, crankDegInput);
}

export interface TeardownPose {
  bodyLiftY: number;
  hoodLiftY: number;
  hoodForwardZ: number;
  hoodTiltX: number;
  ducktailLiftY: number;
  ducktailBackZ: number;
  ducktailTiltX: number;
  doorOutX: number;
  interiorLiftY: number;
  wheelOutX: number;
  suspensionOutX: number;
  transaxleBackZ: number;
  engineBackZ: number;
  engineShroudLiftY: number;
  cylinderHeadOutX: number;
  exhaustDropY: number;
  exhaustBackZ: number;
}

/**
 * Pure explosion trajectory mapping for teardown factor t in [0, 1].
 * Ensures staged, collision-free separation of vehicle assemblies.
 */
export function computeTeardownPose(explode: number): TeardownPose {
  const t = Math.max(0, Math.min(1, explode));
  const ease = t * t * (3 - 2 * t);
  const stage2 = Math.max(0, Math.min(1, (t - 0.2) / 0.8));
  const ease2 = stage2 * stage2 * (3 - 2 * stage2);

  const z = (v: number) => (v === 0 ? 0 : v);

  return {
    bodyLiftY: z(ease * 0.68),
    hoodLiftY: z(ease * 0.30),
    hoodForwardZ: z(ease * 0.34),
    hoodTiltX: z(-ease * 0.26),
    ducktailLiftY: z(ease * 0.28),
    ducktailBackZ: z(-ease * 0.34),
    ducktailTiltX: z(ease * 0.28),
    doorOutX: z(ease2 * 0.56),
    interiorLiftY: z(ease * 0.30),
    wheelOutX: z(ease * 0.54),
    suspensionOutX: z(ease2 * 0.25),
    transaxleBackZ: z(-ease * 0.44),
    engineBackZ: z(-ease * 0.96),
    engineShroudLiftY: z(ease2 * 0.34),
    cylinderHeadOutX: z(ease2 * 0.24),
    exhaustDropY: z(-ease2 * 0.22),
    exhaustBackZ: z(-ease * 1.18),
  };
}
