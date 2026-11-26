import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { CarRig } from './carCommon';
import { buildPorsche911Car } from './porsche911Car';
import { buildBmwE30M3Car } from './bmwE30M3';
import { buildBmwE39M5Car } from './bmwE39M5';
import { buildNissanR35GTRCar } from './nissanR35GTR';
import {
  CameraPresetId,
  CutawayMode,
  EnvironmentId,
  LiveryId,
  SubsystemId,
  VEHICLES,
  VehicleId,
  computeTeardownPose,
  solveEngineKinematics,
} from './specs';
import { createProceduralTextures } from './textures';
import { createEnvironmentRig } from './environments';

export interface SimExternalState {
  vehicleId: VehicleId;
  explode: number; // 0..1
  rpm: number;
  playing: boolean;
  mode: CutawayMode;
  subsystem: SubsystemId;
  livery: LiveryId;
  environment: EnvironmentId;
  cameraPreset: CameraPresetId;
  tourActive: boolean;
}

export interface CalloutScreenPoint {
  id: SubsystemId;
  label: string;
  x: number;
  y: number;
  visible: boolean;
}

export interface DirectorFrameState {
  vehicleId?: VehicleId;
  livery?: LiveryId;
  environment?: EnvironmentId;
  mode?: CutawayMode;
  subsystem?: SubsystemId;
  explode?: number;
  crankDeg?: number;
  wheelSpinRad?: number;
  cameraPos?: [number, number, number];
  cameraTarget?: [number, number, number];
  fov?: number;
  sectionOffset?: number;
  envDt?: number;
  envElapsed?: number;
}

export interface SceneCallbacks {
  onSelectSubsystem: (id: SubsystemId) => void;
  onUserInterruptTour: () => void;
  onCalloutsUpdate: (pts: CalloutScreenPoint[]) => void;
  onCrankDegUpdate: (deg: number) => void;
  onTourStateApply?: (partial: Partial<SimExternalState>) => void;
}

function detectSoftwareWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

const _vec3 = new THREE.Vector3();
const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();

function disposeCarObjectTree(root: THREE.Object3D, sharedTextureSet: Set<THREE.Texture>) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        const stdMat = mat as THREE.MeshStandardMaterial;
        if (stdMat.map && !sharedTextureSet.has(stdMat.map)) {
          stdMat.map.dispose();
        }
        mat.dispose();
      });
    }
  });
}

export function createShowroomScene(
  mountEl: HTMLElement,
  initialState: SimExternalState,
  callbacks: SceneCallbacks,
) {
  const isSoftwareGl = detectSoftwareWebGL();

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    alpha: false,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0xeceef1, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;

  const width = mountEl.clientWidth || window.innerWidth;
  const height = mountEl.clientHeight || window.innerHeight;
  renderer.setSize(width, height);
  mountEl.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeceef1);
  scene.fog = new THREE.FogExp2(0xeceef1, 0.022);

  const getEffectiveFov = (aspect: number) =>
    aspect < 1 ? Math.min(62, 36 / Math.pow(Math.max(0.35, aspect), 0.56)) : 36;

  const initSpec = VEHICLES[initialState.vehicleId];
  const camera = new THREE.PerspectiveCamera(
    getEffectiveFov(width / height),
    width / height,
    0.08,
    140,
  );
  camera.position.set(...initSpec.cameraPresets[initialState.cameraPreset].position);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...initSpec.cameraPresets[initialState.cameraPreset].target);
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.07;
  controls.minDistance = 1.15;
  controls.maxDistance = 10.5;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minPolarAngle = 0.08;
  controls.update();

  // IBL Environment (RoomEnvironment)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  pmrem.dispose();

  // 3-Point Warm/Cool Lighting + Overhead Softboxes
  const hemiLight = new THREE.HemisphereLight(0xf6f8fc, 0x9aa0a8, 0.72);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfff7ea, 1.9);
  keyLight.position.set(4.5, 6.5, 4.2);
  keyLight.castShadow = !isSoftwareGl;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 48;
  keyLight.shadow.camera.left = -3.8;
  keyLight.shadow.camera.right = 3.8;
  keyLight.shadow.camera.top = 3.8;
  keyLight.shadow.camera.bottom = -3.8;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xdce8ff, 0.85);
  rimLight.position.set(-4.5, 3.8, -4.8);
  scene.add(rimLight);

  if (!isSoftwareGl) {
    RectAreaLightUniformsLib.init();
    const overheadSoftbox = new THREE.RectAreaLight(0xffffff, 2.2, 5.5, 2.4);
    overheadSoftbox.position.set(0, 4.2, 0);
    overheadSoftbox.lookAt(0, 0.4, 0);
    scene.add(overheadSoftbox);
  }

  // Shared Procedural Textures & Backdrop Rig
  const textures = createProceduralTextures(renderer.capabilities.getMaxAnisotropy());
  const sharedTextureSet = new Set<THREE.Texture>();
  Object.values(textures).forEach((val) => {
    if (val instanceof THREE.Texture) {
      sharedTextureSet.add(val);
    }
  });

  const environmentRig = createEnvironmentRig(textures);
  scene.add(environmentRig.root);
  environmentRig.applyEnvironment(initialState.environment, scene, renderer, {
    hemi: hemiLight,
    key: keyLight,
    rim: rimLight,
  });

  // Dynamic Contact Shadow Planes (resized cleanly per car!)
  const shadowPlaneMat = new THREE.MeshBasicMaterial({
    map: textures.studioShadowMap,
    transparent: true,
    depthWrite: false,
    opacity: 0.72,
  });
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 4.75), shadowPlaneMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, 0.004, 0);
  scene.add(shadowPlane);

  const tireShadowMat = new THREE.MeshBasicMaterial({
    map: textures.studioShadowMap,
    transparent: true,
    depthWrite: false,
    opacity: 0.85,
  });
  const tireShadowGeo = new THREE.PlaneGeometry(0.46, 0.78);
  const tireShadows: Array<{
    mesh: THREE.Mesh;
    baseX: number;
    baseZ: number;
    sideSign: number;
  }> = Array.from({ length: 4 }, () => {
    const ts = new THREE.Mesh(tireShadowGeo, tireShadowMat);
    ts.rotation.x = -Math.PI / 2;
    scene.add(ts);
    return { mesh: ts, baseX: 0, baseZ: 0, sideSign: 1 };
  });

  // Section Cutaway Clipping Plane
  const sectionPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0.02);
  const clippingPlanes: THREE.Plane[] = [];

  const carRoot = new THREE.Group();
  scene.add(carRoot);

  const state: SimExternalState = { ...initialState };
  let activeRig: CarRig | null = null;
  let pickables: THREE.Object3D[] = [];
  let currentExplode = initialState.explode;
  let crankDeg = 0;
  let wheelSpinRad = 0;
  let cameraTransitionActive = false;
  let directorMode = false;
  let tourTime = 0;
  let lastTourPhase = -1;
  let lastHudSync = -1000;

  const desiredCamPos = new THREE.Vector3(...initSpec.cameraPresets[initialState.cameraPreset].position);
  const desiredCamTarget = new THREE.Vector3(...initSpec.cameraPresets[initialState.cameraPreset].target);

  const buildRigForVehicle = (vid: VehicleId): CarRig => {
    switch (vid) {
      case 'bmw-e30-m3':
        return buildBmwE30M3Car(textures, isSoftwareGl, clippingPlanes);
      case 'bmw-e39-m5':
        return buildBmwE39M5Car(textures, isSoftwareGl, clippingPlanes);
      case 'nissan-r35-gtr':
        return buildNissanR35GTRCar(textures, isSoftwareGl, clippingPlanes);
      case 'porsche-911-rs':
      default:
        return buildPorsche911Car(textures, isSoftwareGl, clippingPlanes);
    }
  };

  const applyLivery = (liveryId: LiveryId) => {
    if (!activeRig) return;
    const vSpec = VEHICLES[state.vehicleId];
    const liv = vSpec.liveries.find((l) => l.id === liveryId) || vSpec.liveries[0];
    activeRig.setLivery(liv, textures);
  };

  const applyVisibilityAndCutaway = () => {
    if (!activeRig) return;
    const isXray = state.mode === 'xray';
    const isSection = state.mode === 'section';

    clippingPlanes.length = 0;
    if (isSection) {
      clippingPlanes.push(sectionPlane);
    }

    const isolateNonBody = state.subsystem !== 'all' && state.subsystem !== 'body';
    const hideBodyForDrivetrainCloseUp =
      state.mode === 'solid' &&
      (state.subsystem === 'engine' || state.subsystem === 'transaxle');
    activeRig.bodyRoot.visible = !hideBodyForDrivetrainCloseUp;

    const bodyTransparent = isXray || isolateNonBody;
    const bodyOpacity = isolateNonBody ? 0.07 : isXray ? 0.22 : 1.0;
    const detailOpacity = isolateNonBody ? 0.06 : isXray ? 0.24 : 1.0;

    const setMatOpacity = (mat: THREE.Material, transparent: boolean, opacity: number) => {
      mat.transparent = transparent;
      mat.opacity = opacity;
      mat.depthWrite = !transparent;
      mat.needsUpdate = true;
    };

    activeRig.fadeableBodyMaterials.forEach((m) => setMatOpacity(m, bodyTransparent, bodyOpacity));
    activeRig.decalMaterials.forEach((m) =>
      setMatOpacity(m, true, bodyTransparent ? detailOpacity : 1.0),
    );
    activeRig.glassMaterials.forEach((m) => {
      m.opacity = isSoftwareGl ? (isolateNonBody ? 0.08 : 0.36) : (isolateNonBody ? 0.08 : 0.42);
    });
    activeRig.lensMaterials.forEach((m) => {
      m.opacity = isolateNonBody ? 0.08 : isXray ? 0.28 : 0.78;
    });

    activeRig.setEngineXray(isXray || state.subsystem === 'engine');

    const showAllOrBody = state.subsystem === 'all' || state.subsystem === 'body';
    activeRig.subsystemGroups.chassis.forEach((grp) => {
      grp.visible = showAllOrBody || state.subsystem === 'chassis';
    });
    activeRig.subsystemGroups.transaxle.forEach((grp) => {
      grp.visible = showAllOrBody || state.subsystem === 'transaxle';
    });
    activeRig.subsystemGroups.engine.forEach((grp) => {
      grp.visible = showAllOrBody || state.subsystem === 'engine';
    });

    const wheelsVisible = showAllOrBody || state.subsystem === 'wheels';
    activeRig.subsystemGroups.wheels.forEach((grp) => {
      grp.visible = wheelsVisible;
    });
    tireShadows.forEach((ts) => {
      ts.mesh.visible = wheelsVisible;
    });
    shadowPlane.visible = showAllOrBody || state.subsystem === 'chassis';
  };

  const loadVehicle = (vid: VehicleId) => {
    if (activeRig) {
      carRoot.remove(activeRig.root);
      disposeCarObjectTree(activeRig.root, sharedTextureSet);
      activeRig = null;
    }

    const vSpec = VEHICLES[vid];
    const rig = buildRigForVehicle(vid);
    activeRig = rig;
    carRoot.add(rig.root);

    // Collect raycastable subsystem pickables
    pickables = [];
    const tagList = (groups: THREE.Object3D[], id: SubsystemId) => {
      groups.forEach((grp) => {
        grp.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.userData.subsystem = id;
            pickables.push(child);
          }
        });
      });
    };
    tagList(rig.subsystemGroups.body, 'body');
    tagList(rig.subsystemGroups.chassis, 'chassis');
    tagList(rig.subsystemGroups.transaxle, 'transaxle');
    tagList(rig.subsystemGroups.engine, 'engine');
    tagList(rig.subsystemGroups.wheels, 'wheels');

    // Fit shadow footprints cleanly to the active vehicle dimensions
    shadowPlane.scale.set(vSpec.width / 1.652, vSpec.length / 4.147, 1);
    shadowPlane.position.set(0, 0.004, 0);

    rig.wheels.forEach((w, idx) => {
      if (tireShadows[idx]) {
        tireShadows[idx].baseX = w.baseX;
        tireShadows[idx].baseZ = w.baseZ;
        tireShadows[idx].sideSign = w.sideSign;
        tireShadows[idx].mesh.position.set(w.baseX, 0.005, w.baseZ);
      }
    });

    applyLivery(state.livery);
    applyVisibilityAndCutaway();
    rig.applyExplodePose(computeTeardownPose(currentExplode));
    const kin = solveEngineKinematics(vSpec.engine, crankDeg);
    rig.updateKinematics(kin, wheelSpinRad);
  };

  loadVehicle(initialState.vehicleId);

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  // Interaction: click vs orbit drag
  const raycaster = new THREE.Raycaster();
  const pointerDownPos = new THREE.Vector2();
  const pointerNdc = new THREE.Vector2();

  const onPointerDown = (e: PointerEvent) => {
    pointerDownPos.set(e.clientX, e.clientY);
  };

  const onPointerUp = (e: PointerEvent) => {
    const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
    if (dist > 5) return;

    const rect = renderer.domElement.getBoundingClientRect();
    pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(pickables, false);
    const visibleHit = hits.find((h) => h.object.visible);
    if (visibleHit && visibleHit.object.userData.subsystem) {
      const hitSub = visibleHit.object.userData.subsystem as SubsystemId;
      if (state.tourActive) {
        state.tourActive = false;
        callbacks.onUserInterruptTour();
      }
      callbacks.onSelectSubsystem(hitSub);
    }
  };

  const onControlsStart = () => {
    cameraTransitionActive = false;
    if (state.tourActive) {
      state.tourActive = false;
      callbacks.onUserInterruptTour();
    }
  };

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  controls.addEventListener('start', onControlsStart);

  const onResize = () => {
    const w = mountEl.clientWidth || window.innerWidth;
    const h = mountEl.clientHeight || window.innerHeight;
    const aspect = w / h;
    camera.aspect = aspect;
    camera.fov = getEffectiveFov(aspect);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    requestRender();
  };
  window.addEventListener('resize', onResize);

  const updateCallouts = () => {
    const w = mountEl.clientWidth || window.innerWidth;
    const h = mountEl.clientHeight || window.innerHeight;
    const pose = computeTeardownPose(currentExplode);
    const vSpec = VEHICLES[state.vehicleId];
    const isRearEngine = vSpec.engine.layout === 'flat6';
    const isRearTrans = vSpec.id === 'porsche-911-rs' || vSpec.id === 'nissan-r35-gtr';
    const ids: SubsystemId[] = ['body', 'engine', 'transaxle', 'chassis', 'wheels'];

    const projected: CalloutScreenPoint[] = ids.map((id) => {
      const spec = vSpec.subsystems[id];
      _vec3.set(...spec.calloutWorld);
      if (id === 'body') _vec3.y += pose.bodyLiftY;
      if (id === 'engine') {
        _vec3.z += isRearEngine ? pose.engineBackZ : Math.abs(pose.engineBackZ) * 0.55;
      }
      if (id === 'transaxle') {
        _vec3.z += isRearTrans ? pose.transaxleBackZ : -pose.transaxleBackZ * 0.5;
      }
      if (id === 'wheels') _vec3.x += pose.wheelOutX;

      _vec3.project(camera);
      const visible =
        _vec3.z < 1 &&
        (state.subsystem === 'all' || state.subsystem === id);

      return {
        id,
        label: spec.shortLabel,
        x: ((_vec3.x + 1) * 0.5) * w,
        y: ((-_vec3.y + 1) * 0.5) * h,
        visible,
      };
    });

    callbacks.onCalloutsUpdate(projected);
  };

  const applyExplodeStateToScene = (t: number) => {
    const pose = computeTeardownPose(t);
    activeRig?.applyExplodePose(pose);

    tireShadows.forEach((ts) => {
      ts.mesh.position.x = ts.baseX + ts.sideSign * pose.wheelOutX;
    });
    const fade = Math.max(0.25, 1 - t * 0.65);
    shadowPlaneMat.opacity = 0.72 * fade;
    tireShadowMat.opacity = 0.85 * Math.max(0.2, 1 - t * 0.75);
  };

  let frameId = 0;
  let disposed = false;
  let renderBusy = false;
  let renderDirty = false;
  let lastTime = performance.now();

  function afterDraw(cb: () => void) {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    if (!gl || !gl.fenceSync) {
      frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (status === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 80);
      }
    };
    frameId = window.setTimeout(poll, 5);
  }

  const needsContinuousLoop = () =>
    (state.playing && state.rpm > 0) ||
    state.environment !== 'studio' ||
    state.tourActive ||
    cameraTransitionActive ||
    Math.abs(currentExplode - state.explode) > 0.001;

  function stepAndRender(now: number) {
    if (disposed) return;
    const rawDt = Math.min(0.1, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;

    if (state.tourActive) {
      tourTime += rawDt;
      const phase = Math.floor((tourTime % 20) / 5);
      if (phase !== lastTourPhase) {
        lastTourPhase = phase;
        if (phase === 0) {
          callbacks.onTourStateApply?.({
            explode: 0,
            mode: 'solid',
            subsystem: 'all',
            cameraPreset: 'hero',
          });
        } else if (phase === 1) {
          callbacks.onTourStateApply?.({
            explode: 0,
            mode: 'xray',
            subsystem: 'all',
            cameraPreset: 'chassis',
          });
        } else if (phase === 2) {
          callbacks.onTourStateApply?.({
            explode: 0.78,
            mode: 'solid',
            subsystem: 'all',
            cameraPreset: 'hero',
          });
        } else if (phase === 3) {
          callbacks.onTourStateApply?.({
            explode: 0.45,
            mode: 'xray',
            subsystem: 'engine',
            cameraPreset: 'engine',
          });
        }
      }
      const orbitAngle = rawDt * 0.22;
      _targetPos.copy(camera.position).sub(controls.target);
      _targetPos.applyAxisAngle(THREE.Object3D.DEFAULT_UP, orbitAngle);
      camera.position.copy(controls.target).add(_targetPos);
    }

    currentExplode = THREE.MathUtils.damp(currentExplode, state.explode, 6.5, rawDt);
    if (Math.abs(currentExplode - state.explode) < 0.0008) {
      currentExplode = state.explode;
    }
    applyExplodeStateToScene(currentExplode);

    if (cameraTransitionActive) {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredCamPos.x, 12.0, rawDt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, desiredCamPos.y, 12.0, rawDt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredCamPos.z, 12.0, rawDt);
      controls.target.x = THREE.MathUtils.damp(controls.target.x, desiredCamTarget.x, 12.0, rawDt);
      controls.target.y = THREE.MathUtils.damp(controls.target.y, desiredCamTarget.y, 12.0, rawDt);
      controls.target.z = THREE.MathUtils.damp(controls.target.z, desiredCamTarget.z, 12.0, rawDt);

      if (
        camera.position.distanceTo(desiredCamPos) < 0.015 &&
        controls.target.distanceTo(desiredCamTarget) < 0.015
      ) {
        camera.position.copy(desiredCamPos);
        controls.target.copy(desiredCamTarget);
        cameraTransitionActive = false;
      }
    }

    if (state.playing && state.rpm > 0) {
      const visualSpeed = Math.min(2800, 120 + state.rpm * 0.32);
      crankDeg = (crankDeg + visualSpeed * rawDt) % 720;
      wheelSpinRad = (wheelSpinRad + (state.rpm / 3000) * rawDt * 2.5) % (Math.PI * 2);
    }

    const vSpec = VEHICLES[state.vehicleId];
    const kin = solveEngineKinematics(vSpec.engine, crankDeg);
    activeRig?.updateKinematics(kin, wheelSpinRad);
    environmentRig.update(rawDt, now * 0.001);

    controls.update();
    renderer.render(scene, camera);

    if (now - lastHudSync > 90) {
      lastHudSync = now;
      callbacks.onCrankDegUpdate(Math.round(crankDeg));
      updateCallouts();
    }
  }

  function requestRender() {
    if (disposed || renderBusy || directorMode) {
      if (renderBusy && !directorMode) renderDirty = true;
      return;
    }
    renderBusy = true;
    frameId = requestAnimationFrame((now) => {
      renderDirty = false;
      stepAndRender(now);
      const done = () => {
        renderBusy = false;
        if (!disposed && (renderDirty || needsContinuousLoop())) {
          requestRender();
        }
      };
      if (isSoftwareGl) afterDraw(done);
      else done();
    });
  }

  controls.addEventListener('change', () => {
    updateCallouts();
    requestRender();
  });

  updateCallouts();
  requestRender();

  const updateState = (next: Partial<SimExternalState>, moveCamera = false) => {
    const prevVehicle = state.vehicleId;
    const prevLivery = state.livery;
    const prevEnv = state.environment;
    const prevMode = state.mode;
    const prevSub = state.subsystem;

    Object.assign(state, next);

    if (next.vehicleId && next.vehicleId !== prevVehicle) {
      loadVehicle(next.vehicleId);
    } else if (next.livery && next.livery !== prevLivery) {
      applyLivery(next.livery);
    }

    if (next.environment && next.environment !== prevEnv) {
      environmentRig.applyEnvironment(next.environment, scene, renderer, {
        hemi: hemiLight,
        key: keyLight,
        rim: rimLight,
      });
    }
    if ((next.mode && next.mode !== prevMode) || (next.subsystem && next.subsystem !== prevSub)) {
      applyVisibilityAndCutaway();
    }

    const activeSpec = VEHICLES[state.vehicleId];
    if (next.vehicleId && next.vehicleId !== prevVehicle) {
      const targetPreset = next.cameraPreset || state.cameraPreset || 'hero';
      const preset = activeSpec.cameraPresets[targetPreset];
      desiredCamPos.set(...preset.position);
      desiredCamTarget.set(...preset.target);
      camera.position.copy(desiredCamPos);
      controls.target.copy(desiredCamTarget);
      controls.update();
      cameraTransitionActive = false;
    } else if (moveCamera && next.cameraPreset) {
      const preset = activeSpec.cameraPresets[next.cameraPreset];
      desiredCamPos.set(...preset.position);
      desiredCamTarget.set(...preset.target);
      cameraTransitionActive = true;
    } else if (moveCamera && next.subsystem) {
      const target = activeSpec.subsystemCameras[next.subsystem];
      desiredCamPos.set(...target.pos);
      desiredCamTarget.set(...target.look);
      cameraTransitionActive = true;
    }

    requestRender();
  };

  const stepCrank = (deltaDeg: number) => {
    crankDeg = ((crankDeg + deltaDeg) % 720 + 720) % 720;
    const kin = solveEngineKinematics(VEHICLES[state.vehicleId].engine, crankDeg);
    activeRig?.updateKinematics(kin, wheelSpinRad);
    callbacks.onCrankDegUpdate(Math.round(crankDeg));
    requestRender();
  };

  const dispose = () => {
    disposed = true;
    cancelAnimationFrame(frameId);
    clearTimeout(frameId);
    window.removeEventListener('resize', onResize);
    renderer.domElement.removeEventListener('pointerdown', onPointerDown);
    renderer.domElement.removeEventListener('pointerup', onPointerUp);
    controls.removeEventListener('start', onControlsStart);
    controls.dispose();
    if (activeRig) {
      disposeCarObjectTree(activeRig.root, sharedTextureSet);
    }
    sharedTextureSet.forEach((tex) => tex.dispose());
    environmentRig.dispose();
    envTex.dispose();
    renderer.dispose();
    if (renderer.domElement.parentElement === mountEl) {
      mountEl.removeChild(renderer.domElement);
    }
  };

  const setDirectorMode = (enabled: boolean) => {
    directorMode = enabled;
    if (enabled) {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      cameraTransitionActive = false;
      renderDirty = false;
      controls.enabled = false;
      if (!isSoftwareGl && keyLight.shadow.mapSize.x < 2048) {
        keyLight.shadow.mapSize.set(2048, 2048);
        keyLight.shadow.map?.dispose();
        keyLight.shadow.map = null;
      }
    } else {
      controls.enabled = true;
      lastTime = performance.now();
      requestRender();
    }
  };

  const renderDirectorFrame = (frame: DirectorFrameState) => {
    if (disposed) return;
    if (!directorMode) setDirectorMode(true);

    const prevVehicle = state.vehicleId;
    const prevLivery = state.livery;
    const prevEnv = state.environment;
    const prevMode = state.mode;
    const prevSub = state.subsystem;

    if (frame.livery !== undefined) state.livery = frame.livery;
    if (frame.mode !== undefined) state.mode = frame.mode;
    if (frame.subsystem !== undefined) state.subsystem = frame.subsystem;
    if (frame.explode !== undefined) state.explode = frame.explode;

    if (frame.vehicleId && frame.vehicleId !== prevVehicle) {
      state.vehicleId = frame.vehicleId;
      loadVehicle(frame.vehicleId);
      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }
    } else if (frame.livery !== undefined && frame.livery !== prevLivery) {
      applyLivery(frame.livery);
    }

    if (frame.environment && frame.environment !== prevEnv) {
      state.environment = frame.environment;
      environmentRig.applyEnvironment(frame.environment, scene, renderer, {
        hemi: hemiLight,
        key: keyLight,
        rim: rimLight,
      });
    }

    sectionPlane.constant = frame.sectionOffset ?? 0.02;

    if (
      (frame.mode !== undefined && frame.mode !== prevMode) ||
      (frame.subsystem !== undefined && frame.subsystem !== prevSub)
    ) {
      applyVisibilityAndCutaway();
    }

    currentExplode = state.explode;
    applyExplodeStateToScene(currentExplode);

    if (frame.crankDeg !== undefined) crankDeg = frame.crankDeg;
    if (frame.wheelSpinRad !== undefined) wheelSpinRad = frame.wheelSpinRad;

    const vSpec = VEHICLES[state.vehicleId];
    const kin = solveEngineKinematics(vSpec.engine, crankDeg);
    activeRig?.updateKinematics(kin, wheelSpinRad);

    if (frame.envDt !== undefined) {
      environmentRig.update(frame.envDt, frame.envElapsed ?? 0);
    }

    if (frame.cameraTarget) {
      controls.target.set(...frame.cameraTarget);
    }
    if (frame.cameraPos) {
      camera.position.set(...frame.cameraPos);
    }
    if (frame.fov !== undefined && Math.abs(camera.fov - frame.fov) > 1e-4) {
      camera.fov = frame.fov;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(controls.target);
    renderer.render(scene, camera);
  };

  return {
    updateState,
    stepCrank,
    setDirectorMode,
    renderDirectorFrame,
    dispose,
    isSoftwareGl,
  };
}

export const createPorscheScene = createShowroomScene;
