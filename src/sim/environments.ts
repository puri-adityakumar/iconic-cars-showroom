import * as THREE from 'three';
import { ENVIRONMENTS, EnvironmentId, EnvironmentSpec } from './specs';
import { ProceduralTextures } from './textures';

export interface EnvironmentRig {
  root: THREE.Group;
  applyEnvironment: (
    id: EnvironmentId,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    lights: {
      hemi: THREE.HemisphereLight;
      key: THREE.DirectionalLight;
      rim: THREE.DirectionalLight;
    },
  ) => EnvironmentSpec;
  update: (dt: number, elapsed: number) => void;
  dispose: () => void;
}

const _dummy = new THREE.Object3D();
const _tmpColor = new THREE.Color();

interface ParticleData {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  vrx: number;
  vry: number;
  scale: number;
  phase: number;
}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

export function createEnvironmentRig(textures: ProceduralTextures): EnvironmentRig {
  const root = new THREE.Group();
  root.name = 'studio_with_forza_backdrops';

  // 1. Atmospheric Gradient Sky Dome (ShaderMaterial)
  const skyUniforms = {
    uTopColor: { value: new THREE.Color('#2f3557') },
    uMidColor: { value: new THREE.Color('#997b98') },
    uHorizonColor: { value: new THREE.Color('#f5c7bd') },
    uSunDir: { value: new THREE.Vector3(0.5, 0.3, -0.7).normalize() },
    uSunColor: { value: new THREE.Color('#ffe4cc') },
    uSunStrength: { value: 1.0 },
  };

  const skyGeo = new THREE.SphereGeometry(54, 32, 20);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: `
      varying vec3 vWorldDir;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(worldPos.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uTopColor;
      uniform vec3 uMidColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform float uSunStrength;
      varying vec3 vWorldDir;

      void main() {
        float h = clamp(vWorldDir.y, 0.0, 1.0);
        vec3 col = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.28, h));
        col = mix(col, uTopColor, smoothstep(0.22, 0.85, h));

        float sunDot = max(dot(normalize(vWorldDir), normalize(uSunDir)), 0.0);
        float halo = pow(sunDot, 10.0) * 0.32 + pow(sunDot, 96.0) * 0.80;
        col += uSunColor * halo * uSunStrength;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  root.add(skyMesh);

  // =========================================================================
  // 2. ARCHITECTURAL DESIGN STUDIO STAGE (Active in ALL 4 Themes!)
  // =========================================================================
  const studioStageGroup = new THREE.Group();

  // Seamless studio cyclorama disc for pure 'studio' mode (large radius 24m)
  const studioCycloramaGeo = new THREE.CircleGeometry(24, 64);
  studioCycloramaGeo.rotateX(-Math.PI / 2);
  const studioFloorMat = new THREE.MeshStandardMaterial({
    color: 0x1f2228,
    roughness: 0.42,
    metalness: 0.14,
    bumpMap: textures.asphaltBump,
    bumpScale: 0.0008,
  });
  const pureStudioFloorMesh = new THREE.Mesh(studioCycloramaGeo, studioFloorMat);
  pureStudioFloorMesh.receiveShadow = true;
  studioStageGroup.add(pureStudioFloorMesh);

  // Architectural circular studio pavilion deck (radius 9.4m for scenic studio themes)
  const pavilionDeckGeo = new THREE.CircleGeometry(9.4, 72);
  pavilionDeckGeo.rotateX(-Math.PI / 2);
  const pavilionDeckMat = new THREE.MeshStandardMaterial({
    color: 0x1c1f25,
    roughness: 0.44,
    metalness: 0.12,
    bumpMap: textures.asphaltBump,
    bumpScale: 0.0012,
  });
  const pavilionDeckMesh = new THREE.Mesh(pavilionDeckGeo, pavilionDeckMat);
  pavilionDeckMesh.receiveShadow = true;
  studioStageGroup.add(pavilionDeckMesh);

  // Precision brushed-metal turntable ring around the 911
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x5a5f6b,
    transparent: true,
    opacity: 0.78,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const innerRingMesh = new THREE.Mesh(new THREE.RingGeometry(2.42, 2.455, 72), ringMat);
  innerRingMesh.rotation.x = -Math.PI / 2;
  innerRingMesh.position.y = 0.002;
  studioStageGroup.add(innerRingMesh);

  const outerStageRing = new THREE.Mesh(new THREE.RingGeometry(5.65, 5.68, 72), ringMat);
  outerStageRing.rotation.x = -Math.PI / 2;
  outerStageRing.position.y = 0.002;
  studioStageGroup.add(outerStageRing);

  // Subtle architectural studio radial floor joint lines (4 hairline axes outside turntable)
  const floorJointMat = new THREE.MeshBasicMaterial({
    color: 0x454a54,
    transparent: true,
    opacity: 0.34,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  ([0, Math.PI / 2] as const).forEach((rot) => {
    ([-4.05, 4.05] as const).forEach((offset) => {
      const joint = new THREE.Mesh(new THREE.PlaneGeometry(0.016, 3.1), floorJointMat);
      joint.rotation.x = -Math.PI / 2;
      joint.rotation.z = rot;
      if (rot === 0) joint.position.set(0, 0.0018, offset);
      else joint.position.set(offset, 0.0018, 0);
      studioStageGroup.add(joint);
    });
  });

  // Overhead Suspended Studio Softbox Canopy (reflections + industrial gallery presence)
  const softboxFrameMat = new THREE.MeshStandardMaterial({
    color: 0x202328,
    roughness: 0.5,
    metalness: 0.6,
  });
  const softboxPanelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.75,
    roughness: 0.25,
  });
  ([-1.05, 1.05] as const).forEach((sx) => {
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.05, 3.9), softboxFrameMat);
    housing.position.set(sx, 4.38, 0);
    studioStageGroup.add(housing);

    const diffuser = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 3.8), softboxPanelMat);
    diffuser.rotation.x = Math.PI / 2;
    diffuser.position.set(sx, 4.35, 0);
    studioStageGroup.add(diffuser);
  });

  // Glass-Walled Studio Pavilion Framing (for Sakura / Canada / India backdrops)
  const pavilionArchitectureGroup = new THREE.Group();
  const parapetMat = new THREE.MeshStandardMaterial({
    color: 0x2b2e34,
    roughness: 0.55,
    metalness: 0.35,
  });
  const glassTrimMat = new THREE.MeshStandardMaterial({
    color: 0x24272c,
    roughness: 0.42,
    metalness: 0.65,
  });

  // Sleek low architectural deck curb & perimeter terrace sill around r = 9.35m
  const deckCurb = new THREE.Mesh(
    new THREE.TorusGeometry(9.38, 0.14, 8, 72),
    parapetMat,
  );
  deckCurb.rotation.x = Math.PI / 2;
  deckCurb.position.y = 0.06;
  pavilionArchitectureGroup.add(deckCurb);

  // Subtle panoramic studio glass balustrade rail (y = 0.44m, ultra-clean sightlines)
  const railRing = new THREE.Mesh(
    new THREE.TorusGeometry(9.38, 0.025, 8, 72),
    glassTrimMat,
  );
  railRing.rotation.x = Math.PI / 2;
  railRing.position.y = 0.46;
  pavilionArchitectureGroup.add(railRing);

  // Slender architectural steel pavilion mullions (spaced wide at r = 9.38m)
  const mullionCount = 12;
  const mullionGeo = new THREE.BoxGeometry(0.08, 4.75, 0.08);
  const mullionInst = new THREE.InstancedMesh(mullionGeo, glassTrimMat, mullionCount);
  for (let i = 0; i < mullionCount; i++) {
    const a = (i / mullionCount) * Math.PI * 2 + Math.PI / 12;
    _dummy.position.set(Math.cos(a) * 9.38, 2.38, Math.sin(a) * 9.38);
    _dummy.rotation.set(0, -a, 0);
    _dummy.scale.set(1, 1, 1);
    _dummy.updateMatrix();
    mullionInst.setMatrixAt(i, _dummy.matrix);
  }
  mullionInst.instanceMatrix.needsUpdate = true;
  pavilionArchitectureGroup.add(mullionInst);

  // Upper architectural pavilion fascia ring at y = 4.76m
  const ceilingRing = new THREE.Mesh(
    new THREE.TorusGeometry(9.38, 0.11, 8, 72),
    parapetMat,
  );
  ceilingRing.rotation.x = Math.PI / 2;
  ceilingRing.position.y = 4.76;
  pavilionArchitectureGroup.add(ceilingRing);

  studioStageGroup.add(pavilionArchitectureGroup);
  root.add(studioStageGroup);

  // =========================================================================
  // 3. SCENIC FORZA HORIZON GARDEN / MOUNTAINS OUTSIDE STUDIO PAVILION
  // =========================================================================
  const vistaGroup = new THREE.Group();

  // Rolling valley terrain beyond the studio terrace (r >= 9.45m, depressed cleanly under studio deck)
  const terrainHeightAt = (vx: number, vz: number) => {
    const r = Math.hypot(vx, vz);
    const terraceDist = Math.max(0, r - 9.5);
    if (terraceDist < 0.05) return -0.18;
    const slope = Math.min(1, terraceDist / 12.0);
    const undulation =
      Math.sin(vx * 0.14 + vz * 0.10) * 0.65 +
      Math.cos(vx * 0.08 - vz * 0.13) * 0.85 +
      0.35;
    const farRise = Math.max(0, terraceDist - 10) * 0.11;
    return -0.16 + undulation * slope + farRise;
  };

  const terrainMat = new THREE.MeshStandardMaterial({
    color: 0x4f5a44,
    roughness: 0.94,
    metalness: 0.0,
  });
  const terrainGeo = new THREE.PlaneGeometry(96, 96, 48, 48);
  terrainGeo.rotateX(-Math.PI / 2);
  const tPos = terrainGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < tPos.count; i++) {
    tPos.setY(i, terrainHeightAt(tPos.getX(i), tPos.getZ(i)));
  }
  terrainGeo.computeVertexNormals();
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  vistaGroup.add(terrainMesh);

  // Three layered distant mountain ridge silhouettes
  const buildMountainRing = (
    radius: number,
    baseHeight: number,
    amp: number,
    mat: THREE.Material,
    phase: number,
  ) => {
    const segs = 64;
    const positions: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;
      const ridge =
        baseHeight +
        Math.sin(a * 5 + phase) * amp * 0.55 +
        Math.cos(a * 11 - phase * 1.3) * amp * 0.3 +
        Math.sin(a * 19 + 0.7) * amp * 0.15;
      positions.push(x, -1.5, z);
      positions.push(x, Math.max(1.0, ridge), z);
    }
    for (let i = 0; i < segs; i++) {
      const b0 = i * 2;
      const t0 = b0 + 1;
      const b1 = b0 + 2;
      const t1 = b0 + 3;
      indices.push(b0, t0, b1, t0, t1, b1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, mat);
  };

  const mountainNearMat = new THREE.MeshBasicMaterial({
    color: 0x4d4d63,
    side: THREE.DoubleSide,
  });
  const mountainFarMat = new THREE.MeshBasicMaterial({
    color: 0x7d7591,
    side: THREE.DoubleSide,
  });
  vistaGroup.add(buildMountainRing(28, 2.7, 1.5, mountainNearMat, 0.4));
  vistaGroup.add(buildMountainRing(38, 4.4, 2.2, mountainFarMat, 1.9));
  vistaGroup.add(buildMountainRing(48, 6.2, 2.9, mountainFarMat, 3.2));

  // Full 360-degree garden ring of 32 scenic trees outside the studio terrace (r = 11.4 .. 21.5m)
  const treeConfigs: Array<{ x: number; z: number; scale: number; rot: number; seed: number }> = [];
  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2 + (seededRand(i * 3 + 1) - 0.5) * 0.14;
    const radius = 11.6 + seededRand(i * 7 + 2) * 9.6;
    const sc = 0.85 + seededRand(i * 11 + 3) * 0.48;
    treeConfigs.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      scale: sc,
      rot: seededRand(i * 13 + 4) * Math.PI * 2,
      seed: i,
    });
  }

  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x3b2c25,
    roughness: 0.92,
    metalness: 0.0,
  });
  const trunkGeo = new THREE.CylinderGeometry(0.09, 0.19, 2.35, 7);
  trunkGeo.translate(0, 1.18, 0);
  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeConfigs.length);
  trunkInst.castShadow = false;
  trunkInst.receiveShadow = true;

  // 5 organic canopy clusters per tree = 160 instances
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.84,
    metalness: 0.0,
  });
  const canopyGeo = new THREE.IcosahedronGeometry(1.02, 2);
  const canopyPerTree = 5;
  const canopyCount = treeConfigs.length * canopyPerTree;
  const canopyInst = new THREE.InstancedMesh(canopyGeo, canopyMat, canopyCount);
  canopyInst.castShadow = false;

  // 36 flowering garden shrubs framing the terrace perimeter (r = 10.6 .. 16.5m)
  const shrubGeo = new THREE.IcosahedronGeometry(0.62, 1);
  const shrubCount = 36;
  const shrubInst = new THREE.InstancedMesh(shrubGeo, canopyMat, shrubCount);
  vistaGroup.add(shrubInst);

  // Decorative granite boulders in the studio perimeter garden (18 instances)
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x62656b,
    roughness: 0.92,
    metalness: 0.04,
  });
  const rockGeo = new THREE.DodecahedronGeometry(0.45, 0);
  const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, 18);
  for (let i = 0; i < 18; i++) {
    const ang = (i / 18) * Math.PI * 2 + 0.12;
    const rad = 10.7 + seededRand(i * 19 + 5) * 4.8;
    const rx = Math.cos(ang) * rad;
    const rz = Math.sin(ang) * rad;
    const rs = 0.72 + seededRand(i * 23 + 6) * 0.85;
    _dummy.position.set(rx, terrainHeightAt(rx, rz) + 0.18 * rs, rz);
    _dummy.rotation.set(seededRand(i) * 2, seededRand(i + 1) * 3, 0);
    _dummy.scale.set(rs * 1.25, rs * 0.72, rs);
    _dummy.updateMatrix();
    rockInst.setMatrixAt(i, _dummy.matrix);
  }
  rockInst.instanceMatrix.needsUpdate = true;
  vistaGroup.add(rockInst);

  // Sakura Stone Toro Lanterns + Hillside Vermilion Torii Gate outside the glass studio
  const sakuraPropsGroup = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x7f7d78, roughness: 0.9 });
  const lanternGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffe4b5,
    emissive: 0xffb35c,
    emissiveIntensity: 1.45,
    roughness: 0.35,
  });
  ([-3.4, 3.4] as const).forEach((lx) => {
    const toro = new THREE.Group();
    const lz = -10.4;
    toro.position.set(lx, terrainHeightAt(lx, lz) + 0.04, lz);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.76, 6), stoneMat);
    base.position.y = 0.38;
    toro.add(base);
    const chamber = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), lanternGlowMat);
    chamber.position.y = 0.88;
    toro.add(chamber);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.22, 6), stoneMat);
    roof.position.y = 1.11;
    toro.add(roof);
    sakuraPropsGroup.add(toro);
  });

  const toriiMat = new THREE.MeshStandardMaterial({ color: 0xb82924, roughness: 0.68 });
  const toriiGroup = new THREE.Group();
  toriiGroup.position.set(-10.2, terrainHeightAt(-10.2, -11.5), -11.5);
  toriiGroup.rotation.y = 0.62;
  ([-0.92, 0.92] as const).forEach((px) => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.12, 2.55, 10), toriiMat);
    pillar.position.set(px, 1.28, 0);
    toriiGroup.add(pillar);
  });
  const kasagi = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.17, 0.24), toriiMat);
  kasagi.position.set(0, 2.55, 0);
  toriiGroup.add(kasagi);
  const nuki = new THREE.Mesh(new THREE.BoxGeometry(2.30, 0.12, 0.16), toriiMat);
  nuki.position.set(0, 2.08, 0);
  toriiGroup.add(nuki);
  sakuraPropsGroup.add(toriiGroup);
  vistaGroup.add(sakuraPropsGroup);

  treeConfigs.forEach((cfg, idx) => {
    const ty = terrainHeightAt(cfg.x, cfg.z);
    _dummy.position.set(cfg.x, ty, cfg.z);
    _dummy.rotation.set(0, cfg.rot, 0);
    _dummy.scale.set(cfg.scale, cfg.scale * (0.92 + seededRand(idx + 50) * 0.24), cfg.scale);
    _dummy.updateMatrix();
    trunkInst.setMatrixAt(idx, _dummy.matrix);
  });
  trunkInst.instanceMatrix.needsUpdate = true;
  vistaGroup.add(trunkInst);
  vistaGroup.add(canopyInst);

  // Subtle fallen petals / leaves around the studio floor edge (48 instances, r = 5.8 .. 8.9m)
  const floorLeafGeo = new THREE.PlaneGeometry(0.085, 0.055);
  floorLeafGeo.rotateX(-Math.PI / 2);
  const floorLeafMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.78,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const floorLeafCount = 48;
  const floorLeafInst = new THREE.InstancedMesh(floorLeafGeo, floorLeafMat, floorLeafCount);
  for (let i = 0; i < floorLeafCount; i++) {
    const ang = seededRand(i * 31 + 2) * Math.PI * 2;
    const rad = 5.9 + seededRand(i * 37 + 3) * 2.9;
    const gs = 0.7 + seededRand(i * 41 + 4) * 0.65;
    _dummy.position.set(Math.cos(ang) * rad, 0.004, Math.sin(ang) * rad);
    _dummy.rotation.set(0, seededRand(i * 43) * Math.PI * 2, 0);
    _dummy.scale.set(gs, 1, gs);
    _dummy.updateMatrix();
    floorLeafInst.setMatrixAt(i, _dummy.matrix);
  }
  floorLeafInst.instanceMatrix.needsUpdate = true;
  vistaGroup.add(floorLeafInst);

  // 4. Drifting Atmospheric Petals / Maple Leaves / Monsoon Leaves around Studio Pavilion
  const particleCount = 128;
  const particleGeo = new THREE.PlaneGeometry(0.082, 0.052);
  const particleMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.88,
  });
  const particleInst = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
  particleInst.frustumCulled = false;

  const particles: ParticleData[] = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: (seededRand(i * 5 + 1) - 0.5) * 22,
      y: 0.35 + seededRand(i * 5 + 2) * 5.2,
      z: (seededRand(i * 5 + 3) - 0.5) * 22,
      vx: 0.24 + seededRand(i * 5 + 4) * 0.38,
      vy: -(0.20 + seededRand(i * 5 + 5) * 0.26),
      vz: (seededRand(i * 7 + 2) - 0.5) * 0.30,
      rx: seededRand(i * 9 + 1) * Math.PI * 2,
      ry: seededRand(i * 9 + 2) * Math.PI * 2,
      rz: seededRand(i * 9 + 3) * Math.PI * 2,
      vrx: (seededRand(i * 11 + 1) - 0.5) * 2.2,
      vry: (seededRand(i * 11 + 2) - 0.5) * 2.5,
      scale: 0.72 + seededRand(i * 13 + 1) * 0.62,
      phase: seededRand(i * 17 + 1) * Math.PI * 2,
    });
  }
  vistaGroup.add(particleInst);
  root.add(vistaGroup);

  const biomePalettes: Record<Exclude<EnvironmentId, 'studio'>, {
    canopy: number[];
    particles: number[];
    trunk: number;
  }> = {
    sakura: {
      canopy: [0xf7b9ce, 0xf29db9, 0xfbd4e2, 0xe886a7],
      particles: [0xffc4d8, 0xf79ebb, 0xffe0eb, 0xf08cae],
      trunk: 0x35252b,
    },
    canada: {
      canopy: [0xc9301e, 0xe05822, 0xe8941e, 0xa82218, 0x244730],
      particles: [0xd6361c, 0xeb6a1e, 0xf0a624, 0xb32418],
      trunk: 0x3d2e24,
    },
    india: {
      canopy: [0x1c522c, 0x2b6e3a, 0x3b8546, 0x164023, 0x4d8f44],
      particles: [0x4c9648, 0x7cb85a, 0xd8ebe0, 0x2e753c],
      trunk: 0x332b22,
    },
  };

  let currentOutdoor = true;

  const applyEnvironment = (
    id: EnvironmentId,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    lights: {
      hemi: THREE.HemisphereLight;
      key: THREE.DirectionalLight;
      rim: THREE.DirectionalLight;
    },
  ): EnvironmentSpec => {
    const spec = ENVIRONMENTS.find((e) => e.id === id) || ENVIRONMENTS[0];
    currentOutdoor = spec.isOutdoor;

    // Sky & Fog
    skyUniforms.uTopColor.value.set(spec.skyTopHex);
    skyUniforms.uMidColor.value.set(spec.skyMidHex);
    skyUniforms.uHorizonColor.value.set(spec.skyHorizonHex);
    skyUniforms.uSunColor.value.set(spec.sunColorHex);
    skyUniforms.uSunDir.value.set(...spec.sunPos).normalize();
    skyUniforms.uSunStrength.value = spec.isOutdoor ? 1.0 : 0.0;

    scene.background = new THREE.Color(spec.fogHex);
    scene.fog = new THREE.FogExp2(spec.fogHex, spec.fogDensity);
    renderer.toneMappingExposure = spec.exposure;

    // Studio Lighting Rig
    lights.hemi.color.set(spec.hemiSkyHex);
    lights.hemi.groundColor.set(spec.hemiGroundHex);
    lights.hemi.intensity = spec.hemiIntensity;

    lights.key.color.set(spec.sunColorHex);
    lights.key.intensity = spec.sunIntensity;
    lights.key.position.set(...spec.sunPos);

    lights.rim.color.set(spec.rimColorHex);
    lights.rim.intensity = spec.rimIntensity;

    // Studio floor & softboxes stay visible in ALL 4 modes
    pureStudioFloorMesh.visible = !spec.isOutdoor;
    pavilionDeckMesh.visible = spec.isOutdoor;
    pavilionArchitectureGroup.visible = spec.isOutdoor;
    vistaGroup.visible = spec.isOutdoor;
    sakuraPropsGroup.visible = spec.id === 'sakura';

    studioFloorMat.color.set(spec.floorHex);
    studioFloorMat.roughness = spec.floorRoughness;
    studioFloorMat.metalness = spec.floorMetalness;

    pavilionDeckMat.color.set(spec.floorHex);
    pavilionDeckMat.roughness = spec.floorRoughness;
    pavilionDeckMat.metalness = spec.floorMetalness;

    ringMat.color.set(spec.ringHex);
    floorJointMat.color.set(0x454a54);
    softboxPanelMat.color.set(spec.softboxHex);
    softboxPanelMat.emissive.set(spec.softboxHex);

    if (spec.isOutdoor) {
      terrainMat.color.set(spec.shoulderHex);
      mountainNearMat.color.set(spec.mountainNearHex);
      mountainFarMat.color.set(spec.mountainFarHex);

      const pal = biomePalettes[spec.id as Exclude<EnvironmentId, 'studio'>];
      trunkMat.color.setHex(pal.trunk);

      treeConfigs.forEach((cfg, tIdx) => {
        const ty = terrainHeightAt(cfg.x, cfg.z);
        const offsets = [
          [0, 2.55 * cfg.scale, 0, 1.04],
          [-0.68 * cfg.scale, 2.02 * cfg.scale, 0.42 * cfg.scale, 0.82],
          [0.65 * cfg.scale, 2.12 * cfg.scale, -0.38 * cfg.scale, 0.84],
          [0.32 * cfg.scale, 2.20 * cfg.scale, 0.62 * cfg.scale, 0.74],
          [-0.36 * cfg.scale, 2.85 * cfg.scale, -0.26 * cfg.scale, 0.70],
        ];
        offsets.forEach(([ox, oy, oz, cs], cSub) => {
          const instIdx = tIdx * canopyPerTree + cSub;
          _dummy.position.set(cfg.x + ox, ty + oy, cfg.z + oz);
          _dummy.rotation.set(0, cfg.rot + cSub * 1.1, 0);
          const flatScale = spec.id === 'sakura' ? 0.68 : spec.id === 'india' ? 0.78 : 0.94;
          _dummy.scale.set(
            cfg.scale * cs * 1.15,
            cfg.scale * cs * flatScale,
            cfg.scale * cs * 1.15,
          );
          _dummy.updateMatrix();
          canopyInst.setMatrixAt(instIdx, _dummy.matrix);

          const colHex = pal.canopy[(tIdx + cSub) % pal.canopy.length];
          _tmpColor.setHex(colHex);
          canopyInst.setColorAt(instIdx, _tmpColor);
        });
      });
      canopyInst.instanceMatrix.needsUpdate = true;
      if (canopyInst.instanceColor) canopyInst.instanceColor.needsUpdate = true;

      for (let i = 0; i < shrubCount; i++) {
        const ang = (i / shrubCount) * Math.PI * 2 + 0.08;
        const rad = 10.6 + seededRand(i * 17 + 7) * 5.8;
        const sx = Math.cos(ang) * rad;
        const sz = Math.sin(ang) * rad;
        const sy = terrainHeightAt(sx, sz) + 0.25;
        const sc = 0.68 + seededRand(i * 29 + 3) * 0.78;
        _dummy.position.set(sx, sy, sz);
        _dummy.rotation.set(0, seededRand(i * 11) * Math.PI * 2, 0);
        _dummy.scale.set(sc * 1.35, sc * 0.68, sc * 1.25);
        _dummy.updateMatrix();
        shrubInst.setMatrixAt(i, _dummy.matrix);

        const colHex = pal.canopy[(i + 2) % pal.canopy.length];
        _tmpColor.setHex(colHex);
        shrubInst.setColorAt(i, _tmpColor);
      }
      shrubInst.instanceMatrix.needsUpdate = true;
      if (shrubInst.instanceColor) shrubInst.instanceColor.needsUpdate = true;

      for (let i = 0; i < floorLeafCount; i++) {
        const colHex = pal.particles[i % pal.particles.length];
        _tmpColor.setHex(colHex);
        floorLeafInst.setColorAt(i, _tmpColor);
      }
      if (floorLeafInst.instanceColor) floorLeafInst.instanceColor.needsUpdate = true;

      for (let i = 0; i < particleCount; i++) {
        const colHex = pal.particles[i % pal.particles.length];
        _tmpColor.setHex(colHex);
        particleInst.setColorAt(i, _tmpColor);
      }
      if (particleInst.instanceColor) particleInst.instanceColor.needsUpdate = true;
    }

    return spec;
  };

  const update = (dt: number, elapsed: number) => {
    if (!currentOutdoor) return;
    for (let i = 0; i < particleCount; i++) {
      const p = particles[i];
      p.x += (p.vx + Math.sin(elapsed * 0.9 + p.phase) * 0.22) * dt;
      p.y += p.vy * dt;
      p.z += (p.vz + Math.cos(elapsed * 0.7 + p.phase) * 0.16) * dt;
      p.rx += p.vrx * dt;
      p.ry += p.vry * dt;

      if (p.y < 0.12) p.y = 5.4;
      if (p.x > 11.5) p.x = -11.5;
      if (p.x < -11.5) p.x = 11.5;
      if (p.z > 11.5) p.z = -11.5;
      if (p.z < -11.5) p.z = 11.5;

      _dummy.position.set(p.x, p.y, p.z);
      _dummy.rotation.set(p.rx, p.ry, p.rz);
      _dummy.scale.setScalar(p.scale);
      _dummy.updateMatrix();
      particleInst.setMatrixAt(i, _dummy.matrix);
    }
    particleInst.instanceMatrix.needsUpdate = true;
  };

  const dispose = () => {
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => m.dispose());
      }
    });
  };

  return {
    root,
    applyEnvironment,
    update,
    dispose,
  };
}
