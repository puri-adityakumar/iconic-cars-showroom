import * as THREE from 'three';
import {
  buildBeveledBox,
  buildSurfaceGrid,
  cornerClusterU,
  sampleArchZ,
} from './carCommon';
import { PORSCHE_SPECS } from './specs';
import { ProceduralTextures } from './textures';

export interface BodyMaterials {
  paint: THREE.MeshPhysicalMaterial;
  trimBlack: THREE.MeshStandardMaterial;
  chrome: THREE.MeshStandardMaterial;
  glass: THREE.MeshPhysicalMaterial;
  headlightGlass: THREE.MeshPhysicalMaterial;
  amberLens: THREE.MeshStandardMaterial;
  tailRedLens: THREE.MeshStandardMaterial;
  reverseWhiteLens: THREE.MeshStandardMaterial;
  carreraSideMat: THREE.MeshPhysicalMaterial;
  rearPorscheMat: THREE.MeshStandardMaterial;
  licensePlateMat: THREE.MeshStandardMaterial;
  rearBadgeMat: THREE.MeshStandardMaterial;
  bumperStripe: THREE.MeshStandardMaterial;
}

export interface Porsche911BodyRig {
  root: THREE.Group;
  bodyShellGroup: THREE.Group;
  frontHoodGroup: THREE.Group;
  ducktailGroup: THREE.Group;
  leftDoorGroup: THREE.Group;
  rightDoorGroup: THREE.Group;
  materials: BodyMaterials;
  setLivery: (bodyHex: string, scriptHex: string, textures: ProceduralTextures) => void;
}

function catmullY(pts: Array<[number, number]>, z: number): number {
  const curve = new THREE.SplineCurve(pts.map(([pz, py]) => new THREE.Vector2(pz, py)));
  const minZ = pts[0][0];
  const maxZ = pts[pts.length - 1][0];
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) * 0.5;
    const p = curve.getPoint(mid);
    if ((maxZ > minZ && p.x < z) || (maxZ < minZ && p.x > z)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return curve.getPoint((lo + hi) * 0.5).y;
}

function wheelArchHeight(z: number, centerZ: number, centerY: number, radius: number): number | null {
  const dz = z - centerZ;
  if (Math.abs(dz) >= radius) return null;
  return centerY + Math.sqrt(Math.max(0, radius * radius - dz * dz));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Builds the 1973 Porsche 911 Carrera RS 2.7 sculptural body, glazing, lights, and trim.
 * Coordinates: +Z Front, -Z Rear, +Y Up, +X Left (Driver).
 */
export function buildPorsche911Body(
  textures: ProceduralTextures,
  isSoftwareGl: boolean,
  clippingPlanes: THREE.Plane[],
): Porsche911BodyRig {
  const root = new THREE.Group();
  root.name = 'porsche_body_root';

  const bodyShellGroup = new THREE.Group();
  bodyShellGroup.name = 'body';
  const frontHoodGroup = new THREE.Group();
  frontHoodGroup.name = 'body';
  const ducktailGroup = new THREE.Group();
  ducktailGroup.name = 'body';
  const leftDoorGroup = new THREE.Group();
  leftDoorGroup.name = 'body';
  const rightDoorGroup = new THREE.Group();
  rightDoorGroup.name = 'body';

  const materials: BodyMaterials = {
    paint: new THREE.MeshPhysicalMaterial({
      color: 0xf3f2ed,
      metalness: 0.05,
      roughness: 0.14,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      ior: 1.56,
      envMapIntensity: 1.44,
      side: THREE.DoubleSide,
      clippingPlanes,
    }),
    trimBlack: new THREE.MeshStandardMaterial({
      color: 0x16181c,
      metalness: 0.12,
      roughness: 0.68,
      side: THREE.DoubleSide,
      clippingPlanes,
    }),
    chrome: new THREE.MeshStandardMaterial({
      color: 0xeef3f8,
      metalness: 0.96,
      roughness: 0.075,
      envMapIntensity: 1.45,
      side: THREE.DoubleSide,
      clippingPlanes,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x1b242d,
      metalness: 0.04,
      roughness: 0.04,
      transmission: isSoftwareGl ? 0 : 0.56,
      transparent: true,
      opacity: isSoftwareGl ? 0.46 : 0.48,
      ior: 1.52,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      depthWrite: false,
      side: THREE.DoubleSide,
      clippingPlanes,
    }),
    headlightGlass: new THREE.MeshPhysicalMaterial({
      color: 0xf5f9ff,
      map: textures.headlightFresnelMap,
      metalness: 0.06,
      roughness: 0.06,
      transparent: true,
      opacity: 0.56,
      clearcoat: 1.0,
      depthWrite: false,
      clippingPlanes,
    }),
    amberLens: new THREE.MeshStandardMaterial({
      color: 0xea7c0e,
      emissive: 0x622600,
      emissiveIntensity: 0.42,
      bumpMap: textures.taillightBump,
      bumpScale: 0.004,
      roughness: 0.14,
      metalness: 0.12,
      clippingPlanes,
    }),
    tailRedLens: new THREE.MeshStandardMaterial({
      color: 0xc2121e,
      emissive: 0x52060a,
      emissiveIntensity: 0.44,
      bumpMap: textures.taillightBump,
      bumpScale: 0.004,
      roughness: 0.14,
      metalness: 0.10,
      clippingPlanes,
    }),
    reverseWhiteLens: new THREE.MeshStandardMaterial({
      color: 0xf0f2f5,
      bumpMap: textures.taillightBump,
      bumpScale: 0.003,
      roughness: 0.16,
      metalness: 0.12,
      clippingPlanes,
    }),
    carreraSideMat: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: textures.carreraSideStripe('#d6182b', '#f3f2ed'),
      transparent: true,
      alphaTest: 0.06,
      metalness: 0.04,
      roughness: 0.22,
      clearcoat: 0.95,
      clearcoatRoughness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      clippingPlanes,
    }),
    rearPorscheMat: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.rearPorscheLetteringMap('#d6182b'),
      transparent: true,
      alphaTest: 0.06,
      roughness: 0.28,
      metalness: 0.12,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      clippingPlanes,
    }),
    licensePlateMat: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.licensePlateMap,
      roughness: 0.42,
      metalness: 0.08,
      clippingPlanes,
    }),
    rearBadgeMat: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.rearCarreraBadgeMap,
      transparent: true,
      alphaTest: 0.06,
      roughness: 0.26,
      metalness: 0.55,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      clippingPlanes,
    }),
    bumperStripe: new THREE.MeshStandardMaterial({
      color: 0xd6182b,
      roughness: 0.34,
      metalness: 0.08,
      clippingPlanes,
    }),
  };

  const frontZ = PORSCHE_SPECS.frontAxleZ; // +1.1355
  const rearZ = PORSCHE_SPECS.rearAxleZ; // -1.1355

  // Longitudinal silhouette curves calibrated against Porsche Museum 1973 Carrera RS 2.7 side & 3/4 views
  const fenderCrownY = (z: number) =>
    catmullY(
      [
        [-2.04, 0.575],
        [-1.84, 0.722],
        [-1.46, 0.838],
        [-1.14, 0.856], // muscular flared RS rear haunch
        [-0.72, 0.784],
        [0.0, 0.764], // taut waist beltline
        [0.64, 0.742], // windshield cowl
        [1.14, 0.732], // classic upright front fender torpedo crest
        [1.52, 0.708],
        [1.74, 0.668], // smooth sugar-scoop brow
        [1.83, 0.616],
        [1.91, 0.455],
      ],
      z,
    );

  const hoodCenterY = (z: number) =>
    catmullY(
      [
        [0.62, 0.742],
        [1.05, 0.654], // classic sculpted hood valley between front torpedo fenders
        [1.48, 0.562],
        [1.80, 0.488],
        [1.955, 0.446],
      ],
      z,
    );

  // Sleek low-slung fastback roof flyline matching Porsche Museum side silhouette
  const roofFlylineY = (z: number) =>
    catmullY(
      [
        [-1.76, 0.855],
        [-1.36, 0.876], // rear window deck base
        [-0.90, 1.042], // fastback C-pillar sweep
        [-0.42, 1.224], // rear cabin header
        [-0.08, 1.268], // roof apex (1.268 + 0.025 crown = 1.293 m)
        [0.20, 1.232], // windshield top header
        [0.635, 0.742], // cowl base
      ],
      z,
    );

  const bodyHalfWidth = (z: number) => {
    const base = 0.782;
    const rearFlare = 0.080 * Math.exp(-Math.pow((z - rearZ) / 0.37, 2));
    const frontFlare = 0.036 * Math.exp(-Math.pow((z - frontZ) / 0.35, 2));
    const frontTaper = 0.145 * smoothstep(1.50, 1.93, z);
    const rearTaper = 0.128 * smoothstep(-1.58, -2.04, z);
    return base + rearFlare + frontFlare - frontTaper - rearTaper;
  };

  // Shared cabin side-glass tumblehome helpers so A/B/C pillars, drip rails & glazing align cleanly
  const cabinSillY = (z: number) => lerp(0.784, 0.744, smoothstep(-0.90, 0.64, z));
  const cabinRoofEdgeX = (z: number) => lerp(0.518, 0.548, smoothstep(-1.10, 0.10, z));
  const cabinBeltX = (z: number) => bodyHalfWidth(z) - 0.084;

  // =========================================================================
  // 1. CONTINUOUS SCULPTED FENDERS, FLARED REAR QUARTERS & ROCKER SILLS
  // =========================================================================
  const buildFenderSpan = (
    zStart: number,
    zEnd: number,
    _zSteps: number,
    sideSign: 1 | -1,
    wheelCenterZ: number,
    wheelCenterY: number,
    archRadius: number,
    isFront: boolean,
  ) => {
    const grid: THREE.Vector3[][] = [];
    const vSteps = 18;
    const zSamples = sampleArchZ(zStart, zEnd, wheelCenterZ, archRadius, 12, 34);

    for (let i = 0; i < zSamples.length; i++) {
      const z = zSamples[i];
      const maxW = bodyHalfWidth(z);
      const innerX = isFront
        ? lerp(0.472, 0.402, smoothstep(0.64, 1.93, z))
        : lerp(0.492, 0.448, smoothstep(-0.74, -2.04, z));
      const topY = fenderCrownY(z);
      const archY = wheelArchHeight(z, wheelCenterZ, wheelCenterY, archRadius);

      // Continuous RS rocker height (0.165) between axles, sweeping smoothly to bumper tops ahead/behind wheels (zero arch spikes)
      let bottomY = 0.165;
      if (isFront && z > wheelCenterZ + archRadius * 0.74) {
        bottomY = lerp(0.165, 0.436, smoothstep(wheelCenterZ + archRadius * 0.74, 1.50, z));
      } else if (!isFront && z < wheelCenterZ - archRadius * 0.74) {
        bottomY = lerp(0.165, 0.415, smoothstep(wheelCenterZ - archRadius * 0.74, -1.52, z));
        if (z < -1.42) {
          bottomY = Math.max(bottomY, lerp(0.305, 0.415, smoothstep(-1.42, -1.52, z)));
        }
      }

      const absDz = Math.abs(z - wheelCenterZ);
      const archBlend = 1 - smoothstep(archRadius * 0.88, archRadius * 1.06, absDz);
      if (archY !== null) {
        const roundedArchY = lerp(
          bottomY,
          archY - 0.004,
          1 - smoothstep(archRadius * 0.88, archRadius, absDz) * 0.25,
        );
        bottomY = Math.max(bottomY, roundedArchY);
      }
      bottomY = Math.min(bottomY, topY - 0.008);

      // Smooth front nose & rear corner wrap so outer fenders terminate flush onto front & rear bumpers
      const noseWrap = isFront ? smoothstep(1.56, 1.92, z) : 0;
      const tailWrap = !isFront ? smoothstep(-1.68, -2.04, z) : 0;
      const lipOut = 0.015 * archBlend;

      const archStartX = maxW + 0.006 + lipOut * 0.65;
      const crownX = lerp(innerX, maxW, isFront ? 0.56 : 0.54);
      const shoulderX = lerp(maxW + 0.010 + lipOut * 0.48, crownX, noseWrap * 0.82 + tailWrap * 0.52);
      const startX = lerp(archStartX, lerp(crownX, maxW * 0.86, 0.4), noseWrap * 0.82 + tailWrap * 0.55);

      const shoulderY = lerp(bottomY, topY, 0.42);
      const seamTargetX = isFront ? innerX - 0.026 : bodyHalfWidth(z) - 0.020;
      const targetSeamY = isFront ? hoodCenterY(z) - 0.012 : topY - 0.006;

      const row: THREE.Vector3[] = [];
      for (let j = 0; j <= vSteps; j++) {
        const v = j / vSteps;
        let x: number;
        let y: number;
        if (v <= 0.40) {
          const t = v / 0.40;
          x = lerp(startX, shoulderX, Math.sin(t * Math.PI * 0.5));
          y = lerp(bottomY, shoulderY, t);
        } else if (v <= 0.78) {
          const t = (v - 0.40) / 0.38;
          x = lerp(shoulderX, crownX, t * t);
          y = lerp(shoulderY, topY, Math.sin(t * Math.PI * 0.5));
        } else {
          const t = (v - 0.78) / 0.22;
          x = lerp(crownX, seamTargetX, t);
          y = lerp(topY, targetSeamY, t);
        }

        // Clamp front & rear outer fender wrap tightly onto curved bumper corners, strictly behind signals & headlight reflector
        let zOut = z;
        if (isFront && z > 1.50) {
          const uB = Math.min(1, Math.abs(x) / 0.778);
          const zBumper = lerp(1.945, 1.485, Math.pow(uB, 3.2));
          const maxUpperZ = Math.min(1.920, zBumper + 0.028);
          const noseLim =
            y < 0.482
              ? zBumper - 0.010
              : lerp(zBumper - 0.008, maxUpperZ, smoothstep(0.56, 0.96, v));
          zOut = Math.min(z, noseLim);
          if (Math.abs(x - 0.558) < 0.104 && y > 0.470 && y < 0.680) {
            const hlFaceZ = 1.760 + (0.576 - y) * 0.495;
            zOut = Math.min(zOut, hlFaceZ - 0.016);
          }
        } else if (!isFront && z < -1.68) {
          const uR = Math.min(1, Math.abs(x) / 0.678);
          const zRearEdge = lerp(-2.044, -1.889, Math.pow(uR, 2.40));
          const tailLim = lerp(zRearEdge + 0.004, -2.010, smoothstep(0.60, 0.96, v));
          zOut = Math.max(z, tailLim);
        }
        row.push(new THREE.Vector3(x * sideSign, y, zOut));
      }
      grid.push(row);
    }

    const geo = buildSurfaceGrid(grid, sideSign === 1);
    const mesh = new THREE.Mesh(geo, materials.paint);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    bodyShellGroup.add(mesh);

    // Dark recessed wheel well inner arch liner + semicircular splash bulkhead
    const linerCurvePts: THREE.Vector3[] = [];
    for (let k = 0; k <= 36; k++) {
      const a = (k / 36) * Math.PI;
      const lz = wheelCenterZ + Math.cos(a) * (archRadius - 0.012);
      const rawLy = wheelCenterY + Math.sin(a) * (archRadius - 0.012);
      const maxSafeLy = isFront ? hoodCenterY(lz) - 0.048 : fenderCrownY(lz) - 0.048;
      linerCurvePts.push(new THREE.Vector3(0, Math.min(rawLy, maxSafeLy), lz));
    }
    const linerGrid: THREE.Vector3[][] = linerCurvePts.map((pt) => [
      new THREE.Vector3((bodyHalfWidth(pt.z) - 0.015) * sideSign, pt.y, pt.z),
      new THREE.Vector3((isFront ? 0.51 : 0.48) * sideSign, pt.y - 0.02, pt.z),
    ]);
    bodyShellGroup.add(
      new THREE.Mesh(buildSurfaceGrid(linerGrid, sideSign === 1, 1, 1, 1), materials.trimBlack),
    );

    const innerWellWall = new THREE.Mesh(
      new THREE.CircleGeometry(archRadius - 0.028, 40, 0, Math.PI),
      materials.trimBlack,
    );
    innerWellWall.position.set(
      (isFront ? 0.49 : 0.47) * sideSign,
      isFront ? 0.21 : 0.22,
      wheelCenterZ,
    );
    innerWellWall.rotation.y = sideSign === 1 ? Math.PI / 2 : -Math.PI / 2;
    bodyShellGroup.add(innerWellWall);

    // Crisp rolled RS wheel-arch flare lip hugging exact opening
    const archLipPts: THREE.Vector3[] = [];
    for (let k = 0; k <= 40; k++) {
      const u = k / 40;
      const ang = lerp(-0.04, Math.PI + 0.04, u);
      const az = wheelCenterZ + Math.cos(ang) * archRadius;
      const ay = Math.max(0.165, wheelCenterY + Math.sin(ang) * archRadius);
      const endFade = Math.pow(Math.sin(u * Math.PI), 0.75);
      const ax = (bodyHalfWidth(az) - 0.002 + 0.015 * endFade) * sideSign;
      archLipPts.push(new THREE.Vector3(ax, ay, az));
    }
    const archLip = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archLipPts), 48, 0.0085, 10, false),
      materials.paint,
    );
    archLip.castShadow = true;
    bodyShellGroup.add(archLip);

    // Subtle fuel-filler door shutline on left (+X) front fender ahead of A-pillar
    if (isFront && sideSign === 1) {
      const fillerPts: THREE.Vector3[] = [];
      for (let k = 0; k <= 16; k++) {
        const ang = (k / 16) * Math.PI * 2;
        const fz = 0.805 + Math.cos(ang) * 0.044;
        const fy = 0.728 + Math.sin(ang) * 0.024;
        const fx = bodyHalfWidth(fz) - 0.088 - Math.sin(ang) * 0.032;
        fillerPts.push(new THREE.Vector3(fx, fy, fz));
      }
      bodyShellGroup.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fillerPts, true), 20, 0.0018, 4, true),
          materials.trimBlack,
        ),
      );
    }
  };

  // Build front fenders and rear flared RS quarters + flush painted RS rocker sills
  ([-1, 1] as const).forEach((side) => {
    buildFenderSpan(0.625, 1.920, 52, side, frontZ, PORSCHE_SPECS.frontTireRadius, 0.340, true);
    buildFenderSpan(-2.04, -0.730, 52, side, rearZ, PORSCHE_SPECS.rearTireRadius, 0.344, false);

    // Seamless painted rocker sill beneath door matching exact fender lower contour (y = 0.165)
    const sillGrid: THREE.Vector3[][] = [];
    for (let i = 0; i <= 14; i++) {
      const z = lerp(-0.735, 0.630, i / 14);
      const w = bodyHalfWidth(z);
      sillGrid.push([
        new THREE.Vector3((w - 0.068) * side, 0.165, z),
        new THREE.Vector3((w - 0.006) * side, 0.165, z),
        new THREE.Vector3((w + 0.006) * side, 0.222, z),
        new THREE.Vector3((w + 0.008) * side, 0.280, z),
      ]);
    }
    const sillMesh = new THREE.Mesh(buildSurfaceGrid(sillGrid, side === 1), materials.paint);
    sillMesh.castShadow = true;
    sillMesh.receiveShadow = true;
    bodyShellGroup.add(sillMesh);

    // Subtle dark lower sill pinch shadow flange (RS 2.7 clean painted sill without thick rubber bar)
    const pinchFlange = new THREE.Mesh(
      new THREE.BoxGeometry(0.010, 0.008, 1.355),
      materials.trimBlack,
    );
    pinchFlange.position.set(0.774 * side, 0.166, -0.052);
    bodyShellGroup.add(pinchFlange);

    // Continuing Carrera side accent bands onto front & rear wheel arch flanks (outward-facing on BOTH sides)
    const capZones: Array<[number, number, number, number]> = [
      [0.630, 0.785, 0.01, 0.16],
      [-0.785, -0.735, 0.84, 0.99],
    ];
    capZones.forEach(([zA, zB, uStart, uEnd]) => {
      const capGrid: THREE.Vector3[][] = [];
      for (let r = 0; r <= 3; r++) {
        const y = lerp(0.228, 0.356, r / 3);
        const row: THREE.Vector3[] = [];
        for (let c = 0; c <= 4; c++) {
          const z = lerp(zA, zB, side === 1 ? 1 - c / 4 : c / 4);
          const w = bodyHalfWidth(z) + 0.012;
          row.push(new THREE.Vector3(w * side, y, z));
        }
        capGrid.push(row);
      }
      const capGeo = buildSurfaceGrid(capGrid, true);
      const uvAttr = capGeo.getAttribute('uv');
      for (let k = 0; k < uvAttr.count; k++) {
        const uVal = uvAttr.getX(k);
        uvAttr.setX(k, lerp(uStart, uEnd, uVal));
      }
      uvAttr.needsUpdate = true;
      bodyShellGroup.add(new THREE.Mesh(capGeo, materials.carreraSideMat));
    });
  });

  // =========================================================================
  // 2. SLEEK FASTBACK ROOF, TEARDROP QUARTER WINDOWS & SEAMLESS PILLARS
  // =========================================================================
  const roofGrid: THREE.Vector3[][] = [];
  const roofZSteps = 18;
  const roofXSteps = 12;
  for (let i = 0; i <= roofZSteps; i++) {
    const t = i / roofZSteps;
    const z = lerp(-0.42, 0.20, t);
    const yPeak = roofFlylineY(z);
    const halfRoofW = cabinRoofEdgeX(z);
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= roofXSteps; j++) {
      const u = (j / roofXSteps) * 2 - 1;
      const x = u * halfRoofW;
      const crown = (1 - u * u) * 0.025;
      row.push(new THREE.Vector3(x, yPeak + crown, z));
    }
    roofGrid.push(row);
  }
  const roofMesh = new THREE.Mesh(buildSurfaceGrid(roofGrid, false), materials.paint);
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  bodyShellGroup.add(roofMesh);

  // Dark matte interior headliner + rear parcel shelf behind back seat
  const headlinerGrid: THREE.Vector3[][] = roofGrid.map((row) =>
    row.map((pt) => new THREE.Vector3(pt.x * 0.96, pt.y - 0.014, pt.z)),
  );
  bodyShellGroup.add(
    new THREE.Mesh(buildSurfaceGrid(headlinerGrid, true), materials.trimBlack),
  );

  const rearParcelShelf = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 0.04, 0.52),
    materials.trimBlack,
  );
  rearParcelShelf.position.set(0, 0.72, -0.94);
  bodyShellGroup.add(rearParcelShelf);

  // Rear Quarter Windows, Solid Painted Fastback C-Pillar Sail Panels & Drip Rails
  ([-1, 1] as const).forEach((side) => {
    // Upper arched roofline guide matching exact glass/drip-rail curve
    const qTopArchZ = [-0.30, -0.45, -0.65, -0.84, -0.94];
    const qTopPts = qTopArchZ.map((qz, idx) => {
      const rx =
        idx === 4
          ? cabinBeltX(-0.94) + 0.014
          : lerp(cabinRoofEdgeX(qz), 0.620, smoothstep(-0.42, -0.94, qz));
      const ry =
        idx === 4
          ? cabinSillY(-0.94) + 0.048
          : roofFlylineY(qz) - lerp(0.008, 0.028, smoothstep(-0.42, -0.94, qz));
      return new THREE.Vector3(rx * side, ry, qz);
    });
    const qBotArchZ = [-0.30, -0.45, -0.63, -0.80, -0.94];
    const qBotPts = qBotArchZ.map(
      (qz, idx) =>
        new THREE.Vector3(
          (cabinBeltX(qz) + (idx === 4 ? 0.014 : 0)) * side,
          cabinSillY(qz) + (idx === 4 ? 0.048 : 0.008),
          qz,
        ),
    );

    // Teardrop Rear Quarter Pop-Out Glass
    const qWinGrid: THREE.Vector3[][] = [];
    for (let r = 0; r <= 5; r++) {
      const f = r / 5;
      const row: THREE.Vector3[] = [];
      for (let c = 0; c < qTopPts.length; c++) {
        row.push(new THREE.Vector3().lerpVectors(qBotPts[c], qTopPts[c], f));
      }
      qWinGrid.push(row);
    }
    const qWinMesh = new THREE.Mesh(buildSurfaceGrid(qWinGrid, side === 1), materials.glass);
    qWinMesh.renderOrder = 2;
    bodyShellGroup.add(qWinMesh);

    // Overshoot-free quarter window frame: straight upright B-pillar bar + continuous open teardrop C-curve
    bodyShellGroup.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.LineCurve3(qBotPts[0], qTopPts[0]), 4, 0.0052, 6, false),
        materials.chrome,
      ),
    );
    const qPerimeterPts = [
      qTopPts[0],
      qTopPts[1],
      qTopPts[2],
      qTopPts[3],
      qTopPts[4],
      qBotPts[3],
      qBotPts[2],
      qBotPts[1],
      qBotPts[0],
    ];
    // Overshoot-free quarter window frame: dark rubber interior gasket + proud exterior chrome surround
    const qTeardropCurve = new THREE.CatmullRomCurve3(qPerimeterPts, false, 'centripetal', 0.5);
    bodyShellGroup.add(
      new THREE.Mesh(new THREE.TubeGeometry(qTeardropCurve, 32, 0.0068, 6, false), materials.trimBlack),
    );
    const qChromeOuterPts = qPerimeterPts.map((pt) => new THREE.Vector3(pt.x + 0.004 * side, pt.y, pt.z));
    bodyShellGroup.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(qChromeOuterPts, false, 'centripetal', 0.5),
          32,
          0.0042,
          6,
          false,
        ),
        materials.chrome,
      ),
    );
    const qClasp = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.026, 0.016), materials.chrome);
    qClasp.position.set(0.646 * side, 0.875, -0.875);
    bodyShellGroup.add(qClasp);

    // Solid sculpted C-pillar wrapping seamlessly behind the teardrop quarter window (-0.94 to -1.36)
    const sailGrid: THREE.Vector3[][] = [];
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      const zBot = lerp(-0.94, -1.36, t);
      const zMid = lerp(-0.84, -1.36, t);
      const zTop = lerp(-0.60, -1.36, t);

      const yBot = fenderCrownY(zBot);
      const xBot = lerp(cabinBeltX(-0.94), 0.620, t);
      const yTop = roofFlylineY(zTop);
      const xTop = lerp(cabinRoofEdgeX(zTop), 0.494, smoothstep(-0.60, -1.36, zTop));

      const row: THREE.Vector3[] = [];
      for (let c = 0; c <= 4; c++) {
        const f = c / 4;
        const crown = Math.sin(f * Math.PI) * 0.009;
        row.push(
          new THREE.Vector3(
            lerp(xBot, xTop, f) * side + crown * side * 0.4,
            lerp(yBot - 0.008, yTop + 0.004, f) + crown,
            lerp(lerp(zBot, zMid, Math.min(1, f * 2)), zTop, Math.max(0, f * 2 - 1)),
          ),
        );
      }
      sailGrid.push(row);
    }
    const sailMesh = new THREE.Mesh(buildSurfaceGrid(sailGrid, side !== 1), materials.paint);
    sailMesh.castShadow = true;
    sailMesh.receiveShadow = true;
    bodyShellGroup.add(sailMesh);

    // Lower C-pillar filler skirt closing gap behind quarter-window rounded corner (-0.94..-0.73)
    const cornerFillGrid: THREE.Vector3[][] = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const z = lerp(-0.94, -0.73, t);
      const botY = fenderCrownY(z) - 0.012;
      const topY = lerp(cabinSillY(-0.94) + 0.048, cabinSillY(-0.73) + 0.010, t);
      const xOuter = cabinBeltX(z) + 0.010;
      cornerFillGrid.push([
        new THREE.Vector3(xOuter * side, botY, z),
        new THREE.Vector3((xOuter - 0.008) * side, topY, z),
      ]);
    }
    bodyShellGroup.add(
      new THREE.Mesh(buildSurfaceGrid(cornerFillGrid, side === 1), materials.paint),
    );

    // Dark interior C-pillar trim backing
    const innerSailGrid: THREE.Vector3[][] = sailGrid.map((row) =>
      row.map((pt) => new THREE.Vector3(pt.x - 0.012 * side, pt.y - 0.008, pt.z)),
    );
    bodyShellGroup.add(
      new THREE.Mesh(buildSurfaceGrid(innerSailGrid, side !== 1), materials.trimBlack),
    );

    // Sculpted painted A-pillar following exact windshield edge
    const aPillarCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.640 * side, 0.742, 0.630),
      new THREE.Vector3(0.594 * side, 1.005, 0.425),
      new THREE.Vector3(cabinRoofEdgeX(0.20) * side, roofFlylineY(0.20), 0.200),
    ]);
    const aPillar = new THREE.Mesh(
      new THREE.TubeGeometry(aPillarCurve, 16, 0.018, 8, false),
      materials.paint,
    );
    aPillar.castShadow = true;
    bodyShellGroup.add(aPillar);

    // Slim matte-black B-pillar upright tucked cleanly beneath chrome drip rail
    const bPillarCurve = new THREE.LineCurve3(
      new THREE.Vector3(cabinBeltX(-0.30) * side, cabinSillY(-0.30), -0.30),
      new THREE.Vector3(cabinRoofEdgeX(-0.29) * side, roofFlylineY(-0.29) - 0.010, -0.29),
    );
    bodyShellGroup.add(
      new THREE.Mesh(new THREE.TubeGeometry(bPillarCurve, 4, 0.012, 8, false), materials.trimBlack),
    );

    // Iconic bright chrome drip-rail gutter tracing the 911 roofline
    const dripCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.646 * side, 0.748, 0.628),
      new THREE.Vector3((cabinRoofEdgeX(0.20) + 0.005) * side, roofFlylineY(0.20) + 0.004, 0.20),
      new THREE.Vector3((cabinRoofEdgeX(-0.08) + 0.007) * side, roofFlylineY(-0.08) + 0.002, -0.08),
      new THREE.Vector3((cabinRoofEdgeX(-0.42) + 0.007) * side, roofFlylineY(-0.42) + 0.004, -0.42),
      new THREE.Vector3(0.588 * side, 0.962, -1.04),
      new THREE.Vector3(0.625 * side, 0.868, -1.35),
    ]);
    bodyShellGroup.add(
      new THREE.Mesh(new THREE.TubeGeometry(dripCurve, 34, 0.0072, 6, false), materials.chrome),
    );
  });

  // Curved Front Windshield Glass + Rubber Gasket + Chrome Insert + Twin Wipers
  const wsGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const zBase = lerp(0.630, 0.20, t);
    const yBase = lerp(0.742, roofFlylineY(0.20), t);
    const halfW = lerp(0.636, cabinRoofEdgeX(0.20), t);
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 12; j++) {
      const u = (j / 12) * 2 - 1;
      const bowZ = (1 - u * u) * 0.048;
      const headerCam = lerp(0.015, 0.025, t);
      row.push(new THREE.Vector3(u * halfW, yBase + (1 - u * u) * headerCam, zBase + bowZ));
    }
    wsGrid.push(row);
  }
  const wsMesh = new THREE.Mesh(buildSurfaceGrid(wsGrid, false), materials.glass);
  wsMesh.renderOrder = 2;
  bodyShellGroup.add(wsMesh);

  const wsSealPts: THREE.Vector3[] = [];
  for (let j = 0; j < wsGrid[0].length; j += 2) wsSealPts.push(wsGrid[0][j]);
  for (let i = 2; i < wsGrid.length; i += 2) wsSealPts.push(wsGrid[i][wsGrid[0].length - 1]);
  for (let j = wsGrid[0].length - 3; j >= 0; j -= 2) wsSealPts.push(wsGrid[wsGrid.length - 1][j]);
  for (let i = wsGrid.length - 3; i >= 2; i -= 2) wsSealPts.push(wsGrid[i][0]);
  const wsSealCurve = new THREE.CatmullRomCurve3(wsSealPts, true, 'centripetal', 0.5);
  bodyShellGroup.add(
    new THREE.Mesh(new THREE.TubeGeometry(wsSealCurve, 56, 0.0075, 6, true), materials.trimBlack),
  );

  // Twin black windshield wipers & cowl vent slots (per Porsche Museum reference)
  [-0.24, 0.14].forEach((wx) => {
    const wiper = new THREE.Mesh(
      new THREE.BoxGeometry(0.41, 0.008, 0.012),
      materials.trimBlack,
    );
    wiper.position.set(wx, 0.768, 0.620);
    wiper.rotation.y = 0.06;
    wiper.rotation.z = -0.06;
    bodyShellGroup.add(wiper);
  });

  const cowlVent = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.004, 0.045),
    materials.trimBlack,
  );
  cowlVent.position.set(0, 0.742, 0.660);
  bodyShellGroup.add(cowlVent);

  // Rearview interior mirror
  const rvMirrorStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.048, 8),
    materials.trimBlack,
  );
  rvMirrorStem.position.set(0, roofFlylineY(0.20) - 0.02, 0.26);
  bodyShellGroup.add(rvMirrorStem);
  const rvMirrorBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.036, 0.018),
    materials.trimBlack,
  );
  rvMirrorBody.position.set(0, roofFlylineY(0.20) - 0.044, 0.265);
  bodyShellGroup.add(rvMirrorBody);

  // Curved Fastback Rear Window Glass + Black Gasket
  const rwGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const z = lerp(-1.36, -0.42, t);
    const yBase = roofFlylineY(z);
    const halfW = lerp(0.492, cabinRoofEdgeX(-0.42), t);
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 12; j++) {
      const u = (j / 12) * 2 - 1;
      const crown = (1 - u * u) * lerp(0.018, 0.025, t);
      const bowZ = -(1 - u * u) * 0.028;
      row.push(new THREE.Vector3(u * halfW, yBase + crown, z + bowZ));
    }
    rwGrid.push(row);
  }
  const rwMesh = new THREE.Mesh(buildSurfaceGrid(rwGrid, true), materials.glass);
  rwMesh.renderOrder = 2;
  bodyShellGroup.add(rwMesh);

  const rwSealPts: THREE.Vector3[] = [];
  for (let j = 0; j < rwGrid[0].length; j += 2) rwSealPts.push(rwGrid[0][j]);
  for (let i = 2; i < rwGrid.length; i += 2) rwSealPts.push(rwGrid[i][rwGrid[0].length - 1]);
  for (let j = rwGrid[0].length - 3; j >= 0; j -= 2) rwSealPts.push(rwGrid[rwGrid.length - 1][j]);
  for (let i = rwGrid.length - 3; i >= 2; i -= 2) rwSealPts.push(rwGrid[i][0]);
  const rwSealCurve = new THREE.CatmullRomCurve3(rwSealPts, true, 'centripetal', 0.5);
  bodyShellGroup.add(
    new THREE.Mesh(new THREE.TubeGeometry(rwSealCurve, 56, 0.0075, 6, true), materials.trimBlack),
  );

  // =========================================================================
  // 3. INTEGRATED 1973 RS FRONT BUMPER APRON, CHIN SPOILER & SUGAR SCOOPS
  // =========================================================================
  // Shared wraparound front RS bumper contour sweeping gracefully back to wheel arch (low chin line)
  const frontBumperPoint = (u: number, t: number) => {
    const cornerLift = Math.pow(Math.max(0, Math.abs(u) - 0.58) / 0.42, 1.55) * 0.048;
    const y = lerp(0.184 + cornerLift, 0.440, t);
    const roundCrown = Math.sin(t * Math.PI);
    const centerZ =
      t < 0.25
        ? lerp(2.020, 2.028, t / 0.25)
        : lerp(2.028, 1.945, Math.pow((t - 0.25) / 0.75, 1.15)) + roundCrown * 0.012;
    const sideZ = 1.485;
    const halfW = lerp(0.735, 0.778, Math.pow(t, 0.55));
    const curveFactor = Math.pow(Math.abs(u), 3.2);
    const z = lerp(centerZ, sideZ, curveFactor);
    return new THREE.Vector3(u * halfW, y, z);
  };

  const frontBumperGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 36; j++) {
      const u = cornerClusterU((j / 36) * 2 - 1, 1.5);
      row.push(frontBumperPoint(u, t));
    }
    frontBumperGrid.push(row);
  }
  const frontBumperApron = new THREE.Mesh(
    buildSurfaceGrid(frontBumperGrid, false),
    materials.paint,
  );
  frontBumperApron.castShadow = true;
  frontBumperApron.receiveShadow = true;
  bodyShellGroup.add(frontBumperApron);

  // Top horizontal bumper deck bridging seamlessly under hood nose, horn grilles & fender bottom
  const bumperShelfGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 4; i++) {
    const t = i / 4;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 32; j++) {
      const u = cornerClusterU((j / 32) * 2 - 1, 1.4);
      const outer = frontBumperPoint(u, 1.0);
      row.push(new THREE.Vector3(outer.x * lerp(1.0, 0.85, t), lerp(0.440, 0.445, t), outer.z - t * 0.10));
    }
    bumperShelfGrid.push(row);
  }
  bodyShellGroup.add(new THREE.Mesh(buildSurfaceGrid(bumperShelfGrid, false), materials.paint));

  // Flush recessed matte-black RS front oil-cooler intake slot in lower chin spoiler
  const oilCoolerRecess = new THREE.Mesh(
    buildBeveledBox(0.42, 0.048, 0.014, 0.010, 3),
    materials.trimBlack,
  );
  oilCoolerRecess.position.set(0, 0.214, 2.020);
  oilCoolerRecess.rotation.x = 0.08;
  bodyShellGroup.add(oilCoolerRecess);

  // 3 subtle dark horizontal oil cooler slats
  [-0.012, 0, 0.012].forEach((ly) => {
    const louver = new THREE.Mesh(
      buildBeveledBox(0.40, 0.004, 0.014, 0.002, 2),
      materials.chrome,
    );
    louver.position.set(0, 0.214 + ly, 2.022);
    bodyShellGroup.add(louver);
  });

  // Matte-black lower chin spoiler edge lip hugging exact bottom bumper contour
  const chinLipPts: THREE.Vector3[] = [];
  for (let j = 0; j <= 36; j++) {
    const u = cornerClusterU((j / 36) * 2 - 1, 1.5);
    chinLipPts.push(frontBumperPoint(u, 0.0));
  }
  bodyShellGroup.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(chinLipPts), 48, 0.0075, 10, false),
      materials.trimBlack,
    ),
  );

  // Crisp F-body horizontal chrome + colored RS impact stripe wrapping cleanly to wheel arches
  const trimT = (0.392 - 0.184) / (0.440 - 0.184);
  const frontTrimPts: THREE.Vector3[] = [];
  for (let j = 0; j <= 36; j++) {
    const u = cornerClusterU((j / 36) * 2 - 1, 1.5) * 0.985;
    const p = frontBumperPoint(u, trimT);
    frontTrimPts.push(new THREE.Vector3(p.x * 1.003, p.y, p.z + 0.004));
  }
  bodyShellGroup.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(frontTrimPts), 48, 0.0085, 10, false),
      materials.chrome,
    ),
  );
  const frontRubberPts = frontTrimPts.map((p) => new THREE.Vector3(p.x * 1.004, p.y, p.z + 0.005));
  bodyShellGroup.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(frontRubberPts), 48, 0.0068, 8, false),
      materials.bumperStripe,
    ),
  );

  // Front German License Plate flush on front bumper nose
  const frontPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.076, 0.010),
    materials.licensePlateMat,
  );
  frontPlate.position.set(0, 0.292, 2.042);
  bodyShellGroup.add(frontPlate);

  // Sculpted Integrated Sugar-Scoop Headlights, Black Slatted Horn Grilles & Two-Tone Turn Signals
  ([-1, 1] as const).forEach((side) => {
    const hx = 0.558 * side;
    const hy = 0.576;
    const hz = 1.760;

    const hlGroup = new THREE.Group();
    hlGroup.position.set(hx, hy, hz);
    hlGroup.rotation.x = -0.46;
    hlGroup.rotation.y = side * 0.11;

    // Tapered body-colored sugar-scoop barrel blending smoothly back into the torpedo fender crown
    const scoopBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.098, 0.128, 0.34, 36),
      materials.paint,
    );
    scoopBarrel.rotation.x = Math.PI / 2;
    scoopBarrel.position.z = -0.158;
    hlGroup.add(scoopBarrel);

    // Dark recessed optical housing ring framing reflector depth inside chrome bezel
    const cupRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.086, 0.008, 10, 36),
      materials.trimBlack,
    );
    cupRim.position.z = 0.022;
    hlGroup.add(cupRim);

    // Classic chamfered chrome headlight bezel seated flush at fender nose
    const bezel = new THREE.Mesh(
      new THREE.TorusGeometry(0.095, 0.011, 16, 40),
      materials.chrome,
    );
    bezel.position.z = 0.029;
    hlGroup.add(bezel);

    // Deep parabolic dark-chrome reflector bowl cleanly ahead of sheetmetal clamp
    const reflector = new THREE.Mesh(
      new THREE.CylinderGeometry(0.088, 0.036, 0.042, 32),
      new THREE.MeshStandardMaterial({
        color: 0x4b535e,
        metalness: 0.92,
        roughness: 0.14,
        envMapIntensity: 1.5,
        clippingPlanes,
      }),
    );
    reflector.rotation.x = Math.PI / 2;
    reflector.position.z = 0.006;
    hlGroup.add(reflector);

    // Central H4 bulb cap
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.020, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0xfff6dd,
        emissive: 0xffeed0,
        emissiveIntensity: 0.75,
        clippingPlanes,
      }),
    );
    bulb.position.z = 0.018;
    hlGroup.add(bulb);

    // Clear fluted Fresnel Bosch glass lens
    const lens = new THREE.Mesh(
      new THREE.SphereGeometry(0.090, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.30),
      new THREE.MeshPhysicalMaterial({
        color: 0xe6effa,
        map: textures.headlightFresnelMap,
        metalness: 0.05,
        roughness: 0.06,
        transparent: true,
        opacity: 0.36,
        clearcoat: 1.0,
        depthWrite: false,
        clippingPlanes,
      }),
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.z = 0.018;
    lens.renderOrder = 3;
    hlGroup.add(lens);

    bodyShellGroup.add(hlGroup);

    // Exact bumper corner Z-contour helper so horn grilles & Euro turn signals hug curved corner with zero clipping
    const bumperEdgeZ = (absX: number) =>
      lerp(1.945, 1.485, Math.pow(Math.min(1, absX / 0.778), 3.2));

    const buildCurvedFrontShell = (
      x0: number,
      x1: number,
      y0: number,
      y1: number,
      zBackOff: number,
      zFrontOff: number,
      material: THREE.Material,
    ) => {
      const steps = 6;
      const frontGrid: THREE.Vector3[][] = [];
      const topGrid: THREE.Vector3[][] = [];
      for (let r = 0; r <= 1; r++) {
        const y = r === 0 ? y0 : y1;
        const row: THREE.Vector3[] = [];
        for (let c = 0; c <= steps; c++) {
          const x = lerp(x0, x1, c / steps);
          const z = bumperEdgeZ(x) + zFrontOff;
          row.push(new THREE.Vector3(x * side, y, z));
        }
        frontGrid.push(row);
      }
      for (let r = 0; r <= 1; r++) {
        const zOff = r === 0 ? -zBackOff : zFrontOff;
        const row: THREE.Vector3[] = [];
        for (let c = 0; c <= steps; c++) {
          const x = lerp(x0, x1, c / steps);
          row.push(new THREE.Vector3(x * side, y1, bumperEdgeZ(x) + zOff));
        }
        topGrid.push(row);
      }
      const frontMesh = new THREE.Mesh(buildSurfaceGrid(frontGrid, side === 1), material);
      const topMesh = new THREE.Mesh(buildSurfaceGrid(topGrid, side !== 1), material);
      const outerGrid: THREE.Vector3[][] = [
        [
          new THREE.Vector3(x1 * side, y0, bumperEdgeZ(x1) - zBackOff),
          new THREE.Vector3(x1 * side, y0, bumperEdgeZ(x1) + zFrontOff),
        ],
        [
          new THREE.Vector3(x1 * side, y1, bumperEdgeZ(x1) - zBackOff),
          new THREE.Vector3(x1 * side, y1, bumperEdgeZ(x1) + zFrontOff),
        ],
      ];
      const outerMesh = new THREE.Mesh(buildSurfaceGrid(outerGrid, side !== 1), material);
      bodyShellGroup.add(frontMesh);
      bodyShellGroup.add(topMesh);
      bodyShellGroup.add(outerMesh);
    };

    // Classic satin-black slatted horn grille wrapping cleanly along curved bumper corner
    buildCurvedFrontShell(0.376, 0.474, 0.443, 0.477, 0.022, 0.004, materials.trimBlack);
    [0.451, 0.460, 0.469].forEach((sy) => {
      const ribPts: THREE.Vector3[] = [];
      for (let c = 0; c <= 6; c++) {
        const x = lerp(0.378, 0.472, c / 6);
        ribPts.push(new THREE.Vector3(x * side, sy, bumperEdgeZ(x) + 0.008));
      }
      bodyShellGroup.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ribPts), 8, 0.0022, 5, false),
          materials.trimBlack,
        ),
      );
    });

    // Sleek Euro clear-inner + amber-outer wraparound turn signal framed cleanly above bumper shelf
    buildCurvedFrontShell(0.478, 0.606, 0.443, 0.477, 0.022, 0.005, materials.trimBlack);
    buildCurvedFrontShell(0.483, 0.526, 0.447, 0.473, 0.018, 0.011, materials.reverseWhiteLens);
    buildCurvedFrontShell(0.528, 0.601, 0.447, 0.473, 0.018, 0.011, materials.amberLens);
  });

  // =========================================================================
  // 4. GAP-FREE REAR VALANCE (TAILLETS & PLATE), QUARTER SHOULDERS & BUMPER
  // =========================================================================
  // Rear lower valance spans bumper top (y = 0.415) up to decklid hinge line (y = 0.576)
  const rearValencePoint = (u: number, t: number) => {
    const zCenter = lerp(-2.055, -2.044, t);
    const halfW = lerp(0.692, 0.665, t);
    const absU = Math.abs(u);
    const topY =
      absU <= 0.698
        ? lerp(0.576, 0.572, Math.pow(absU / 0.698, 2))
        : lerp(0.572, 0.556, (absU - 0.698) / 0.302);
    const y = lerp(0.415, topY, t);
    const zCurve = zCenter + Math.pow(absU, 2.40) * lerp(0.165, 0.155, t);
    return new THREE.Vector3(u * halfW, y, zCurve);
  };

  const rearValenceGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 34; j++) {
      const u = cornerClusterU((j / 34) * 2 - 1, 1.4);
      row.push(rearValencePoint(u, t));
    }
    rearValenceGrid.push(row);
  }
  const rearValenceMesh = new THREE.Mesh(
    buildSurfaceGrid(rearValenceGrid, true),
    materials.paint,
  );
  rearValenceMesh.castShadow = true;
  rearValenceMesh.receiveShadow = true;
  bodyShellGroup.add(rearValenceMesh);

  // Rear deck shoulder panels sweeping seamlessly down along ducktail flanks to taillight top edge
  ([-1, 1] as const).forEach((side) => {
    const shoulderGrid: THREE.Vector3[][] = [];
    for (let i = 0; i <= 14; i++) {
      const s = i / 14;
      const zInner = lerp(-1.982, -1.36, s);
      const zOuter = lerp(-1.889, -1.36, Math.pow(s, 0.88));
      const zMid = lerp(zInner, zOuter, 0.5);
      const innerX = lerp(0.455, 0.492, smoothstep(-1.982, -1.36, zInner));
      const outerX = lerp(0.665, bodyHalfWidth(zOuter) - 0.020, smoothstep(-1.889, -1.36, zOuter));
      const innerY = lerp(0.572, 0.876, smoothstep(-1.982, -1.36, zInner));
      const outerY = fenderCrownY(zOuter) - 0.006;
      shoulderGrid.push([
        new THREE.Vector3(innerX * side, innerY, zInner),
        new THREE.Vector3(lerp(innerX, outerX, 0.5) * side, lerp(innerY, outerY, 0.5) + 0.008, zMid),
        new THREE.Vector3(outerX * side, outerY, zOuter),
      ]);
    }
    const shoulderMesh = new THREE.Mesh(
      buildSurfaceGrid(shoulderGrid, side !== 1),
      materials.paint,
    );
    shoulderMesh.castShadow = true;
    shoulderMesh.receiveShadow = true;
    bodyShellGroup.add(shoulderMesh);
  });

  // Recessed black license plate pocket centered cleanly between taillights
  const rearPlatePocket = new THREE.Mesh(
    new THREE.BoxGeometry(0.43, 0.116, 0.016),
    materials.trimBlack,
  );
  rearPlatePocket.position.set(0, 0.484, -2.058);
  bodyShellGroup.add(rearPlatePocket);

  // Sculpted Rounded F-Body Wraparound Rear Bumper meeting rear wheel arch cleanly
  const rearBumperPoint = (u: number, t: number) => {
    const cornerLift = Math.pow(Math.max(0, Math.abs(u) - 0.68) / 0.32, 1.8) * 0.018;
    const y = lerp(0.285 + cornerLift, 0.420, t);
    const roundCrown = Math.sin(t * Math.PI);
    const centerZ = lerp(-2.062, -2.118, roundCrown);
    const sideZ = -1.465;
    const halfW = lerp(0.758, 0.790, roundCrown);
    const curveFactor = Math.pow(Math.abs(u), 3.3);
    const z = lerp(centerZ, sideZ, curveFactor);
    return new THREE.Vector3(u * halfW, y, z);
  };

  const rearBumperBodyGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 36; j++) {
      const u = cornerClusterU((j / 36) * 2 - 1, 1.5);
      row.push(rearBumperPoint(u, t));
    }
    rearBumperBodyGrid.push(row);
  }
  const rearBumperBody = new THREE.Mesh(
    buildSurfaceGrid(rearBumperBodyGrid, true),
    materials.paint,
  );
  rearBumperBody.castShadow = true;
  rearBumperBody.receiveShadow = true;
  bodyShellGroup.add(rearBumperBody);

  // Rear bumper chrome + colored RS impact stripe wrapping cleanly around corners
  const rearTrimPts: THREE.Vector3[] = [];
  for (let j = 0; j <= 36; j++) {
    const u = cornerClusterU((j / 36) * 2 - 1, 1.5);
    const p = rearBumperPoint(u, 0.56);
    rearTrimPts.push(new THREE.Vector3(p.x * 1.003, p.y, p.z - 0.004));
  }
  bodyShellGroup.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rearTrimPts), 48, 0.009, 10, false),
      materials.chrome,
    ),
  );
  const rearRubberPts = rearTrimPts.map((p) => new THREE.Vector3(p.x * 1.004, p.y, p.z - 0.005));
  bodyShellGroup.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rearRubberPts), 48, 0.0068, 8, false),
      materials.bumperStripe,
    ),
  );

  // Classic F-body wraparound taillight clusters: [RED inner] [CLEAR reverse middle] [AMBER outer corner]
  ([-1, 1] as const).forEach((side) => {
    const tlGroup = new THREE.Group();
    tlGroup.position.set(0.498 * side, 0.494, -1.996);
    tlGroup.rotation.y = -side * 0.28;

    const housing = new THREE.Mesh(
      buildBeveledBox(0.282, 0.076, 0.036, 0.012, 3),
      materials.chrome,
    );
    tlGroup.add(housing);

    const redPart = new THREE.Mesh(
      buildBeveledBox(0.072, 0.058, 0.042, 0.008, 2),
      materials.tailRedLens,
    );
    redPart.position.x = -0.094 * side;
    tlGroup.add(redPart);

    const reversePart = new THREE.Mesh(
      buildBeveledBox(0.046, 0.058, 0.042, 0.006, 2),
      materials.reverseWhiteLens,
    );
    reversePart.position.x = -0.034 * side;
    tlGroup.add(reversePart);

    const amberPart = new THREE.Mesh(
      buildBeveledBox(0.128, 0.058, 0.042, 0.009, 2),
      materials.amberLens,
    );
    amberPart.position.x = 0.064 * side;
    tlGroup.add(amberPart);

    const rib = new THREE.Mesh(
      buildBeveledBox(0.270, 0.005, 0.046, 0.002, 2),
      materials.chrome,
    );
    tlGroup.add(rib);

    bodyShellGroup.add(tlGroup);

    // Sculpted tall body-colored rear bumperette housings (matching Porsche Museum RS 2.7) + red reflector
    const overriderHousing = new THREE.Mesh(
      buildBeveledBox(0.056, 0.145, 0.046, 0.012, 3),
      materials.paint,
    );
    overriderHousing.position.set(0.265 * side, 0.365, -2.100);
    bodyShellGroup.add(overriderHousing);

    const overriderPad = new THREE.Mesh(
      buildBeveledBox(0.044, 0.092, 0.016, 0.008, 3),
      materials.trimBlack,
    );
    overriderPad.position.set(0.265 * side, 0.365, -2.124);
    bodyShellGroup.add(overriderPad);

    const rearReflector = new THREE.Mesh(
      buildBeveledBox(0.054, 0.026, 0.014, 0.006, 2),
      materials.tailRedLens,
    );
    rearReflector.position.set(0.320 * side, 0.382, -2.100);
    rearReflector.rotation.y = -side * 0.12;
    bodyShellGroup.add(rearReflector);

    const plateLamp = new THREE.Mesh(
      buildBeveledBox(0.034, 0.018, 0.020, 0.005, 2),
      materials.chrome,
    );
    plateLamp.position.set(0.202 * side, 0.502, -2.070);
    bodyShellGroup.add(plateLamp);
  });

  const rearPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.37, 0.078, 0.012),
    materials.licensePlateMat,
  );
  rearPlate.position.set(0, 0.484, -2.070);
  rearPlate.rotation.y = Math.PI;
  bodyShellGroup.add(rearPlate);

  // =========================================================================
  // 5. SLOPING FRONT HOOD (BONNET) — Separate Hinged Group + Shield Crest
  // =========================================================================
  const hoodGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    const zLine = lerp(0.64, 1.946, t);
    const halfW = lerp(0.482, 0.376, smoothstep(0.64, 1.946, zLine));
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 12; j++) {
      const u = (j / 12) * 2 - 1;
      const zFrontEdge = lerp(1.946, 1.894, Math.pow(Math.abs(u), 2.2));
      const z = lerp(0.64, zFrontEdge, t);
      const yCenter = hoodCenterY(z);
      const camber = (1 - u * u) * 0.024;
      row.push(new THREE.Vector3(u * halfW, yCenter + camber, z));
    }
    hoodGrid.push(row);
  }
  const hoodMesh = new THREE.Mesh(buildSurfaceGrid(hoodGrid, false), materials.paint);
  hoodMesh.castShadow = true;
  hoodMesh.receiveShadow = true;
  frontHoodGroup.add(hoodMesh);

  // Crisp subtle hairline perimeter shutline around curved front hood
  const hoodSealPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const z = lerp(0.66, 1.894, t);
    const hw = lerp(0.482, 0.376, smoothstep(0.64, 1.946, lerp(0.64, 1.946, t)));
    hoodSealPts.push(new THREE.Vector3(-hw, hoodCenterY(z) + 0.001, z));
  }
  for (let j = 1; j <= 11; j++) {
    const u = (j / 12) * 2 - 1;
    const zFront = lerp(1.946, 1.894, Math.pow(Math.abs(u), 2.2));
    const camber = (1 - u * u) * 0.024;
    hoodSealPts.push(new THREE.Vector3(u * 0.376, hoodCenterY(zFront) + camber + 0.001, zFront));
  }
  for (let i = 12; i >= 0; i--) {
    const t = i / 12;
    const z = lerp(0.66, 1.894, t);
    const hw = lerp(0.482, 0.376, smoothstep(0.64, 1.946, lerp(0.64, 1.946, t)));
    hoodSealPts.push(new THREE.Vector3(hw, hoodCenterY(z) + 0.001, z));
  }
  frontHoodGroup.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hoodSealPts, false), 46, 0.0016, 6, false),
      materials.trimBlack,
    ),
  );

  // Iconic Stuttgart crest shield emblem on front hood nose
  const crestBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.044, 0.052),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.porscheCrestMap,
      transparent: true,
      alphaTest: 0.1,
      metalness: 0.55,
      roughness: 0.25,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      clippingPlanes,
    }),
  );
  crestBadge.position.set(0, hoodCenterY(1.83) + 0.027, 1.83);
  crestBadge.rotation.x = -Math.PI / 2 + 0.27;
  frontHoodGroup.add(crestBadge);

  // =========================================================================
  // 6. SCULPTED CARRERA RS 2.7 "BÜRZEL" DUCKTAIL ENGINE DECKLID
  // =========================================================================
  // Authentic 1973 Carrera RS Bürzel sweeping seamlessly from lower deck hinge (y = 0.576) up to spoiler crest
  const duckUpperGrid: THREE.Vector3[][] = [];
  const duckRearLipGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const kickT = 1 - smoothstep(-2.02, -1.58, lerp(-2.02, -1.36, t));
    const z = lerp(-2.02, -1.36, t) - 0.048 * Math.pow(kickT, 1.45);
    const halfW = lerp(0.422, 0.492, t);
    const baseSlopeY = lerp(0.816, 0.876, t);
    const duckCurl = 0.108 * Math.pow(kickT, 1.50);
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 12; j++) {
      const u = (j / 12) * 2 - 1;
      const edgeDrop = u * u * lerp(0.020, 0.010, t);
      row.push(new THREE.Vector3(u * halfW, baseSlopeY + duckCurl - edgeDrop, z));
    }
    duckUpperGrid.push(row);
  }
  const duckMesh = new THREE.Mesh(buildSurfaceGrid(duckUpperGrid, false), materials.paint);
  duckMesh.castShadow = true;
  duckMesh.receiveShadow = true;
  ducktailGroup.add(duckMesh);

  // Continuous concave S-curve ducktail rear panel sweeping from decklid shutline (y = 0.576) up to crest
  const duckRearPoint = (u: number, t: number, topPt: THREE.Vector3) => {
    const botX = u * 0.455;
    const botY = lerp(0.576, 0.572, u * u);
    const botZ = -2.044 + Math.pow(Math.abs(u), 2.40) * 0.0625;
    const x = lerp(botX, topPt.x, t);
    const y = lerp(botY, topPt.y, t);
    const hollow = Math.sin(t * Math.PI) * 0.036;
    const z = lerp(botZ, topPt.z, t) + hollow;
    return new THREE.Vector3(x, y, z);
  };

  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const row: THREE.Vector3[] = [];
    for (let j = 0; j <= 12; j++) {
      const u = (j / 12) * 2 - 1;
      row.push(duckRearPoint(u, t, duckUpperGrid[0][j]));
    }
    duckRearLipGrid.push(row);
  }
  const duckLipBack = new THREE.Mesh(buildSurfaceGrid(duckRearLipGrid, false), materials.paint);
  duckLipBack.castShadow = true;
  duckLipBack.receiveShadow = true;
  ducktailGroup.add(duckLipBack);

  // Curved P O R S C H E block-band stencil on the sloped lower ducktail panel right above taillights & plate
  const rearPorscheGrid: THREE.Vector3[][] = [];
  for (let r = 0; r <= 3; r++) {
    const t = lerp(0.07, 0.25, r / 3);
    const row: THREE.Vector3[] = [];
    for (let c = 0; c <= 14; c++) {
      const u = lerp(0.92, -0.92, c / 14);
      const uIdx = ((u + 1) * 0.5) * 12;
      const j0 = Math.max(0, Math.min(11, Math.floor(uIdx)));
      const frac = uIdx - j0;
      const topPt = new THREE.Vector3().lerpVectors(duckUpperGrid[0][j0], duckUpperGrid[0][j0 + 1], frac);
      const pt = duckRearPoint(u, t, topPt);
      row.push(new THREE.Vector3(pt.x, pt.y, pt.z - 0.005));
    }
    rearPorscheGrid.push(row);
  }
  ducktailGroup.add(
    new THREE.Mesh(buildSurfaceGrid(rearPorscheGrid, true), materials.rearPorscheMat),
  );

  // Flush tapered side walls sealing ducktail smoothly into rear quarter shoulders
  ([0, 12] as const).forEach((edgeIdx) => {
    const sideWallGrid: THREE.Vector3[][] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const zBase = lerp(-1.982, -1.36, t);
      const topPt = duckUpperGrid[i][edgeIdx];
      const floorX = lerp(0.455, 0.492, t) * (edgeIdx === 0 ? -1 : 1);
      const floorY = lerp(0.572, 0.870, t);
      sideWallGrid.push([
        new THREE.Vector3(floorX, floorY, zBase),
        new THREE.Vector3(topPt.x, topPt.y, topPt.z),
      ]);
    }
    const wallMesh = new THREE.Mesh(
      buildSurfaceGrid(sideWallGrid, edgeIdx === 12),
      materials.paint,
    );
    wallMesh.castShadow = true;
    ducktailGroup.add(wallMesh);
  });

  // Flush recessed matte-black cooling grille + 12 dark satin horizontal louvers (flush with deck slope)
  const grilleFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.008, 0.28),
    materials.trimBlack,
  );
  grilleFrame.position.set(0, 0.862, -1.52);
  grilleFrame.rotation.x = -0.072;
  ducktailGroup.add(grilleFrame);

  for (let s = 0; s < 12; s++) {
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.004, 0.011),
      materials.trimBlack,
    );
    slat.position.set(0, 0.858 + s * 0.0018, -1.645 + s * 0.023);
    ducktailGroup.add(slat);
  }

  // Right-aligned Carrera RS badge seated flush on the upper concave ducktail wall
  const rearBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.20, 0.046),
    materials.rearBadgeMat,
  );
  rearBadge.position.set(-0.185, 0.828, -2.036);
  rearBadge.rotation.y = Math.PI;
  rearBadge.rotation.x = -0.22;
  ducktailGroup.add(rearBadge);

  // =========================================================================
  // 7. SCULPTED DOORS, CARRERA SIDE SCRIPT, FLUSH GLASS & DURANT MIRROR
  // =========================================================================
  const buildDoor = (sideSign: 1 | -1, targetGroup: THREE.Group) => {
    const dGrid: THREE.Vector3[][] = [];
    for (let i = 0; i <= 14; i++) {
      const z = lerp(-0.735, 0.630, i / 14);
      const maxW = bodyHalfWidth(z);
      const topY = fenderCrownY(z);
      const bottomY = 0.278;
      const midY = lerp(0.148, topY, 0.54);
      const row: THREE.Vector3[] = [];
      for (let j = 0; j <= 8; j++) {
        const v = j / 8;
        let x: number;
        let y: number;
        if (v <= 0.54) {
          const t = v / 0.54;
          x = lerp(maxW + 0.008, maxW + 0.010, t);
          y = lerp(bottomY, midY, t);
        } else {
          const t = (v - 0.54) / 0.46;
          x = lerp(maxW + 0.010, maxW - 0.084, t);
          y = lerp(midY, topY, Math.sin(t * Math.PI * 0.5));
        }
        row.push(new THREE.Vector3(x * sideSign, y, z));
      }
      dGrid.push(row);
    }
    const doorSkin = new THREE.Mesh(buildSurfaceGrid(dGrid, sideSign === 1), materials.paint);
    doorSkin.castShadow = true;
    doorSkin.receiveShadow = true;
    targetGroup.add(doorSkin);

    // Subtle crisp dark panel shutlines along door front, rear & sill seams
    [-0.734, 0.629].forEach((sz) => {
      const seamCurve = new THREE.LineCurve3(
        new THREE.Vector3((bodyHalfWidth(sz) + 0.008) * sideSign, 0.278, sz),
        new THREE.Vector3((bodyHalfWidth(sz) - 0.080) * sideSign, fenderCrownY(sz), sz),
      );
      targetGroup.add(
        new THREE.Mesh(new THREE.TubeGeometry(seamCurve, 6, 0.0018, 4, false), materials.trimBlack),
      );
    });

    // Curved Carrera RS side script decal wrapping cleanly onto lower door contour (left-to-right on both sides)
    const stripeGrid: THREE.Vector3[][] = [];
    const stripeZCols = 16;
    const stripeYRows = 4;
    for (let r = 0; r <= stripeYRows; r++) {
      const y = lerp(0.228, 0.356, r / stripeYRows);
      const row: THREE.Vector3[] = [];
      for (let c = 0; c <= stripeZCols; c++) {
        const u = sideSign === 1 ? 1 - c / stripeZCols : c / stripeZCols;
        const z = lerp(-0.72, 0.62, u);
        const w = bodyHalfWidth(z) + 0.012;
        row.push(new THREE.Vector3(w * sideSign, y, z));
      }
      stripeGrid.push(row);
    }
    targetGroup.add(
      new THREE.Mesh(buildSurfaceGrid(stripeGrid, true), materials.carreraSideMat),
    );

    // Door interior RS lightweight quilted card, red pull strap & chrome winder crank
    const doorCard = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.37, 1.24),
      materials.trimBlack,
    );
    doorCard.position.set(0.730 * sideSign, 0.485, -0.05);
    targetGroup.add(doorCard);

    const pullStrap = new THREE.Mesh(
      new THREE.BoxGeometry(0.010, 0.028, 0.16),
      materials.tailRedLens,
    );
    pullStrap.position.set(0.713 * sideSign, 0.50, 0.08);
    pullStrap.rotation.x = -0.35;
    targetGroup.add(pullStrap);

    const winderCrank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.022, 10),
      materials.chrome,
    );
    winderCrank.rotation.z = Math.PI / 2;
    winderCrank.position.set(0.710 * sideSign, 0.46, 0.25);
    targetGroup.add(winderCrank);

    // Chrome exterior door handle with black push-button trigger
    const handle = new THREE.Mesh(
      buildBeveledBox(0.024, 0.022, 0.145, 0.008, 3),
      materials.chrome,
    );
    handle.position.set(0.775 * sideSign, 0.680, -0.46);
    targetGroup.add(handle);

    const handleTrigger = new THREE.Mesh(
      buildBeveledBox(0.028, 0.014, 0.022, 0.004, 2),
      materials.trimBlack,
    );
    handleTrigger.position.set(0.777 * sideSign, 0.680, -0.515);
    targetGroup.add(handleTrigger);

    // Door Window Glass & Frame matching exact A-pillar / roof / B-pillar 3D coordinates (zero closed-spline loops)
    const dZPts = [0.55, 0.20, -0.06, -0.29];
    const dBotPts = [
      new THREE.Vector3(cabinBeltX(0.55) * sideSign, cabinSillY(0.55) + 0.008, 0.55),
      new THREE.Vector3(cabinBeltX(0.20) * sideSign, cabinSillY(0.20) + 0.008, 0.20),
      new THREE.Vector3(cabinBeltX(-0.06) * sideSign, cabinSillY(-0.06) + 0.008, -0.06),
      new THREE.Vector3(cabinBeltX(-0.29) * sideSign, cabinSillY(-0.29) + 0.008, -0.29),
    ];
    const dTopPts = [
      new THREE.Vector3(0.625 * sideSign, 0.790, 0.54),
      new THREE.Vector3(cabinRoofEdgeX(0.20) * sideSign, roofFlylineY(0.20) - 0.010, 0.20),
      new THREE.Vector3(cabinRoofEdgeX(-0.06) * sideSign, roofFlylineY(-0.06) - 0.010, -0.06),
      new THREE.Vector3(cabinRoofEdgeX(-0.29) * sideSign, roofFlylineY(-0.29) - 0.010, -0.29),
    ];
    const dWinGrid: THREE.Vector3[][] = [];
    for (let r = 0; r <= 4; r++) {
      const f = r / 4;
      const row: THREE.Vector3[] = [];
      for (let c = 0; c < dZPts.length; c++) {
        row.push(new THREE.Vector3().lerpVectors(dBotPts[c], dTopPts[c], f));
      }
      dWinGrid.push(row);
    }
    const winMesh = new THREE.Mesh(buildSurfaceGrid(dWinGrid, sideSign !== 1), materials.glass);
    winMesh.renderOrder = 2;
    targetGroup.add(winMesh);

    // Overshoot-free perimeter strips: chrome lower sill, chrome A/roof arch, black B-pillar upright
    targetGroup.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.LineCurve3(dBotPts[0], dBotPts[3]), 8, 0.0052, 6, false),
        materials.chrome,
      ),
    );
    targetGroup.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.LineCurve3(dBotPts[3], dTopPts[3]), 6, 0.0052, 6, false),
        materials.trimBlack,
      ),
    );
    const doorArchCurve = new THREE.CatmullRomCurve3(
      [dBotPts[0], dTopPts[0], dTopPts[1], dTopPts[2], dTopPts[3]],
      false,
      'centripetal',
      0.5,
    );
    targetGroup.add(
      new THREE.Mesh(new THREE.TubeGeometry(doorArchCurve, 26, 0.0058, 6, false), materials.chrome),
    );

    // Classic triangular vent window vertical chrome divider bar
    const ventBot = new THREE.Vector3(cabinBeltX(0.31) * sideSign, cabinSillY(0.31) + 0.008, 0.31);
    const ventTop = new THREE.Vector3(
      lerp(0.625, cabinRoofEdgeX(0.20), 0.70) * sideSign,
      lerp(0.790, roofFlylineY(0.20) - 0.010, 0.70),
      0.31,
    );
    targetGroup.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.LineCurve3(ventBot, ventTop), 4, 0.0052, 6, false),
        materials.chrome,
      ),
    );

    // Chrome driver-side Durant round mirror (+X left side)
    if (sideSign === 1) {
      const stalk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.010, 0.014, 0.072, 10),
        materials.chrome,
      );
      stalk.position.set(0.752, 0.788, 0.42);
      stalk.rotation.z = -0.65;
      targetGroup.add(stalk);

      const mirrorCap = new THREE.Mesh(
        new THREE.SphereGeometry(0.044, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.60),
        materials.chrome,
      );
      mirrorCap.position.set(0.804, 0.816, 0.42);
      mirrorCap.rotation.x = Math.PI / 2;
      targetGroup.add(mirrorCap);

      const mirrorGlass = new THREE.Mesh(
        new THREE.CircleGeometry(0.038, 18),
        materials.chrome,
      );
      mirrorGlass.position.set(0.804, 0.816, 0.415);
      mirrorGlass.rotation.y = Math.PI;
      targetGroup.add(mirrorGlass);
    }
  };

  buildDoor(1, leftDoorGroup);
  buildDoor(-1, rightDoorGroup);

  root.add(bodyShellGroup);
  root.add(frontHoodGroup);
  root.add(ducktailGroup);
  root.add(leftDoorGroup);
  root.add(rightDoorGroup);

  const setLivery = (bodyHex: string, scriptHex: string, tex: ProceduralTextures) => {
    materials.paint.color.set(bodyHex);
    const isLightBody = bodyHex.toLowerCase() === '#f3f2ed';
    materials.bumperStripe.color.set(isLightBody ? scriptHex : '#16181c');
    const oldMap = materials.carreraSideMat.map;
    materials.carreraSideMat.map = tex.carreraSideStripe(scriptHex, bodyHex);
    materials.carreraSideMat.needsUpdate = true;
    oldMap?.dispose();

    const oldRearMap = materials.rearPorscheMat.map;
    materials.rearPorscheMat.map = tex.rearPorscheLetteringMap(scriptHex);
    materials.rearPorscheMat.needsUpdate = true;
    oldRearMap?.dispose();
  };

  return {
    root,
    bodyShellGroup,
    frontHoodGroup,
    ducktailGroup,
    leftDoorGroup,
    rightDoorGroup,
    materials,
    setLivery,
  };
}
