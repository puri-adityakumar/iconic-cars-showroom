import * as THREE from 'three';
import {
  CarRig,
  PistonVisual,
  WheelAssembly,
  addSealedWheelWell,
  buildAirfoilWing,
  buildBankedCylinderVisual,
  buildBeveledBox,
  buildDeepDishRimLip,
  buildHelicalSpring,
  buildSurfaceGrid,
  buildSweptPylon,
  buildTireProfile,
  catmullY,
  cornerClusterU,
  createCommonDrivetrainMaterials,
  lerp,
  sampleArchZ,
  smoothstep,
  updateBankedPistons,
  wheelArchHeight,
} from './carCommon';
import {
  EngineKinematics,
  LiverySpec,
  TeardownPose,
  VEHICLES,
} from './specs';
import { ProceduralTextures } from './textures';

/**
 * 2020 Nissan GT-R (R35)
 * Seamless sculpted aero fastback coupe with wraparound V-motion front apron,
 * swept lightning LED DRL headlamps, NACA hood ducts, fender aero vents,
 * flush blackened A-pillar visor & floating black C-pillar aero strip, four round
 * afterburner halo taillights, carbon Venturi diffuser & quad burnt-titanium tips,
 * VR38DETT 3.8L twin-turbo V6, rear GR6 DCT transaxle + ATTESA AWD & 20" RAYS forged wheels.
 */
export function buildNissanR35GTRCar(
  textures: ProceduralTextures,
  isSoftwareGl: boolean,
  clippingPlanes: THREE.Plane[],
): CarRig {
  const spec = VEHICLES['nissan-r35-gtr'];
  const root = new THREE.Group();
  root.name = 'nissan_r35_gtr_root';

  const bodyRoot = new THREE.Group();
  bodyRoot.name = 'body';
  const shellGroup = new THREE.Group();
  shellGroup.name = 'body';
  const hoodGroup = new THREE.Group();
  hoodGroup.name = 'body';
  const trunkWingGroup = new THREE.Group();
  trunkWingGroup.name = 'body';
  const leftDoorGroup = new THREE.Group();
  leftDoorGroup.name = 'body';
  const rightDoorGroup = new THREE.Group();
  rightDoorGroup.name = 'body';

  const common = createCommonDrivetrainMaterials(textures, clippingPlanes);

  const paintMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f4ea8,
    metalness: 0.45,
    roughness: 0.13,
    clearcoat: 1.0,
    clearcoatRoughness: 0.025,
    envMapIntensity: 1.56,
    side: THREE.DoubleSide,
    clippingPlanes,
  });
  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x16181d,
    metalness: 0.28,
    roughness: 0.42,
    side: THREE.DoubleSide,
    clippingPlanes,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xeaf0f6,
    metalness: 0.94,
    roughness: 0.12,
    envMapIntensity: 1.45,
    side: THREE.DoubleSide,
    clippingPlanes,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x141b24,
    metalness: 0.05,
    roughness: 0.04,
    transmission: isSoftwareGl ? 0 : 0.50,
    transparent: true,
    opacity: isSoftwareGl ? 0.50 : 0.52,
    clearcoat: 1.0,
    depthWrite: false,
    side: THREE.DoubleSide,
    clippingPlanes,
  });
  const headlightGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x1d2634,
    metalness: 0.08,
    roughness: 0.05,
    transparent: true,
    opacity: 0.22,
    clearcoat: 1.0,
    depthWrite: false,
    clippingPlanes,
  });
  const drlLedMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xdcecff,
    emissiveIntensity: 1.55,
    roughness: 0.10,
    clippingPlanes,
  });
  const afterburnerHaloMat = new THREE.MeshStandardMaterial({
    color: 0xff2028,
    emissive: 0xd91018,
    emissiveIntensity: 1.5,
    roughness: 0.12,
    clippingPlanes,
  });
  const accentPinstripeMat = new THREE.MeshStandardMaterial({
    color: 0xd91b24,
    roughness: 0.30,
    metalness: 0.12,
    clippingPlanes,
  });
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.createPlateMap('GT-R · R35'),
    roughness: 0.42,
    metalness: 0.08,
    clippingPlanes,
  });
  const nissanBadgeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.nissanBadgeMap,
    transparent: true,
    alphaTest: 0.08,
    metalness: 0.55,
    roughness: 0.25,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    clippingPlanes,
  });
  const gtrBadgeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.gtrBadgeMap,
    transparent: true,
    alphaTest: 0.08,
    roughness: 0.28,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    clippingPlanes,
  });
  const raysWheelMat = new THREE.MeshStandardMaterial({
    color: 0x4b5059,
    metalness: 0.86,
    roughness: 0.22,
    envMapIntensity: 1.45,
    clippingPlanes,
  });

  const fZ = spec.frontAxleZ; // +1.390
  const rZ = spec.rearAxleZ; // -1.390
  const archR = 0.376;

  const gtrBeltY = (z: number) =>
    catmullY(
      [
        [-2.26, 0.945],
        [-1.75, 0.942],
        [-1.39, 0.932],
        [-0.78, 0.880],
        [0.0, 0.865],
        [0.72, 0.835],
        [1.39, 0.790],
        [1.92, 0.695],
        [2.29, 0.555],
      ],
      z,
    );

  const gtrRoofSideY = (z: number) =>
    catmullY(
      [
        [-0.58, 1.348],
        [-0.32, 1.364],
        [-0.08, 1.368],
        [0.10, 1.352],
        [0.24, 1.326],
      ],
      z,
    );

  // Soft muscular haunch swells blending with zero step into doors & bumper
  const gtrBaseHalfW = (z: number) =>
    0.908 - 0.105 * smoothstep(1.88, 2.30, z) - 0.095 * smoothstep(-1.86, -2.28, z);

  const gtrFlareOffset = (z: number) => {
    const fMask =
      Math.exp(-Math.pow((z - fZ) / 0.28, 2)) *
      (1 - smoothstep(1.88, 2.16, z)) *
      smoothstep(0.77, 1.00, z);
    const rMask =
      Math.exp(-Math.pow((z - rZ) / 0.30, 2)) *
      (1 - smoothstep(-1.88, -2.16, z)) *
      smoothstep(-0.84, -1.08, z);
    return fMask * 0.036 + rMask * 0.042;
  };

  const gtrOuterHalfW = (z: number) => gtrBaseHalfW(z) + gtrFlareOffset(z);
  const gtrShoulderX = (z: number) => gtrBaseHalfW(z) - 0.072;
  const gtrNoseZ = (u: number) => lerp(2.312, 1.985, Math.pow(Math.min(1, Math.abs(u)), 2.5));
  const gtrTailZ = (u: number) => lerp(-2.312, -2.065, Math.pow(Math.min(1, Math.abs(u)), 2.8));

  const gtrSideCol = (
    z: number,
    bottomY: number,
    topY: number,
    flareBlend: number,
    innerDeckX: number | null,
    side: 1 | -1,
    isFrontFender = false,
    isRearFender = false,
  ): THREE.Vector3[] => {
    const maxW = gtrOuterHalfW(z);
    const shX = gtrShoulderX(z);
    const shoulderY = lerp(bottomY, topY, 0.72);
    const crownX = lerp(shX, maxW + 0.006 * flareBlend, 0.44);
    const col = [
      new THREE.Vector3(maxW * side, bottomY, z),
      new THREE.Vector3((maxW + 0.005 * flareBlend) * side, lerp(bottomY, shoulderY, 0.25), z),
      new THREE.Vector3((maxW + 0.008 * flareBlend) * side, lerp(bottomY, shoulderY, 0.52), z),
      new THREE.Vector3((maxW + 0.007 * flareBlend) * side, shoulderY, z),
      new THREE.Vector3((maxW + 0.004 * flareBlend) * side, lerp(shoulderY, topY, 0.42), z),
      new THREE.Vector3(crownX * side, lerp(shoulderY, topY, 0.70), z),
      new THREE.Vector3(lerp(crownX, shX, 0.55) * side, lerp(shoulderY, topY, 0.86), z),
      new THREE.Vector3(shX * side, topY, z),
    ];
    if (innerDeckX !== null) {
      col.push(new THREE.Vector3(innerDeckX * side, topY - 0.004, z));
    }
    return col;
  };

  const gtrFenderRowAtZ = (z: number, side: 1 | -1, axleZ: number, wheelY: number, isFront: boolean) => {
    const innerX = isFront
      ? lerp(0.752, 0.572, smoothstep(0.72, 2.28, z))
      : lerp(0.832, 0.620, smoothstep(-0.78, -2.26, z));
    const topY = gtrBeltY(z);
    const archY = wheelArchHeight(z, axleZ, wheelY, archR);

    let bottomY = 0.150;
    if (isFront && z > axleZ + archR * 0.72) {
      bottomY = lerp(0.150, 0.455, smoothstep(axleZ + archR * 0.72, 1.82, z));
    } else if (!isFront && z < axleZ - archR * 0.72) {
      bottomY = lerp(0.150, 0.455, smoothstep(axleZ - archR * 0.72, -1.82, z));
    }
    const flareBlend = 1 - smoothstep(archR * 0.85, archR * 1.18, Math.abs(z - axleZ));
    if (archY !== null) {
      bottomY = Math.max(bottomY, archY - 0.004);
    }
    bottomY = Math.min(bottomY, topY - 0.015);
    return gtrSideCol(z, bottomY, topY, flareBlend, innerX - 0.012, side);
  };

  // =========================================================================
  // 1. WIDE MUSCULAR GT-R FENDERS, FENDER GILL VENTS & CARBON SIDE SKIRTS
  // =========================================================================
  const buildGtrFender = (
    zA: number,
    zB: number,
    _steps: number,
    side: 1 | -1,
    axleZ: number,
    wheelY: number,
    isFront: boolean,
  ) => {
    const grid: THREE.Vector3[][] = [];
    const capSteps = 10;
    const zArchEdge = isFront ? axleZ + archR * 0.98 : axleZ - archR * 0.98;

    if (!isFront) {
      for (let i = 0; i < capSteps; i++) {
        const s = i / capSteps;
        const row: THREE.Vector3[] = [];
        for (let k = 0; k <= 8; k++) {
          const uNom = lerp(0.98, 0.74, smoothstep(0.15, 1.0, k / 8));
          const zTail = Math.min(zArchEdge - 0.06, gtrTailZ(uNom) + 0.002);
          const zCol = lerp(zTail, zArchEdge, s);
          row.push(gtrFenderRowAtZ(zCol, side, axleZ, wheelY, false)[k]);
        }
        grid.push(row);
      }
    }

    const archSpanStart = isFront ? zA : zArchEdge;
    const archSpanEnd = isFront ? zArchEdge : zB;
    const zSamples = sampleArchZ(archSpanStart, archSpanEnd, axleZ, archR, 12, 34);
    for (let i = 0; i < zSamples.length; i++) {
      grid.push(gtrFenderRowAtZ(zSamples[i], side, axleZ, wheelY, isFront));
    }

    if (isFront) {
      for (let i = 1; i <= capSteps; i++) {
        const s = i / capSteps;
        const row: THREE.Vector3[] = [];
        for (let k = 0; k <= 8; k++) {
          const uNom = lerp(0.98, 0.74, smoothstep(0.15, 1.0, k / 8));
          const zNose = Math.max(zArchEdge + 0.06, gtrNoseZ(uNom) - 0.002);
          const zCol = lerp(zArchEdge, zNose, s);
          row.push(gtrFenderRowAtZ(zCol, side, axleZ, wheelY, true)[k]);
        }
        grid.push(row);
      }
    }

    const mesh = new THREE.Mesh(buildSurfaceGrid(grid, side === 1), paintMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    shellGroup.add(mesh);

    addSealedWheelWell({
      target: shellGroup,
      side,
      axleZ,
      wheelY,
      archRadius: archR,
      outerXFn: gtrOuterHalfW,
      innerX: 0.58,
      maxRoofYFn: gtrBeltY,
      linerMat: carbonMat,
      lipMat: paintMat,
    });
  };

  ([-1, 1] as const).forEach((side) => {
    buildGtrFender(0.71, 2.18, 46, side, fZ, spec.frontTireRadius, true);
    buildGtrFender(-2.22, -0.77, 46, side, rZ, spec.rearTireRadius, false);

    // Sculpted GT-R Carbon Aero Side Skirts & smooth fender gill vent
    const sideSkirt = new THREE.Mesh(
      buildBeveledBox(0.095, 0.046, 1.54, 0.014, 3),
      carbonMat,
    );
    sideSkirt.position.set(0.882 * side, 0.146, -0.02);
    shellGroup.add(sideSkirt);

    const fenderVent = new THREE.Mesh(
      buildBeveledBox(0.024, 0.24, 0.088, 0.010, 3),
      carbonMat,
    );
    fenderVent.position.set(0.908 * side, 0.455, 0.88);
    fenderVent.rotation.y = side * 0.12;
    shellGroup.add(fenderVent);
  });

  // =========================================================================
  // 2. JET-FIGHTER VISOR CANOPY, BLACKENED A-PILLARS & FLUSH C-PILLAR FILLET
  // =========================================================================
  const gtrRoofSideX = (z: number) => lerp(0.605, 0.635, smoothstep(-0.58, 0.24, z));
  const gtrWsEdgePt = (t: number, side: 1 | -1) => {
    const z = lerp(0.72, 0.24, t);
    const hw = lerp(gtrShoulderX(0.72), 0.635, t);
    const y = lerp(0.836, 1.326, t) + Math.sin(t * Math.PI) * 0.018;
    return new THREE.Vector3(hw * side, y, z);
  };
  const gtrRwEdgePt = (t: number, side: 1 | -1) => {
    const z = lerp(-1.62, -0.58, t);
    const hw = lerp(0.640, 0.605, t);
    const y = lerp(0.940, 1.348, t) + Math.sin(t * Math.PI) * 0.022;
    return new THREE.Vector3(hw * side, y, z);
  };

  const roofGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 16; i++) {
    const z = lerp(-0.58, 0.24, i / 16);
    const yPeak = gtrRoofSideY(z);
    const hw = gtrRoofSideX(z);
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 12; j++) {
      const u = (j / 12) * 2 - 1;
      row.push(new THREE.Vector3(u * hw, yPeak + (1 - u * u) * 0.020, z));
    }
    roofGrid.push(row);
  }
  const roof = new THREE.Mesh(buildSurfaceGrid(roofGrid, false), paintMat);
  roof.castShadow = true;
  shellGroup.add(roof);

  const headliner = roofGrid.map((row) =>
    row.map((p) => new THREE.Vector3(p.x * 0.96, p.y - 0.012, p.z)),
  );
  shellGroup.add(new THREE.Mesh(buildSurfaceGrid(headliner, true), carbonMat));

  const wsGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const edge = gtrWsEdgePt(t, 1);
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 12; j++) {
      const u = (j / 12) * 2 - 1;
      row.push(
        new THREE.Vector3(
          u * edge.x,
          edge.y + (1 - u * u) * 0.018,
          edge.z + (1 - u * u) * 0.055,
        ),
      );
    }
    wsGrid.push(row);
  }
  const ws = new THREE.Mesh(buildSurfaceGrid(wsGrid, false), glassMat);
  ws.renderOrder = 2;
  shellGroup.add(ws);

  const rwGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const edge = gtrRwEdgePt(t, 1);
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 12; j++) {
      const u = (j / 12) * 2 - 1;
      row.push(
        new THREE.Vector3(
          u * edge.x,
          edge.y + (1 - u * u) * 0.015,
          edge.z - (1 - u * u) * 0.025,
        ),
      );
    }
    rwGrid.push(row);
  }
  const rw = new THREE.Mesh(buildSurfaceGrid(rwGrid, true), glassMat);
  rw.renderOrder = 2;
  shellGroup.add(rw);

  ([-1, 1] as const).forEach((side) => {
    const aPts = [0, 0.25, 0.5, 0.75, 1.0].map((t) => gtrWsEdgePt(t, side));
    const aCurve = new THREE.CatmullRomCurve3(aPts, false, 'centripetal', 0.5);
    shellGroup.add(new THREE.Mesh(new THREE.TubeGeometry(aCurve, 20, 0.019, 10, false), carbonMat));

    // Shared fastback C-pillar trailing window border
    const gtrCPillarFrontPt = (f: number) => {
      const z = lerp(-1.02, -0.58, f);
      const kinkZ = Math.sin(Math.pow(1 - f, 1.3) * Math.PI) * 0.020;
      const x = lerp(gtrShoulderX(-1.02), gtrRoofSideX(-0.58), smoothstep(0, 1, f));
      const yCurve = lerp(f, Math.sin(f * Math.PI * 0.5), 0.55);
      const y = lerp(gtrBeltY(-1.02), gtrRoofSideY(-0.58), yCurve);
      return new THREE.Vector3(x * side, y, z + kinkZ);
    };

    const cGrid: THREE.Vector3[][] = [];
    for (let i = 0; i <= 14; i++) {
      const f = i / 14;
      const pFront = gtrCPillarFrontPt(f);
      const pBack = gtrRwEdgePt(f, side);
      const row: THREE.Vector3[] = [];
      for (let c = 0; c <= 4; c++) {
        const u = c / 4;
        const p = new THREE.Vector3().lerpVectors(pFront, pBack, u);
        p.x += Math.sin(u * Math.PI) * 0.008 * side * Math.sin(f * Math.PI);
        row.push(p);
      }
      cGrid.push(row);
    }
    const cSail = new THREE.Mesh(buildSurfaceGrid(cGrid, side !== 1), paintMat);
    cSail.castShadow = true;
    shellGroup.add(cSail);

    // Dark interior C-pillar cabin headliner liner
    const cTrimGrid = cGrid.map((r) =>
      r.map((pt) => new THREE.Vector3(pt.x - 0.008 * side, pt.y - 0.004, pt.z - 0.003)),
    );
    shellGroup.add(new THREE.Mesh(buildSurfaceGrid(cTrimGrid, side === 1), carbonMat));

    // Flush R35 Blackened C-Pillar Leading Edge Aero Accent strip seated cleanly ON the sail surface
    const visorPts = [0.05, 0.35, 0.65, 0.96].map((f) => {
      const pt = gtrCPillarFrontPt(f);
      return new THREE.Vector3(pt.x + 0.003 * side, pt.y, pt.z);
    });
    shellGroup.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(visorPts, false, 'centripetal', 0.5),
          20,
          0.011,
          8,
          false,
        ),
        carbonMat,
      ),
    );

    const qwGrid: THREE.Vector3[][] = [];
    for (let r = 0; r <= 6; r++) {
      const f = r / 6;
      const pBack = gtrCPillarFrontPt(f);
      const zFront = -0.35;
      const xFront = lerp(gtrShoulderX(zFront), gtrRoofSideX(zFront), f);
      const yFront = lerp(gtrBeltY(zFront), gtrRoofSideY(zFront), f);
      const pFront = new THREE.Vector3(xFront * side, yFront, zFront);
      const row: THREE.Vector3[] = [];
      for (let c = 0; c <= 8; c++) {
        const u = c / 8;
        const p = new THREE.Vector3().lerpVectors(pFront, pBack, u);
        if (r === 6) {
          p.x = gtrRoofSideX(p.z) * side;
          p.y = gtrRoofSideY(p.z);
        }
        row.push(p);
      }
      qwGrid.push(row);
    }
    const qw = new THREE.Mesh(buildSurfaceGrid(qwGrid, side === 1), glassMat);
    qw.renderOrder = 2;
    shellGroup.add(qw);
  });

  // =========================================================================
  // 3. CONTINUOUS WRAPAROUND V-MOTION FRONT FASCIA & NACA HOOD
  // =========================================================================
  const gtrFrontBumperPt = (u: number, t: number) => {
    const frontU = Math.min(1, Math.abs(u) / 0.85);
    const zTopEdge = gtrNoseZ(frontU * 0.82);
    const topY = gtrBeltY(zTopEdge) + (1 - Math.min(1, u * u)) * 0.022;
    const y = lerp(0.150, topY, t);
    const sideZ = fZ + archR * 0.99;
    const centerZ = t < 0.25 ? 2.340 : lerp(2.340, zTopEdge, (t - 0.25) / 0.75);
    const frontZ = lerp(centerZ, zTopEdge, Math.pow(frontU, 2.2));
    const cornerWrap = smoothstep(0.74, 1.0, Math.abs(u));
    const frontW = lerp(gtrOuterHalfW(frontZ) + 0.008, gtrOuterHalfW(frontZ) - 0.014, t);
    const archEdgeW = lerp(gtrOuterHalfW(sideZ), gtrShoulderX(sideZ), t * 0.60);
    const halfW = lerp(frontW, archEdgeW, cornerWrap);
    const z = lerp(frontZ, sideZ, cornerWrap);
    return new THREE.Vector3(u * halfW, y, z);
  };
  const fBumperGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 40; j++) {
      const u = cornerClusterU((j / 40) * 2 - 1, 1.5);
      row.push(gtrFrontBumperPt(u, t));
    }
    fBumperGrid.push(row);
  }
  const frontApron = new THREE.Mesh(buildSurfaceGrid(fBumperGrid, false), paintMat);
  frontApron.castShadow = true;
  shellGroup.add(frontApron);

  // Curved Matte-Carbon Chin Splitter + Signature Pinstripe Trim tucked flush
  const splitterPts: THREE.Vector3[] = [];
  const pinPts: THREE.Vector3[] = [];
  for (let j = 0; j <= 38; j++) {
    const u = cornerClusterU(lerp(-0.98, 0.98, j / 38), 1.5);
    const p = gtrFrontBumperPt(u, 0.02);
    splitterPts.push(new THREE.Vector3(p.x * 1.005, 0.145, p.z + 0.020));
    pinPts.push(new THREE.Vector3(p.x * 1.007, 0.132, p.z + 0.024));
  }
  shellGroup.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(splitterPts), 48, 0.014, 10, false),
      carbonMat,
    ),
  );
  shellGroup.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pinPts), 48, 0.006, 8, false),
      accentPinstripeMat,
    ),
  );

  // Contoured R35 Upper+Lower V-Motion Grille Cavity, Crossbar & Continuous V-Chrome Bezel
  const buildGtrFrontPatch = (
    u0: number,
    u1: number,
    t0: number,
    t1: number,
    zOff: number,
    mat: THREE.Material,
    taperWidthRatio = 1.0,
  ) => {
    const g: THREE.Vector3[][] = [];
    for (let r = 0; r <= 6; r++) {
      const f = r / 6;
      const t = lerp(t0, t1, f);
      const uMid = (u0 + u1) * 0.5;
      const halfSpan = ((u1 - u0) * 0.5) * lerp(taperWidthRatio, 1.0, f);
      const vFade = Math.sin(f * Math.PI);
      const row: THREE.Vector3[] = [];
      for (let c = 0; c <= 16; c++) {
        const fc = c / 16;
        const u = lerp(uMid - halfSpan, uMid + halfSpan, fc);
        const hFade = Math.pow(Math.sin(fc * Math.PI), 0.45);
        const p = gtrFrontBumperPt(u, t);
        row.push(new THREE.Vector3(p.x, p.y, p.z + zOff * Math.max(0.25, vFade * hFade)));
      }
      g.push(row);
    }
    shellGroup.add(new THREE.Mesh(buildSurfaceGrid(g, false), mat));
  };

  buildGtrFrontPatch(-0.42, 0.42, 0.14, 0.86, 0.006, carbonMat, 0.90);
  // Sleek R35 Satin-Carbon Bumper Crossbar separating Upper V-Grille & Lower Dam
  buildGtrFrontPatch(-0.43, 0.43, 0.45, 0.56, 0.011, carbonMat);

  // Continuous U/V-shaped Satin-Aluminum V-Motion Surround hugging the curved Upper Grille
  const vBezelPts = [
    gtrFrontBumperPt(-0.39, 0.84),
    gtrFrontBumperPt(-0.34, 0.68),
    gtrFrontBumperPt(-0.25, 0.53),
    gtrFrontBumperPt(0.0, 0.51),
    gtrFrontBumperPt(0.25, 0.53),
    gtrFrontBumperPt(0.34, 0.68),
    gtrFrontBumperPt(0.39, 0.84),
  ].map((p) => new THREE.Vector3(p.x, p.y, p.z + 0.014));
  shellGroup.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(vBezelPts), 36, 0.013, 10, false),
      chromeMat,
    ),
  );

  const frontNissan = new THREE.Mesh(new THREE.CircleGeometry(0.036, 24), nissanBadgeMat);
  frontNissan.position.set(0, 0.445, 2.346);
  shellGroup.add(frontNissan);

  const frontGtr = new THREE.Mesh(new THREE.PlaneGeometry(0.072, 0.038), gtrBadgeMat);
  frontGtr.position.set(0.18, 0.435, 2.338);
  frontGtr.rotation.y = 0.10;
  shellGroup.add(frontGtr);

  // Dark gloss optical headlight housing material (no grey blowout)
  const hlHousingMat = new THREE.MeshStandardMaterial({
    color: 0x0b0e14,
    metalness: 0.28,
    roughness: 0.35,
    side: THREE.DoubleSide,
    clippingPlanes,
  });

  ([-1, 1] as const).forEach((side) => {
    buildGtrFrontPatch(side === 1 ? 0.56 : -0.78, side === 1 ? 0.78 : -0.56, 0.16, 0.46, 0.005, carbonMat, 0.92);
    buildGtrFrontPatch(side === 1 ? 0.56 : -0.78, side === 1 ? 0.78 : -0.56, 0.42, 0.48, 0.009, drlLedMat, 0.96);

    // Swept parametric R35 multi-projector headlights seated flush along fender slope (no sharp overhang)
    const hlGrid: THREE.Vector3[][] = [];
    const drlRibbonPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 10; i++) {
      const s = i / 10;
      const z = lerp(2.14, 1.80, s);
      const taper = 0.45 + 0.55 * Math.sin(s * Math.PI);
      const xMid = lerp(0.575, 0.700, s);
      const xHalfSpan = 0.078 * taper;
      const xIn = xMid - xHalfSpan;
      const xOut = Math.min(gtrOuterHalfW(z) - 0.016, xMid + xHalfSpan);
      const yBase = gtrBeltY(z) + 0.002;
      const row: THREE.Vector3[] = [];
      for (let c = 0; c <= 4; c++) {
        const f = c / 4;
        const x = lerp(xIn, xOut, f);
        const y = lerp(yBase + 0.004, yBase - 0.018 * taper, f);
        row.push(new THREE.Vector3(x * side, y, z));
      }
      hlGrid.push(row);
      drlRibbonPts.push(new THREE.Vector3((xOut - 0.014) * side, yBase - 0.008 * taper, z));
    }
    const hlBack = new THREE.Mesh(buildSurfaceGrid(hlGrid, side === 1), hlHousingMat);
    shellGroup.add(hlBack);
    const hlGlassOverlay = new THREE.Mesh(
      buildSurfaceGrid(
        hlGrid.map((r) => r.map((pt) => new THREE.Vector3(pt.x, pt.y + 0.005, pt.z))),
        side === 1,
      ),
      headlightGlassMat,
    );
    hlGlassOverlay.renderOrder = 3;
    shellGroup.add(hlGlassOverlay);
    shellGroup.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(drlRibbonPts), 24, 0.0065, 8, false),
        drlLedMat,
      ),
    );
    [2.05, 1.97, 1.89].forEach((pz, pi) => {
      const proj = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 14), chromeMat);
      proj.position.set((0.59 + pi * 0.045) * side, gtrBeltY(pz) + 0.001, pz);
      shellGroup.add(proj);
    });
  });

  // Muscular Contoured Hood following gtrFrontBumperPt top contour cleanly (zero awning overhang!)
  const hoodGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 18; i++) {
    const tZ = i / 18;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 14; j++) {
      const u = (j / 14) * 2 - 1;
      const frontU = Math.min(1, (Math.abs(u) * 0.72) / 0.85);
      const zFront = gtrNoseZ(frontU * 0.82) + 0.002;
      const z = lerp(0.72, zFront, tZ);
      const hw = lerp(gtrShoulderX(0.72), 0.568, smoothstep(0.72, 2.28, z));
      const yC = gtrBeltY(z);
      row.push(new THREE.Vector3(u * hw, yC + (1 - u * u) * 0.020, z));
    }
    hoodGrid.push(row);
  }
  const hoodMesh = new THREE.Mesh(buildSurfaceGrid(hoodGrid, false), paintMat);
  hoodMesh.castShadow = true;
  hoodGroup.add(hoodMesh);

  ([-0.24, 0.24] as const).forEach((nx) => {
    const naca = new THREE.Mesh(
      buildBeveledBox(0.115, 0.012, 0.22, 0.014, 3),
      carbonMat,
    );
    naca.position.set(nx, gtrBeltY(1.48) + 0.014, 1.48);
    naca.rotation.x = 0.22;
    hoodGroup.add(naca);
  });

  // =========================================================================
  // 4. TRUNK, GT-R WING, WRAPAROUND KAMM-TAIL REAR, QUAD HALOS & TITANIUM QUADS
  // =========================================================================
  const trunkGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 8; i++) {
    const tZ = i / 8;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 10; j++) {
      const u = (j / 10) * 2 - 1;
      const zRear = gtrTailZ(u * 0.74) + 0.002;
      const z = lerp(zRear, -1.62, tZ);
      const hw = lerp(0.620, 0.640, tZ);
      const yC = gtrBeltY(z);
      row.push(new THREE.Vector3(u * hw, yC + (1 - u * u) * 0.014, z));
    }
    trunkGrid.push(row);
  }
  const trunkLid = new THREE.Mesh(buildSurfaceGrid(trunkGrid, false), paintMat);
  trunkLid.castShadow = true;
  trunkWingGroup.add(trunkLid);

  const gtrPylonGeo = buildSweptPylon(0.145, 0.21, 0.16, 0.030, 0.045);
  ([-0.50, 0.50] as const).forEach((wx) => {
    const stanchion = new THREE.Mesh(gtrPylonGeo, paintMat);
    stanchion.position.set(wx, 1.005, -2.14);
    trunkWingGroup.add(stanchion);
  });
  const rearWing = new THREE.Mesh(
    buildAirfoilWing(1.42, 0.24, 0.030, 0.010),
    paintMat,
  );
  rearWing.position.set(0, 1.078, -2.16);
  rearWing.rotation.x = -0.07;
  rearWing.castShadow = true;
  trunkWingGroup.add(rearWing);

  // Rear shoulders bridging seamlessly between trunk lid and outer rear quarter fenders
  ([-1, 1] as const).forEach((side) => {
    const shGrid: THREE.Vector3[][] = [];
    for (let i = 0; i <= 14; i++) {
      const z = lerp(-2.22, -1.62, i / 14);
      const xIn = lerp(0.620, 0.640, i / 14);
      const xOut = gtrShoulderX(z);
      shGrid.push([
        new THREE.Vector3(xIn * side, gtrBeltY(z), z),
        new THREE.Vector3(xOut * side, gtrBeltY(z) - 0.003, z),
      ]);
    }
    shellGroup.add(new THREE.Mesh(buildSurfaceGrid(shGrid, side !== 1), paintMat));
  });

  // Continuous Curved Rear Kamm-Tail Fascia wrapping cleanly into rear fender flanks
  const gtrRearPt = (u: number, t: number) => {
    const zTopEdge = gtrTailZ(u);
    const topY = gtrBeltY(zTopEdge) + (1 - Math.min(1, u * u)) * 0.012;
    const y = lerp(0.320, topY, t);
    const sideZ = -1.78;
    const centerZ = lerp(-2.312, zTopEdge, smoothstep(0.6, 1.0, t));
    const cornerWrap = smoothstep(0.76, 1.0, Math.abs(u));
    const archEdgeW = lerp(gtrOuterHalfW(sideZ), gtrShoulderX(sideZ), t * 0.65);
    const halfW = lerp(lerp(0.840, 0.790, t), archEdgeW, cornerWrap);
    const z = lerp(lerp(centerZ, -2.10, Math.pow(Math.min(1, Math.abs(u) / 0.85), 2.8)), sideZ, cornerWrap);
    return new THREE.Vector3(u * halfW, y, z);
  };
  const rFasciaGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 38; j++) {
      const u = cornerClusterU((j / 38) * 2 - 1, 1.5);
      row.push(gtrRearPt(u, t));
    }
    rFasciaGrid.push(row);
  }
  const rearFascia = new THREE.Mesh(buildSurfaceGrid(rFasciaGrid, true), paintMat);
  rearFascia.castShadow = true;
  shellGroup.add(rearFascia);

  // Continuous Curved Carbon Rear Venturi Diffuser tapering smoothly into lower bumper apron
  const rearDiffuserGrid: THREE.Vector3[][] = [];
  for (let r = 0; r <= 4; r++) {
    const f = r / 4;
    const t = lerp(0.0, 0.34, f);
    const y = lerp(0.150, 0.325, f);
    const row: THREE.Vector3[] = [];
    for (let c = 0; c <= 24; c++) {
      const u = lerp(-0.84, 0.84, c / 24);
      const p = gtrRearPt(u, t);
      const edgeFade = 1 - smoothstep(0.62, 0.84, Math.abs(u));
      row.push(new THREE.Vector3(p.x, y, p.z - 0.005 * edgeFade));
    }
    rearDiffuserGrid.push(row);
  }
  shellGroup.add(new THREE.Mesh(buildSurfaceGrid(rearDiffuserGrid, true), carbonMat));

  const diffFinGeo = buildSweptPylon(0.15, 0.10, 0.04, 0.014, 0.028);
  [-0.32, -0.11, 0.11, 0.32].forEach((fx) => {
    const fin = new THREE.Mesh(diffFinGeo, carbonMat);
    fin.position.set(fx, 0.228, -2.288);
    shellGroup.add(fin);
  });

  ([-1, 1] as const).forEach((side) => {
    [
      { x: 0.60 * side, r: 0.080 },
      { x: 0.40 * side, r: 0.064 },
    ].forEach((cfg) => {
      const pod = new THREE.Group();
      pod.position.set(cfg.x, 0.805, -2.285);
      pod.rotation.y = -side * 0.14;
      const housing = new THREE.Mesh(
        new THREE.CylinderGeometry(cfg.r + 0.010, cfg.r + 0.012, 0.025, 32),
        carbonMat,
      );
      housing.rotation.x = Math.PI / 2;
      pod.add(housing);
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(cfg.r * 0.84, 0.012, 14, 36),
        afterburnerHaloMat,
      );
      halo.position.z = -0.015;
      pod.add(halo);
      shellGroup.add(pod);
    });
  });

  const rearNissan = new THREE.Mesh(new THREE.CircleGeometry(0.036, 24), nissanBadgeMat);
  rearNissan.position.set(0, 0.815, -2.316);
  rearNissan.rotation.y = Math.PI;
  shellGroup.add(rearNissan);

  const rearGtr = new THREE.Mesh(new THREE.PlaneGeometry(0.095, 0.052), gtrBadgeMat);
  rearGtr.position.set(-0.56, 0.635, -2.304);
  rearGtr.rotation.y = Math.PI;
  shellGroup.add(rearGtr);

  const rearPlate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.078, 0.012), plateMat);
  rearPlate.position.set(0, 0.56, -2.318);
  rearPlate.rotation.y = Math.PI;
  shellGroup.add(rearPlate);

  // =========================================================================
  // 5. SEAMLESS DOORS & AERODYNAMIC TEARDROP GT-R MIRRORS
  // =========================================================================
  const buildDoor = (side: 1 | -1, target: THREE.Group) => {
    const dGrid: THREE.Vector3[][] = [];
    for (let i = 0; i <= 20; i++) {
      const z = lerp(-0.78, 0.72, i / 20);
      dGrid.push(gtrSideCol(z, 0.172, gtrBeltY(z), 0, null, side));
    }
    const doorSkin = new THREE.Mesh(buildSurfaceGrid(dGrid, side === 1), paintMat);
    doorSkin.castShadow = true;
    target.add(doorSkin);

    const handle = new THREE.Mesh(
      buildBeveledBox(0.016, 0.022, 0.155, 0.007, 3),
      chromeMat,
    );
    handle.position.set(0.910 * side, 0.725, -0.48);
    target.add(handle);

    const mirrorStalk = new THREE.Mesh(
      buildBeveledBox(0.075, 0.018, 0.036, 0.007, 2),
      carbonMat,
    );
    mirrorStalk.position.set(0.845 * side, 0.865, 0.54);
    target.add(mirrorStalk);

    const mirrorPod = new THREE.Mesh(new THREE.SphereGeometry(0.058, 22, 16), paintMat);
    mirrorPod.scale.set(1.05, 0.68, 0.85);
    mirrorPod.position.set(0.905 * side, 0.885, 0.53);
    target.add(mirrorPod);

    const dwGrid: THREE.Vector3[][] = [];
    for (let r = 0; r <= 6; r++) {
      const f = r / 6;
      const pFront = gtrWsEdgePt(f, side);
      const pBack = new THREE.Vector3(
        lerp(gtrShoulderX(-0.35), gtrRoofSideX(-0.35), f) * side,
        lerp(gtrBeltY(-0.35), gtrRoofSideY(-0.35), f),
        -0.35,
      );
      const row: THREE.Vector3[] = [];
      for (let c = 0; c <= 10; c++) {
        const u = c / 10;
        const p = new THREE.Vector3().lerpVectors(pFront, pBack, u);
        if (r === 6) {
          p.x = gtrRoofSideX(p.z) * side;
          p.y = gtrRoofSideY(p.z);
        }
        row.push(p);
      }
      dwGrid.push(row);
    }
    const dw = new THREE.Mesh(buildSurfaceGrid(dwGrid, side === 1), glassMat);
    dw.renderOrder = 2;
    target.add(dw);

    const dFrontPts = Array.from({ length: 7 }, (_, r) => dwGrid[r][0]);
    const dTopPts = Array.from({ length: 11 }, (_, c) => dwGrid[6][c]);
    [dFrontPts, dTopPts].forEach((segPts) => {
      target.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(segPts, false, 'centripetal', 0.5),
            16,
            0.0055,
            8,
            false,
          ),
          carbonMat,
        ),
      );
    });
  };
  buildDoor(1, leftDoorGroup);
  buildDoor(-1, rightDoorGroup);

  bodyRoot.add(shellGroup, hoodGroup, trunkWingGroup, leftDoorGroup, rightDoorGroup);

  // =========================================================================
  // 6. VR38DETT 3.8L TWIN-TURBO V6, REAR GR6 TRANSAXLE, ATTESA AWD & RAYS 20"
  // =========================================================================
  const chassisGroup = new THREE.Group();
  chassisGroup.name = 'chassis';
  const interiorGroup = new THREE.Group();
  interiorGroup.name = 'chassis';
  const transaxleGroup = new THREE.Group();
  transaxleGroup.name = 'transaxle';
  const engineRootGroup = new THREE.Group();
  engineRootGroup.name = 'engine';
  const engineBlockGroup = new THREE.Group();
  engineBlockGroup.name = 'engine';
  const engineTopGroup = new THREE.Group();
  engineTopGroup.name = 'engine';
  const exhaustGroup = new THREE.Group();
  exhaustGroup.name = 'engine';
  const frontSuspLeft = new THREE.Group();
  frontSuspLeft.name = 'chassis';
  const frontSuspRight = new THREE.Group();
  frontSuspRight.name = 'chassis';
  const rearSuspLeft = new THREE.Group();
  rearSuspLeft.name = 'chassis';
  const rearSuspRight = new THREE.Group();
  rearSuspRight.name = 'chassis';

  const floorPan = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.036, 3.12), common.steelDark);
  floorPan.position.set(0, 0.172, 0);
  chassisGroup.add(floorPan);

  const tunnel = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 2.75), common.steelDark);
  tunnel.position.set(0, 0.23, -0.10);
  chassisGroup.add(tunnel);

  const frontIntercooler = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.26, 0.075), common.aluminum);
  frontIntercooler.position.set(0, 0.32, 2.15);
  chassisGroup.add(frontIntercooler);

  const dash = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.16, 0.34), common.leatherBlack);
  dash.position.set(0, 0.68, 0.50);
  interiorGroup.add(dash);

  const mfdScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.26, 0.13),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.gtrMfdMap,
      emissive: 0x182636,
      emissiveIntensity: 0.4,
      clippingPlanes,
    }),
  );
  mfdScreen.position.set(0.02, 0.72, 0.325);
  mfdScreen.rotation.y = Math.PI;
  interiorGroup.add(mfdScreen);

  const swGroup = new THREE.Group();
  swGroup.position.set(0.38, 0.72, 0.18);
  swGroup.rotation.x = -0.24;
  swGroup.add(new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.019, 12, 32), common.leatherBlack));
  const topMarker = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.038, 0.042), accentPinstripeMat);
  topMarker.position.set(0, 0.175, 0);
  swGroup.add(topMarker);
  interiorGroup.add(swGroup);

  ([-1, 1] as const).forEach((side) => {
    const seat = new THREE.Group();
    seat.position.set(0.38 * side, 0.25, -0.28);
    seat.add(new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.10, 0.46), common.leatherBlack));
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.60, 0.10), common.leatherBlack);
    back.position.set(0, 0.32, -0.18);
    back.rotation.x = -0.22;
    seat.add(back);
    const redBolster = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.46, 0.04), common.redAccent);
    redBolster.position.set(0, 0.30, -0.14);
    redBolster.rotation.x = -0.22;
    seat.add(redBolster);
    interiorGroup.add(seat);
  });

  const springGeo = buildHelicalSpring(0.048, 0.20, 6);
  ([-1, 1] as const).forEach((side) => {
    const fg = side === 1 ? frontSuspLeft : frontSuspRight;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.032, 0.18), common.aluminum);
    arm.position.set(0.48 * side, 0.24, fZ);
    fg.add(arm);
    const dam = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.32, 12), common.bilsteinYellow);
    dam.position.set(0.62 * side, 0.42, fZ);
    fg.add(dam);
    const spr = new THREE.Mesh(springGeo, common.redAccent);
    spr.position.set(0.62 * side, 0.30, fZ);
    fg.add(spr);

    const rg = side === 1 ? rearSuspLeft : rearSuspRight;
    const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.032, 0.22), common.aluminum);
    rArm.position.set(0.50 * side, 0.25, rZ);
    rg.add(rArm);
    const rSpr = new THREE.Mesh(springGeo, common.redAccent);
    rSpr.position.set(0.60 * side, 0.28, rZ);
    rg.add(rSpr);
  });

  const engZ = 1.18;
  const engY = 0.35;
  engineBlockGroup.position.set(0, engY, engZ);
  engineTopGroup.position.set(0, engY, engZ);
  exhaustGroup.position.set(0, engY, engZ);

  const blockCore = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.38), common.aluminum);
  engineBlockGroup.add(blockCore);

  const crankshaftGroup = new THREE.Group();
  const crankMain = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.44, 14), common.steelDark);
  crankMain.rotation.x = Math.PI / 2;
  crankshaftGroup.add(crankMain);
  const pulley = new THREE.Mesh(new THREE.CylinderGeometry(0.060, 0.060, 0.026, 22), common.aluminum);
  pulley.rotation.x = Math.PI / 2;
  pulley.position.z = 0.23;
  crankshaftGroup.add(pulley);
  engineBlockGroup.add(crankshaftGroup);

  const pistonVisuals: PistonVisual[] = [];
  const half60Rad = Math.PI / 6;
  const v6Z = [0.115, 0.0, -0.115];
  [
    { num: 1, bankSign: -1 as const, zLocal: v6Z[0] + 0.012 },
    { num: 3, bankSign: -1 as const, zLocal: v6Z[1] + 0.012 },
    { num: 5, bankSign: -1 as const, zLocal: v6Z[2] + 0.012 },
    { num: 2, bankSign: 1 as const, zLocal: v6Z[0] - 0.012 },
    { num: 4, bankSign: 1 as const, zLocal: v6Z[1] - 0.012 },
    { num: 6, bankSign: 1 as const, zLocal: v6Z[2] - 0.012 },
  ].forEach((cm) => {
    pistonVisuals.push(
      buildBankedCylinderVisual({
        cylNumber: cm.num,
        bankSign: cm.bankSign,
        bankTiltRad: cm.bankSign * half60Rad,
        zLocal: cm.zLocal,
        bore: spec.engine.bore,
        crankR: spec.engine.crankRadius,
        rodLen: spec.engine.rodLength,
        blockGroup: engineBlockGroup,
        linerMat: common.cylinderLiner,
        pistonMat: common.aluminum,
        rodMat: common.steelDark,
        ringMat: common.steelDark,
        pinMat: common.chrome,
        clippingPlanes,
      }),
    );
  });

  const intakePlenum = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.095, 0.36), common.redAccent);
  intakePlenum.position.set(0, 0.27, 0);
  engineTopGroup.add(intakePlenum);

  const takumiPlaque = new THREE.Mesh(
    new THREE.PlaneGeometry(0.16, 0.065),
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: textures.takumiPlaqueMap, clippingPlanes }),
  );
  takumiPlaque.rotation.x = -Math.PI / 2;
  takumiPlaque.position.set(0, 0.319, 0.02);
  engineTopGroup.add(takumiPlaque);

  ([-1, 1] as const).forEach((s) => {
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.065, 0.38), common.steelDark);
    cover.position.set(0.16 * s, 0.21, 0);
    cover.rotation.z = -0.52 * s;
    engineTopGroup.add(cover);

    const turboCompressor = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.022, 12, 20), common.aluminum);
    turboCompressor.position.set(0.24 * s, 0.04, 0.02);
    turboCompressor.rotation.y = Math.PI / 2;
    exhaustGroup.add(turboCompressor);

    const turboTurbine = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.020, 12, 20), common.exhaustBronze);
    turboTurbine.position.set(0.24 * s, 0.04, -0.05);
    turboTurbine.rotation.y = Math.PI / 2;
    exhaustGroup.add(turboTurbine);

    const chargePipe = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.24 * s, 0.08, 0.08),
      new THREE.Vector3(0.28 * s, 0.05, 0.56),
      new THREE.Vector3(0.32 * s, -0.02, 0.94),
    ]);
    engineTopGroup.add(
      new THREE.Mesh(new THREE.TubeGeometry(chargePipe, 14, 0.024, 10, false), common.chrome),
    );

    const downpipe = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.23 * s, 0.02, -0.10),
      new THREE.Vector3(0.14 * s, -0.16, -0.35),
      new THREE.Vector3(0.12 * s, -0.17, -2.95),
    ]);
    exhaustGroup.add(
      new THREE.Mesh(new THREE.TubeGeometry(downpipe, 16, 0.026, 10, false), common.exhaustTitanium),
    );

    // Dual matte-dark rear mufflers tucked neatly inside underbody tunnel ahead of rear apron
    const muffler = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.32, 16), common.steelDark);
    muffler.rotation.x = Math.PI / 2;
    muffler.position.set(0.45 * s, -0.12, -3.14);
    exhaustGroup.add(muffler);

    [-0.068, 0.068].forEach((txOff) => {
      const tipOuter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.054, 0.054, 0.16, 18),
        common.burntBlueTip,
      );
      tipOuter.rotation.x = Math.PI / 2;
      tipOuter.position.set(0.46 * s + txOff, -0.12, -3.44);
      exhaustGroup.add(tipOuter);

      const bore = new THREE.Mesh(new THREE.CircleGeometry(0.046, 16), common.leatherBlack);
      bore.rotation.y = Math.PI;
      bore.position.set(0.46 * s + txOff, -0.12, -3.522);
      exhaustGroup.add(bore);
    });
  });

  engineRootGroup.add(engineBlockGroup, engineTopGroup, exhaustGroup);

  const gr6Transaxle = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.64), common.magnesium);
  gr6Transaxle.position.set(0, 0.30, rZ - 0.10);
  transaxleGroup.add(gr6Transaxle);

  const carbonDriveshaft = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 2.38, 12), carbonMat);
  carbonDriveshaft.rotation.x = Math.PI / 2;
  carbonDriveshaft.position.set(0, 0.28, -0.10);
  transaxleGroup.add(carbonDriveshaft);

  const frontReturnShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 2.48, 10),
    common.chrome,
  );
  frontReturnShaft.rotation.x = Math.PI / 2;
  frontReturnShaft.position.set(-0.11, 0.27, 0.02);
  transaxleGroup.add(frontReturnShaft);

  const frontDiff = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.24), common.aluminum);
  frontDiff.position.set(-0.08, 0.28, fZ - 0.06);
  transaxleGroup.add(frontDiff);

  ([-1, 1] as const).forEach((s) => {
    const rShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.62, 10), common.steelDark);
    rShaft.rotation.z = Math.PI / 2;
    rShaft.position.set(0.46 * s, 0.31, rZ);
    transaxleGroup.add(rShaft);

    const fShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.58, 10), common.steelDark);
    fShaft.rotation.z = Math.PI / 2;
    fShaft.position.set(0.44 * s, 0.29, fZ);
    transaxleGroup.add(fShaft);
  });

  // =========================================================================
  // 7. 20" RAYS FORGED WHEELS & 390MM BREMBO GOLD BRAKES
  // =========================================================================
  const wheels: WheelAssembly[] = [];
  ([
    { sideSign: 1 as const, isFront: true },
    { sideSign: -1 as const, isFront: true },
    { sideSign: 1 as const, isFront: false },
    { sideSign: -1 as const, isFront: false },
  ]).forEach(({ sideSign, isFront }) => {
    const outerR = isFront ? spec.frontTireRadius : spec.rearTireRadius;
    const width = isFront ? spec.frontTireWidth : spec.rearTireWidth;
    const rimR = spec.wheelRimDiameter * 0.5;
    const trackHalf = (isFront ? spec.frontTrack : spec.rearTrack) * 0.5;
    const zPos = isFront ? fZ : rZ;

    const wheelGroup = new THREE.Group();
    wheelGroup.name = 'wheels';
    wheelGroup.position.set(trackHalf * sideSign, outerR, zPos);

    const tire = new THREE.Mesh(buildTireProfile(outerR, rimR, width), common.tire);
    tire.castShadow = true;
    wheelGroup.add(tire);

    wheelGroup.add(new THREE.Mesh(buildDeepDishRimLip(rimR, width, sideSign, 0.78), raysWheelMat));

    const raysSpokeGeo = buildBeveledBox(0.015, rimR * 0.90, 0.012, 0.004, 2);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      [-0.24, 0.24].forEach((split) => {
        const spoke = new THREE.Mesh(raysSpokeGeo, raysWheelMat);
        spoke.position.set(
          width * 0.22 * sideSign,
          Math.cos(a + split * 0.5) * rimR * 0.46,
          Math.sin(a + split * 0.5) * rimR * 0.46,
        );
        spoke.rotation.x = a + split;
        wheelGroup.add(spoke);
      });
    }

    const centerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.044, 0.022, 24), raysWheelMat);
    centerCap.rotation.z = Math.PI / 2;
    centerCap.position.x = width * 0.23 * sideSign;
    wheelGroup.add(centerCap);

    const capLogo = new THREE.Mesh(new THREE.CircleGeometry(0.022, 24), nissanBadgeMat);
    capLogo.rotation.y = sideSign === 1 ? Math.PI / 2 : -Math.PI / 2;
    capLogo.position.x = (width * 0.23 + 0.012) * sideSign;
    wheelGroup.add(capLogo);

    const hubBrakeGroup = new THREE.Group();
    hubBrakeGroup.name = 'wheels';
    hubBrakeGroup.position.set((trackHalf - 0.04) * sideSign, outerR, zPos);

    const discR = (isFront ? spec.frontDiscDiameter : spec.rearDiscDiameter) * 0.5;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(discR, discR, 0.030, 36), common.disc);
    disc.rotation.z = Math.PI / 2;
    hubBrakeGroup.add(disc);

    const caliper = new THREE.Mesh(
      buildBeveledBox(0.072, 0.135, 0.165, 0.016, 3),
      common.goldCalipers,
    );
    caliper.position.set(0, 0.02, isFront ? -discR * 0.72 : discR * 0.72);
    hubBrakeGroup.add(caliper);

    root.add(wheelGroup, hubBrakeGroup);
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

  root.add(
    bodyRoot,
    chassisGroup,
    interiorGroup,
    transaxleGroup,
    frontSuspLeft,
    frontSuspRight,
    rearSuspLeft,
    rearSuspRight,
    engineRootGroup,
  );

  const applyExplodePose = (p: TeardownPose) => {
    const shellLift = p.bodyLiftY * 1.65;
    shellGroup.position.set(0, shellLift, 0);
    hoodGroup.position.set(0, shellLift + p.hoodLiftY * 1.55, p.hoodForwardZ * 1.35);
    hoodGroup.rotation.x = p.hoodTiltX;
    trunkWingGroup.position.set(0, shellLift + p.ducktailLiftY, p.ducktailBackZ);
    trunkWingGroup.rotation.x = p.ducktailTiltX;
    leftDoorGroup.position.set(p.doorOutX * 1.15, shellLift * 0.85, 0);
    rightDoorGroup.position.set(-p.doorOutX * 1.15, shellLift * 0.85, 0);

    interiorGroup.position.set(0, p.interiorLiftY * 0.75, 0);
    transaxleGroup.position.set(0, 0, p.transaxleBackZ);

    engineBlockGroup.position.z = engZ;
    engineTopGroup.position.set(0, engY + p.engineShroudLiftY * 0.50, engZ);
    exhaustGroup.position.set(0, engY + p.exhaustDropY, engZ);

    frontSuspLeft.position.x = p.suspensionOutX;
    frontSuspRight.position.x = -p.suspensionOutX;
    rearSuspLeft.position.x = p.suspensionOutX;
    rearSuspRight.position.x = -p.suspensionOutX;

    wheels.forEach((w) => {
      w.wheelGroup.position.x = w.baseX + w.sideSign * p.wheelOutX;
      w.hubBrakeGroup.position.x =
        w.baseX - 0.04 * w.sideSign + w.sideSign * (p.wheelOutX * 0.55);
    });
  };

  return {
    root,
    bodyRoot,
    wheels,
    subsystemGroups: {
      body: [bodyRoot],
      chassis: [
        chassisGroup,
        interiorGroup,
        frontSuspLeft,
        frontSuspRight,
        rearSuspLeft,
        rearSuspRight,
      ],
      transaxle: [transaxleGroup],
      engine: [engineRootGroup],
      wheels: wheels.flatMap((w) => [w.wheelGroup, w.hubBrakeGroup]),
    },
    fadeableBodyMaterials: [
      paintMat,
      carbonMat,
      chromeMat,
      accentPinstripeMat,
      plateMat,
    ],
    glassMaterials: [glassMat],
    lensMaterials: [headlightGlassMat, drlLedMat, afterburnerHaloMat],
    decalMaterials: [nissanBadgeMat, gtrBadgeMat],
    applyExplodePose,
    updateKinematics: (kin: EngineKinematics, wheelSpinRad: number) => {
      crankshaftGroup.rotation.z = kin.crankRad;
      updateBankedPistons(pistonVisuals, kin, spec.engine.crankRadius);
      for (let i = 0; i < wheels.length; i++) {
        wheels[i].wheelGroup.rotation.x = wheelSpinRad;
      }
    },
    setLivery: (livery: LiverySpec) => {
      paintMat.color.set(livery.bodyHex);
      accentPinstripeMat.color.set(livery.scriptHex);
      raysWheelMat.color.set(livery.wheelAccentHex);
    },
    setEngineXray: (xray: boolean) => {
      common.cylinderLiner.transparent = xray;
      common.cylinderLiner.opacity = xray ? 0.28 : 1.0;
      common.cylinderLiner.depthWrite = !xray;
      common.cylinderLiner.needsUpdate = true;
    },
  };
}
