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
  buildRoundedRingGeo,
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
 * 1990 BMW M3 Sport Evolution (E30 Vintage Edition)
 * Continuous box-flared SMC bodywork, shark-nose twin kidneys & quad round headlamps,
 * wraparound Sport Evo bumper with adjustable splitter & brake cooling ducts, raised trunk
 * with bi-plane wing, S14B25 2.5L Inline-4 with ITBs, Getrag 265/5 & 16" BBS basketweaves.
 */
export function buildBmwE30M3Car(
  textures: ProceduralTextures,
  isSoftwareGl: boolean,
  clippingPlanes: THREE.Plane[],
): CarRig {
  const spec = VEHICLES['bmw-e30-m3'];
  const root = new THREE.Group();
  root.name = 'bmw_e30_m3_root';

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
    color: 0x181a1e,
    metalness: 0.14,
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.035,
    envMapIntensity: 1.48,
    side: THREE.DoubleSide,
    clippingPlanes,
  });
  const trimBlackMat = new THREE.MeshStandardMaterial({
    color: 0x16181c,
    metalness: 0.14,
    roughness: 0.65,
    side: THREE.DoubleSide,
    clippingPlanes,
  });
  const bumperStripeMat = new THREE.MeshStandardMaterial({
    color: 0xd61c2c,
    roughness: 0.34,
    metalness: 0.08,
    clippingPlanes,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xeef3f8,
    metalness: 0.96,
    roughness: 0.08,
    envMapIntensity: 1.45,
    side: THREE.DoubleSide,
    clippingPlanes,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a232d,
    metalness: 0.04,
    roughness: 0.04,
    transmission: isSoftwareGl ? 0 : 0.52,
    transparent: true,
    opacity: isSoftwareGl ? 0.45 : 0.46,
    clearcoat: 1.0,
    depthWrite: false,
    side: THREE.DoubleSide,
    clippingPlanes,
  });
  const headlightGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4f8ff,
    map: textures.headlightFresnelMap,
    metalness: 0.06,
    roughness: 0.06,
    transparent: true,
    opacity: 0.44,
    clearcoat: 1.0,
    depthWrite: false,
    clippingPlanes,
  });
  const amberLensMat = new THREE.MeshStandardMaterial({
    color: 0xec8212,
    emissive: 0x622800,
    emissiveIntensity: 0.44,
    bumpMap: textures.taillightBump,
    bumpScale: 0.004,
    roughness: 0.16,
    clippingPlanes,
  });
  const redLensMat = new THREE.MeshStandardMaterial({
    color: 0xc41422,
    emissive: 0x52060a,
    emissiveIntensity: 0.45,
    bumpMap: textures.taillightBump,
    bumpScale: 0.004,
    roughness: 0.16,
    clippingPlanes,
  });
  const whiteLensMat = new THREE.MeshStandardMaterial({
    color: 0xf1f3f6,
    roughness: 0.18,
    clippingPlanes,
  });
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.createPlateMap('M · EVO 25'),
    roughness: 0.42,
    metalness: 0.08,
    clippingPlanes,
  });
  const roundelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.bmwRoundelMap,
    transparent: true,
    alphaTest: 0.08,
    metalness: 0.45,
    roughness: 0.25,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    clippingPlanes,
  });
  const mBadgeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.bmwM3BadgeMap,
    transparent: true,
    alphaTest: 0.08,
    roughness: 0.28,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    clippingPlanes,
  });
  const wheelCenterMat = new THREE.MeshStandardMaterial({
    color: 0x6c727d,
    metalness: 0.78,
    roughness: 0.26,
    envMapIntensity: 1.35,
    clippingPlanes,
  });

  const fZ = spec.frontAxleZ; // +1.2825
  const rZ = spec.rearAxleZ; // -1.2825
  const archR = 0.332;

  const e30BeltY = (z: number) =>
    catmullY(
      [
        [-2.08, 0.870],
        [-1.60, 0.862],
        [-1.28, 0.855],
        [-0.78, 0.786],
        [0.0, 0.778],
        [0.74, 0.768],
        [1.28, 0.752],
        [1.78, 0.708],
        [2.08, 0.652],
      ],
      z,
    );

  // Seamless door-to-fender base width + soft aerodynamic box-flare swells returning to 0 at door seams
  const e30BaseHalfW = (z: number) =>
    0.756 - 0.036 * smoothstep(1.88, 2.09, z) - 0.038 * smoothstep(-1.86, -2.09, z);

  const e30FlareOffset = (z: number) => {
    const fMask =
      Math.exp(-Math.pow((z - fZ) / 0.24, 2)) *
      (1 - smoothstep(1.80, 2.02, z)) *
      smoothstep(0.79, 0.98, z);
    const rMask =
      Math.exp(-Math.pow((z - rZ) / 0.26, 2)) *
      (1 - smoothstep(-1.82, -2.02, z)) *
      smoothstep(-0.84, -1.04, z);
    return (fMask + rMask) * 0.068;
  };

  const e30OuterHalfW = (z: number) => e30BaseHalfW(z) + e30FlareOffset(z);
  const e30ShoulderX = (z: number) => e30BaseHalfW(z) - 0.054;
  // Curved E30 nose & tail edge functions shared identically by grille, hood, fenders & trunk
  const e30NoseZ = (u: number) => lerp(2.095, 1.880, Math.pow(Math.min(1, Math.abs(u)), 2.8));
  const e30TailZ = (u: number) => lerp(-2.095, -1.945, Math.pow(Math.min(1, Math.abs(u)), 2.8));

  // Shared flank cross-section so front fender, door, sill & rear quarter align identically at seams
  const e30SideCol = (
    z: number,
    bottomY: number,
    topY: number,
    flareBlend: number,
    innerDeckX: number | null,
    side: 1 | -1,
  ): THREE.Vector3[] => {
    const maxW = e30OuterHalfW(z);
    const shX = e30ShoulderX(z);
    const shoulderY = lerp(bottomY, topY, 0.74);
    const crownX = lerp(shX, maxW + 0.004 * flareBlend, 0.46);
    const col = [
      new THREE.Vector3(maxW * side, bottomY, z),
      new THREE.Vector3((maxW + 0.004 * flareBlend) * side, lerp(bottomY, shoulderY, 0.25), z),
      new THREE.Vector3((maxW + 0.006 * flareBlend) * side, lerp(bottomY, shoulderY, 0.52), z),
      new THREE.Vector3((maxW + 0.007 * flareBlend) * side, shoulderY, z),
      new THREE.Vector3((maxW + 0.004 * flareBlend) * side, lerp(shoulderY, topY, 0.42), z),
      new THREE.Vector3(crownX * side, lerp(shoulderY, topY, 0.70), z),
      new THREE.Vector3(lerp(crownX, shX, 0.55) * side, lerp(shoulderY, topY, 0.88), z),
      new THREE.Vector3(shX * side, topY, z),
    ];
    if (innerDeckX !== null) {
      col.push(new THREE.Vector3(innerDeckX * side, topY - 0.004, z));
    }
    return col;
  };

  const e30FenderRowAtZ = (z: number, side: 1 | -1, axleZ: number, wheelY: number, isFront: boolean) => {
    const innerX = isFront
      ? lerp(0.650, 0.560, smoothstep(0.74, 2.08, z))
      : lerp(0.680, 0.578, smoothstep(-0.78, -2.08, z));
    const topY = e30BeltY(z);
    const archY = wheelArchHeight(z, axleZ, wheelY, archR);
    let bottomY = 0.175;
    if (isFront && z > axleZ + archR * 0.72) {
      bottomY = lerp(0.175, 0.442, smoothstep(axleZ + archR * 0.72, 1.66, z));
    } else if (!isFront && z < axleZ - archR * 0.72) {
      bottomY = lerp(0.175, 0.445, smoothstep(axleZ - archR * 0.72, -1.66, z));
    }
    const flareBlend = 1 - smoothstep(archR * 0.85, archR * 1.18, Math.abs(z - axleZ));
    if (archY !== null) {
      bottomY = Math.max(bottomY, archY - 0.004);
    }
    bottomY = Math.min(bottomY, topY - 0.015);
    return e30SideCol(z, bottomY, topY, flareBlend, innerX - 0.010, side);
  };

  // =========================================================================
  // 1. SEAMLESS E30 BOX-FLARED FENDERS & ROCKER SILLS
  // =========================================================================
  const buildE30Fender = (
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
          const uNom = lerp(0.98, 0.78, smoothstep(0.15, 1.0, k / 8));
          const zTail = Math.min(zArchEdge - 0.06, e30TailZ(uNom) + 0.002);
          const zCol = lerp(zTail, zArchEdge, s);
          row.push(e30FenderRowAtZ(zCol, side, axleZ, wheelY, false)[k]);
        }
        grid.push(row);
      }
    }

    const archSpanStart = isFront ? zA : zArchEdge;
    const archSpanEnd = isFront ? zArchEdge : zB;
    const zSamples = sampleArchZ(archSpanStart, archSpanEnd, axleZ, archR, 12, 34);
    for (let i = 0; i < zSamples.length; i++) {
      grid.push(e30FenderRowAtZ(zSamples[i], side, axleZ, wheelY, isFront));
    }

    if (isFront) {
      for (let i = 1; i <= capSteps; i++) {
        const s = i / capSteps;
        const row: THREE.Vector3[] = [];
        for (let k = 0; k <= 8; k++) {
          const uNom = lerp(0.98, 0.78, smoothstep(0.15, 1.0, k / 8));
          const zNose = Math.max(zArchEdge + 0.06, e30NoseZ(uNom) - 0.002);
          const zCol = lerp(zArchEdge, zNose, s);
          row.push(e30FenderRowAtZ(zCol, side, axleZ, wheelY, true)[k]);
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
      outerXFn: e30OuterHalfW,
      innerX: 0.51,
      maxRoofYFn: e30BeltY,
      linerMat: trimBlackMat,
      lipMat: paintMat,
    });
  };

  ([-1, 1] as const).forEach((side) => {
    buildE30Fender(0.73, 2.02, 48, side, fZ, spec.frontTireRadius, true);
    buildE30Fender(-2.03, -0.78, 48, side, rZ, spec.rearTireRadius, false);

    const sillGrid: THREE.Vector3[][] = [];
    for (let i = 0; i <= 18; i++) {
      const z = lerp(-0.80, 0.75, i / 18);
      const w = e30BaseHalfW(z);
      sillGrid.push([
        new THREE.Vector3((w - 0.065) * side, 0.175, z),
        new THREE.Vector3((w - 0.012) * side, 0.176, z),
        new THREE.Vector3(w * side, 0.215, z),
        new THREE.Vector3(w * side, 0.305, z),
      ]);
    }
    const sill = new THREE.Mesh(buildSurfaceGrid(sillGrid, side === 1), paintMat);
    sill.castShadow = true;
    shellGroup.add(sill);

    const rubStrip = new THREE.Mesh(
      buildBeveledBox(0.018, 0.022, 1.50, 0.007, 3),
      trimBlackMat,
    );
    rubStrip.position.set(0.756 * side, 0.545, -0.02);
    shellGroup.add(rubStrip);
  });

  // =========================================================================
  // 2. FASTBACK / THREE-BOX GREENHOUSE, FLUSH GLASS & SEALED C-PILLAR SAIL
  // =========================================================================
  const e30WsEdgePt = (t: number, side: 1 | -1) => {
    const z = lerp(0.74, 0.28, t);
    const hw = lerp(e30ShoulderX(0.74), 0.562, t);
    const y = lerp(0.768, 1.318, t) + Math.sin(t * Math.PI) * 0.012;
    return new THREE.Vector3(hw * side, y, z);
  };
  const e30RwEdgePt = (t: number, side: 1 | -1) => {
    const z = lerp(-1.34, -0.58, t);
    const hw = lerp(0.578, 0.562, t);
    const y = lerp(0.870, 1.320, t) + Math.sin(t * Math.PI) * 0.016;
    return new THREE.Vector3(hw * side, y, z);
  };
  const e30RoofSideY = (z: number) =>
    catmullY(
      [
        [-0.58, 1.320],
        [-0.36, 1.352],
        [-0.10, 1.365],
        [0.12, 1.348],
        [0.28, 1.318],
      ],
      z,
    );

  const roofGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 16; i++) {
    const z = lerp(-0.58, 0.28, i / 16);
    const yPeak = e30RoofSideY(z);
    const hw = 0.562;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 12; j++) {
      const u = (j / 12) * 2 - 1;
      row.push(new THREE.Vector3(u * hw, yPeak + (1 - u * u) * 0.016, z));
    }
    roofGrid.push(row);
  }
  const roofMesh = new THREE.Mesh(buildSurfaceGrid(roofGrid, false), paintMat);
  roofMesh.castShadow = true;
  shellGroup.add(roofMesh);

  const headlinerGrid = roofGrid.map((row) =>
    row.map((p) => new THREE.Vector3(p.x * 0.96, p.y - 0.012, p.z)),
  );
  shellGroup.add(new THREE.Mesh(buildSurfaceGrid(headlinerGrid, true), trimBlackMat));

  const wsGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const edge = e30WsEdgePt(t, 1);
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 12; j++) {
      const u = (j / 12) * 2 - 1;
      row.push(
        new THREE.Vector3(
          u * edge.x,
          edge.y + (1 - u * u) * 0.014,
          edge.z + (1 - u * u) * 0.032,
        ),
      );
    }
    wsGrid.push(row);
  }
  const wsMesh = new THREE.Mesh(buildSurfaceGrid(wsGrid, false), glassMat);
  wsMesh.renderOrder = 2;
  shellGroup.add(wsMesh);

  [-0.24, 0.16].forEach((wx) => {
    const wiper = new THREE.Mesh(buildBeveledBox(0.42, 0.008, 0.012, 0.003, 2), trimBlackMat);
    wiper.position.set(wx, 0.788, 0.73);
    wiper.rotation.y = 0.08;
    wiper.rotation.z = -0.06;
    shellGroup.add(wiper);
  });

  const rwGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const edge = e30RwEdgePt(t, 1);
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 12; j++) {
      const u = (j / 12) * 2 - 1;
      row.push(
        new THREE.Vector3(
          u * edge.x,
          edge.y + (1 - u * u) * 0.014,
          edge.z - (1 - u * u) * 0.018,
        ),
      );
    }
    rwGrid.push(row);
  }
  const rwMesh = new THREE.Mesh(buildSurfaceGrid(rwGrid, true), glassMat);
  rwMesh.renderOrder = 2;
  shellGroup.add(rwMesh);

  ([-1, 1] as const).forEach((side) => {
    const aPts = [0, 0.25, 0.5, 0.75, 1.0].map((t) => e30WsEdgePt(t, side));
    const aCurve = new THREE.CatmullRomCurve3(aPts, false, 'centripetal', 0.5);
    shellGroup.add(new THREE.Mesh(new THREE.TubeGeometry(aCurve, 20, 0.016, 10, false), paintMat));

    const bCurve = new THREE.LineCurve3(
      new THREE.Vector3(e30ShoulderX(-0.22) * side, e30BeltY(-0.22), -0.22),
      new THREE.Vector3(0.562 * side, e30RoofSideY(-0.22) - 0.004, -0.22),
    );
    shellGroup.add(new THREE.Mesh(new THREE.TubeGeometry(bCurve, 6, 0.013, 10, false), trimBlackMat));

    // Shared Hofmeister-kink trailing curve between rear quarter window and C-pillar
    const e30CPillarFrontPt = (f: number) => {
      // f=0: beltline at z=-0.84 -> f=1: roof header at z=-0.58
      const z = lerp(-0.84, -0.58, f);
      const xB = e30ShoulderX(-0.84);
      const xT = 0.562;
      const kinkZ = Math.sin(Math.pow(1 - f, 1.3) * Math.PI) * 0.022;
      const x = lerp(xB, xT, smoothstep(0, 1, f));
      const yCurve = lerp(f, Math.sin(f * Math.PI * 0.5), 0.55);
      const y = lerp(e30BeltY(-0.84), e30RoofSideY(-0.58), yCurve);
      return new THREE.Vector3(x * side, y, z + kinkZ);
    };

    // Sculpted C-pillar sail following exact curved rear window edge & Hofmeister kink
    const cPillarGrid: THREE.Vector3[][] = [];
    for (let i = 0; i <= 14; i++) {
      const f = i / 14;
      const pFront = e30CPillarFrontPt(f);
      const pBack = e30RwEdgePt(f, side);
      const row: THREE.Vector3[] = [];
      for (let c = 0; c <= 4; c++) {
        const u = c / 4;
        const p = new THREE.Vector3().lerpVectors(pFront, pBack, u);
        p.x += Math.sin(u * Math.PI) * 0.008 * side * Math.sin(f * Math.PI);
        row.push(p);
      }
      cPillarGrid.push(row);
    }
    const cPillar = new THREE.Mesh(buildSurfaceGrid(cPillarGrid, side !== 1), paintMat);
    cPillar.castShadow = true;
    shellGroup.add(cPillar);

    // Matte charcoal interior C-pillar headliner trim
    const cTrimGrid = cPillarGrid.map((r) =>
      r.map((pt) => new THREE.Vector3(pt.x - 0.008 * side, pt.y - 0.004, pt.z - 0.003)),
    );
    shellGroup.add(new THREE.Mesh(buildSurfaceGrid(cTrimGrid, side === 1), trimBlackMat));

    // Smooth curved Rear Quarter Glass + Hofmeister surround (split top/rear trims so splines never overshoot corners)
    const qwGrid: THREE.Vector3[][] = [];
    for (let r = 0; r <= 6; r++) {
      const f = r / 6;
      const pBack = e30CPillarFrontPt(f);
      const zFront = -0.22;
      const xFront = lerp(e30ShoulderX(zFront), 0.562, f);
      const yFront = lerp(e30BeltY(zFront), e30RoofSideY(zFront), f);
      const pFront = new THREE.Vector3(xFront * side, yFront, zFront);
      const row: THREE.Vector3[] = [];
      for (let c = 0; c <= 8; c++) {
        const u = c / 8;
        const p = new THREE.Vector3().lerpVectors(pFront, pBack, u);
        if (r === 6) {
          p.y = e30RoofSideY(p.z);
        }
        row.push(p);
      }
      qwGrid.push(row);
    }
    const qWin = new THREE.Mesh(buildSurfaceGrid(qwGrid, side === 1), glassMat);
    qWin.renderOrder = 2;
    shellGroup.add(qWin);

    const qTopPts = Array.from({ length: 9 }, (_, c) => qwGrid[6][c]);
    const qRearPts = Array.from({ length: 7 }, (_, r) => qwGrid[6 - r][8]);
    [qTopPts, qRearPts].forEach((segPts) => {
      shellGroup.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(segPts, false, 'centripetal', 0.5),
            16,
            0.0058,
            8,
            false,
          ),
          trimBlackMat,
        ),
      );
    });
  });

  // =========================================================================
  // 3. CONTINUOUS WRAPAROUND E30 SHARK-NOSE GRILLE, BUMPERS & SPLITTER
  // =========================================================================
  const frontGrilleGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 30; j++) {
      const u = cornerClusterU((j / 30) * 2 - 1, 1.45);
      const zBase = e30NoseZ(u) + lerp(-0.002, 0.004, t);
      const topEdgeY = e30BeltY(zBase) + (1 - Math.min(1, u * u)) * 0.016;
      const y = lerp(0.448, topEdgeY, t);
      const hw = lerp(e30OuterHalfW(zBase), e30ShoulderX(zBase) + 0.016, t);
      row.push(new THREE.Vector3(u * hw, y, zBase));
    }
    frontGrilleGrid.push(row);
  }
  shellGroup.add(new THREE.Mesh(buildSurfaceGrid(frontGrilleGrid, false), trimBlackMat));

  // Horizontal slat lines & Twin Chrome BMW Kidney Grilles (smooth rounded rings + vertical slats)
  for (let s = -2; s <= 2; s++) {
    const slatPts: THREE.Vector3[] = [];
    const y = 0.548 + s * 0.025;
    const t = (y - 0.448) / 0.198;
    for (let j = 0; j <= 20; j++) {
      const u = cornerClusterU((j / 20) * 2 - 1, 1.4);
      const zS = e30NoseZ(u) + lerp(-0.001, 0.007, t);
      slatPts.push(new THREE.Vector3(u * 0.712, y, zS));
    }
    shellGroup.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(slatPts), 28, 0.0028, 8, false),
        trimBlackMat,
      ),
    );
  }

  const kidneyRingGeo = buildRoundedRingGeo(0.116, 0.190, 0.018, 0.022, 0.010);
  const kidneyBackGeo = buildBeveledBox(0.098, 0.172, 0.014, 0.014, 2);
  const kidneySlatGeo = buildBeveledBox(0.005, 0.162, 0.012, 0.002, 2);
  ([-0.068, 0.068] as const).forEach((kx) => {
    const kFrame = new THREE.Mesh(kidneyRingGeo, chromeMat);
    kFrame.position.set(kx, 0.548, 2.099);
    kFrame.rotation.x = 0.10;
    shellGroup.add(kFrame);
    const kInner = new THREE.Mesh(kidneyBackGeo, trimBlackMat);
    kInner.position.set(kx, 0.548, 2.097);
    kInner.rotation.x = 0.10;
    shellGroup.add(kInner);
    for (let si = -3; si <= 3; si++) {
      const bar = new THREE.Mesh(kidneySlatGeo, trimBlackMat);
      bar.position.set(kx + si * 0.012, 0.548, 2.104);
      bar.rotation.x = 0.10;
      shellGroup.add(bar);
    }
  });

  // Quad Round Halogen Headlights seated tangent to curved grille surface
  ([-1, 1] as const).forEach((side) => {
    [0.378, 0.525].forEach((ox, idx) => {
      const u = (ox * side) / 0.724;
      const hz = e30NoseZ(u) + 0.015;
      const hl = new THREE.Group();
      hl.position.set(ox * side, 0.556, hz);
      hl.rotation.x = 0.08;
      hl.rotation.y = side * (idx === 0 ? 0.22 : 0.34);
      hl.add(new THREE.Mesh(new THREE.TorusGeometry(0.064, 0.008, 14, 36), chromeMat));
      const refl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.060, 0.025, 0.024, 32),
        new THREE.MeshStandardMaterial({ color: 0x56606d, metalness: 0.92, roughness: 0.15, clippingPlanes }),
      );
      refl.rotation.x = Math.PI / 2;
      refl.position.z = -0.01;
      hl.add(refl);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.060, 32), headlightGlassMat);
      lens.position.z = 0.004;
      hl.add(lens);
      shellGroup.add(hl);
    });
  });

  // Continuous Wraparound Sport Evo Front Bumper & Lower Spoiler sweeping seamlessly around corners to arch
  const e30FrontBumperPt = (u: number, t: number) => {
    const y = lerp(0.175, 0.452, t);
    const sideZ = fZ + archR * 0.99;
    const centerZ = t < 0.25 ? 2.125 : lerp(2.125, 2.142, Math.sin(((t - 0.25) / 0.75) * Math.PI));
    const frontEdgeZ = lerp(centerZ, 1.90, Math.pow(Math.min(1, Math.abs(u) / 0.88), 2.5));
    const cornerWrap = smoothstep(0.76, 1.0, Math.abs(u));
    const frontW = lerp(e30OuterHalfW(frontEdgeZ) + 0.004, e30OuterHalfW(frontEdgeZ) - 0.010, t);
    const halfW = lerp(frontW, e30OuterHalfW(sideZ), cornerWrap);
    const z = lerp(frontEdgeZ, sideZ, cornerWrap);
    return new THREE.Vector3(u * halfW, y, z);
  };

  const frontBumperGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 36; j++) {
      const u = cornerClusterU((j / 36) * 2 - 1, 1.5);
      row.push(e30FrontBumperPt(u, t));
    }
    frontBumperGrid.push(row);
  }
  const fBumperMesh = new THREE.Mesh(buildSurfaceGrid(frontBumperGrid, false), paintMat);
  fBumperMesh.castShadow = true;
  shellGroup.add(fBumperMesh);

  // Sport Evo Red/Black Wraparound Bumper Accent Stripe + Curved Lower Splitter tucked flush to bumper
  const frontAccentPts: THREE.Vector3[] = [];
  const frontSplitterPts: THREE.Vector3[] = [];
  for (let j = 0; j <= 36; j++) {
    const u = cornerClusterU(lerp(-0.98, 0.98, j / 36), 1.5);
    const pA = e30FrontBumperPt(u, 0.88);
    frontAccentPts.push(new THREE.Vector3(pA.x * 1.003, pA.y, pA.z + 0.004));
    const pS = e30FrontBumperPt(u, 0.04);
    frontSplitterPts.push(new THREE.Vector3(pS.x * 1.005, 0.165, pS.z + 0.020));
  }
  shellGroup.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(frontAccentPts), 44, 0.0065, 10, false),
      bumperStripeMat,
    ),
  );
  shellGroup.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(frontSplitterPts), 44, 0.013, 10, false),
      trimBlackMat,
    ),
  );

  // Contoured oil-cooler intake, brake cooling ducts & flush amber turn signals hugging curved E30 apron
  const buildE30BumperPatch = (
    u0: number,
    u1: number,
    t0: number,
    t1: number,
    zOff: number,
    mat: THREE.Material,
  ) => {
    const g: THREE.Vector3[][] = [];
    for (let r = 0; r <= 4; r++) {
      const t = lerp(t0, t1, r / 4);
      const row: THREE.Vector3[] = [];
      for (let c = 0; c <= 12; c++) {
        const u = lerp(u0, u1, c / 12);
        const p = e30FrontBumperPt(u, t);
        row.push(new THREE.Vector3(p.x, p.y, p.z + zOff));
      }
      g.push(row);
    }
    shellGroup.add(new THREE.Mesh(buildSurfaceGrid(g, false), mat));
  };

  buildE30BumperPatch(-0.37, 0.37, 0.14, 0.36, 0.005, trimBlackMat);
  ([-1, 1] as const).forEach((side) => {
    buildE30BumperPatch(side === 1 ? 0.55 : -0.76, side === 1 ? 0.76 : -0.55, 0.15, 0.35, 0.005, trimBlackMat);
    buildE30BumperPatch(side === 1 ? 0.60 : -0.78, side === 1 ? 0.78 : -0.60, 0.58, 0.72, 0.004, amberLensMat);
  });

  const frontPlate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.076, 0.010), plateMat);
  frontPlate.position.set(0, 0.345, 2.146);
  shellGroup.add(frontPlate);

  // =========================================================================
  // 4. FLUSH CLAMSHELL HOOD, TRUNK DECK, SPORT EVO BI-PLANE WING & WRAPAROUND REAR
  // =========================================================================
  const hoodGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 14; i++) {
    const tZ = i / 14;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 10; j++) {
      const u = (j / 10) * 2 - 1;
      const zFront = e30NoseZ(u * 0.78) + 0.004;
      const z = lerp(0.74, zFront, tZ);
      const hw = lerp(e30ShoulderX(0.74), 0.568, smoothstep(0.74, 2.09, z));
      const yC = e30BeltY(z);
      row.push(new THREE.Vector3(u * hw, yC + (1 - u * u) * 0.016, z));
    }
    hoodGrid.push(row);
  }
  const hoodMesh = new THREE.Mesh(buildSurfaceGrid(hoodGrid, false), paintMat);
  hoodMesh.castShadow = true;
  hoodGroup.add(hoodMesh);

  const hoodRoundel = new THREE.Mesh(new THREE.CircleGeometry(0.032, 20), roundelMat);
  hoodRoundel.position.set(0, e30BeltY(2.01) + 0.018, 2.01);
  hoodRoundel.rotation.x = -Math.PI / 2 + 0.08;
  hoodGroup.add(hoodRoundel);

  const trunkGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 8; i++) {
    const tZ = i / 8;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 10; j++) {
      const u = (j / 10) * 2 - 1;
      const zRear = e30TailZ(u * 0.78) + 0.004;
      const z = lerp(zRear, -1.34, tZ);
      const hw = lerp(0.562, 0.578, tZ);
      const yC = e30BeltY(z);
      row.push(new THREE.Vector3(u * hw, yC + (1 - u * u) * 0.014, z));
    }
    trunkGrid.push(row);
  }
  const trunkLid = new THREE.Mesh(buildSurfaceGrid(trunkGrid, false), paintMat);
  trunkLid.castShadow = true;
  trunkWingGroup.add(trunkLid);

  // Sport Evolution Bi-Plane Rear Wing (smooth airfoil + swept pylons)
  const e30PylonGeo = buildSweptPylon(0.145, 0.21, 0.17, 0.030, 0.045);
  ([-0.46, 0.46] as const).forEach((sx) => {
    const pylon = new THREE.Mesh(e30PylonGeo, paintMat);
    pylon.position.set(sx, 0.94, -1.94);
    trunkWingGroup.add(pylon);
  });
  const wingMain = new THREE.Mesh(
    buildAirfoilWing(1.30, 0.23, 0.028, 0.008),
    paintMat,
  );
  wingMain.position.set(0, 1.022, -1.96);
  wingMain.rotation.x = -0.08;
  wingMain.castShadow = true;
  trunkWingGroup.add(wingMain);

  const gurneyFlap = new THREE.Mesh(
    buildBeveledBox(1.22, 0.016, 0.085, 0.005, 3),
    trimBlackMat,
  );
  gurneyFlap.position.set(0, 1.046, -2.056);
  gurneyFlap.rotation.x = -0.32;
  trunkWingGroup.add(gurneyFlap);

  // Continuous Rear Upper Fascia + Curved Wraparound Rear Bumper meeting rear quarters flush
  const rearUpperGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 30; j++) {
      const u = cornerClusterU((j / 30) * 2 - 1, 1.45);
      const z = e30TailZ(u);
      const y = lerp(0.452, e30BeltY(z) + (1 - Math.min(1, u * u)) * 0.014, t);
      const hw = lerp(0.728, 0.706, t);
      row.push(new THREE.Vector3(u * hw, y, z));
    }
    rearUpperGrid.push(row);
  }
  const rearUpperMesh = new THREE.Mesh(buildSurfaceGrid(rearUpperGrid, true), paintMat);
  rearUpperMesh.castShadow = true;
  shellGroup.add(rearUpperMesh);

  // Rear shoulder seal closing gap between trunk lid and outer rear quarter fenders
  ([-1, 1] as const).forEach((side) => {
    const rShoulderGrid: THREE.Vector3[][] = [];
    for (let i = 0; i <= 14; i++) {
      const z = lerp(-2.03, -1.34, i / 14);
      const xIn = lerp(0.556, 0.578, i / 14);
      const xOut = e30ShoulderX(z);
      rShoulderGrid.push([
        new THREE.Vector3(xIn * side, e30BeltY(z), z),
        new THREE.Vector3(xOut * side, e30BeltY(z) - 0.002, z),
      ]);
    }
    shellGroup.add(new THREE.Mesh(buildSurfaceGrid(rShoulderGrid, side !== 1), paintMat));
  });

  const e30RearBumperPt = (u: number, t: number) => {
    const y = lerp(0.245, 0.455, t);
    const sideZ = -1.60;
    const centerZ = lerp(-2.125, -2.142, Math.sin(t * Math.PI));
    const frontRearZ = lerp(centerZ, -1.96, Math.pow(Math.min(1, Math.abs(u) / 0.88), 2.5));
    const cornerWrap = smoothstep(0.76, 1.0, Math.abs(u));
    const halfW = lerp(lerp(0.736, 0.724, t), 0.758, cornerWrap);
    const z = lerp(frontRearZ, sideZ, cornerWrap);
    return new THREE.Vector3(u * halfW, y, z);
  };
  const rearBumperGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 36; j++) {
      const u = cornerClusterU((j / 36) * 2 - 1, 1.5);
      row.push(e30RearBumperPt(u, t));
    }
    rearBumperGrid.push(row);
  }
  const rBumperMesh = new THREE.Mesh(buildSurfaceGrid(rearBumperGrid, true), paintMat);
  rBumperMesh.castShadow = true;
  shellGroup.add(rBumperMesh);

  const rearAccentPts: THREE.Vector3[] = [];
  for (let j = 0; j <= 36; j++) {
    const u = cornerClusterU(lerp(-0.98, 0.98, j / 36), 1.5);
    const pR = e30RearBumperPt(u, 0.85);
    rearAccentPts.push(new THREE.Vector3(pR.x * 1.003, pR.y, pR.z - 0.004));
  }
  shellGroup.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rearAccentPts), 44, 0.0065, 10, false),
      bumperStripeMat,
    ),
  );

  // Classic 3-band E30 Taillights, Roundel, M3 Badge & Plate
  ([-1, 1] as const).forEach((side) => {
    const tl = new THREE.Group();
    tl.position.set(0.49 * side, 0.695, -2.078);
    tl.rotation.y = -side * 0.16;
    tl.add(new THREE.Mesh(buildBeveledBox(0.34, 0.14, 0.016, 0.008, 3), trimBlackMat));
    const upperAmber = new THREE.Mesh(buildBeveledBox(0.18, 0.055, 0.022, 0.006, 2), amberLensMat);
    upperAmber.position.set(0.068 * side, 0.033, 0);
    tl.add(upperAmber);
    const innerReverse = new THREE.Mesh(buildBeveledBox(0.11, 0.055, 0.022, 0.006, 2), whiteLensMat);
    innerReverse.position.set(-0.095 * side, 0.033, 0);
    tl.add(innerReverse);
    const lowerRed = new THREE.Mesh(buildBeveledBox(0.31, 0.058, 0.022, 0.006, 2), redLensMat);
    lowerRed.position.set(0, -0.033, 0);
    tl.add(lowerRed);
    shellGroup.add(tl);
  });

  const rearRoundel = new THREE.Mesh(new THREE.CircleGeometry(0.030, 20), roundelMat);
  rearRoundel.position.set(0, 0.785, -2.104);
  rearRoundel.rotation.y = Math.PI;
  shellGroup.add(rearRoundel);

  const rearM3Badge = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.034), mBadgeMat);
  rearM3Badge.position.set(-0.46, 0.805, -2.104);
  rearM3Badge.rotation.y = Math.PI;
  shellGroup.add(rearM3Badge);

  const rearPlate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.078, 0.012), plateMat);
  rearPlate.position.set(0, 0.665, -2.106);
  rearPlate.rotation.y = Math.PI;
  shellGroup.add(rearPlate);

  // =========================================================================
  // 5. SEAMLESS DOORS & AERODYNAMIC MIRRORS
  // =========================================================================
  const buildDoor = (side: 1 | -1, target: THREE.Group) => {
    const dGrid: THREE.Vector3[][] = [];
    for (let i = 0; i <= 20; i++) {
      const z = lerp(-0.78, 0.74, i / 20);
      dGrid.push(e30SideCol(z, 0.305, e30BeltY(z), 0, null, side));
    }
    const doorMesh = new THREE.Mesh(buildSurfaceGrid(dGrid, side === 1), paintMat);
    doorMesh.castShadow = true;
    target.add(doorMesh);

    const handle = new THREE.Mesh(
      buildBeveledBox(0.018, 0.022, 0.14, 0.007, 3),
      trimBlackMat,
    );
    handle.position.set(0.758 * side, 0.68, -0.50);
    target.add(handle);

    // Aerodynamic teardrop E30 M3 side mirror housing + swept arm
    const mirrorArm = new THREE.Mesh(
      buildBeveledBox(0.068, 0.022, 0.038, 0.007, 2),
      paintMat,
    );
    mirrorArm.position.set((e30ShoulderX(0.56) + 0.032) * side, 0.798, 0.56);
    target.add(mirrorArm);

    const mirrorPod = new THREE.Mesh(new THREE.SphereGeometry(0.054, 22, 16), paintMat);
    mirrorPod.scale.set(1.08, 0.66, 0.92);
    mirrorPod.position.set((e30ShoulderX(0.56) + 0.092) * side, 0.812, 0.55);
    target.add(mirrorPod);

    // Smooth door glass tracking exact A-pillar leading edge & curved roofline
    const dwGrid: THREE.Vector3[][] = [];
    for (let r = 0; r <= 6; r++) {
      const f = r / 6;
      const pFront = e30WsEdgePt(f, side);
      const pBack = new THREE.Vector3(
        lerp(e30ShoulderX(-0.22), 0.562, f) * side,
        lerp(e30BeltY(-0.22), e30RoofSideY(-0.22), f),
        -0.22,
      );
      const row: THREE.Vector3[] = [];
      for (let c = 0; c <= 10; c++) {
        const u = c / 10;
        const p = new THREE.Vector3().lerpVectors(pFront, pBack, u);
        if (r === 6) {
          p.y = e30RoofSideY(p.z);
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
          trimBlackMat,
        ),
      );
    });
  };
  buildDoor(1, leftDoorGroup);
  buildDoor(-1, rightDoorGroup);

  bodyRoot.add(shellGroup, hoodGroup, trunkWingGroup, leftDoorGroup, rightDoorGroup);

  // =========================================================================
  // 6. DRIVETRAIN: S14B25 2.5L I4, GETRAG 265/5, BBS 16" & RECARO COCKPIT
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

  const floorPan = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.032, 2.72), common.steelDark);
  floorPan.position.set(0, 0.185, 0);
  chassisGroup.add(floorPan);

  const tunnel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 2.40), common.steelDark);
  tunnel.position.set(0, 0.24, -0.10);
  chassisGroup.add(tunnel);

  const frontSubframe = new THREE.Mesh(new THREE.BoxGeometry(0.90, 0.05, 0.88), common.steelDark);
  frontSubframe.position.set(0, 0.21, fZ);
  chassisGroup.add(frontSubframe);

  // Tucked cleanly inside engine bay below closed hood (y = 0.595)
  const strutBrace = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.96, 10),
    common.redAccent,
  );
  strutBrace.rotation.z = Math.PI / 2;
  strutBrace.position.set(0, 0.595, fZ + 0.02);
  chassisGroup.add(strutBrace);

  const radiator = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.34, 0.045), common.aluminum);
  radiator.position.set(0, 0.42, fZ + 0.54);
  chassisGroup.add(radiator);

  const dash = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.14, 0.28), common.leatherBlack);
  dash.position.set(0, 0.67, 0.52);
  interiorGroup.add(dash);

  const clusterPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.11),
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: textures.bmwGaugeMap, clippingPlanes }),
  );
  clusterPlane.position.set(0.32, 0.70, 0.375);
  clusterPlane.rotation.y = Math.PI;
  interiorGroup.add(clusterPlane);

  const swGroup = new THREE.Group();
  swGroup.position.set(0.32, 0.71, 0.22);
  swGroup.rotation.x = -0.26;
  swGroup.add(new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.018, 12, 32), common.leatherBlack));
  [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].forEach((a) => {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.15, 0.010), common.leatherBlack);
    sp.position.set(Math.sin(a) * 0.08, Math.cos(a) * 0.08, 0);
    sp.rotation.z = -a;
    swGroup.add(sp);
  });
  const mBadgeCenter = new THREE.Mesh(new THREE.CircleGeometry(0.022, 16), roundelMat);
  mBadgeCenter.rotation.y = Math.PI;
  mBadgeCenter.position.z = -0.015;
  swGroup.add(mBadgeCenter);
  interiorGroup.add(swGroup);

  const mClothMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.mClothSeatMap,
    roughness: 0.86,
    clippingPlanes,
  });
  ([-1, 1] as const).forEach((side) => {
    const seat = new THREE.Group();
    seat.position.set(0.31 * side, 0.26, -0.26);
    seat.add(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.09, 0.42), mClothMat));
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.54, 0.09), mClothMat);
    back.position.set(0, 0.29, -0.17);
    back.rotation.x = -0.20;
    seat.add(back);
    ([-1, 1] as const).forEach((b) => {
      const bolster = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.52, 0.12), common.leatherBlack);
      bolster.position.set(0.17 * b, 0.29, -0.14);
      bolster.rotation.x = -0.20;
      seat.add(bolster);
    });
    const redBelt = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.52, 0.012), common.redAccent);
    redBelt.position.set(0.11 * side, 0.30, -0.11);
    redBelt.rotation.x = -0.22;
    redBelt.rotation.z = 0.28 * side;
    seat.add(redBelt);
    interiorGroup.add(seat);
  });

  const springGeo = buildHelicalSpring(0.044, 0.18, 6);
  ([-1, 1] as const).forEach((side) => {
    const fg = side === 1 ? frontSuspLeft : frontSuspRight;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.025, 0.14), common.steelDark);
    arm.position.set(0.42 * side, 0.22, fZ);
    fg.add(arm);
    const strut = new THREE.Group();
    strut.position.set(0.56 * side, 0.24, fZ);
    strut.rotation.z = side * 0.18;
    const damper = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.30, 12), common.bilsteinYellow);
    damper.position.y = 0.16;
    strut.add(damper);
    const spring = new THREE.Mesh(springGeo, common.redAccent);
    spring.position.y = 0.08;
    strut.add(spring);
    fg.add(strut);

    const rg = side === 1 ? rearSuspLeft : rearSuspRight;
    const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.03, 0.18), common.aluminum);
    rArm.position.set(0.44 * side, 0.24, rZ + 0.08);
    rg.add(rArm);
    const rSpring = new THREE.Mesh(springGeo, common.redAccent);
    rSpring.position.set(0.52 * side, 0.24, rZ);
    rg.add(rSpring);
  });

  const engZ = 1.18;
  const engY = 0.32;
  engineBlockGroup.position.set(0, engY, engZ);
  engineTopGroup.position.set(0, engY, engZ);
  exhaustGroup.position.set(0, engY, engZ);

  const i4TiltRad = 0.21;
  const lowerBlock = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.14, 0.46), common.steelDark);
  lowerBlock.rotation.z = -i4TiltRad;
  engineBlockGroup.add(lowerBlock);

  const crankshaftGroup = new THREE.Group();
  const crankMain = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.50, 14), common.steelDark);
  crankMain.rotation.x = Math.PI / 2;
  crankshaftGroup.add(crankMain);
  const crankPulley = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.024, 22), common.aluminum);
  crankPulley.rotation.x = Math.PI / 2;
  crankPulley.position.z = 0.26;
  crankshaftGroup.add(crankPulley);
  engineBlockGroup.add(crankshaftGroup);

  const pistonVisuals: PistonVisual[] = [];
  const zPositions = [0.165, 0.055, -0.055, -0.165];
  [1, 2, 3, 4].forEach((cylNum, idx) => {
    pistonVisuals.push(
      buildBankedCylinderVisual({
        cylNumber: cylNum,
        bankSign: 1,
        bankTiltRad: i4TiltRad,
        zLocal: zPositions[idx],
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

    const itb = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.020, 0.095, 14),
      common.aluminum,
    );
    itb.rotation.z = -1.15;
    itb.position.set(0.11, 0.24, zPositions[idx]);
    engineTopGroup.add(itb);

    const hdr = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.02, 0.22, zPositions[idx]),
      new THREE.Vector3(-0.18, 0.16, zPositions[idx] - 0.02),
      new THREE.Vector3(-0.15, -0.06, -0.24),
    ]);
    exhaustGroup.add(
      new THREE.Mesh(new THREE.TubeGeometry(hdr, 12, 0.017, 8, false), common.exhaustBronze),
    );
  });

  const valveCover = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.075, 0.48), common.aluminum);
  valveCover.position.set(Math.sin(i4TiltRad) * 0.25, Math.cos(i4TiltRad) * 0.25, 0);
  valveCover.rotation.z = -i4TiltRad;
  engineTopGroup.add(valveCover);

  const mPowerPlaque = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: textures.bmwMPowerPlaqueMap, clippingPlanes }),
  );
  mPowerPlaque.rotation.x = -Math.PI / 2;
  mPowerPlaque.rotation.z = Math.PI / 2;
  mPowerPlaque.rotation.y = i4TiltRad;
  mPowerPlaque.position.set(Math.sin(i4TiltRad) * 0.292, Math.cos(i4TiltRad) * 0.292, 0);
  engineTopGroup.add(mPowerPlaque);

  const airbox = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.11, 0.44), trimBlackMat);
  airbox.position.set(0.18, 0.24, 0.01);
  engineTopGroup.add(airbox);

  // Tucked underbody exhaust + rear Sport Evo muffler inside valance + clean offset dual chrome tips
  const exhaustMid = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 2.70, 12), common.exhaustTitanium);
  exhaustMid.rotation.x = Math.PI / 2;
  exhaustMid.position.set(-0.14, -0.14, -1.62);
  exhaustGroup.add(exhaustMid);

  const rearMuffler = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.36), common.steelDark);
  rearMuffler.position.set(0.30, -0.07, -2.96);
  exhaustGroup.add(rearMuffler);

  [0.27, 0.35].forEach((tx) => {
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.16, 16), chromeMat);
    tip.rotation.x = Math.PI / 2;
    tip.position.set(tx, -0.09, -3.26);
    exhaustGroup.add(tip);
  });

  engineRootGroup.add(engineBlockGroup, engineTopGroup, exhaustGroup);

  const g265Bell = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.10, 0.48, 16), common.magnesium);
  g265Bell.rotation.x = Math.PI / 2;
  g265Bell.position.set(0, 0.29, 0.68);
  transaxleGroup.add(g265Bell);

  const propShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 1.65, 12), common.steelDark);
  propShaft.rotation.x = Math.PI / 2;
  propShaft.position.set(0, 0.28, -0.38);
  transaxleGroup.add(propShaft);

  const rearDiff = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.20, 0.26), common.aluminum);
  rearDiff.position.set(0, 0.29, rZ);
  transaxleGroup.add(rearDiff);

  ([-1, 1] as const).forEach((s) => {
    const hs = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.56, 10), common.steelDark);
    hs.rotation.z = Math.PI / 2;
    hs.position.set(0.41 * s, 0.295, rZ);
    transaxleGroup.add(hs);
  });

  // =========================================================================
  // 7. 16" BBS CROSS-SPOKE WHEELS & 280MM DISCS
  // =========================================================================
  const wheels: WheelAssembly[] = [];
  ([
    { sideSign: 1 as const, isFront: true },
    { sideSign: -1 as const, isFront: true },
    { sideSign: 1 as const, isFront: false },
    { sideSign: -1 as const, isFront: false },
  ]).forEach(({ sideSign, isFront }) => {
    const outerR = spec.frontTireRadius;
    const width = spec.frontTireWidth;
    const rimR = spec.wheelRimDiameter * 0.5;
    const trackHalf = (isFront ? spec.frontTrack : spec.rearTrack) * 0.5;
    const zPos = isFront ? fZ : rZ;

    const wheelGroup = new THREE.Group();
    wheelGroup.name = 'wheels';
    wheelGroup.position.set(trackHalf * sideSign, outerR, zPos);

    const tire = new THREE.Mesh(buildTireProfile(outerR, rimR, width), common.tire);
    tire.castShadow = true;
    wheelGroup.add(tire);

    wheelGroup.add(new THREE.Mesh(buildDeepDishRimLip(rimR, width, sideSign, 0.78), common.chrome));

    const meshBacking = new THREE.Mesh(
      new THREE.CylinderGeometry(rimR * 0.85, rimR * 0.85, 0.02, 36),
      common.steelDark,
    );
    meshBacking.rotation.z = Math.PI / 2;
    meshBacking.position.x = width * 0.16 * sideSign;
    wheelGroup.add(meshBacking);

    const e30SpokeGeo = buildBeveledBox(0.014, rimR * 0.82, 0.010, 0.004, 2);
    for (let k = 0; k < 8; k++) {
      const ang = (k / 8) * Math.PI * 2;
      [-0.14, 0.14].forEach((offsetAng) => {
        const spoke = new THREE.Mesh(e30SpokeGeo, wheelCenterMat);
        spoke.position.set(
          width * 0.21 * sideSign,
          Math.cos(ang) * rimR * 0.44,
          Math.sin(ang) * rimR * 0.44,
        );
        spoke.rotation.x = ang + offsetAng;
        wheelGroup.add(spoke);
      });
    }

    const hexNut = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.048, 0.024, 6), wheelCenterMat);
    hexNut.rotation.z = Math.PI / 2;
    hexNut.position.x = width * 0.24 * sideSign;
    wheelGroup.add(hexNut);

    const centerRoundel = new THREE.Mesh(new THREE.CircleGeometry(0.022, 24), roundelMat);
    centerRoundel.rotation.y = sideSign === 1 ? Math.PI / 2 : -Math.PI / 2;
    centerRoundel.position.x = (width * 0.24 + 0.013) * sideSign;
    wheelGroup.add(centerRoundel);

    const hubBrakeGroup = new THREE.Group();
    hubBrakeGroup.name = 'wheels';
    hubBrakeGroup.position.set((trackHalf - 0.04) * sideSign, outerR, zPos);

    const discR = (isFront ? spec.frontDiscDiameter : spec.rearDiscDiameter) * 0.5;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(discR, discR, 0.022, 36), common.disc);
    disc.rotation.z = Math.PI / 2;
    hubBrakeGroup.add(disc);

    const caliper = new THREE.Mesh(
      buildBeveledBox(0.055, 0.095, 0.115, 0.012, 3),
      common.steelDark,
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
    transaxleGroup.position.set(0, 0, -p.transaxleBackZ * 0.35);

    engineBlockGroup.position.z = engZ;
    engineTopGroup.position.set(0, engY + p.engineShroudLiftY * 0.55, engZ);
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
      trimBlackMat,
      chromeMat,
      bumperStripeMat,
      amberLensMat,
      redLensMat,
      whiteLensMat,
      plateMat,
    ],
    glassMaterials: [glassMat],
    lensMaterials: [headlightGlassMat],
    decalMaterials: [roundelMat, mBadgeMat],
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
      bumperStripeMat.color.set(livery.scriptHex);
      wheelCenterMat.color.set(livery.wheelAccentHex);
    },
    setEngineXray: (xray: boolean) => {
      common.cylinderLiner.transparent = xray;
      common.cylinderLiner.opacity = xray ? 0.28 : 1.0;
      common.cylinderLiner.depthWrite = !xray;
      common.cylinderLiner.needsUpdate = true;
    },
  };
}
