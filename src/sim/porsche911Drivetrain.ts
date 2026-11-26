import * as THREE from 'three';
import { Flat6Kinematics, PORSCHE_SPECS } from './specs';
import { ProceduralTextures } from './textures';

export interface WheelAssembly {
  wheelGroup: THREE.Group;
  hubBrakeGroup: THREE.Group;
  sideSign: 1 | -1;
  isFront: boolean;
  baseX: number;
  baseY: number;
  baseZ: number;
}

export interface PistonVisual {
  cylinderNumber: 1 | 2 | 3 | 4 | 5 | 6;
  bankSign: 1 | -1;
  zLocal: number;
  pistonGroup: THREE.Group;
  rodGroup: THREE.Group;
  crankPinMarker: THREE.Mesh;
  chamberGlowMat: THREE.MeshStandardMaterial;
}

export interface Porsche911DrivetrainRig {
  root: THREE.Group;
  chassisGroup: THREE.Group;
  interiorGroup: THREE.Group;
  transaxleGroup: THREE.Group;
  engineRootGroup: THREE.Group;
  engineBlockGroup: THREE.Group;
  engineShroudGroup: THREE.Group;
  leftHeadGroup: THREE.Group;
  rightHeadGroup: THREE.Group;
  exhaustGroup: THREE.Group;
  frontSuspLeft: THREE.Group;
  frontSuspRight: THREE.Group;
  rearSuspLeft: THREE.Group;
  rearSuspRight: THREE.Group;
  wheels: WheelAssembly[];
  updateKinematics: (kin: Flat6Kinematics, wheelSpinRad: number) => void;
  setEngineXray: (xray: boolean) => void;
  setFuchsColor: (hex: string) => void;
}

export function buildPorsche911Drivetrain(
  textures: ProceduralTextures,
  clippingPlanes: THREE.Plane[],
): Porsche911DrivetrainRig {
  const root = new THREE.Group();
  root.name = 'porsche_drivetrain_root';

  // Shared calibrated PBR materials
  const matSteelDark = new THREE.MeshStandardMaterial({
    color: 0x26292e,
    metalness: 0.65,
    roughness: 0.42,
    clippingPlanes,
  });
  const matAluminum = new THREE.MeshStandardMaterial({
    color: 0xc2c7ce,
    metalness: 0.85,
    roughness: 0.34,
    bumpMap: textures.brushedMetalBump,
    bumpScale: 0.002,
    clippingPlanes,
  });
  const matMagnesium = new THREE.MeshStandardMaterial({
    color: 0x9aa0a6,
    metalness: 0.72,
    roughness: 0.48,
    bumpMap: textures.brushedMetalBump,
    bumpScale: 0.0025,
    clippingPlanes,
  });
  const matChrome = new THREE.MeshStandardMaterial({
    color: 0xedf1f6,
    metalness: 0.94,
    roughness: 0.14,
    clippingPlanes,
  });
  const matFuchsSilver = new THREE.MeshStandardMaterial({
    color: 0xeef2f6,
    metalness: 0.94,
    roughness: 0.12,
    envMapIntensity: 1.48,
    clippingPlanes,
  });
  const matFuchsCenter = new THREE.MeshPhysicalMaterial({
    color: 0xc81828,
    metalness: 0.14,
    roughness: 0.22,
    clearcoat: 0.9,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.35,
    clippingPlanes,
  });
  const matBilsteinYellow = new THREE.MeshStandardMaterial({
    color: 0xdfb21a,
    metalness: 0.25,
    roughness: 0.35,
    clippingPlanes,
  });
  const matRedSpring = new THREE.MeshStandardMaterial({
    color: 0xd6182b,
    metalness: 0.2,
    roughness: 0.38,
    clippingPlanes,
  });
  const matExhaustBronze = new THREE.MeshStandardMaterial({
    color: 0x8f745c,
    metalness: 0.78,
    roughness: 0.36,
    clippingPlanes,
  });
  const matShroudCream = new THREE.MeshStandardMaterial({
    color: 0xd5c8a8,
    metalness: 0.04,
    roughness: 0.56,
    clippingPlanes,
  });
  const matBrass = new THREE.MeshStandardMaterial({
    color: 0xc79e47,
    metalness: 0.86,
    roughness: 0.28,
    clippingPlanes,
  });
  const matLeatherBlack = new THREE.MeshStandardMaterial({
    color: 0x181a1d,
    metalness: 0.05,
    roughness: 0.76,
    clippingPlanes,
  });
  const matPepita = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.pepitaSeatMap,
    roughness: 0.88,
    metalness: 0.0,
    clippingPlanes,
  });
  const matTire = new THREE.MeshStandardMaterial({
    color: 0x1b1c1f,
    metalness: 0.02,
    roughness: 0.86,
    bumpMap: textures.tireTreadBump,
    bumpScale: 0.004,
    clippingPlanes,
  });
  const matDisc = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.brakeDiscMap,
    metalness: 0.82,
    roughness: 0.32,
    clippingPlanes,
  });
  const matCylinderLiner = new THREE.MeshPhysicalMaterial({
    color: 0xaab4be,
    metalness: 0.55,
    roughness: 0.32,
    transparent: false,
    opacity: 1,
    clippingPlanes,
  });

  // =========================================================================
  // 1. CHASSIS FLOORPAN, BACKBONE TUNNEL & FUEL TANK
  // =========================================================================
  const chassisGroup = new THREE.Group();
  chassisGroup.name = 'chassis';

  // Main floorpan tub
  const floorPan = new THREE.Mesh(
    new THREE.BoxGeometry(1.24, 0.028, 2.44),
    matSteelDark,
  );
  floorPan.position.set(0, 0.178, 0.04);
  floorPan.castShadow = true;
  floorPan.receiveShadow = true;
  chassisGroup.add(floorPan);

  // Central structural backbone tunnel
  const tunnel = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.14, 2.15),
    matSteelDark,
  );
  tunnel.position.set(0, 0.22, -0.04);
  chassisGroup.add(tunnel);

  // Front luggage bulkhead + firewall
  const frontBulkhead = new THREE.Mesh(
    new THREE.BoxGeometry(1.04, 0.36, 0.04),
    matSteelDark,
  );
  frontBulkhead.position.set(0, 0.35, 0.64);
  chassisGroup.add(frontBulkhead);

  const rearFirewall = new THREE.Mesh(
    new THREE.BoxGeometry(1.24, 0.52, 0.04),
    matSteelDark,
  );
  rearFirewall.position.set(0, 0.42, -1.16);
  chassisGroup.add(rearFirewall);

  // Front frame horns + 85L Fuel Tank
  const frontSubframe = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 0.05, 0.96),
    matSteelDark,
  );
  frontSubframe.position.set(0, 0.22, 1.22);
  chassisGroup.add(frontSubframe);

  const fuelTank = new THREE.Mesh(
    new THREE.BoxGeometry(0.64, 0.16, 0.48),
    new THREE.MeshStandardMaterial({
      color: 0x2f3339,
      metalness: 0.35,
      roughness: 0.58,
      clippingPlanes,
    }),
  );
  fuelTank.position.set(0, 0.31, 1.38);
  fuelTank.castShadow = true;
  chassisGroup.add(fuelTank);

  // Front strut tower brace
  const strutBrace = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.013, 0.96, 10),
    matRedSpring,
  );
  strutBrace.rotation.z = Math.PI / 2;
  strutBrace.position.set(0, 0.53, PORSCHE_SPECS.frontAxleZ);
  chassisGroup.add(strutBrace);

  // Left/right unibody rocker frame rails + front fuel filler cap
  ([-1, 1] as const).forEach((side) => {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.060, 0.056, 2.40),
      matSteelDark,
    );
    rail.position.set(0.56 * side, 0.194, 0.04);
    chassisGroup.add(rail);
  });

  const fuelFillerCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.036, 0.025, 16),
    matAluminum,
  );
  fuelFillerCap.position.set(0.24, 0.40, 1.46);
  chassisGroup.add(fuelFillerCap);

  // Rear engine carrier crossmember ("moustache bar")
  const rearCarrier = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 0.045, 0.06),
    matSteelDark,
  );
  rearCarrier.position.set(0, 0.31, -1.86);
  chassisGroup.add(rearCarrier);

  // =========================================================================
  // 2. CLASSIC 911 INTERIOR (5-DIAL VDO DASH, PEPITA BUCKET SEATS, WHEEL)
  // =========================================================================
  const interiorGroup = new THREE.Group();
  interiorGroup.name = 'chassis';

  // Dashboard lower knee bolster & contoured upper cowl pad
  const dashPad = new THREE.Mesh(
    new THREE.BoxGeometry(1.16, 0.085, 0.25),
    matLeatherBlack,
  );
  dashPad.position.set(0, 0.66, 0.42);
  interiorGroup.add(dashPad);

  const dashHood = new THREE.Mesh(
    new THREE.BoxGeometry(0.50, 0.04, 0.14),
    matLeatherBlack,
  );
  dashHood.position.set(0.32, 0.715, 0.34);
  interiorGroup.add(dashHood);

  // Interior rearview mirror suspended near windshield header
  const mirrorStalk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.07, 8),
    matSteelDark,
  );
  mirrorStalk.position.set(0, 1.18, 0.29);
  interiorGroup.add(mirrorStalk);
  const rearViewMirror = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.042, 0.018),
    matLeatherBlack,
  );
  rearViewMirror.position.set(0, 1.14, 0.28);
  interiorGroup.add(rearViewMirror);

  // 5-Dial VDO Instrument Cluster Plane (Driver left +X)
  const vdoCluster = new THREE.Mesh(
    new THREE.PlaneGeometry(0.46, 0.105),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.vdoGaugeMap,
      roughness: 0.32,
      clippingPlanes,
    }),
  );
  vdoCluster.position.set(0.32, 0.662, 0.292);
  vdoCluster.rotation.y = Math.PI;
  interiorGroup.add(vdoCluster);

  // Steering Column + 3-Spoke Dished Leather RS Wheel (Left-hand drive +X)
  const steeringCol = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.026, 0.34, 12),
    matSteelDark,
  );
  steeringCol.position.set(0.32, 0.65, 0.24);
  steeringCol.rotation.x = Math.PI / 2 - 0.28;
  interiorGroup.add(steeringCol);

  const wheelGroup = new THREE.Group();
  wheelGroup.position.set(0.32, 0.70, 0.09);
  wheelGroup.rotation.x = -0.28;
  const wheelRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.175, 0.017, 14, 36),
    matLeatherBlack,
  );
  wheelGroup.add(wheelRim);
  const wheelHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.044, 0.045, 18),
    matLeatherBlack,
  );
  wheelHub.rotation.x = Math.PI / 2;
  wheelGroup.add(wheelHub);
  const hornCrest = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.008, 12),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.porscheCrestMap,
      clippingPlanes,
    }),
  );
  hornCrest.rotation.x = Math.PI / 2;
  hornCrest.position.z = -0.025;
  wheelGroup.add(hornCrest);
  [-Math.PI / 2, 0.16, Math.PI - 0.16].forEach((spokeAngle) => {
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(0.155, 0.024, 0.008),
      matAluminum,
    );
    spoke.position.set(Math.cos(spokeAngle) * 0.085, Math.sin(spokeAngle) * 0.085, -0.008);
    spoke.rotation.z = spokeAngle;
    wheelGroup.add(spoke);
  });
  interiorGroup.add(wheelGroup);

  // Tall 915 Floor Shifter + Rubber Accordion Boot + Handbrake + Alloy Pedals
  const shiftBoot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.048, 0.065, 12),
    matLeatherBlack,
  );
  shiftBoot.position.set(0, 0.30, 0.04);
  interiorGroup.add(shiftBoot);
  const shiftLever = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.01, 0.24, 8),
    matSteelDark,
  );
  shiftLever.position.set(0, 0.39, 0.02);
  shiftLever.rotation.x = -0.18;
  interiorGroup.add(shiftLever);
  const shiftKnob = new THREE.Mesh(
    new THREE.SphereGeometry(0.024, 14, 12),
    matLeatherBlack,
  );
  shiftKnob.position.set(0, 0.51, -0.005);
  interiorGroup.add(shiftKnob);

  // Handbrake lever & chrome glovebox dash trim
  const handbrake = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.011, 0.22, 8),
    matLeatherBlack,
  );
  handbrake.position.set(0, 0.32, -0.19);
  handbrake.rotation.x = 1.25;
  interiorGroup.add(handbrake);

  const gloveboxTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.014, 0.012),
    matAluminum,
  );
  gloveboxTrim.position.set(-0.30, 0.655, 0.292);
  interiorGroup.add(gloveboxTrim);

  // Driver footwell perforated aluminum pedals (Clutch, Brake, Accelerator)
  [0.42, 0.33, 0.24].forEach((px, pIdx) => {
    const pedal = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, pIdx === 2 ? 0.115 : 0.068, 0.012),
      matAluminum,
    );
    pedal.position.set(px, pIdx === 2 ? 0.22 : 0.25, 0.54);
    pedal.rotation.x = -0.35;
    interiorGroup.add(pedal);
  });

  // Sculpted Recaro Sport Bucket Seats with Contoured Bolsters & Pepita Inserts
  const seatBackProfile = new THREE.Shape();
  seatBackProfile.moveTo(-0.045, 0);
  seatBackProfile.lineTo(0.045, 0);
  seatBackProfile.quadraticCurveTo(0.055, 0.25, 0.038, 0.53);
  seatBackProfile.quadraticCurveTo(0.0, 0.55, -0.042, 0.53);
  seatBackProfile.closePath();
  const seatBackShellGeo = new THREE.ExtrudeGeometry(seatBackProfile, {
    depth: 0.38,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.012,
    bevelSegments: 2,
  });
  seatBackShellGeo.rotateY(Math.PI / 2);
  seatBackShellGeo.translate(-0.19, 0, 0);

  ([-1, 1] as const).forEach((side) => {
    const seat = new THREE.Group();
    seat.position.set(0.32 * side, 0.24, -0.22);

    // Base cushion + side thigh bolsters
    const baseCenter = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.095, 0.38),
      matPepita,
    );
    baseCenter.position.set(0, 0.005, 0.02);
    seat.add(baseCenter);

    ([-1, 1] as const).forEach((bSide) => {
      const thighBolster = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.115, 0.43),
        matLeatherBlack,
      );
      thighBolster.position.set(0.16 * bSide, 0.015, 0.01);
      thighBolster.rotation.z = -0.18 * bSide;
      seat.add(thighBolster);

      // Shoulder/rib side bolster
      const ribBolster = new THREE.Mesh(
        new THREE.BoxGeometry(0.085, 0.49, 0.12),
        matLeatherBlack,
      );
      ribBolster.position.set(0.16 * bSide, 0.27, -0.155);
      ribBolster.rotation.x = -0.22;
      ribBolster.rotation.y = -0.16 * bSide;
      seat.add(ribBolster);
    });

    // Chrome seat-recline hinge brackets
    const hinge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.44, 12),
      matChrome,
    );
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(0, 0.04, -0.17);
    seat.add(hinge);

    const backShell = new THREE.Mesh(seatBackShellGeo, matLeatherBlack);
    backShell.position.set(0, 0.02, -0.18);
    backShell.rotation.x = -0.22;
    seat.add(backShell);

    const backCenter = new THREE.Mesh(
      new THREE.BoxGeometry(0.23, 0.48, 0.045),
      matPepita,
    );
    backCenter.position.set(0, 0.27, -0.145);
    backCenter.rotation.x = -0.22;
    seat.add(backCenter);

    // Rounded contoured headrest
    const headrest = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.07, 0.20, 14),
      matLeatherBlack,
    );
    headrest.rotation.z = Math.PI / 2;
    headrest.position.set(0, 0.59, -0.24);
    headrest.scale.set(0.85, 1, 0.65);
    seat.add(headrest);

    interiorGroup.add(seat);
  });

  // =========================================================================
  // 3. SUSPENSION: FRONT MACPHERSON STRUTS & REAR SEMI-TRAILING ARMS
  // =========================================================================
  const buildHelicalSpring = (radius: number, height: number, turns: number) => {
    const pts: THREE.Vector3[] = [];
    const steps = turns * 14;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = t * turns * Math.PI * 2;
      pts.push(
        new THREE.Vector3(Math.cos(angle) * radius, t * height, Math.sin(angle) * radius),
      );
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, steps, 0.009, 6, false);
  };
  const frontSpringGeo = buildHelicalSpring(0.044, 0.19, 6);

  const frontSuspLeft = new THREE.Group();
  frontSuspLeft.name = 'chassis';
  const frontSuspRight = new THREE.Group();
  frontSuspRight.name = 'chassis';

  ([-1, 1] as const).forEach((side) => {
    const fg = side === 1 ? frontSuspLeft : frontSuspRight;
    const fz = PORSCHE_SPECS.frontAxleZ;
    const trackHalf = PORSCHE_SPECS.frontTrack / 2;

    // Lower A-arm wishbone
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.26 * side, 0.23, fz + 0.16),
      new THREE.Vector3((trackHalf - 0.11) * side, 0.24, fz),
      new THREE.Vector3(0.26 * side, 0.23, fz - 0.18),
    ]);
    fg.add(new THREE.Mesh(new THREE.TubeGeometry(armCurve, 16, 0.016, 8, false), matSteelDark));

    // Longitudinal front torsion bar
    const tBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.011, 0.45, 10),
      matRedSpring,
    );
    tBar.rotation.x = Math.PI / 2;
    tBar.position.set(0.26 * side, 0.23, fz - 0.32);
    fg.add(tBar);

    // Bilstein MacPherson strut damper + red coil spring
    const strut = new THREE.Group();
    strut.position.set((trackHalf - 0.13) * side, 0.24, fz);
    strut.rotation.z = side * 0.22;

    const damper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.026, 0.29, 12),
      matBilsteinYellow,
    );
    damper.position.y = 0.145;
    strut.add(damper);

    const springMesh = new THREE.Mesh(frontSpringGeo, matRedSpring);
    springMesh.position.y = 0.06;
    strut.add(springMesh);

    fg.add(strut);
  });

  const rearSuspLeft = new THREE.Group();
  rearSuspLeft.name = 'chassis';
  const rearSuspRight = new THREE.Group();
  rearSuspRight.name = 'chassis';

  ([-1, 1] as const).forEach((side) => {
    const rg = side === 1 ? rearSuspLeft : rearSuspRight;
    const rz = PORSCHE_SPECS.rearAxleZ;
    const trackHalf = PORSCHE_SPECS.rearTrack / 2;

    // Semi-trailing arm casting
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.24 * side, 0.26, rz + 0.34),
      new THREE.Vector3((trackHalf - 0.13) * side, 0.28, rz),
      new THREE.Vector3(0.36 * side, 0.27, rz + 0.24),
    ]);
    rg.add(
      new THREE.Mesh(new THREE.TubeGeometry(armCurve, 14, 0.022, 8, false), matAluminum),
    );

    // Transverse rear torsion bar
    const rearTBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.38, 10),
      matRedSpring,
    );
    rearTBar.rotation.z = Math.PI / 2;
    rearTBar.position.set(0.20 * side, 0.26, rz + 0.34);
    rg.add(rearTBar);

    // Rear Bilstein shock absorber
    const rShock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.024, 0.32, 12),
      matBilsteinYellow,
    );
    rShock.position.set((trackHalf - 0.15) * side, 0.42, rz - 0.04);
    rShock.rotation.z = side * 0.22;
    rg.add(rShock);
  });

  // =========================================================================
  // 4. TYPE 915 5-SPEED MANUAL TRANSAXLE & CV HALF-SHAFTS
  // =========================================================================
  const transaxleGroup = new THREE.Group();
  transaxleGroup.name = 'transaxle';
  const axleZ = PORSCHE_SPECS.rearAxleZ;

  // Main ribbed magnesium gear housing (ahead of rear axle)
  const gearCase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.135, 0.155, 0.46, 16),
    matMagnesium,
  );
  gearCase.rotation.x = Math.PI / 2;
  gearCase.position.set(0, 0.31, axleZ + 0.16);
  gearCase.castShadow = true;
  transaxleGroup.add(gearCase);

  // Bellhousing mating to Flat-6
  const bellHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.145, 0.20, 16),
    matMagnesium,
  );
  bellHousing.rotation.x = Math.PI / 2;
  bellHousing.position.set(0, 0.31, axleZ - 0.16);
  transaxleGroup.add(bellHousing);

  // Nose cone (5th/reverse gear end)
  const noseCone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.125, 0.18, 14),
    matMagnesium,
  );
  noseCone.rotation.x = Math.PI / 2;
  noseCone.position.set(0, 0.31, axleZ + 0.46);
  transaxleGroup.add(noseCone);

  // Cooling ribs along transaxle case
  for (let i = 0; i < 6; i++) {
    const rib = new THREE.Mesh(
      new THREE.TorusGeometry(0.145, 0.008, 6, 18),
      matMagnesium,
    );
    rib.position.set(0, 0.31, axleZ - 0.02 + i * 0.07);
    transaxleGroup.add(rib);
  }

  // Rear CV half-shafts connecting differential output flanges to wheel hubs
  ([-1, 1] as const).forEach((side) => {
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.017, 0.017, 0.56, 10),
      matSteelDark,
    );
    shaft.rotation.z = Math.PI / 2;
    shaft.position.set(0.41 * side, 0.315, axleZ);
    transaxleGroup.add(shaft);

    const cvBoot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.036, 0.07, 12),
      matLeatherBlack,
    );
    cvBoot.rotation.z = Math.PI / 2;
    cvBoot.position.set(0.19 * side, 0.315, axleZ);
    transaxleGroup.add(cvBoot);
  });

  // =========================================================================
  // 5. TYPE 911/83 2.7L AIR-COOLED FLAT-6 BOXER ENGINE
  // Positioned behind rear axle (crank center at z = -1.58m, y = 0.31m)
  // =========================================================================
  const engineRootGroup = new THREE.Group();
  engineRootGroup.name = 'engine';
  const engZ = -1.58;
  const engY = 0.31;

  const engineBlockGroup = new THREE.Group();
  engineBlockGroup.name = 'engine';
  engineBlockGroup.position.set(0, engY, engZ);

  const engineShroudGroup = new THREE.Group();
  engineShroudGroup.name = 'engine';
  engineShroudGroup.position.set(0, engY, engZ);

  const leftHeadGroup = new THREE.Group();
  leftHeadGroup.name = 'engine';
  leftHeadGroup.position.set(0, engY, engZ);

  const rightHeadGroup = new THREE.Group();
  rightHeadGroup.name = 'engine';
  rightHeadGroup.position.set(0, engY, engZ);

  const exhaustGroup = new THREE.Group();
  exhaustGroup.name = 'engine';
  exhaustGroup.position.set(0, engY, engZ);

  // Split Magnesium Crankcase (center core)
  const crankCase = new THREE.Mesh(
    new THREE.BoxGeometry(0.20, 0.21, 0.44),
    matMagnesium,
  );
  crankCase.castShadow = true;
  engineBlockGroup.add(crankCase);

  // Finned oil sump plate underneath
  const sumpPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.03, 0.40),
    matAluminum,
  );
  sumpPlate.position.y = -0.115;
  engineBlockGroup.add(sumpPlate);

  // Flywheel (mating forward to 915 transaxle)
  const flywheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.03, 28),
    matSteelDark,
  );
  flywheel.rotation.x = Math.PI / 2;
  flywheel.position.z = 0.245;
  engineBlockGroup.add(flywheel);

  // Rotating Forged Crankshaft Assembly
  const crankshaftGroup = new THREE.Group();
  const mainJournal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.50, 14),
    matSteelDark,
  );
  mainJournal.rotation.x = Math.PI / 2;
  crankshaftGroup.add(mainJournal);

  // Lower Crankshaft Pulley (rear end -Z)
  const crankPulley = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, 0.028, 24),
    matAluminum,
  );
  crankPulley.rotation.x = Math.PI / 2;
  crankPulley.position.z = -0.265;
  crankshaftGroup.add(crankPulley);
  engineBlockGroup.add(crankshaftGroup);

  // 6 Dynamic Pistons, Connecting Rods, Finned Nikasil Cylinders & Glow Chambers
  const pistonVisuals: PistonVisual[] = [];
  const cylMeta: Array<{
    num: 1 | 2 | 3 | 4 | 5 | 6;
    bankSign: 1 | -1;
    zLocal: number;
  }> = [
    { num: 1, bankSign: 1, zLocal: 0.13 },
    { num: 2, bankSign: 1, zLocal: 0.01 },
    { num: 3, bankSign: 1, zLocal: -0.11 },
    { num: 4, bankSign: -1, zLocal: 0.105 },
    { num: 5, bankSign: -1, zLocal: -0.015 },
    { num: 6, bankSign: -1, zLocal: -0.135 },
  ];

  const rodLen = PORSCHE_SPECS.engine.rodLength;
  const crankR = PORSCHE_SPECS.engine.crankRadius;

  cylMeta.forEach((cm) => {
    const headTarget = cm.bankSign === 1 ? leftHeadGroup : rightHeadGroup;

    // Finned Nikasil Cylinder Barrel (4 stacked circular cooling fins)
    const barrelGroup = new THREE.Group();
    barrelGroup.position.set(0.145 * cm.bankSign, 0, cm.zLocal);
    const linerSleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.048, 0.11, 18, 1, true),
      matCylinderLiner,
    );
    linerSleeve.rotation.z = Math.PI / 2;
    barrelGroup.add(linerSleeve);

    for (let f = 0; f < 5; f++) {
      const fin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.064, 0.064, 0.006, 18),
        matAluminum,
      );
      fin.rotation.z = Math.PI / 2;
      fin.position.x = (-0.042 + f * 0.021) * cm.bankSign;
      barrelGroup.add(fin);
    }
    engineBlockGroup.add(barrelGroup);

    // Combustion Chamber Glow Disc (pulses on power stroke 1-6-2-4-3-5)
    const chamberGlowMat = new THREE.MeshStandardMaterial({
      color: 0xff5a1f,
      emissive: 0xff4500,
      emissiveIntensity: 0,
      transparent: true,
      opacity: 0.85,
      clippingPlanes,
    });
    const glowDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.041, 0.041, 0.018, 16),
      chamberGlowMat,
    );
    glowDisc.rotation.z = Math.PI / 2;
    glowDisc.position.set(0.188 * cm.bankSign, 0, cm.zLocal);
    engineBlockGroup.add(glowDisc);

    // Moving Piston
    const pistonGroup = new THREE.Group();
    const pistonCrown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.046, 18),
      matAluminum,
    );
    pistonCrown.rotation.z = Math.PI / 2;
    pistonGroup.add(pistonCrown);
    // Compression rings
    for (let ringIdx = 0; ringIdx < 2; ringIdx++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.043, 0.002, 6, 18),
        matSteelDark,
      );
      ring.rotation.y = Math.PI / 2;
      ring.position.x = (0.014 - ringIdx * 0.01) * cm.bankSign;
      pistonGroup.add(ring);
    }
    pistonGroup.position.set(0.15 * cm.bankSign, 0, cm.zLocal);
    engineBlockGroup.add(pistonGroup);

    // Articulating Connecting Rod (pivots at piston wrist pin -> crank pin)
    const rodGroup = new THREE.Group();
    const rodBeam = new THREE.Mesh(
      new THREE.BoxGeometry(rodLen, 0.014, 0.016),
      matSteelDark,
    );
    rodBeam.position.x = -rodLen * 0.5 * cm.bankSign;
    rodGroup.add(rodBeam);
    const bigEnd = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.02, 14),
      matAluminum,
    );
    bigEnd.rotation.x = Math.PI / 2;
    bigEnd.position.x = -rodLen * cm.bankSign;
    rodGroup.add(bigEnd);
    rodGroup.position.set(0.15 * cm.bankSign, 0, cm.zLocal);
    engineBlockGroup.add(rodGroup);

    // Crankpin counterweight cheek
    const crankPinMarker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.017, 0.017, 0.024, 12),
      matChrome,
    );
    crankPinMarker.rotation.x = Math.PI / 2;
    crankPinMarker.position.set(crankR, 0, cm.zLocal);
    engineBlockGroup.add(crankPinMarker);

    // Curved aluminum intake runner (head port y=0.038 up to flange y=0.095)
    const runnerCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.230 * cm.bankSign, 0.038, cm.zLocal),
      new THREE.Vector3(0.246 * cm.bankSign, 0.068, cm.zLocal),
      new THREE.Vector3(0.244 * cm.bankSign, 0.095, cm.zLocal),
    ]);
    headTarget.add(
      new THREE.Mesh(new THREE.TubeGeometry(runnerCurve, 10, 0.020, 12, false), matAluminum),
    );

    const flangeCollar = new THREE.Mesh(
      new THREE.TorusGeometry(0.021, 0.004, 8, 16),
      matAluminum,
    );
    flangeCollar.rotation.x = Math.PI / 2;
    flangeCollar.position.set(0.244 * cm.bankSign, 0.096, cm.zLocal);
    headTarget.add(flangeCollar);

    // Tapered brass velocity stack cleanly seated above flange (y=0.096..0.208, zero overlap)
    const stack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0265, 0.0205, 0.112, 18, 1, true),
      matBrass,
    );
    stack.position.set(0.241 * cm.bankSign, 0.152, cm.zLocal);
    stack.rotation.z = cm.bankSign * 0.065;
    headTarget.add(stack);

    const trumpetLip = new THREE.Mesh(
      new THREE.TorusGeometry(0.027, 0.0045, 8, 18),
      matChrome,
    );
    trumpetLip.rotation.x = Math.PI / 2;
    trumpetLip.position.set(0.237 * cm.bankSign, 0.208, cm.zLocal);
    headTarget.add(trumpetLip);

    // Braided MFI fuel injection line from Bosch pump to aluminum injector port
    const fuelLineCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.11, 0.18, 0.04 + (cm.num % 3) * 0.045),
      new THREE.Vector3(0.17 * cm.bankSign, 0.17, cm.zLocal * 0.45),
      new THREE.Vector3(0.236 * cm.bankSign, 0.076, cm.zLocal),
    ]);
    engineShroudGroup.add(
      new THREE.Mesh(new THREE.TubeGeometry(fuelLineCurve, 12, 0.0026, 6, false), matBrass),
    );

    // High-tension spark plug wire from distributor cap to cylinder head
    const plugWireCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.11, 0.175, -0.18),
      new THREE.Vector3(0.08 * cm.bankSign, 0.145, -0.16),
      new THREE.Vector3(0.21 * cm.bankSign, 0.055, cm.zLocal),
    ]);
    engineBlockGroup.add(
      new THREE.Mesh(new THREE.TubeGeometry(plugWireCurve, 12, 0.0024, 6, false), matLeatherBlack),
    );

    pistonVisuals.push({
      cylinderNumber: cm.num,
      bankSign: cm.bankSign,
      zLocal: cm.zLocal,
      pistonGroup,
      rodGroup,
      crankPinMarker,
      chamberGlowMat,
    });
  });

  // Left & Right SOHC Cylinder Heads + Finned Cast Magnesium Valve Covers
  ([-1, 1] as const).forEach((side) => {
    const headTarget = side === 1 ? leftHeadGroup : rightHeadGroup;
    const headBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.085, 0.125, 0.40),
      matAluminum,
    );
    headBlock.position.set(0.24 * side, 0.01, -0.01);
    headBlock.castShadow = true;
    headTarget.add(headBlock);

    const valveCover = new THREE.Mesh(
      new THREE.BoxGeometry(0.036, 0.105, 0.39),
      matMagnesium,
    );
    valveCover.position.set(0.295 * side, 0.0, -0.01);
    headTarget.add(valveCover);

    // Machined horizontal cooling ribs & 6 chrome cam-cover hex nuts
    for (let r = -1; r <= 1; r++) {
      const rib = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.008, 0.37),
        matAluminum,
      );
      rib.position.set(0.314 * side, r * 0.028, -0.01);
      headTarget.add(rib);
    }
    [-0.14, -0.01, 0.12].forEach((nz) => {
      [-0.032, 0.032].forEach((ny) => {
        const nut = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0045, 0.0045, 0.012, 6),
          matChrome,
        );
        nut.rotation.z = Math.PI / 2;
        nut.position.set(0.315 * side, ny, nz);
        headTarget.add(nut);
      });
    });

    // Front timing chain housing boss
    const chainBox = new THREE.Mesh(
      new THREE.CylinderGeometry(0.044, 0.044, 0.048, 16),
      matAluminum,
    );
    chainBox.rotation.x = Math.PI / 2;
    chainBox.position.set(0.25 * side, 0.01, 0.205);
    headTarget.add(chainBox);

    // Throttle linkage crossbar above intake trumpets
    const throttleRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0045, 0.0045, 0.34, 8),
      matChrome,
    );
    throttleRod.rotation.x = Math.PI / 2;
    throttleRod.position.set(0.195 * side, 0.115, -0.01);
    headTarget.add(throttleRod);
  });

  // Iconic Sculpted Fiberglass Cooling Shroud (curved arch profile) + 11-Blade Axial Fan
  const shroudShape = new THREE.Shape();
  shroudShape.moveTo(-0.24, 0.06);
  shroudShape.quadraticCurveTo(-0.23, 0.25, -0.13, 0.295);
  shroudShape.quadraticCurveTo(0, 0.335, 0.13, 0.295);
  shroudShape.quadraticCurveTo(0.23, 0.25, 0.24, 0.06);
  shroudShape.lineTo(0.18, 0.06);
  shroudShape.quadraticCurveTo(0, 0.13, -0.18, 0.06);
  shroudShape.closePath();

  const shroudGeo = new THREE.ExtrudeGeometry(shroudShape, {
    depth: 0.31,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.014,
    bevelSegments: 3,
  });
  shroudGeo.translate(0, 0, -0.17);
  const shroudDome = new THREE.Mesh(shroudGeo, matShroudCream);
  shroudDome.castShadow = true;
  engineShroudGroup.add(shroudDome);

  // Cast magnesium circular fan housing + steel retaining strap
  const fanRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.122, 0.126, 0.085, 32, 1, true),
    matAluminum,
  );
  fanRing.rotation.x = Math.PI / 2;
  fanRing.position.set(0, 0.22, -0.20);
  engineShroudGroup.add(fanRing);

  const fanStrap = new THREE.Mesh(
    new THREE.TorusGeometry(0.126, 0.005, 8, 32),
    matChrome,
  );
  fanStrap.position.set(0, 0.22, -0.205);
  engineShroudGroup.add(fanStrap);

  // Spinning 11-Blade Axial Cooling Fan
  const fanRotorGroup = new THREE.Group();
  fanRotorGroup.position.set(0, 0.22, -0.21);
  const fanHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.042, 0.044, 18),
    matAluminum,
  );
  fanHub.rotation.x = Math.PI / 2;
  fanRotorGroup.add(fanHub);
  const fanNut = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.016, 6),
    matChrome,
  );
  fanNut.rotation.x = Math.PI / 2;
  fanNut.position.z = -0.025;
  fanRotorGroup.add(fanNut);

  for (let b = 0; b < 11; b++) {
    const angle = (b / 11) * Math.PI * 2;
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.019, 0.080, 0.007),
      matRedSpring,
    );
    blade.position.set(Math.cos(angle) * 0.072, Math.sin(angle) * 0.072, 0);
    blade.rotation.z = angle + Math.PI / 2;
    blade.rotation.y = 0.48;
    fanRotorGroup.add(blade);
  }
  engineShroudGroup.add(fanRotorGroup);

  // V-Belt connecting crank pulley (y=0) to fan hub (y=0.22)
  const vBeltCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-0.056, 0, -0.265),
      new THREE.Vector3(-0.046, 0.22, -0.245),
      new THREE.Vector3(0.046, 0.22, -0.245),
      new THREE.Vector3(0.056, 0, -0.265),
    ],
    true,
  );
  engineShroudGroup.add(
    new THREE.Mesh(new THREE.TubeGeometry(vBeltCurve, 24, 0.007, 6, true), matLeatherBlack),
  );

  // Bosch MFI 6-Plunger Mechanical Fuel Injection Pump + Brass Plunger Fittings
  const mfiPump = new THREE.Mesh(
    new THREE.BoxGeometry(0.088, 0.115, 0.15),
    matAluminum,
  );
  mfiPump.position.set(0.11, 0.12, 0.09);
  engineShroudGroup.add(mfiPump);

  for (let pIdx = 0; pIdx < 6; pIdx++) {
    const plunger = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0065, 0.0065, 0.016, 8),
      matBrass,
    );
    plunger.position.set(0.11, 0.184, 0.034 + pIdx * 0.022);
    engineShroudGroup.add(plunger);
  }

  const distributorGroup = new THREE.Group();
  distributorGroup.position.set(-0.11, 0.10, -0.18);
  const distBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.025, 0.09, 14),
    matAluminum,
  );
  distributorGroup.add(distBody);
  const distCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.04, 14),
    new THREE.MeshStandardMaterial({ color: 0xc2481a, roughness: 0.35, clippingPlanes }),
  );
  distCap.position.y = 0.06;
  distributorGroup.add(distCap);
  engineBlockGroup.add(distributorGroup);

  // Equal-Length Exhaust Headers & Transverse Sport Muffler + Tailpipe
  ([-1, 1] as const).forEach((side) => {
    [0.12, 0.0, -0.12].forEach((zOff) => {
      const headerCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.24 * side, -0.05, zOff),
        new THREE.Vector3(0.22 * side, -0.15, zOff - 0.04),
        new THREE.Vector3(0.14 * side, -0.16, -0.24),
      ]);
      exhaustGroup.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(headerCurve, 14, 0.017, 8, false),
          matExhaustBronze,
        ),
      );
    });
  });

  const muffler = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.068, 0.62, 18),
    matSteelDark,
  );
  muffler.rotation.z = Math.PI / 2;
  muffler.position.set(0, -0.055, -0.34);
  muffler.castShadow = true;
  exhaustGroup.add(muffler);

  // Authentic 1973 RS driver-left (+X) curved exhaust exit & rolled polished tip under rear skirt
  const tailPipeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.24, -0.055, -0.35),
    new THREE.Vector3(0.32, -0.075, -0.41),
    new THREE.Vector3(0.355, -0.082, -0.505),
  ]);
  exhaustGroup.add(
    new THREE.Mesh(new THREE.TubeGeometry(tailPipeCurve, 14, 0.023, 14, false), matChrome),
  );
  const tailTipLip = new THREE.Mesh(
    new THREE.TorusGeometry(0.023, 0.0042, 10, 20),
    matChrome,
  );
  tailTipLip.position.set(0.355, -0.082, -0.505);
  tailTipLip.rotation.y = 0.06;
  exhaustGroup.add(tailTipLip);
  const tailBore = new THREE.Mesh(
    new THREE.CircleGeometry(0.019, 14),
    matLeatherBlack,
  );
  tailBore.position.set(0.355, -0.082, -0.507);
  tailBore.rotation.y = Math.PI;
  exhaustGroup.add(tailBore);

  engineRootGroup.add(engineBlockGroup);
  engineRootGroup.add(engineShroudGroup);
  engineRootGroup.add(leftHeadGroup);
  engineRootGroup.add(rightHeadGroup);
  engineRootGroup.add(exhaustGroup);

  // =========================================================================
  // 6. FORGED 5-PETAL FUCHS ALLOY WHEELS & CROSS-DRILLED BRAKE ROTORS
  // =========================================================================
  const buildFuchsSpokeShape = (rimInnerR: number) => {
    const s = new THREE.Shape();
    // Classic forged 1973 Carrera RS Fuchs sculpted paddle spokes framing 5 black pockets
    s.moveTo(-0.024, 0.028);
    s.bezierCurveTo(-0.027, rimInnerR * 0.36, -0.064, rimInnerR * 0.72, -0.056, rimInnerR * 0.96);
    s.quadraticCurveTo(0, rimInnerR * 1.045, 0.056, rimInnerR * 0.96);
    s.bezierCurveTo(0.064, rimInnerR * 0.72, 0.027, rimInnerR * 0.36, 0.024, 0.028);
    s.closePath();
    return s;
  };
  const petalShape = buildFuchsSpokeShape(0.152);
  const petalGeo = new THREE.ExtrudeGeometry(petalShape, {
    depth: 0.015,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  });

  const buildTireProfile = (outerR: number, rimR: number, width: number) => {
    const hw = width * 0.5;
    const pts = [
      new THREE.Vector2(rimR - 0.004, -hw * 0.86),
      new THREE.Vector2(rimR + (outerR - rimR) * 0.32, -hw * 0.98),
      new THREE.Vector2(rimR + (outerR - rimR) * 0.62, -hw * 1.03),
      new THREE.Vector2(outerR - 0.022, -hw * 0.95),
      new THREE.Vector2(outerR - 0.006, -hw * 0.80),
      new THREE.Vector2(outerR, -hw * 0.60),
      new THREE.Vector2(outerR, 0),
      new THREE.Vector2(outerR, hw * 0.60),
      new THREE.Vector2(outerR - 0.006, hw * 0.80),
      new THREE.Vector2(outerR - 0.022, hw * 0.95),
      new THREE.Vector2(rimR + (outerR - rimR) * 0.62, hw * 1.03),
      new THREE.Vector2(rimR + (outerR - rimR) * 0.32, hw * 0.98),
      new THREE.Vector2(rimR - 0.004, hw * 0.86),
    ];
    const geo = new THREE.LatheGeometry(pts, 64);
    geo.rotateZ(Math.PI / 2); // Note: rotateZ(+PI/2) maps (r, +y) -> (-y, +r)
    return geo;
  };

  // Stepped machined alloy Fuchs outer dish & bead lip (note -sideSign because rotateZ(+PI/2) flips y->-x)
  const buildFuchsRimLip = (rimR: number, width: number, sideSign: 1 | -1) => {
    const hw = width * 0.45;
    const lipSign = -sideSign;
    const pts = [
      new THREE.Vector2(rimR * 0.78, -hw * 0.25 * lipSign),
      new THREE.Vector2(rimR * 0.84, hw * 0.24 * lipSign),
      new THREE.Vector2(rimR * 0.90, hw * 0.56 * lipSign),
      new THREE.Vector2(rimR * 0.96, hw * 0.92 * lipSign),
      new THREE.Vector2(rimR * 1.005, hw * 1.00 * lipSign),
      new THREE.Vector2(rimR * 1.005, hw * 0.88 * lipSign),
      new THREE.Vector2(rimR * 0.94, hw * 0.84 * lipSign),
      new THREE.Vector2(rimR * 0.94, -hw * 0.88 * lipSign),
    ];
    const geo = new THREE.LatheGeometry(pts, 64);
    geo.rotateZ(Math.PI / 2);
    return geo;
  };

  const wheels: WheelAssembly[] = [];
  const corners: Array<{ sideSign: 1 | -1; isFront: boolean }> = [
    { sideSign: 1, isFront: true },
    { sideSign: -1, isFront: true },
    { sideSign: 1, isFront: false },
    { sideSign: -1, isFront: false },
  ];

  corners.forEach(({ sideSign, isFront }) => {
    const outerR = isFront ? PORSCHE_SPECS.frontTireRadius : PORSCHE_SPECS.rearTireRadius;
    const width = isFront ? PORSCHE_SPECS.frontTireWidth : PORSCHE_SPECS.rearTireWidth;
    const rimR = PORSCHE_SPECS.wheelRimDiameter * 0.5;
    const trackHalf = (isFront ? PORSCHE_SPECS.frontTrack : PORSCHE_SPECS.rearTrack) * 0.5;
    const zPos = isFront ? PORSCHE_SPECS.frontAxleZ : PORSCHE_SPECS.rearAxleZ;

    // 1. Wheel & Tire Group (spins on axle, explodes outward)
    const wheelGroup = new THREE.Group();
    wheelGroup.name = 'wheels';
    wheelGroup.position.set(trackHalf * sideSign, outerR, zPos);

    // Tire
    const tireMesh = new THREE.Mesh(buildTireProfile(outerR, rimR, width), matTire);
    tireMesh.castShadow = true;
    tireMesh.receiveShadow = true;
    wheelGroup.add(tireMesh);

    // Stepped Polished Fuchs Alloy Outer Lip & Barrel
    const rimLip = new THREE.Mesh(buildFuchsRimLip(rimR, width, sideSign), matFuchsSilver);
    wheelGroup.add(rimLip);

    // Satin Black Anodized Recessed Wheel Center Bowl + Inner Pocket Ring
    const dishBack = new THREE.Mesh(
      new THREE.CylinderGeometry(rimR * 0.86, rimR * 0.86, 0.024, 36),
      matLeatherBlack,
    );
    dishBack.rotation.z = Math.PI / 2;
    dishBack.position.x = (width * 0.145) * sideSign;
    wheelGroup.add(dishBack);

    const blackPocketRim = new THREE.Mesh(
      new THREE.TorusGeometry(rimR * 0.835, 0.009, 8, 36),
      matLeatherBlack,
    );
    blackPocketRim.rotation.y = Math.PI / 2;
    blackPocketRim.position.x = (width * 0.17) * sideSign;
    wheelGroup.add(blackPocketRim);

    // Painted Center Hub Ring & Outer Star Web Ring framing the 5 forged Fuchs cutouts
    const centerStarHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.060, 0.018, 24),
      matFuchsCenter,
    );
    centerStarHub.rotation.z = Math.PI / 2;
    centerStarHub.position.x = (width * 0.18) * sideSign;
    wheelGroup.add(centerStarHub);

    const outerWebRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.146, 0.0085, 8, 36),
      matFuchsCenter,
    );
    outerWebRing.rotation.y = Math.PI / 2;
    outerWebRing.position.x = (width * 0.178) * sideSign;
    wheelGroup.add(outerWebRing);

    // 5 Forged Fuchs Cloverleaf Petals (Livery-Matched Centers) + Chrome Acorn Lug Nuts
    for (let k = 0; k < 5; k++) {
      const ang = (k / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, matFuchsCenter);
      petal.rotation.y = sideSign === 1 ? Math.PI / 2 : -Math.PI / 2;
      petal.rotation.z = ang;
      petal.position.x = (width * 0.165) * sideSign;
      wheelGroup.add(petal);

      const lug = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0085, 0.0085, 0.024, 6),
        matChrome,
      );
      lug.rotation.z = Math.PI / 2;
      lug.position.set(
        (width * 0.215) * sideSign,
        Math.cos(ang + Math.PI / 5) * 0.044,
        Math.sin(ang + Math.PI / 5) * 0.044,
      );
      wheelGroup.add(lug);
    }

    // Center Cap with Recessed Stuttgart Crest
    const centerCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.035, 0.030, 20),
      matFuchsCenter,
    );
    centerCap.rotation.z = Math.PI / 2;
    centerCap.position.x = (width * 0.21) * sideSign;
    wheelGroup.add(centerCap);

    const capCrest = new THREE.Mesh(
      new THREE.CircleGeometry(0.017, 16),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: textures.porscheCrestMap,
        transparent: true,
        alphaTest: 0.08,
        metalness: 0.45,
        roughness: 0.3,
        clippingPlanes,
      }),
    );
    capCrest.rotation.y = sideSign === 1 ? Math.PI / 2 : -Math.PI / 2;
    capCrest.position.x = (width * 0.21 + 0.016) * sideSign;
    wheelGroup.add(capCrest);

    // Chrome tire valve stem near outer dish lip
    const valveStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0035, 0.004, 0.018, 8),
      matChrome,
    );
    valveStem.rotation.z = Math.PI / 2;
    valveStem.position.set((width * 0.32) * sideSign, rimR * 0.87, 0);
    wheelGroup.add(valveStem);

    // 2. Cross-Drilled Ventilated Brake Rotor & Multi-Piece Finned Caliper
    const hubBrakeGroup = new THREE.Group();
    hubBrakeGroup.name = 'wheels';
    hubBrakeGroup.position.set((trackHalf - 0.035) * sideSign, outerR, zPos);

    const discR = (isFront ? PORSCHE_SPECS.frontDiscDiameter : PORSCHE_SPECS.rearDiscDiameter) * 0.5;
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(discR, discR, 0.024, 40),
      matDisc,
    );
    disc.rotation.z = Math.PI / 2;
    hubBrakeGroup.add(disc);

    const discHat = new THREE.Mesh(
      new THREE.CylinderGeometry(discR * 0.46, discR * 0.48, 0.034, 20),
      matSteelDark,
    );
    discHat.rotation.z = Math.PI / 2;
    hubBrakeGroup.add(discHat);

    const caliperZ = isFront ? -discR * 0.72 : discR * 0.72;
    const caliper = new THREE.Mesh(
      new THREE.BoxGeometry(0.058, 0.098, 0.116),
      matAluminum,
    );
    caliper.position.set(0, 0.03, caliperZ);
    hubBrakeGroup.add(caliper);

    const caliperBridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.062, 0.042, 0.072),
      matRedSpring,
    );
    caliperBridge.position.set(0, 0.03, caliperZ);
    hubBrakeGroup.add(caliperBridge);

    root.add(wheelGroup);
    root.add(hubBrakeGroup);

    wheels.push({
      wheelGroup,
      hubBrakeGroup,
      sideSign,
      isFront,
      baseX: trackHalf * sideSign,
      baseY: outerR,
      baseZ: zPos,
    });
  });

  root.add(chassisGroup);
  root.add(interiorGroup);
  root.add(transaxleGroup);
  root.add(frontSuspLeft);
  root.add(frontSuspRight);
  root.add(rearSuspLeft);
  root.add(rearSuspRight);
  root.add(engineRootGroup);

  const updateKinematics = (kin: Flat6Kinematics, wheelSpinRad: number) => {
    crankshaftGroup.rotation.z = kin.crankRad;
    fanRotorGroup.rotation.z = kin.fanRad;
    distributorGroup.rotation.y = kin.distributorRad;

    for (let i = 0; i < pistonVisuals.length; i++) {
      const pv = pistonVisuals[i];
      const cylState = kin.cylinders.find((c) => c.cylinderNumber === pv.cylinderNumber);
      if (!cylState) continue;

      pv.pistonGroup.position.x = cylState.pistonOffset;
      pv.rodGroup.position.x = cylState.pistonOffset;
      pv.rodGroup.rotation.z = cylState.rodAngleRad;

      pv.crankPinMarker.position.x = Math.cos(cylState.throwAngleRad) * crankR;
      pv.crankPinMarker.position.y = Math.sin(cylState.throwAngleRad) * crankR;

      pv.chamberGlowMat.emissiveIntensity = cylState.combustionIntensity * 2.8;
      pv.chamberGlowMat.opacity = 0.15 + cylState.combustionIntensity * 0.85;
    }

    for (let i = 0; i < wheels.length; i++) {
      wheels[i].wheelGroup.rotation.x = wheelSpinRad;
    }
  };

  const setEngineXray = (xray: boolean) => {
    matCylinderLiner.transparent = xray;
    matCylinderLiner.opacity = xray ? 0.26 : 1.0;
    matCylinderLiner.depthWrite = !xray;
    matCylinderLiner.needsUpdate = true;

    matShroudCream.color.setHex(xray ? 0xbaa882 : 0xebe4d2);
    matShroudCream.transparent = xray;
    matShroudCream.opacity = xray ? 0.48 : 1.0;
    matShroudCream.depthWrite = !xray;
    matShroudCream.needsUpdate = true;
  };

  const setFuchsColor = (hex: string) => {
    matFuchsCenter.color.set(hex);
  };

  return {
    root,
    chassisGroup,
    interiorGroup,
    transaxleGroup,
    engineRootGroup,
    engineBlockGroup,
    engineShroudGroup,
    leftHeadGroup,
    rightHeadGroup,
    exhaustGroup,
    frontSuspLeft,
    frontSuspRight,
    rearSuspLeft,
    rearSuspRight,
    wheels,
    updateKinematics,
    setEngineXray,
    setFuchsColor,
  };
}
