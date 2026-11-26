import * as THREE from 'three';
import {
  CarRig,
  PistonVisual,
  WheelAssembly,
  addSealedWheelWell,
  buildBankedCylinderVisual,
  buildBeveledBox,
  buildDeepDishRimLip,
  buildHelicalSpring,
  buildRoundedRingGeo,
  buildSurfaceGrid,
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
 * 2002 BMW M5 (E39)
 * Seamless 4-door executive body with glowing Angel Eyes, twin-kidney grille,
 * continuous wraparound oval M front apron & quad-tip rear diffuser, double-arm teardrop
 * M5 mirrors, trunk lip spoiler, 4.9L S62 90-deg V8, Getrag 420G & 18" Style 65 wheels.
 */
export function buildBmwE39M5Car(
  textures: ProceduralTextures,
  isSoftwareGl: boolean,
  clippingPlanes: THREE.Plane[],
): CarRig {
  const spec = VEHICLES['bmw-e39-m5'];
  const root = new THREE.Group();
  root.name = 'bmw_e39_m5_root';

  const bodyRoot = new THREE.Group();
  bodyRoot.name = 'body';
  const shellGroup = new THREE.Group();
  shellGroup.name = 'body';
  const hoodGroup = new THREE.Group();
  hoodGroup.name = 'body';
  const trunkGroup = new THREE.Group();
  trunkGroup.name = 'body';
  const leftDoorsGroup = new THREE.Group();
  leftDoorsGroup.name = 'body';
  const rightDoorsGroup = new THREE.Group();
  rightDoorsGroup.name = 'body';

  const common = createCommonDrivetrainMaterials(textures, clippingPlanes);

  const paintMat = new THREE.MeshPhysicalMaterial({
    color: 0x183f8c,
    metalness: 0.42,
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.52,
    side: THREE.DoubleSide,
    clippingPlanes,
  });
  const trimBlackMat = new THREE.MeshStandardMaterial({
    color: 0x16181c,
    metalness: 0.18,
    roughness: 0.56,
    side: THREE.DoubleSide,
    clippingPlanes,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xeef3f8,
    metalness: 0.96,
    roughness: 0.08,
    envMapIntensity: 1.48,
    side: THREE.DoubleSide,
    clippingPlanes,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a2430,
    metalness: 0.05,
    roughness: 0.04,
    transmission: isSoftwareGl ? 0 : 0.54,
    transparent: true,
    opacity: isSoftwareGl ? 0.45 : 0.48,
    clearcoat: 1.0,
    depthWrite: false,
    side: THREE.DoubleSide,
    clippingPlanes,
  });
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: 0x202a38,
    metalness: 0.08,
    roughness: 0.05,
    transparent: true,
    opacity: 0.20,
    clearcoat: 1.0,
    depthWrite: false,
    clippingPlanes,
  });
  const angelEyeMat = new THREE.MeshStandardMaterial({
    color: 0xfff8e6,
    emissive: 0xfff3d4,
    emissiveIntensity: 1.4,
    roughness: 0.12,
    clippingPlanes,
  });
  const amberLensMat = new THREE.MeshStandardMaterial({
    color: 0xea7e10,
    emissive: 0x5c2600,
    emissiveIntensity: 0.44,
    roughness: 0.16,
    clippingPlanes,
  });
  const redCelisMat = new THREE.MeshStandardMaterial({
    color: 0xd01422,
    emissive: 0x800810,
    emissiveIntensity: 0.72,
    roughness: 0.14,
    clippingPlanes,
  });
  const whiteLensMat = new THREE.MeshStandardMaterial({
    color: 0xf0f3f7,
    roughness: 0.16,
    clippingPlanes,
  });
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.createPlateMap('M · S62 V8'),
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
  const m5BadgeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.bmwM5BadgeMap,
    transparent: true,
    alphaTest: 0.08,
    roughness: 0.28,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    clippingPlanes,
  });
  const style65Mat = new THREE.MeshStandardMaterial({
    color: 0x777e88,
    metalness: 0.88,
    roughness: 0.20,
    envMapIntensity: 1.45,
    clippingPlanes,
  });

  const fZ = spec.frontAxleZ; // +1.415
  const rZ = spec.rearAxleZ; // -1.415
  const archR = 0.354;

  const e39BeltY = (z: number) =>
    catmullY(
      [
        [-2.34, 0.900],
        [-1.85, 0.916],
        [-1.42, 0.904],
        [-0.85, 0.865],
        [0.0, 0.852],
        [0.78, 0.840],
        [1.42, 0.822],
        [1.98, 0.745],
        [2.34, 0.635],
      ],
      z,
    );

  const e39RoofSideY = (z: number) =>
    catmullY(
      [
        [-0.68, 1.402],
        [-0.40, 1.425],
        [-0.12, 1.430],
        [0.08, 1.418],
        [0.24, 1.396],
      ],
      z,
    );

  // Seamless base half-width + subtle wheel arch flares returning smoothly to zero at door seams & bumpers
  const e39BaseHalfW = (z: number) =>
    0.858 - 0.085 * smoothstep(1.94, 2.34, z) - 0.082 * smoothstep(-1.94, -2.34, z);

  const e39FlareOffset = (z: number) => {
    const fMask =
      Math.exp(-Math.pow((z - fZ) / 0.28, 2)) *
      (1 - smoothstep(1.88, 2.18, z)) *
      smoothstep(0.84, 1.08, z);
    const rMask =
      Math.exp(-Math.pow((z - rZ) / 0.30, 2)) *
      (1 - smoothstep(-1.88, -2.18, z)) *
      smoothstep(-0.92, -1.16, z);
    return fMask * 0.034 + rMask * 0.044;
  };

  const e39OuterHalfW = (z: number) => e39BaseHalfW(z) + e39FlareOffset(z);
  const e39ShoulderX = (z: number) => e39BaseHalfW(z) - 0.072;
  const e39NoseZ = (u: number) => lerp(2.352, 2.110, Math.pow(Math.min(1, Math.abs(u)), 2.8));
  const e39TailZ = (u: number) => lerp(-2.355, -2.150, Math.pow(Math.min(1, Math.abs(u)), 2.8));

  const e39SideCol = (
    z: number,
    bottomY: number,
    topY: number,
    flareBlend: number,
    innerDeckX: number | null,
    side: 1 | -1,
    isFrontFender = false,
    isRearFender = false,
  ): THREE.Vector3[] => {
    const maxW = e39OuterHalfW(z);
    const shX = e39ShoulderX(z);
    const shoulderY = lerp(bottomY, topY, 0.72);
    const crownX = lerp(shX, maxW + 0.005 * flareBlend, 0.44);
    const col = [
      new THREE.Vector3(maxW * side, bottomY, z),
      new THREE.Vector3((maxW + 0.005 * flareBlend) * side, lerp(bottomY, shoulderY, 0.25), z),
      new THREE.Vector3((maxW + 0.008 * flareBlend) * side, lerp(bottomY, shoulderY, 0.52), z),
      new THREE.Vector3((maxW + 0.006 * flareBlend) * side, shoulderY, z),
      new THREE.Vector3((maxW + 0.003 * flareBlend) * side, lerp(shoulderY, topY, 0.42), z),
      new THREE.Vector3(crownX * side, lerp(shoulderY, topY, 0.70), z),
      new THREE.Vector3(lerp(crownX, shX, 0.55) * side, lerp(shoulderY, topY, 0.86), z),
      new THREE.Vector3(shX * side, topY, z),
    ];
    if (innerDeckX !== null) {
      col.push(new THREE.Vector3(innerDeckX * side, topY - 0.004, z));
    }
    return col;
  };

  const e39FenderRowAtZ = (z: number, side: 1 | -1, axleZ: number, wheelY: number, isFront: boolean) => {
    const innerX = isFront
      ? lerp(0.735, 0.610, smoothstep(0.78, 2.34, z))
      : lerp(0.768, 0.625, smoothstep(-0.88, -2.34, z));
    const topY = e39BeltY(z);
    const archY = wheelArchHeight(z, axleZ, wheelY, archR);

    let bottomY = 0.172;
    if (isFront && z > axleZ + archR * 0.74) {
      bottomY = lerp(0.172, 0.442, smoothstep(axleZ + archR * 0.74, 1.82, z));
    } else if (!isFront && z < axleZ - archR * 0.74) {
      bottomY = lerp(0.172, 0.445, smoothstep(axleZ - archR * 0.74, -1.82, z));
    }
    const flareBlend = 1 - smoothstep(archR * 0.85, archR * 1.18, Math.abs(z - axleZ));
    if (archY !== null) {
      bottomY = Math.max(bottomY, archY - 0.004);
    }
    bottomY = Math.min(bottomY, topY - 0.015);
    return e39SideCol(z, bottomY, topY, flareBlend, innerX - 0.012, side);
  };

  // =========================================================================
  // 1. E39 SCULPTED FENDERS & ROCKER SILLS
  // =========================================================================
  const buildE39Fender = (
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
          const zTail = Math.min(zArchEdge - 0.06, e39TailZ(uNom) + 0.002);
          const zCol = lerp(zTail, zArchEdge, s);
          row.push(e39FenderRowAtZ(zCol, side, axleZ, wheelY, false)[k]);
        }
        grid.push(row);
      }
    }

    const archSpanStart = isFront ? zA : zArchEdge;
    const archSpanEnd = isFront ? zArchEdge : zB;
    const zSamples = sampleArchZ(archSpanStart, archSpanEnd, axleZ, archR, 12, 34);
    for (let i = 0; i < zSamples.length; i++) {
      grid.push(e39FenderRowAtZ(zSamples[i], side, axleZ, wheelY, isFront));
    }

    if (isFront) {
      for (let i = 1; i <= capSteps; i++) {
        const s = i / capSteps;
        const row: THREE.Vector3[] = [];
        for (let k = 0; k <= 8; k++) {
          const uNom = lerp(0.98, 0.78, smoothstep(0.15, 1.0, k / 8));
          const zNose = Math.max(zArchEdge + 0.06, e39NoseZ(uNom) - 0.002);
          const zCol = lerp(zArchEdge, zNose, s);
          row.push(e39FenderRowAtZ(zCol, side, axleZ, wheelY, true)[k]);
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
      outerXFn: e39OuterHalfW,
      innerX: 0.56,
      maxRoofYFn: e39BeltY,
      linerMat: trimBlackMat,
      lipMat: paintMat,
    });
  };

  ([-1, 1] as const).forEach((side) => {
    buildE39Fender(0.77, 2.26, 46, side, fZ, spec.frontTireRadius, true);
    buildE39Fender(-2.27, -0.87, 46, side, rZ, spec.rearTireRadius, false);

    const sillGrid: THREE.Vector3[][] = [];
    for (let i = 0; i <= 18; i++) {
      const z = lerp(-0.90, 0.79, i / 18);
      const w = e39BaseHalfW(z);
      sillGrid.push([
        new THREE.Vector3((w - 0.065) * side, 0.172, z),
        new THREE.Vector3((w - 0.012) * side, 0.174, z),
        new THREE.Vector3(w * side, 0.215, z),
        new THREE.Vector3(w * side, 0.295, z),
      ]);
    }
    const sill = new THREE.Mesh(buildSurfaceGrid(sillGrid, side === 1), paintMat);
    sill.castShadow = true;
    shellGroup.add(sill);

    const sideStrip = new THREE.Mesh(
      buildBeveledBox(0.018, 0.026, 1.63, 0.008, 3),
      trimBlackMat,
    );
    sideStrip.position.set(0.862 * side, 0.485, -0.04);
    shellGroup.add(sideStrip);
  });

  // =========================================================================
  // 2. EXECUTIVE SEDAN ROOF, GREENHOUSE, HOFFMEISTER KINK & PILLARS
  // =========================================================================
  const e39RoofSideX = (z: number) => lerp(0.620, 0.642, smoothstep(-0.68, 0.24, z));
  const e39WsEdgePt = (t: number, side: 1 | -1) => {
    const z = lerp(0.78, 0.24, t);
    const hw = lerp(e39ShoulderX(0.78), 0.642, t);
    const y = lerp(0.840, 1.396, t) + Math.sin(t * Math.PI) * 0.015;
    return new THREE.Vector3(hw * side, y, z);
  };
  const e39RwEdgePt = (t: number, side: 1 | -1) => {
    const z = lerp(-1.56, -0.68, t);
    const hw = lerp(0.665, 0.620, t);
    const y = lerp(0.915, 1.402, t) + Math.sin(t * Math.PI) * 0.020;
    return new THREE.Vector3(hw * side, y, z);
  };

  const roofGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 16; i++) {
    const z = lerp(-0.68, 0.24, i / 16);
    const yPeak = e39RoofSideY(z);
    const hw = e39RoofSideX(z);
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 12; j++) {
      const u = (j / 12) * 2 - 1;
      row.push(new THREE.Vector3(u * hw, yPeak + (1 - u * u) * 0.022, z));
    }
    roofGrid.push(row);
  }
  const roof = new THREE.Mesh(buildSurfaceGrid(roofGrid, false), paintMat);
  roof.castShadow = true;
  shellGroup.add(roof);

  const headliner = roofGrid.map((row) =>
    row.map((p) => new THREE.Vector3(p.x * 0.96, p.y - 0.014, p.z)),
  );
  shellGroup.add(new THREE.Mesh(buildSurfaceGrid(headliner, true), trimBlackMat));

  const wsGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const edge = e39WsEdgePt(t, 1);
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 12; j++) {
      const u = (j / 12) * 2 - 1;
      row.push(
        new THREE.Vector3(
          u * edge.x,
          edge.y + (1 - u * u) * 0.018,
          edge.z + (1 - u * u) * 0.04,
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
    const edge = e39RwEdgePt(t, 1);
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 12; j++) {
      const u = (j / 12) * 2 - 1;
      row.push(
        new THREE.Vector3(
          u * edge.x,
          edge.y + (1 - u * u) * 0.016,
          edge.z - (1 - u * u) * 0.032,
        ),
      );
    }
    rwGrid.push(row);
  }
  const rw = new THREE.Mesh(buildSurfaceGrid(rwGrid, true), glassMat);
  rw.renderOrder = 2;
  shellGroup.add(rw);

  ([-1, 1] as const).forEach((side) => {
    const aPts = [0, 0.25, 0.5, 0.75, 1.0].map((t) => e39WsEdgePt(t, side));
    const aCurve = new THREE.CatmullRomCurve3(aPts, false, 'centripetal', 0.5);
    shellGroup.add(new THREE.Mesh(new THREE.TubeGeometry(aCurve, 20, 0.018, 10, false), paintMat));

    const bCurve = new THREE.LineCurve3(
      new THREE.Vector3(e39ShoulderX(-0.14) * side, e39BeltY(-0.14), -0.14),
      new THREE.Vector3(e39RoofSideX(-0.14) * side, e39RoofSideY(-0.14) - 0.004, -0.14),
    );
    shellGroup.add(new THREE.Mesh(new THREE.TubeGeometry(bCurve, 6, 0.014, 10, false), trimBlackMat));

    // Shared Hoffmeister-kink trailing curve between rear door glass and C-pillar
    const e39CPillarFrontPt = (f: number) => {
      const z = lerp(-1.02, -0.68, f);
      const kinkZ = Math.sin(Math.pow(1 - f, 1.3) * Math.PI) * 0.024;
      const x = lerp(e39ShoulderX(-1.02), e39RoofSideX(-0.68), smoothstep(0, 1, f));
      const yCurve = lerp(f, Math.sin(f * Math.PI * 0.5), 0.55);
      const y = lerp(e39BeltY(-1.02), e39RoofSideY(-0.68), yCurve);
      return new THREE.Vector3(x * side, y, z + kinkZ);
    };

    const cGrid: THREE.Vector3[][] = [];
    for (let i = 0; i <= 14; i++) {
      const f = i / 14;
      const pFront = e39CPillarFrontPt(f);
      const pBack = e39RwEdgePt(f, side);
      const row: THREE.Vector3[] = [];
      for (let c = 0; c <= 4; c++) {
        const u = c / 4;
        const p = new THREE.Vector3().lerpVectors(pFront, pBack, u);
        p.x += Math.sin(u * Math.PI) * 0.008 * side * Math.sin(f * Math.PI);
        row.push(p);
      }
      cGrid.push(row);
    }
    const cPillar = new THREE.Mesh(buildSurfaceGrid(cGrid, side !== 1), paintMat);
    cPillar.castShadow = true;
    shellGroup.add(cPillar);

    const cTrimGrid = cGrid.map((r) =>
      r.map((pt) => new THREE.Vector3(pt.x - 0.008 * side, pt.y - 0.004, pt.z - 0.003)),
    );
    shellGroup.add(new THREE.Mesh(buildSurfaceGrid(cTrimGrid, side === 1), trimBlackMat));

    const rwGlassGrid: THREE.Vector3[][] = [];
    for (let r = 0; r <= 6; r++) {
      const f = r / 6;
      const pBack = e39CPillarFrontPt(f);
      const zFront = -0.14;
      const xFront = lerp(e39ShoulderX(zFront), e39RoofSideX(zFront), f);
      const yFront = lerp(e39BeltY(zFront), e39RoofSideY(zFront), f);
      const pFront = new THREE.Vector3(xFront * side, yFront, zFront);
      const row: THREE.Vector3[] = [];
      for (let c = 0; c <= 8; c++) {
        const u = c / 8;
        const p = new THREE.Vector3().lerpVectors(pFront, pBack, u);
        if (r === 6) {
          p.x = e39RoofSideX(p.z) * side;
          p.y = e39RoofSideY(p.z);
        }
        row.push(p);
      }
      rwGlassGrid.push(row);
    }
    const rearDoorWin = new THREE.Mesh(buildSurfaceGrid(rwGlassGrid, side === 1), glassMat);
    rearDoorWin.renderOrder = 2;
    shellGroup.add(rearDoorWin);

    const rTopPts = Array.from({ length: 9 }, (_, c) => rwGlassGrid[6][c]);
    const rRearPts = Array.from({ length: 7 }, (_, r) => rwGlassGrid[6 - r][8]);
    [rTopPts, rRearPts].forEach((segPts) => {
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
  // 3. CURVED WRAPAROUND E39 FRONT FASCIA, KIDNEYS, ANGEL EYES & M5 APRON
  // =========================================================================
  const frontMaskGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 30; j++) {
      const u = cornerClusterU((j / 30) * 2 - 1, 1.45);
      const z = e39NoseZ(u);
      const topEdgeY = e39BeltY(z) + (1 - Math.min(1, u * u)) * 0.020;
      const y = lerp(0.445, topEdgeY, t);
      const hw = lerp(e39OuterHalfW(z), e39ShoulderX(z) + 0.018, t);
      row.push(new THREE.Vector3(u * hw, y, z));
    }
    frontMaskGrid.push(row);
  }
  shellGroup.add(new THREE.Mesh(buildSurfaceGrid(frontMaskGrid, false), paintMat));

  // Twin Chrome BMW Kidney Grilles (smooth rounded rings + black backing & vertical slats)
  const e39KidneyRingGeo = buildRoundedRingGeo(0.24, 0.145, 0.024, 0.032, 0.015);
  const e39KidneyHoleGeo = buildBeveledBox(0.205, 0.112, 0.014, 0.020, 2);
  const e39KidneySlatGeo = buildBeveledBox(0.0055, 0.106, 0.012, 0.002, 2);
  ([-0.145, 0.145] as const).forEach((kx) => {
    const kRing = new THREE.Mesh(e39KidneyRingGeo, chromeMat);
    kRing.position.set(kx, 0.562, 2.349);
    kRing.rotation.x = 0.06;
    shellGroup.add(kRing);
    const kHole = new THREE.Mesh(e39KidneyHoleGeo, trimBlackMat);
    kHole.position.set(kx, 0.562, 2.347);
    kHole.rotation.x = 0.06;
    shellGroup.add(kHole);
    for (let si = -4; si <= 4; si++) {
      const slat = new THREE.Mesh(e39KidneySlatGeo, trimBlackMat);
      slat.position.set(kx + si * 0.021, 0.562, 2.354);
      slat.rotation.x = 0.06;
      shellGroup.add(slat);
    }
  });
  const mGrilleBadge = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.022), m5BadgeMat);
  mGrilleBadge.position.set(-0.14, 0.558, 2.368);
  shellGroup.add(mGrilleBadge);

  // Dark gloss-black E39 LCI Xenon headlamp shrouds + glowing Angel Eye halos + curved amber corner conformed to nose
  const hlShroudMat = new THREE.MeshStandardMaterial({
    color: 0x0e1116,
    metalness: 0.25,
    roughness: 0.38,
    side: THREE.DoubleSide,
    clippingPlanes,
  });

  ([-1, 1] as const).forEach((side) => {
    const hlPanelGrid: THREE.Vector3[][] = [];
    for (let r = 0; r <= 4; r++) {
      const t = lerp(0.18, 0.86, r / 4);
      const row: THREE.Vector3[] = [];
      for (let c = 0; c <= 12; c++) {
        const u = lerp(0.41 * side, 0.94 * side, c / 12);
        const z = e39NoseZ(u) + 0.004;
        const topEdgeY = e39BeltY(z) + (1 - Math.min(1, u * u)) * 0.020;
        const y = lerp(0.455, topEdgeY - 0.012, t);
        row.push(new THREE.Vector3(u * 0.772, y, z));
      }
      hlPanelGrid.push(row);
    }
    shellGroup.add(new THREE.Mesh(buildSurfaceGrid(hlPanelGrid, side === 1), hlShroudMat));

    const hlCoverGrid = hlPanelGrid.map((r) =>
      r.map((pt) => new THREE.Vector3(pt.x, pt.y, pt.z + 0.008)),
    );
    const cover = new THREE.Mesh(buildSurfaceGrid(hlCoverGrid, side === 1), lensMat);
    cover.renderOrder = 3;
    shellGroup.add(cover);

    // Smooth curved amber indicator wrapping into E39 nose corner
    const amberGrid: THREE.Vector3[][] = [];
    for (let r = 0; r <= 3; r++) {
      const t = lerp(0.24, 0.80, r / 3);
      const row: THREE.Vector3[] = [];
      for (let c = 0; c <= 6; c++) {
        const u = lerp(0.79 * side, 0.92 * side, c / 6);
        const z = e39NoseZ(u) + 0.007;
        const topEdgeY = e39BeltY(z) + (1 - Math.min(1, u * u)) * 0.020;
        const y = lerp(0.455, topEdgeY - 0.012, t);
        row.push(new THREE.Vector3(u * 0.772, y, z));
      }
      amberGrid.push(row);
    }
    shellGroup.add(new THREE.Mesh(buildSurfaceGrid(amberGrid, side === 1), amberLensMat));

    const hlCenterU = 0.62 * side;
    const hlCenterZ = e39NoseZ(hlCenterU) + 0.010;
    const hlYaw = side * 0.28;
    [-0.082, 0.055].forEach((ox) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.0048, 12, 36), angelEyeMat);
      ring.position.set((0.49 + ox) * side, 0.558, hlCenterZ - ox * 0.26);
      ring.rotation.y = hlYaw;
      shellGroup.add(ring);
    });
  });

  // Continuous Wraparound E39 M5 Front Apron sweeping seamlessly into outer fender arch (no gap in front of tire)
  const e39FrontBumperPt = (u: number, t: number) => {
    const y = lerp(0.168, 0.448, t);
    const sideZ = fZ + archR * 0.99;
    const centerZ = lerp(2.345, 2.382, Math.sin(t * Math.PI * 0.65));
    const frontU = Math.min(1, Math.abs(u) / 0.86);
    const frontZ = lerp(centerZ, 2.13, Math.pow(frontU, 2.4));
    const cornerWrap = smoothstep(0.74, 1.0, Math.abs(u));
    const frontW = lerp(e39OuterHalfW(frontZ) + 0.008, e39OuterHalfW(frontZ) - 0.012, t);
    const archEdgeW = lerp(e39OuterHalfW(sideZ), e39OuterHalfW(sideZ) - 0.016, t);
    const halfW = lerp(frontW, archEdgeW, cornerWrap);
    const z = lerp(frontZ, sideZ, cornerWrap);
    return new THREE.Vector3(u * halfW, y, z);
  };
  const fBumperGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 36; j++) {
      const u = cornerClusterU((j / 36) * 2 - 1, 1.5);
      row.push(e39FrontBumperPt(u, t));
    }
    fBumperGrid.push(row);
  }
  const frontBumper = new THREE.Mesh(buildSurfaceGrid(fBumperGrid, false), paintMat);
  frontBumper.castShadow = true;
  shellGroup.add(frontBumper);

  // Contoured curved smiling M5 intake & T-bar matching front bumper apron
  const buildE39CurvedBand = (
    uSpan: number,
    t0: number,
    t1: number,
    zOff: number,
    mat: THREE.Material,
  ) => {
    const g: THREE.Vector3[][] = [];
    for (let r = 0; r <= 4; r++) {
      const t = lerp(t0, t1, r / 4);
      const row: THREE.Vector3[] = [];
      for (let c = 0; c <= 16; c++) {
        const u = lerp(-uSpan, uSpan, c / 16);
        const p = e39FrontBumperPt(u, t);
        row.push(new THREE.Vector3(p.x, p.y, p.z + zOff));
      }
      g.push(row);
    }
    shellGroup.add(new THREE.Mesh(buildSurfaceGrid(g, false), mat));
  };
  buildE39CurvedBand(0.46, 0.24, 0.58, 0.005, trimBlackMat);
  buildE39CurvedBand(0.46, 0.39, 0.43, 0.009, paintMat);

  ([-1, 1] as const).forEach((side) => {
    const uCenter = 0.66 * side;
    const pFog = e39FrontBumperPt(uCenter, 0.40);
    const pPrev = e39FrontBumperPt(uCenter - 0.03, 0.40);
    const pNext = e39FrontBumperPt(uCenter + 0.03, 0.40);
    const yaw = Math.atan2(-(pNext.z - pPrev.z), pNext.x - pPrev.x);
    const fogGroup = new THREE.Group();
    fogGroup.position.set(pFog.x, pFog.y, pFog.z);
    fogGroup.rotation.y = yaw;
    const fogPocket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.038, 0.012, 24),
      trimBlackMat,
    );
    fogPocket.rotation.x = Math.PI / 2;
    fogPocket.position.z = 0.002;
    fogGroup.add(fogPocket);
    const fogLens = new THREE.Mesh(new THREE.CircleGeometry(0.028, 24), whiteLensMat);
    fogLens.position.z = 0.009;
    fogGroup.add(fogLens);
    shellGroup.add(fogGroup);
  });

  const frontPlate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.076, 0.010), plateMat);
  frontPlate.position.set(0, 0.372, 2.386);
  shellGroup.add(frontPlate);

  // =========================================================================
  // 4. CONTOURED E39 HOOD, TRUNK DECK, SEAMLESS WRAPAROUND REAR & QUAD TIPS
  // =========================================================================
  const hoodGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 14; i++) {
    const tZ = i / 14;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 10; j++) {
      const u = (j / 10) * 2 - 1;
      const zFront = e39NoseZ(u * 0.78) + 0.002;
      const z = lerp(0.78, zFront, tZ);
      const hw = lerp(e39ShoulderX(0.78), 0.622, smoothstep(0.78, 2.34, z));
      const yC = e39BeltY(z);
      row.push(new THREE.Vector3(u * hw, yC + (1 - u * u) * 0.020, z));
    }
    hoodGrid.push(row);
  }
  const hoodMesh = new THREE.Mesh(buildSurfaceGrid(hoodGrid, false), paintMat);
  hoodMesh.castShadow = true;
  hoodGroup.add(hoodMesh);

  const hoodRoundel = new THREE.Mesh(new THREE.CircleGeometry(0.034, 20), roundelMat);
  hoodRoundel.position.set(0, e39BeltY(2.26) + 0.022, 2.26);
  hoodRoundel.rotation.x = -Math.PI / 2 + 0.22;
  hoodGroup.add(hoodRoundel);

  const trunkGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 8; i++) {
    const tZ = i / 8;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 10; j++) {
      const u = (j / 10) * 2 - 1;
      const zRear = e39TailZ(u * 0.78) + 0.002;
      const z = lerp(zRear, -1.56, tZ);
      const hw = lerp(0.625, 0.665, tZ);
      const yC = e39BeltY(z);
      row.push(new THREE.Vector3(u * hw, yC + (1 - u * u) * 0.015, z));
    }
    trunkGrid.push(row);
  }
  const trunkMesh = new THREE.Mesh(buildSurfaceGrid(trunkGrid, false), paintMat);
  trunkMesh.castShadow = true;
  trunkGroup.add(trunkMesh);

  const lipSpoiler = new THREE.Mesh(
    buildBeveledBox(1.20, 0.020, 0.044, 0.009, 3),
    paintMat,
  );
  lipSpoiler.position.set(0, 0.916, -2.326);
  lipSpoiler.rotation.x = -0.18;
  trunkGroup.add(lipSpoiler);

  // Rear shoulder seal joining trunk lid seamlessly to rear fenders
  ([-1, 1] as const).forEach((side) => {
    const shGrid: THREE.Vector3[][] = [];
    for (let i = 0; i <= 14; i++) {
      const z = lerp(-2.28, -1.56, i / 14);
      const xIn = lerp(0.625, 0.665, i / 14);
      const xOut = e39ShoulderX(z);
      shGrid.push([
        new THREE.Vector3(xIn * side, e39BeltY(z), z),
        new THREE.Vector3(xOut * side, e39BeltY(z) - 0.003, z),
      ]);
    }
    shellGroup.add(new THREE.Mesh(buildSurfaceGrid(shGrid, side !== 1), paintMat));
  });

  // Continuous Curved Rear Upper Fascia + Wraparound Rear Bumper meeting rear arch (z=-1.74)
  const rearUpperGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 30; j++) {
      const u = cornerClusterU((j / 30) * 2 - 1, 1.45);
      const z = e39TailZ(u);
      const y = lerp(0.450, e39BeltY(z) + (1 - Math.min(1, u * u)) * 0.014, t);
      const hw = lerp(0.790, 0.770, t);
      row.push(new THREE.Vector3(u * hw, y, z));
    }
    rearUpperGrid.push(row);
  }
  const rearUpper = new THREE.Mesh(buildSurfaceGrid(rearUpperGrid, true), paintMat);
  rearUpper.castShadow = true;
  shellGroup.add(rearUpper);

  const e39RearBumperPt = (u: number, t: number) => {
    const y = lerp(0.225, 0.452, t);
    const sideZ = -1.74;
    const centerZ = lerp(-2.355, -2.382, Math.sin(t * Math.PI * 0.7));
    const frontRearZ = lerp(centerZ, -2.16, Math.pow(Math.min(1, Math.abs(u) / 0.86), 2.5));
    const cornerWrap = smoothstep(0.74, 1.0, Math.abs(u));
    const archEdgeW = lerp(e39OuterHalfW(sideZ), e39OuterHalfW(sideZ) - 0.016, t);
    const halfW = lerp(lerp(0.790, 0.805, t), archEdgeW, cornerWrap);
    const z = lerp(frontRearZ, sideZ, cornerWrap);
    return new THREE.Vector3(u * halfW, y, z);
  };
  const rBumperGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 36; j++) {
      const u = cornerClusterU((j / 36) * 2 - 1, 1.5);
      row.push(e39RearBumperPt(u, t));
    }
    rBumperGrid.push(row);
  }
  const rearBumper = new THREE.Mesh(buildSurfaceGrid(rBumperGrid, true), paintMat);
  rearBumper.castShadow = true;
  shellGroup.add(rearBumper);

  const rearDiffuserGrid: THREE.Vector3[][] = [];
  for (let r = 0; r <= 3; r++) {
    const t = lerp(0.0, 0.30, r / 3);
    const row: THREE.Vector3[] = [];
    for (let c = 0; c <= 18; c++) {
      const u = lerp(-0.68, 0.68, c / 18);
      const p = e39RearBumperPt(u, t);
      row.push(new THREE.Vector3(p.x, p.y, p.z - 0.005));
    }
    rearDiffuserGrid.push(row);
  }
  shellGroup.add(new THREE.Mesh(buildSurfaceGrid(rearDiffuserGrid, true), trimBlackMat));

  const rearRoundel = new THREE.Mesh(new THREE.CircleGeometry(0.032, 24), roundelMat);
  rearRoundel.position.set(0, 0.845, -2.358);
  rearRoundel.rotation.y = Math.PI;
  shellGroup.add(rearRoundel);

  const rearM5Badge = new THREE.Mesh(new THREE.PlaneGeometry(0.115, 0.034), m5BadgeMat);
  rearM5Badge.position.set(-0.50, 0.855, -2.345);
  rearM5Badge.rotation.y = Math.PI;
  shellGroup.add(rearM5Badge);

  const rearPlate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.078, 0.012), plateMat);
  rearPlate.position.set(0, 0.695, -2.360);
  rearPlate.rotation.y = Math.PI;
  shellGroup.add(rearPlate);

  ([-1, 1] as const).forEach((side) => {
    const tl = new THREE.Group();
    tl.position.set(0.55 * side, 0.745, -2.318);
    tl.rotation.y = -side * 0.24;
    tl.add(new THREE.Mesh(buildBeveledBox(0.32, 0.122, 0.022, 0.010, 3), redCelisMat));
    const upperClear = new THREE.Mesh(buildBeveledBox(0.19, 0.044, 0.026, 0.007, 2), whiteLensMat);
    upperClear.position.set(-0.035 * side, 0.035, 0);
    tl.add(upperClear);
    const cornerAmber = new THREE.Mesh(buildBeveledBox(0.105, 0.044, 0.026, 0.007, 2), amberLensMat);
    cornerAmber.position.set(0.108 * side, 0.035, 0);
    tl.add(cornerAmber);
    shellGroup.add(tl);
  });

  // =========================================================================
  // 5. FOUR-DOOR PANELS & DOUBLE-ARM TEARDROP M5 MIRRORS
  // =========================================================================
  const buildDoors = (side: 1 | -1, target: THREE.Group) => {
    const dGrid: THREE.Vector3[][] = [];
    for (let i = 0; i <= 20; i++) {
      const z = lerp(-0.88, 0.78, i / 20);
      dGrid.push(e39SideCol(z, 0.295, e39BeltY(z), 0, null, side));
    }
    const doorSkin = new THREE.Mesh(buildSurfaceGrid(dGrid, side === 1), paintMat);
    doorSkin.castShadow = true;
    target.add(doorSkin);

    const e39HandleGeo = buildBeveledBox(0.018, 0.022, 0.145, 0.007, 3);
    [-0.70, 0.06].forEach((hz) => {
      const h = new THREE.Mesh(e39HandleGeo, paintMat);
      h.position.set(0.858 * side, 0.725, hz);
      target.add(h);
    });

    // Authentic E39 M5 Twin-Arm Oval Mirror anchored to black A-pillar gusset
    const gusset = new THREE.Mesh(
      buildBeveledBox(0.024, 0.088, 0.088, 0.008, 2),
      trimBlackMat,
    );
    gusset.position.set(e39ShoulderX(0.62) * side, 0.875, 0.62);
    target.add(gusset);
    const mArmGeo = buildBeveledBox(0.105, 0.012, 0.022, 0.005, 2);
    [-0.016, 0.016].forEach((ay) => {
      const arm = new THREE.Mesh(mArmGeo, paintMat);
      arm.position.set((e39ShoulderX(0.62) + 0.055) * side, 0.880 + ay, 0.61);
      target.add(arm);
    });
    const mirrorHousing = new THREE.Mesh(new THREE.SphereGeometry(0.060, 22, 16), paintMat);
    mirrorHousing.scale.set(1.05, 0.68, 0.85);
    mirrorHousing.position.set((e39ShoulderX(0.62) + 0.115) * side, 0.885, 0.60);
    target.add(mirrorHousing);

    const dwGrid: THREE.Vector3[][] = [];
    for (let r = 0; r <= 6; r++) {
      const f = r / 6;
      const pFront = e39WsEdgePt(f, side);
      const pBack = new THREE.Vector3(
        lerp(e39ShoulderX(-0.14), e39RoofSideX(-0.14), f) * side,
        lerp(e39BeltY(-0.14), e39RoofSideY(-0.14), f),
        -0.14,
      );
      const row: THREE.Vector3[] = [];
      for (let c = 0; c <= 10; c++) {
        const u = c / 10;
        const p = new THREE.Vector3().lerpVectors(pFront, pBack, u);
        if (r === 6) {
          p.x = e39RoofSideX(p.z) * side;
          p.y = e39RoofSideY(p.z);
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
  buildDoors(1, leftDoorsGroup);
  buildDoors(-1, rightDoorsGroup);

  bodyRoot.add(shellGroup, hoodGroup, trunkGroup, leftDoorsGroup, rightDoorsGroup);

  // =========================================================================
  // 6. DRIVETRAIN: S62 4.9L 90° V8, GETRAG 420G 6-SPD, QUAD TIPS & STYLE 65
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

  const floorPan = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.034, 3.15), common.steelDark);
  floorPan.position.set(0, 0.182, 0);
  chassisGroup.add(floorPan);

  const tunnel = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 2.70), common.steelDark);
  tunnel.position.set(0, 0.24, -0.05);
  chassisGroup.add(tunnel);

  const frontSubframe = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.05, 1.05), common.aluminum);
  frontSubframe.position.set(0, 0.22, fZ);
  chassisGroup.add(frontSubframe);

  const radiator = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.36, 0.05), common.aluminum);
  radiator.position.set(0, 0.42, fZ + 0.68);
  chassisGroup.add(radiator);

  const dash = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.16, 0.32), common.leatherBlack);
  dash.position.set(0, 0.72, 0.56);
  interiorGroup.add(dash);

  const m5Cluster = new THREE.Mesh(
    new THREE.PlaneGeometry(0.46, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: textures.bmwGaugeMap, clippingPlanes }),
  );
  m5Cluster.position.set(0.35, 0.74, 0.395);
  m5Cluster.rotation.y = Math.PI;
  interiorGroup.add(m5Cluster);

  const swGroup = new THREE.Group();
  swGroup.position.set(0.35, 0.75, 0.24);
  swGroup.rotation.x = -0.25;
  swGroup.add(new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.020, 12, 32), common.leatherBlack));
  [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].forEach((a) => {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.155, 0.012), common.leatherBlack);
    sp.position.set(Math.sin(a) * 0.08, Math.cos(a) * 0.08, 0);
    sp.rotation.z = -a;
    swGroup.add(sp);
  });
  interiorGroup.add(swGroup);

  const nappaSeatMat = new THREE.MeshStandardMaterial({
    color: 0x22252b,
    roughness: 0.62,
    metalness: 0.04,
    clippingPlanes,
  });
  ([-1, 1] as const).forEach((side) => {
    const seat = new THREE.Group();
    seat.position.set(0.35 * side, 0.28, -0.22);
    seat.add(new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.10, 0.46), nappaSeatMat));
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.58, 0.10), nappaSeatMat);
    back.position.set(0, 0.31, -0.18);
    back.rotation.x = -0.20;
    seat.add(back);
    interiorGroup.add(seat);
  });
  const rearBench = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.46, 0.52), nappaSeatMat);
  rearBench.position.set(0, 0.46, -0.92);
  interiorGroup.add(rearBench);

  const springGeo = buildHelicalSpring(0.046, 0.20, 6);
  ([-1, 1] as const).forEach((side) => {
    const fg = side === 1 ? frontSuspLeft : frontSuspRight;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.03, 0.16), common.aluminum);
    arm.position.set(0.46 * side, 0.24, fZ);
    fg.add(arm);
    const strut = new THREE.Group();
    strut.position.set(0.60 * side, 0.26, fZ);
    strut.rotation.z = side * 0.18;
    strut.add(
      new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.027, 0.32, 12), common.steelDark),
    );
    const spring = new THREE.Mesh(springGeo, common.steelDark);
    spring.position.y = 0.04;
    strut.add(spring);
    fg.add(strut);

    const rg = side === 1 ? rearSuspLeft : rearSuspRight;
    const zAxleArm = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.032, 0.22), common.aluminum);
    zAxleArm.position.set(0.48 * side, 0.25, rZ);
    rg.add(zAxleArm);
    const rSpring = new THREE.Mesh(springGeo, common.steelDark);
    rSpring.position.set(0.56 * side, 0.26, rZ);
    rg.add(rSpring);
  });

  const engZ = 1.34;
  const engY = 0.35;
  engineBlockGroup.position.set(0, engY, engZ);
  engineTopGroup.position.set(0, engY, engZ);
  exhaustGroup.position.set(0, engY, engZ);

  const blockCore = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.50), common.aluminum);
  engineBlockGroup.add(blockCore);

  const crankshaftGroup = new THREE.Group();
  const crankMain = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.56, 14), common.steelDark);
  crankMain.rotation.x = Math.PI / 2;
  crankshaftGroup.add(crankMain);
  const pulley = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.026, 22), common.aluminum);
  pulley.rotation.x = Math.PI / 2;
  pulley.position.z = 0.29;
  crankshaftGroup.add(pulley);
  engineBlockGroup.add(crankshaftGroup);

  const pistonVisuals: PistonVisual[] = [];
  const zBay = [0.18, 0.06, -0.06, -0.18];
  const halfVRad = Math.PI / 4;
  [
    { num: 1, bankSign: -1 as const, zLocal: zBay[0] + 0.014 },
    { num: 2, bankSign: -1 as const, zLocal: zBay[1] + 0.014 },
    { num: 3, bankSign: -1 as const, zLocal: zBay[2] + 0.014 },
    { num: 4, bankSign: -1 as const, zLocal: zBay[3] + 0.014 },
    { num: 5, bankSign: 1 as const, zLocal: zBay[0] - 0.014 },
    { num: 6, bankSign: 1 as const, zLocal: zBay[1] - 0.014 },
    { num: 7, bankSign: 1 as const, zLocal: zBay[2] - 0.014 },
    { num: 8, bankSign: 1 as const, zLocal: zBay[3] - 0.014 },
  ].forEach((cm) => {
    pistonVisuals.push(
      buildBankedCylinderVisual({
        cylNumber: cm.num,
        bankSign: cm.bankSign,
        bankTiltRad: cm.bankSign * halfVRad,
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

    const bankHdr = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.22 * cm.bankSign, 0.14, cm.zLocal),
      new THREE.Vector3(0.26 * cm.bankSign, 0.02, cm.zLocal - 0.04),
      new THREE.Vector3(0.18 * cm.bankSign, -0.14, -0.28),
    ]);
    exhaustGroup.add(
      new THREE.Mesh(new THREE.TubeGeometry(bankHdr, 10, 0.016, 8, false), common.exhaustBronze),
    );
  });

  const s62Plenum = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.11, 0.46), trimBlackMat);
  s62Plenum.position.set(0, 0.255, -0.01);
  engineTopGroup.add(s62Plenum);

  const mPlaque = new THREE.Mesh(
    new THREE.PlaneGeometry(0.30, 0.075),
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: textures.bmwMPowerPlaqueMap, clippingPlanes }),
  );
  mPlaque.rotation.x = -Math.PI / 2;
  mPlaque.rotation.z = Math.PI / 2;
  mPlaque.position.set(0, 0.312, -0.01);
  engineTopGroup.add(mPlaque);

  ([-1, 1] as const).forEach((s) => {
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.48), common.steelDark);
    cover.position.set(0.19 * s, 0.20, 0);
    cover.rotation.z = -0.78 * s;
    engineTopGroup.add(cover);

    const vanosPod = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.06, 16), common.aluminum);
    vanosPod.rotation.x = Math.PI / 2;
    vanosPod.position.set(0.18 * s, 0.19, 0.27);
    engineTopGroup.add(vanosPod);

    // Tucked underbody exhaust + rear mufflers tucked neatly inside diffuser -> crisp Quad 76mm Chrome Tips!
    const midPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 3.00, 10),
      common.exhaustTitanium,
    );
    midPipe.rotation.x = Math.PI / 2;
    midPipe.position.set(0.14 * s, -0.14, -1.84);
    exhaustGroup.add(midPipe);

    const muffler = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.10, 0.34), common.steelDark);
    muffler.position.set(0.42 * s, -0.10, -3.32);
    exhaustGroup.add(muffler);

    [-0.042, 0.042].forEach((txOff) => {
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.16, 16), chromeMat);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(0.42 * s + txOff, -0.11, -3.65);
      exhaustGroup.add(tip);
    });
  });

  engineRootGroup.add(engineBlockGroup, engineTopGroup, exhaustGroup);

  const g420 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.56, 16), common.magnesium);
  g420.rotation.x = Math.PI / 2;
  g420.position.set(0, 0.30, 0.72);
  transaxleGroup.add(g420);

  const propShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.85, 12), common.steelDark);
  propShaft.rotation.x = Math.PI / 2;
  propShaft.position.set(0, 0.29, -0.45);
  transaxleGroup.add(propShaft);

  const rearDiff = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.30), common.aluminum);
  rearDiff.position.set(0, 0.30, rZ);
  transaxleGroup.add(rearDiff);

  ([-1, 1] as const).forEach((s) => {
    const hs = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.64, 10), common.steelDark);
    hs.rotation.z = Math.PI / 2;
    hs.position.set(0.46 * s, 0.305, rZ);
    transaxleGroup.add(hs);
  });

  // =========================================================================
  // 7. 18" BMW STYLE 65 CHROME-SHADOW WHEELS & 345MM ROTORS
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
    const trackHalf = (isFront ? spec.frontTrack : spec.rearTrack) * 0.5 - 0.018;
    const zPos = isFront ? fZ : rZ;

    const wheelGroup = new THREE.Group();
    wheelGroup.name = 'wheels';
    wheelGroup.position.set(trackHalf * sideSign, outerR, zPos);

    const tire = new THREE.Mesh(buildTireProfile(outerR, rimR, width), common.tire);
    tire.castShadow = true;
    wheelGroup.add(tire);

    wheelGroup.add(new THREE.Mesh(buildDeepDishRimLip(rimR, width, sideSign, 0.72), style65Mat));

    const e39SpokeGeo = buildBeveledBox(0.016, rimR * 0.88, 0.014, 0.004, 2);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      [-0.22, 0.22].forEach((offset) => {
        const spoke = new THREE.Mesh(e39SpokeGeo, style65Mat);
        spoke.position.set(
          width * 0.16 * sideSign,
          Math.cos(a + offset * 0.5) * rimR * 0.45,
          Math.sin(a + offset * 0.5) * rimR * 0.45,
        );
        spoke.rotation.x = a + offset;
        wheelGroup.add(spoke);
      });
    }

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 0.022, 24), style65Mat);
    cap.rotation.z = Math.PI / 2;
    cap.position.x = width * 0.20 * sideSign;
    wheelGroup.add(cap);

    const roundelCap = new THREE.Mesh(new THREE.CircleGeometry(0.022, 24), roundelMat);
    roundelCap.rotation.y = sideSign === 1 ? Math.PI / 2 : -Math.PI / 2;
    roundelCap.position.x = (width * 0.20 + 0.012) * sideSign;
    wheelGroup.add(roundelCap);

    const hubBrakeGroup = new THREE.Group();
    hubBrakeGroup.name = 'wheels';
    hubBrakeGroup.position.set((trackHalf - 0.04) * sideSign, outerR, zPos);

    const discR = (isFront ? spec.frontDiscDiameter : spec.rearDiscDiameter) * 0.5;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(discR, discR, 0.026, 36), common.disc);
    disc.rotation.z = Math.PI / 2;
    hubBrakeGroup.add(disc);

    const caliper = new THREE.Mesh(
      buildBeveledBox(0.062, 0.115, 0.135, 0.014, 3),
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
    trunkGroup.position.set(0, shellLift + p.ducktailLiftY, p.ducktailBackZ);
    trunkGroup.rotation.x = p.ducktailTiltX;
    leftDoorsGroup.position.set(p.doorOutX * 1.15, shellLift * 0.85, 0);
    rightDoorsGroup.position.set(-p.doorOutX * 1.15, shellLift * 0.85, 0);

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
      amberLensMat,
      redCelisMat,
      whiteLensMat,
      plateMat,
    ],
    glassMaterials: [glassMat],
    lensMaterials: [lensMat, angelEyeMat],
    decalMaterials: [roundelMat, m5BadgeMat],
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
      style65Mat.color.set(livery.wheelAccentHex);
    },
    setEngineXray: (xray: boolean) => {
      common.cylinderLiner.transparent = xray;
      common.cylinderLiner.opacity = xray ? 0.28 : 1.0;
      common.cylinderLiner.depthWrite = !xray;
      common.cylinderLiner.needsUpdate = true;
    },
  };
}
