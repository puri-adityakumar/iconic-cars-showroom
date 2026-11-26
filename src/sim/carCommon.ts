import * as THREE from 'three';
import {
  EngineKinematics,
  LiverySpec,
  SubsystemId,
  TeardownPose,
} from './specs';
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
  cylinderNumber: number;
  bankSign: 1 | -1;
  /** Cylinder bank tilt angle in XY plane from vertical (+Y = 0, +X = +PI/2, -X = -PI/2) */
  bankTiltRad: number;
  zLocal: number;
  pistonGroup: THREE.Group;
  rodGroup: THREE.Group;
  crankPinMarker: THREE.Mesh;
  chamberGlowMat: THREE.MeshStandardMaterial;
}

export interface CarRig {
  root: THREE.Group;
  bodyRoot: THREE.Group;
  wheels: WheelAssembly[];
  subsystemGroups: Record<Exclude<SubsystemId, 'all'>, THREE.Object3D[]>;
  /** Solid painted/opaque materials on body whose transparency changes in X-Ray/isolate */
  fadeableBodyMaterials: THREE.Material[];
  /** Material groups preserving fixed low opacity (glass / optical lenses) */
  glassMaterials: THREE.Material[];
  lensMaterials: THREE.Material[];
  /** Materials needing force-transparent handling when non-zero alpha map exists */
  decalMaterials: THREE.Material[];
  applyExplodePose: (pose: TeardownPose) => void;
  updateKinematics: (kin: EngineKinematics, wheelSpinRad: number) => void;
  setLivery: (livery: LiverySpec, textures: ProceduralTextures) => void;
  setEngineXray: (xray: boolean) => void;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Evaluates a corner-safe tangent-matched cubic Hermite subdivision along a 1D control polyline.
 * - Preserves every original control point at exact uniform knot spacing (zero UV or seam drift).
 * - Uses normalized secant tangent averaging + chord-length speed scaling so uneven grid spacing
 *   cannot loop or overshoot, while maintaining C0 corners where bend angle > ~75 deg.
 */
function subdivide1DCubic(pts: THREE.Vector3[], subs: number): THREE.Vector3[] {
  const n = pts.length;
  if (subs <= 1 || n < 2) return pts;

  // For 2-point segments (flat cross-strips), linear subdivision improves aspect ratio without bending.
  if (n === 2) {
    const out: THREE.Vector3[] = [];
    for (let k = 0; k <= subs; k++) {
      out.push(new THREE.Vector3().lerpVectors(pts[0], pts[1], k / subs));
    }
    return out;
  }

  const deltas: THREE.Vector3[] = [];
  const lens: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const d = new THREE.Vector3().subVectors(pts[i + 1], pts[i]);
    deltas.push(d);
    lens.push(d.length());
  }

  const dirs: THREE.Vector3[] = new Array(n);
  const smooth: number[] = new Array(n).fill(0);

  for (let i = 1; i < n - 1; i++) {
    const l0 = lens[i - 1];
    const l1 = lens[i];
    if (l0 < 1e-6 || l1 < 1e-6) {
      dirs[i] = new THREE.Vector3();
      smooth[i] = 0;
      continue;
    }
    const vIn = deltas[i - 1].clone().divideScalar(l0);
    const vOut = deltas[i].clone().divideScalar(l1);
    const dot = vIn.dot(vOut);
    const s = smoothstep(0.18, 0.58, dot);
    const sum = vIn.add(vOut);
    if (sum.lengthSq() < 1e-8) {
      dirs[i] = vOut;
      smooth[i] = 0;
    } else {
      dirs[i] = sum.normalize();
      smooth[i] = s;
    }
  }

  // Exact parabolic boundary tangents (reflection of adjacent interior tangent across end chord)
  if (lens[0] >= 1e-6) {
    const v0 = deltas[0].clone().divideScalar(lens[0]);
    const refl = v0.clone().multiplyScalar(2 * v0.dot(dirs[1])).sub(dirs[1]);
    dirs[0] = refl.lengthSq() > 1e-8 ? refl.normalize().lerp(v0, 1 - smooth[1]).normalize() : v0;
    smooth[0] = smooth[1];
  } else {
    dirs[0] = new THREE.Vector3();
  }

  const last = n - 1;
  if (lens[last - 1] >= 1e-6) {
    const vLast = deltas[last - 1].clone().divideScalar(lens[last - 1]);
    const refl = vLast
      .clone()
      .multiplyScalar(2 * vLast.dot(dirs[last - 1]))
      .sub(dirs[last - 1]);
    dirs[last] =
      refl.lengthSq() > 1e-8
        ? refl.normalize().lerp(vLast, 1 - smooth[last - 1]).normalize()
        : vLast;
    smooth[last] = smooth[last - 1];
  } else {
    dirs[last] = new THREE.Vector3();
  }

  const out: THREE.Vector3[] = [];
  const m0 = new THREE.Vector3();
  const m1 = new THREE.Vector3();
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const L = lens[i];
    const d = deltas[i];

    if (L < 1e-6 || (smooth[i] === 0 && smooth[i + 1] === 0)) {
      for (let k = 0; k < subs; k++) {
        out.push(new THREE.Vector3().lerpVectors(p0, p1, k / subs));
      }
      continue;
    }

    m0.copy(d).lerp(dirs[i].clone().multiplyScalar(L), smooth[i]);
    m1.copy(d).lerp(dirs[i + 1].clone().multiplyScalar(L), smooth[i + 1]);

    for (let k = 0; k < subs; k++) {
      const t = k / subs;
      const t2 = t * t;
      const t3 = t2 * t;
      const h00 = 2 * t3 - 3 * t2 + 1;
      const h10 = t3 - 2 * t2 + t;
      const h01 = -2 * t3 + 3 * t2;
      const h11 = t3 - t2;
      out.push(
        new THREE.Vector3(
          h00 * p0.x + h10 * m0.x + h01 * p1.x + h11 * m1.x,
          h00 * p0.y + h10 * m0.y + h01 * p1.y + h11 * m1.y,
          h00 * p0.z + h10 * m0.z + h01 * p1.z + h11 * m1.z,
        ),
      );
    }
  }
  out.push(pts[n - 1].clone());
  return out;
}

/**
 * Creates a smooth parametric surface from a grid of 3D points [row][col].
 * Applies knot-preserving tangent-matched cubic Hermite subdivision in both axes
 * and recomputes smooth vertex normals automatically.
 */
export function buildSurfaceGrid(
  grid: THREE.Vector3[][],
  flipWinding = false,
  uvScaleX = 1,
  uvScaleY = 1,
  subdivisions = 2,
): THREE.BufferGeometry {
  let refined = grid;
  if (subdivisions > 1 && grid.length >= 2 && grid[0].length >= 2) {
    const rowSubdivided = refined.map((row) => subdivide1DCubic(row, subdivisions));
    const newCols = rowSubdivided[0].length;
    const colVectors: THREE.Vector3[][] = [];
    for (let c = 0; c < newCols; c++) {
      colVectors.push(rowSubdivided.map((row) => row[c]));
    }
    const colSubdivided = colVectors.map((col) => subdivide1DCubic(col, subdivisions));
    const newRows = colSubdivided[0].length;
    refined = [];
    for (let r = 0; r < newRows; r++) {
      const row: THREE.Vector3[] = [];
      for (let c = 0; c < newCols; c++) {
        row.push(colSubdivided[c][r]);
      }
      refined.push(row);
    }
  }

  const rows = refined.length;
  const cols = refined[0].length;
  const positions = new Float32Array(rows * cols * 3);
  const uvs = new Float32Array(rows * cols * 2);
  const indices: number[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const p = refined[r][c];
      positions[idx * 3] = p.x;
      positions[idx * 3 + 1] = p.y;
      positions[idx * 3 + 2] = p.z;
      uvs[idx * 2] = (c / (cols - 1)) * uvScaleX;
      uvs[idx * 2 + 1] = (r / (rows - 1)) * uvScaleY;
    }
  }

  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c;
      const b = a + 1;
      const d = (r + 1) * cols + c;
      const e = d + 1;
      if (flipWinding) {
        indices.push(a, b, d, b, e, d);
      } else {
        indices.push(a, d, b, b, d, e);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates sorted Z coordinates across [zStart, zEnd] with angular (cosine) clustering
 * over the wheel arch span [axleZ - archR, axleZ + archR] so semicircular wheel cutouts
 * have high density right along their steep vertical front/rear edges.
 */
export function sampleArchZ(
  zStart: number,
  zEnd: number,
  axleZ: number,
  archR: number,
  outerSteps = 12,
  archSteps = 32,
): number[] {
  const zMin = Math.min(zStart, zEnd);
  const zMax = Math.max(zStart, zEnd);
  const aMin = Math.max(zMin, axleZ - archR);
  const aMax = Math.min(zMax, axleZ + archR);
  const zs: number[] = [];

  if (aMin > zMin + 1e-4) {
    for (let i = 0; i < outerSteps; i++) {
      zs.push(lerp(zMin, aMin, i / outerSteps));
    }
  }
  for (let k = 0; k <= archSteps; k++) {
    const z = axleZ - archR * Math.cos((k / archSteps) * Math.PI);
    const clamped = Math.max(zMin, Math.min(zMax, z));
    if (zs.length === 0 || Math.abs(clamped - zs[zs.length - 1]) > 1e-4) {
      zs.push(clamped);
    }
  }
  if (zMax > aMax + 1e-4) {
    for (let i = 1; i <= outerSteps; i++) {
      const z = lerp(aMax, zMax, i / outerSteps);
      if (Math.abs(z - zs[zs.length - 1]) > 1e-4) {
        zs.push(z);
      }
    }
  }
  return zStart <= zEnd ? zs : zs.reverse();
}

/**
 * Clusters a uniform grid parameter `s in [-1, 1]` smoothly toward outer corners `+-1`
 * so high-power wraparound bumper curves remain round without corner faceting.
 */
export function cornerClusterU(s: number, power = 1.45): number {
  const sign = s < 0 ? -1 : 1;
  return sign * (1 - Math.pow(Math.max(0, 1 - Math.abs(s)), power));
}

function makeRoundedRectShape(hw: number, hh: number, r: number): THREE.Shape {
  const cr = Math.max(0, Math.min(r, hw * 0.96, hh * 0.96));
  const s = new THREE.Shape();
  s.moveTo(-hw + cr, -hh);
  s.lineTo(hw - cr, -hh);
  if (cr > 0) s.quadraticCurveTo(hw, -hh, hw, -hh + cr);
  s.lineTo(hw, hh - cr);
  if (cr > 0) s.quadraticCurveTo(hw, hh, hw - cr, hh);
  s.lineTo(-hw + cr, hh);
  if (cr > 0) s.quadraticCurveTo(-hw, hh, -hw, hh - cr);
  s.lineTo(-hw, -hh + cr);
  if (cr > 0) s.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);
  return s;
}

/**
 * Centered beveled rounded box matching `(w, h, d)` bounding size with smooth chamfered edges.
 */
export function buildBeveledBox(
  w: number,
  h: number,
  d: number,
  radius = 0.008,
  bevelSegments = 3,
): THREE.BufferGeometry {
  const b = Math.min(radius * 0.45, w * 0.22, h * 0.22, d * 0.30);
  const hw = Math.max(0.0005, w * 0.5 - b);
  const hh = Math.max(0.0005, h * 0.5 - b);
  const extD = Math.max(0.0005, d - 2 * b);
  const shape = makeRoundedRectShape(hw, hh, Math.max(0.0002, radius - b * 0.3));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: extD,
    bevelEnabled: b > 0.0004,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments,
    curveSegments: 8,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

/**
 * Smooth rounded-corner BMW kidney grille surround ring (outer rounded rectangle + inner hole).
 */
export function buildRoundedRingGeo(
  w: number,
  h: number,
  d: number,
  cornerRadius: number,
  barWidth: number,
): THREE.BufferGeometry {
  const b = Math.min(barWidth * 0.25, d * 0.25);
  const outer = makeRoundedRectShape(w * 0.5 - b, h * 0.5 - b, cornerRadius);
  const holePath = makeRoundedRectShape(
    Math.max(0.004, w * 0.5 - barWidth),
    Math.max(0.004, h * 0.5 - barWidth),
    Math.max(0.002, cornerRadius - barWidth * 0.6),
  );
  outer.holes.push(holePath);
  const geo = new THREE.ExtrudeGeometry(outer, {
    depth: Math.max(0.001, d - 2 * b),
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 3,
    curveSegments: 12,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

/**
 * Smooth cambered airfoil wing spanning along X (`+Z` leading edge -> `-Z` trailing edge).
 */
export function buildAirfoilWing(
  span: number,
  chord: number,
  thickness: number,
  camber = 0.010,
): THREE.BufferGeometry {
  const hc = chord * 0.5;
  const ht = thickness * 0.5;
  const s = new THREE.Shape();
  s.moveTo(-hc, 0);
  s.bezierCurveTo(-hc * 0.25, ht * 1.15 + camber, hc * 0.55, ht * 1.35 + camber * 0.4, hc, ht * 0.15);
  s.quadraticCurveTo(hc * 1.04, 0, hc, -ht * 0.35);
  s.bezierCurveTo(hc * 0.45, -ht * 0.65, -hc * 0.30, -ht * 0.25 + camber * 0.4, -hc, -ht * 0.12);
  s.closePath();

  const b = Math.min(0.006, ht * 0.4);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.02, span - 2 * b),
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b * 0.65,
    bevelSegments: 3,
    curveSegments: 18,
  });
  geo.rotateY(-Math.PI / 2);
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

/**
 * Swept wing stanchion / diffuser fin extending vertically along Y and front-to-back along Z.
 */
export function buildSweptPylon(
  height: number,
  botChord: number,
  topChord: number,
  thickness: number,
  sweepBack = 0.035,
): THREE.BufferGeometry {
  const hh = height * 0.5;
  const bHalf = botChord * 0.5;
  const tHalf = topChord * 0.5;
  const s = new THREE.Shape();
  s.moveTo(-bHalf, -hh);
  s.lineTo(bHalf, -hh);
  s.quadraticCurveTo(lerp(bHalf, tHalf, 0.55) - sweepBack * 0.4, 0, tHalf - sweepBack, hh);
  s.lineTo(-tHalf - sweepBack, hh);
  s.quadraticCurveTo(-lerp(bHalf, tHalf, 0.5) - sweepBack * 0.6, 0, -bHalf, -hh);
  s.closePath();

  const b = Math.min(0.004, thickness * 0.25);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.002, thickness - 2 * b),
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 2,
    curveSegments: 12,
  });
  geo.rotateY(-Math.PI / 2);
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

export function catmullY(pts: Array<[number, number]>, z: number): number {
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

export function wheelArchHeight(
  z: number,
  centerZ: number,
  centerY: number,
  radius: number,
): number | null {
  const dz = z - centerZ;
  if (Math.abs(dz) >= radius) return null;
  return centerY + Math.sqrt(Math.max(0, radius * radius - dz * dz));
}

export function buildHelicalSpring(radius: number, height: number, turns: number): THREE.TubeGeometry {
  const pts: THREE.Vector3[] = [];
  const steps = turns * 14;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    pts.push(
      new THREE.Vector3(Math.cos(angle) * radius, t * height, Math.sin(angle) * radius),
    );
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), steps, 0.009, 6, false);
}

/**
 * Adds a dark enclosed curved wheel-well barrel liner, full lower-to-upper inner tub wall,
 * front/rear vertical end caps down to rocker height, and a crisp painted arch lip
 * so side and 3/4 views never show sky or floor gaps past the tire.
 */
export function addSealedWheelWell(opts: {
  target: THREE.Group;
  side: 1 | -1;
  axleZ: number;
  wheelY: number;
  archRadius: number;
  outerXFn: (z: number) => number;
  innerX: number;
  maxRoofYFn: (z: number) => number;
  linerMat: THREE.Material;
  lipMat: THREE.Material;
}) {
  const {
    target,
    side,
    axleZ,
    wheelY,
    archRadius,
    outerXFn,
    innerX,
    maxRoofYFn,
    linerMat,
    lipMat,
  } = opts;

  // Build barrel liner tracking the true circular arch edge down to wheelY,
  // then closing vertically inside the arch heels down to rocker level y = 0.178
  const archPts: Array<[number, number]> = [];
  archPts.push([axleZ + archRadius + 0.008, 0.178]);
  for (let k = 0; k <= 44; k++) {
    const a = lerp(0, Math.PI, k / 44);
    const lz = axleZ + Math.cos(a) * (archRadius - 0.006);
    const rawLy = wheelY + Math.sin(a) * (archRadius - 0.006);
    const ly = Math.max(0.178, Math.min(rawLy, maxRoofYFn(lz) - 0.024));
    archPts.push([lz, ly]);
  }
  archPts.push([axleZ - archRadius - 0.008, 0.178]);

  const linerGrid: THREE.Vector3[][] = archPts.map(([lz, ly]) => {
    const outer = outerXFn(lz) - 0.015;
    return [
      new THREE.Vector3(outer * side, ly, lz),
      new THREE.Vector3(innerX * side, ly - 0.006, lz),
    ];
  });
  target.add(new THREE.Mesh(buildSurfaceGrid(linerGrid, side === 1, 1, 1, 1), linerMat));

  // Full vertical inner wheelhouse tub bulkhead spanning rockers to upper fender crown
  const zBack = axleZ - archRadius - 0.04;
  const zFront = axleZ + archRadius + 0.04;
  const wallGrid: THREE.Vector3[][] = [];
  for (let i = 0; i <= 14; i++) {
    const lz = lerp(zBack, zFront, i / 14);
    const topWallY = Math.min(wheelY + archRadius + 0.04, maxRoofYFn(lz) - 0.020);
    wallGrid.push([
      new THREE.Vector3(innerX * side, 0.178, lz),
      new THREE.Vector3(innerX * side, topWallY, lz),
    ]);
  }
  target.add(new THREE.Mesh(buildSurfaceGrid(wallGrid, side === 1, 1, 1, 1), linerMat));

  const lipPts: THREE.Vector3[] = [];
  for (let k = 0; k <= 44; k++) {
    const u = k / 44;
    const ang = lerp(-0.04, Math.PI + 0.04, u);
    const az = axleZ + Math.cos(ang) * archRadius;
    const ay = Math.max(0.165, wheelY + Math.sin(ang) * archRadius);
    const ax = (outerXFn(az) - 0.002 + 0.007 * Math.pow(Math.sin(u * Math.PI), 0.7)) * side;
    lipPts.push(new THREE.Vector3(ax, ay, az));
  }
  const lip = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lipPts), 48, 0.0085, 10, false),
    lipMat,
  );
  lip.castShadow = true;
  target.add(lip);
}

export function buildTireProfile(outerR: number, rimR: number, width: number): THREE.BufferGeometry {
  const hw = width * 0.5;
  const pts = [
    new THREE.Vector2(rimR - 0.004, -hw * 0.88),
    new THREE.Vector2(rimR + (outerR - rimR) * 0.34, -hw * 0.98),
    new THREE.Vector2(rimR + (outerR - rimR) * 0.65, -hw * 1.02),
    new THREE.Vector2(outerR - 0.018, -hw * 0.94),
    new THREE.Vector2(outerR - 0.005, -hw * 0.80),
    new THREE.Vector2(outerR, -hw * 0.60),
    new THREE.Vector2(outerR, 0),
    new THREE.Vector2(outerR, hw * 0.60),
    new THREE.Vector2(outerR - 0.005, hw * 0.80),
    new THREE.Vector2(outerR - 0.018, hw * 0.94),
    new THREE.Vector2(rimR + (outerR - rimR) * 0.65, hw * 1.02),
    new THREE.Vector2(rimR + (outerR - rimR) * 0.34, hw * 0.98),
    new THREE.Vector2(rimR - 0.004, hw * 0.88),
  ];
  const geo = new THREE.LatheGeometry(pts, 64);
  geo.rotateZ(Math.PI / 2);
  return geo;
}

export function buildDeepDishRimLip(
  rimR: number,
  width: number,
  sideSign: 1 | -1,
  dishDepth = 0.72,
): THREE.BufferGeometry {
  const hw = width * 0.46;
  const lipSign = -sideSign;
  const pts = [
    new THREE.Vector2(rimR * dishDepth, -hw * 0.25 * lipSign),
    new THREE.Vector2(rimR * (dishDepth + 0.08), hw * 0.28 * lipSign),
    new THREE.Vector2(rimR * 0.90, hw * 0.62 * lipSign),
    new THREE.Vector2(rimR * 0.96, hw * 0.92 * lipSign),
    new THREE.Vector2(rimR * 1.005, hw * 1.00 * lipSign),
    new THREE.Vector2(rimR * 1.005, hw * 0.88 * lipSign),
    new THREE.Vector2(rimR * 0.94, hw * 0.84 * lipSign),
    new THREE.Vector2(rimR * 0.94, -hw * 0.88 * lipSign),
  ];
  const geo = new THREE.LatheGeometry(pts, 64);
  geo.rotateZ(Math.PI / 2);
  return geo;
}

export function createCommonDrivetrainMaterials(
  textures: ProceduralTextures,
  clippingPlanes: THREE.Plane[],
) {
  return {
    steelDark: new THREE.MeshStandardMaterial({
      color: 0x26292e,
      metalness: 0.65,
      roughness: 0.42,
      clippingPlanes,
    }),
    aluminum: new THREE.MeshStandardMaterial({
      color: 0xc2c7ce,
      metalness: 0.85,
      roughness: 0.34,
      bumpMap: textures.brushedMetalBump,
      bumpScale: 0.002,
      clippingPlanes,
    }),
    magnesium: new THREE.MeshStandardMaterial({
      color: 0x9aa0a6,
      metalness: 0.72,
      roughness: 0.48,
      bumpMap: textures.brushedMetalBump,
      bumpScale: 0.0025,
      clippingPlanes,
    }),
    chrome: new THREE.MeshStandardMaterial({
      color: 0xedf1f6,
      metalness: 0.94,
      roughness: 0.14,
      clippingPlanes,
    }),
    exhaustTitanium: new THREE.MeshStandardMaterial({
      color: 0x9ca4b0,
      metalness: 0.88,
      roughness: 0.24,
      clippingPlanes,
    }),
    burntBlueTip: new THREE.MeshStandardMaterial({
      color: 0x4569b8,
      metalness: 0.92,
      roughness: 0.18,
      clippingPlanes,
    }),
    exhaustBronze: new THREE.MeshStandardMaterial({
      color: 0x8f745c,
      metalness: 0.78,
      roughness: 0.36,
      clippingPlanes,
    }),
    leatherBlack: new THREE.MeshStandardMaterial({
      color: 0x181a1d,
      metalness: 0.05,
      roughness: 0.76,
      clippingPlanes,
    }),
    tire: new THREE.MeshStandardMaterial({
      color: 0x1b1c1f,
      metalness: 0.02,
      roughness: 0.86,
      bumpMap: textures.tireTreadBump,
      bumpScale: 0.004,
      clippingPlanes,
    }),
    disc: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.brakeDiscMap,
      metalness: 0.82,
      roughness: 0.32,
      clippingPlanes,
    }),
    bilsteinYellow: new THREE.MeshStandardMaterial({
      color: 0xdfb21a,
      metalness: 0.25,
      roughness: 0.35,
      clippingPlanes,
    }),
    redAccent: new THREE.MeshStandardMaterial({
      color: 0xd6182b,
      metalness: 0.2,
      roughness: 0.36,
      clippingPlanes,
    }),
    goldCalipers: new THREE.MeshStandardMaterial({
      color: 0xd99b26,
      metalness: 0.55,
      roughness: 0.28,
      clippingPlanes,
    }),
    cylinderLiner: new THREE.MeshPhysicalMaterial({
      color: 0xaab4be,
      metalness: 0.55,
      roughness: 0.32,
      transparent: false,
      opacity: 1,
      clippingPlanes,
    }),
  };
}

/**
 * Builds an animated overhead-cam / multi-cylinder crank-piston-rod mechanism along any
 * bank tilt angle (`0` = vertical inline, `+-PI/4` = 90° V8, `+-PI/6` = 60° V6, `+-PI/2` = Flat-6).
 */
export function buildBankedCylinderVisual(opts: {
  cylNumber: number;
  bankSign: 1 | -1;
  bankTiltRad: number;
  zLocal: number;
  bore: number;
  crankR: number;
  rodLen: number;
  blockGroup: THREE.Group;
  linerMat: THREE.Material;
  pistonMat: THREE.Material;
  rodMat: THREE.Material;
  ringMat: THREE.Material;
  pinMat: THREE.Material;
  clippingPlanes: THREE.Plane[];
}): PistonVisual {
  const {
    cylNumber,
    bankSign,
    bankTiltRad,
    zLocal,
    bore,
    crankR,
    rodLen,
    blockGroup,
    linerMat,
    pistonMat,
    rodMat,
    ringMat,
    pinMat,
    clippingPlanes,
  } = opts;

  const rBore = bore * 0.5;
  const axX = Math.sin(bankTiltRad);
  const axY = Math.cos(bankTiltRad);
  const midTravel = rodLen * 0.92;

  // Transparent / cutaway cylinder sleeve aligned with bank axis
  const sleeveGroup = new THREE.Group();
  sleeveGroup.position.set(axX * midTravel, axY * midTravel, zLocal);
  sleeveGroup.rotation.z = -bankTiltRad;
  const sleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(rBore + 0.005, rBore + 0.005, crankR * 2.35, 18, 1, true),
    linerMat,
  );
  sleeveGroup.add(sleeve);
  blockGroup.add(sleeveGroup);

  // Combustion chamber flash disc at TDC top of stroke
  const tdcDist = rodLen + crankR + 0.012;
  const chamberGlowMat = new THREE.MeshStandardMaterial({
    color: 0xff5a1f,
    emissive: 0xff4500,
    emissiveIntensity: 0,
    transparent: true,
    opacity: 0.85,
    clippingPlanes,
  });
  const glowDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(rBore * 0.88, rBore * 0.88, 0.016, 16),
    chamberGlowMat,
  );
  glowDisc.position.set(axX * tdcDist, axY * tdcDist, zLocal);
  glowDisc.rotation.z = -bankTiltRad;
  blockGroup.add(glowDisc);

  // Piston head + compression rings oriented along bank axis
  const pistonGroup = new THREE.Group();
  pistonGroup.rotation.z = -bankTiltRad;
  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(rBore * 0.92, rBore * 0.92, 0.042, 18),
    pistonMat,
  );
  pistonGroup.add(crown);
  for (let ri = 0; ri < 2; ri++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(rBore * 0.94, 0.002, 6, 18),
      ringMat,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.012 - ri * 0.009;
    pistonGroup.add(ring);
  }
  blockGroup.add(pistonGroup);

  // Connecting rod reaching downward (-local Y from wrist pin toward crankpin)
  const rodGroup = new THREE.Group();
  const rodBeam = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, rodLen, 0.015),
    rodMat,
  );
  rodBeam.position.y = -rodLen * 0.5;
  rodGroup.add(rodBeam);
  const bigEnd = new THREE.Mesh(
    new THREE.CylinderGeometry(0.021, 0.021, 0.020, 14),
    pistonMat,
  );
  bigEnd.rotation.x = Math.PI / 2;
  bigEnd.position.y = -rodLen;
  rodGroup.add(bigEnd);
  blockGroup.add(rodGroup);

  // Rotating crank journal counterweight marker in XY plane
  const crankPinMarker = new THREE.Mesh(
    new THREE.CylinderGeometry(0.017, 0.017, 0.022, 12),
    pinMat,
  );
  crankPinMarker.rotation.x = Math.PI / 2;
  crankPinMarker.position.set(0, 0, zLocal);
  blockGroup.add(crankPinMarker);

  return {
    cylinderNumber: cylNumber,
    bankSign,
    bankTiltRad,
    zLocal,
    pistonGroup,
    rodGroup,
    crankPinMarker,
    chamberGlowMat,
  };
}

/**
 * Updates vertical/V-banked cylinder pistons, con-rods, crankpins, and combustion glow.
 */
export function updateBankedPistons(
  visuals: PistonVisual[],
  kin: EngineKinematics,
  crankR: number,
) {
  for (let i = 0; i < visuals.length; i++) {
    const pv = visuals[i];
    const cylState = kin.cylinders.find((c) => c.cylinderNumber === pv.cylinderNumber);
    if (!cylState) continue;

    const s = Math.abs(cylState.pistonOffset);
    const axX = Math.sin(pv.bankTiltRad);
    const axY = Math.cos(pv.bankTiltRad);

    pv.pistonGroup.position.set(axX * s, axY * s, pv.zLocal);
    pv.rodGroup.position.set(axX * s, axY * s, pv.zLocal);
    pv.rodGroup.rotation.z = -pv.bankTiltRad + cylState.rodAngleRad;

    const pinWorldX = Math.sin(cylState.throwAngleRad) * crankR;
    const pinWorldY = Math.cos(cylState.throwAngleRad) * crankR;
    pv.crankPinMarker.position.set(pinWorldX, pinWorldY, pv.zLocal);

    pv.chamberGlowMat.emissiveIntensity = cylState.combustionIntensity * 2.8;
    pv.chamberGlowMat.opacity = 0.15 + cylState.combustionIntensity * 0.85;
  }
}
