import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CameraPresetId,
  CutawayMode,
  EnvironmentId,
  LiveryId,
  SubsystemId,
  VEHICLES,
  VehicleId,
} from './sim/specs';
import {
  CalloutScreenPoint,
  SimExternalState,
  createShowroomScene,
} from './sim/sceneManager';
import { TeardownHUD } from './components/TeardownHUD';

function getInitialVehicleId(): VehicleId {
  if (typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('car');
    if (param && param in VEHICLES) {
      return param as VehicleId;
    }
  }
  return 'porsche-911-rs';
}

function getCinemaFlags(): { hideChrome: boolean; director: boolean } {
  if (typeof window === 'undefined') {
    return { hideChrome: false, director: false };
  }
  const params = new URLSearchParams(window.location.search);
  const director = params.get('director') === '1';
  const hideChrome = director || params.get('hide') === '1';
  return { hideChrome, director };
}

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneApiRef = useRef<ReturnType<typeof createShowroomScene> | null>(null);

  const initialCar = getInitialVehicleId();
  const initialSpec = VEHICLES[initialCar];
  const { hideChrome: initialHideChrome, director: initialDirector } = getCinemaFlags();

  const [vehicleId, setVehicleId] = useState<VehicleId>(initialCar);
  const [explode, setExplode] = useState(0);
  const [rpm, setRpm] = useState<number>(initialSpec.engine.idleRpm);
  const [playing, setPlaying] = useState(true);
  const [crankDeg, setCrankDeg] = useState(0);
  const [mode, setMode] = useState<CutawayMode>('solid');
  const [subsystem, setSubsystem] = useState<SubsystemId>('all');
  const [livery, setLivery] = useState<LiveryId>(initialSpec.liveries[0].id);
  const [environment, setEnvironment] = useState<EnvironmentId>('sakura');
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('hero');
  const [tourActive, setTourActive] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [uiHidden, setUiHidden] = useState(initialHideChrome);
  const [hideAllChrome] = useState(initialHideChrome);
  const [callouts, setCallouts] = useState<CalloutScreenPoint[]>([]);
  const [webglError, setWebglError] = useState(false);

  const applyTourStateRef = useRef((partial: Partial<SimExternalState>) => {
    if (partial.explode !== undefined) setExplode(partial.explode);
    if (partial.mode !== undefined) setMode(partial.mode);
    if (partial.subsystem !== undefined) setSubsystem(partial.subsystem);
    if (partial.cameraPreset !== undefined) setCameraPreset(partial.cameraPreset);
    sceneApiRef.current?.updateState(partial, true);
  });

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    try {
      const api = createShowroomScene(
        el,
        {
          vehicleId: initialCar,
          explode: 0,
          rpm: initialSpec.engine.idleRpm,
          playing: true,
          mode: 'solid',
          subsystem: 'all',
          livery: initialSpec.liveries[0].id,
          environment: 'sakura',
          cameraPreset: 'hero',
          tourActive: false,
        },
        {
          onSelectSubsystem: (id) => {
            setSubsystem((prev) => {
              const next = prev === id ? 'all' : id;
              sceneApiRef.current?.updateState({ subsystem: next }, true);
              return next;
            });
          },
          onUserInterruptTour: () => {
            setTourActive(false);
          },
          onCalloutsUpdate: (pts) => {
            if (!initialHideChrome) setCallouts(pts);
          },
          onCrankDegUpdate: (deg) => {
            if (!initialHideChrome) setCrankDeg(deg);
          },
          onTourStateApply: (partial) => {
            applyTourStateRef.current(partial);
          },
        },
      );
      if (initialDirector) {
        api.setDirectorMode(true);
        (window as unknown as { __SHOWROOM_DIRECTOR__?: unknown }).__SHOWROOM_DIRECTOR__ = {
          setDirectorMode: api.setDirectorMode,
          renderFrame: api.renderDirectorFrame,
          isSoftwareGl: api.isSoftwareGl,
        };
      }
      sceneApiRef.current = api;
      return () => {
        if (initialDirector) {
          delete (window as unknown as { __SHOWROOM_DIRECTOR__?: unknown }).__SHOWROOM_DIRECTOR__;
        }
        api.dispose();
        sceneApiRef.current = null;
      };
    } catch {
      setWebglError(true);
    }
    // Mount WebGL canvas once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts: H hides UI, Space toggles engine playback
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'h' || e.key === 'H') {
        setUiHidden((v) => !v);
      } else if (e.key === ' ') {
        e.preventDefault();
        setPlaying((p) => {
          const next = !p;
          sceneApiRef.current?.updateState({ playing: next });
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleVehicleChange = useCallback((nextId: VehicleId) => {
    const spec = VEHICLES[nextId];
    const nextLivery = spec.liveries[0].id;
    const nextRpm = spec.engine.idleRpm;
    setTourActive(false);
    setVehicleId(nextId);
    setLivery(nextLivery);
    setRpm(nextRpm);
    setSubsystem('all');
    setCameraPreset('hero');
    sceneApiRef.current?.updateState(
      {
        vehicleId: nextId,
        livery: nextLivery,
        rpm: nextRpm,
        subsystem: 'all',
        cameraPreset: 'hero',
        tourActive: false,
      },
      true,
    );
  }, []);

  const handleExplodeChange = useCallback((val: number) => {
    setTourActive(false);
    setExplode(val);
    sceneApiRef.current?.updateState({ explode: val, tourActive: false });
  }, []);

  const handleRpmChange = useCallback((val: number) => {
    setRpm(val);
    sceneApiRef.current?.updateState({ rpm: val });
  }, []);

  const handleTogglePlay = useCallback(() => {
    setPlaying((prev) => {
      const next = !prev;
      sceneApiRef.current?.updateState({ playing: next });
      return next;
    });
  }, []);

  const handleStepCrank = useCallback((delta: number) => {
    setPlaying(false);
    sceneApiRef.current?.updateState({ playing: false });
    sceneApiRef.current?.stepCrank(delta);
  }, []);

  const handleModeChange = useCallback((nextMode: CutawayMode) => {
    setTourActive(false);
    setMode(nextMode);
    sceneApiRef.current?.updateState({ mode: nextMode, tourActive: false });
  }, []);

  const handleSubsystemChange = useCallback((id: SubsystemId) => {
    setTourActive(false);
    setSubsystem(id);
    sceneApiRef.current?.updateState({ subsystem: id, tourActive: false }, true);
  }, []);

  const handleLiveryChange = useCallback((id: LiveryId) => {
    setLivery(id);
    sceneApiRef.current?.updateState({ livery: id });
  }, []);

  const handleEnvironmentChange = useCallback((id: EnvironmentId) => {
    setEnvironment(id);
    sceneApiRef.current?.updateState({ environment: id });
  }, []);

  const handleCameraPresetChange = useCallback((id: CameraPresetId) => {
    setTourActive(false);
    setCameraPreset(id);
    sceneApiRef.current?.updateState({ cameraPreset: id, tourActive: false }, true);
  }, []);

  const handleToggleTour = useCallback(() => {
    setTourActive((prev) => {
      const next = !prev;
      sceneApiRef.current?.updateState({ tourActive: next });
      return next;
    });
  }, []);

  const activeVehicle = VEHICLES[vehicleId];

  return (
    <main
      className={`relative h-screen w-screen overflow-hidden ${
        environment === 'studio' ? 'bg-[#1f2228]' : 'bg-[#1f2433]'
      }`}
      style={{ '--showroom-accent': activeVehicle.accentHex } as React.CSSProperties}
      data-vehicle={vehicleId}
      data-subsystem={subsystem}
      data-mode={mode}
      data-environment={environment}
      data-explode={Math.round(explode * 100)}
    >
      <div
        ref={mountRef}
        data-testid="showroom-viewport"
        className="h-full w-full cursor-grab active:cursor-grabbing"
      />

      {webglError ? (
        <div className="fixed inset-0 flex items-center justify-center bg-[#eceef1] p-6 text-center">
          <div className="max-w-sm rounded border border-[#d5d8de] bg-white p-6">
            <h2 className="text-base font-bold text-[#16181b]">3D Viewport Unavailable</h2>
            <p className="mt-2 text-xs text-[#5f656e]">
              WebGL rendering could not be initialized in this browser environment.
            </p>
          </div>
        </div>
      ) : hideAllChrome ? null : (
        <TeardownHUD
          vehicleId={vehicleId}
          explode={explode}
          rpm={rpm}
          playing={playing}
          crankDeg={crankDeg}
          mode={mode}
          subsystem={subsystem}
          livery={livery}
          environment={environment}
          cameraPreset={cameraPreset}
          tourActive={tourActive}
          showLabels={showLabels}
          dockCollapsed={dockCollapsed}
          uiHidden={uiHidden}
          callouts={callouts}
          onVehicleChange={handleVehicleChange}
          onExplodeChange={handleExplodeChange}
          onRpmChange={handleRpmChange}
          onTogglePlay={handleTogglePlay}
          onStepCrank={handleStepCrank}
          onModeChange={handleModeChange}
          onSubsystemChange={handleSubsystemChange}
          onLiveryChange={handleLiveryChange}
          onEnvironmentChange={handleEnvironmentChange}
          onCameraPresetChange={handleCameraPresetChange}
          onToggleTour={handleToggleTour}
          onToggleLabels={() => setShowLabels((v) => !v)}
          onToggleDock={() => setDockCollapsed((v) => !v)}
          onToggleUiHidden={() => setUiHidden((v) => !v)}
        />
      )}
    </main>
  );
}
