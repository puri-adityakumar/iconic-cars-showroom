import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Pause,
  Play,
  RotateCw,
  Tag,
} from 'lucide-react';
import {
  CameraPresetId,
  CutawayMode,
  ENVIRONMENTS,
  EnvironmentId,
  LiveryId,
  SubsystemId,
  VEHICLE_LIST,
  VEHICLES,
  VehicleId,
} from '../sim/specs';
import { CalloutScreenPoint } from '../sim/sceneManager';

interface TeardownHUDProps {
  vehicleId: VehicleId;
  explode: number;
  rpm: number;
  playing: boolean;
  crankDeg: number;
  mode: CutawayMode;
  subsystem: SubsystemId;
  livery: LiveryId;
  environment: EnvironmentId;
  cameraPreset: CameraPresetId;
  tourActive: boolean;
  showLabels: boolean;
  dockCollapsed: boolean;
  uiHidden: boolean;
  callouts: CalloutScreenPoint[];
  onVehicleChange: (id: VehicleId) => void;
  onExplodeChange: (val: number) => void;
  onRpmChange: (val: number) => void;
  onTogglePlay: () => void;
  onStepCrank: (deg: number) => void;
  onModeChange: (mode: CutawayMode) => void;
  onSubsystemChange: (id: SubsystemId) => void;
  onLiveryChange: (id: LiveryId) => void;
  onEnvironmentChange: (id: EnvironmentId) => void;
  onCameraPresetChange: (id: CameraPresetId) => void;
  onToggleTour: () => void;
  onToggleLabels: () => void;
  onToggleDock: () => void;
  onToggleUiHidden: () => void;
}

const SUBSYSTEM_ORDER: SubsystemId[] = ['all', 'body', 'engine', 'transaxle', 'chassis', 'wheels'];
const MODE_OPTIONS: Array<{ id: CutawayMode; label: string }> = [
  { id: 'solid', label: 'Solid' },
  { id: 'xray', label: 'X-Ray' },
  { id: 'section', label: 'Section' },
];
const VIEW_ORDER: CameraPresetId[] = ['hero', 'engine', 'chassis', 'front', 'side'];

export const TeardownHUD: React.FC<TeardownHUDProps> = ({
  vehicleId,
  explode,
  rpm,
  playing,
  crankDeg,
  mode,
  subsystem,
  livery,
  environment,
  cameraPreset,
  tourActive,
  showLabels,
  dockCollapsed,
  uiHidden,
  callouts,
  onVehicleChange,
  onExplodeChange,
  onRpmChange,
  onTogglePlay,
  onStepCrank,
  onModeChange,
  onSubsystemChange,
  onLiveryChange,
  onEnvironmentChange,
  onCameraPresetChange,
  onToggleTour,
  onToggleLabels,
  onToggleDock,
  onToggleUiHidden,
}) => {
  const vehicle = VEHICLES[vehicleId];
  const activeSpec = vehicle.subsystems[subsystem];
  const rpmRatio = Math.min(1, Math.max(0, rpm / vehicle.engine.maxRpm));
  const accent = vehicle.accentHex;

  if (uiHidden) {
    return (
      <div className="pointer-events-none fixed inset-0 z-20">
        <button
          type="button"
          onClick={onToggleUiHidden}
          aria-label="Show Controls"
          className="pointer-events-auto fixed top-5 right-5 flex items-center gap-1.5 rounded border border-[#d5d8de] bg-[#fafafc]/95 px-3 py-1.5 text-xs font-medium text-[#16181b] shadow-sm transition-colors hover:bg-white"
        >
          <Eye className="h-3.5 w-3.5" />
          <span className="whitespace-nowrap">Show UI</span>
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-5">
      {/* Top Row: Minimal Vehicle Spec Card (Left) + Vehicle Selector + Backdrop/Paint Utilities (Right) */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="pointer-events-auto rounded border border-[#d5d8de] bg-[#fafafc]/92 px-3.5 py-2.5 shadow-xs">
          <div className="mb-1.5 h-[3px] w-10" style={{ backgroundColor: accent }} />
          <h1 className="text-base font-bold tracking-tight text-[#16181b] sm:text-lg whitespace-nowrap">
            {vehicle.model}
          </h1>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-[#5f656e] whitespace-nowrap">
            <span>{vehicle.year}</span>
            <span aria-hidden="true">·</span>
            <span>{vehicle.engine.summary}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">{vehicle.engine.firingOrderLabel}</span>
          </div>

          <div className="mt-2 flex items-baseline gap-2.5">
            <span
              className="font-mono-tabular text-xl font-bold tracking-tight sm:text-2xl"
              style={{ color: accent }}
            >
              {rpm.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold tracking-wider text-[#5f656e]">
              RPM
            </span>
            <span className="font-mono-tabular text-[11px] text-[#5f656e]">
              {crankDeg}°
            </span>
          </div>
          <div className="mt-1 h-1.5 w-44 overflow-hidden rounded-xs bg-[#d7dae0]">
            <div
              className="h-full transition-[width] duration-75"
              style={{ width: `${Math.round(rpmRatio * 100)}%`, backgroundColor: accent }}
            />
          </div>
        </div>

        {/* Center Showroom Selector: Single-row horizontally scrollable tablist with shape/underline indicator */}
        <div
          role="tablist"
          aria-label="Showroom Vehicles"
          className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded border border-[#d5d8de] bg-[#fafafc]/95 px-1.5 py-1 shadow-xs"
        >
          {VEHICLE_LIST.map((car) => {
            const active = vehicleId === car.id;
            return (
              <button
                key={car.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Select ${car.model}`}
                onClick={() => onVehicleChange(car.id)}
                style={active ? { borderBottomColor: car.accentHex } : undefined}
                className={`flex-none rounded-xs border-b-2 px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[#16181b] text-white'
                    : 'border-transparent text-[#4a4f57] hover:bg-[#eceef2] hover:text-[#16181b]'
                }`}
              >
                {car.shortName}
              </button>
            );
          })}
        </div>

        {/* Top-Right Compact Utility Controls */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
          <div
            className="flex items-center gap-1 rounded border border-[#d5d8de] bg-[#fafafc]/95 px-1.5 py-1 shadow-xs"
            role="group"
            aria-label="Environment Backdrop"
          >
            {ENVIRONMENTS.map((env) => {
              const active = environment === env.id;
              return (
                <button
                  key={env.id}
                  type="button"
                  onClick={() => onEnvironmentChange(env.id)}
                  aria-label={`Backdrop ${env.label}`}
                  aria-pressed={active}
                  className={`flex items-center gap-1.5 rounded-xs px-2 py-0.5 text-[11px] font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-[#16181b] text-white'
                      : 'text-[#4a4f57] hover:bg-[#eceef2] hover:text-[#16181b]'
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-xs border border-black/15 shrink-0"
                    style={{ backgroundColor: env.swatchHex }}
                    aria-hidden="true"
                  />
                  <span>{env.label}</span>
                </button>
              );
            })}
          </div>

          <div
            className="flex items-center gap-1.5 rounded border border-[#d5d8de] bg-[#fafafc]/95 px-2 py-1.5 shadow-xs"
            role="group"
            aria-label="Exterior Paint Finish"
          >
            {vehicle.liveries.map((liv) => {
              const active = livery === liv.id;
              return (
                <button
                  key={liv.id}
                  type="button"
                  onClick={() => onLiveryChange(liv.id)}
                  title={liv.name}
                  aria-label={`Paint ${liv.name}`}
                  aria-pressed={active}
                  style={
                    active
                      ? {
                          backgroundColor: liv.swatchHex,
                          borderColor: accent,
                          boxShadow: `0 0 0 1px ${accent}`,
                        }
                      : { backgroundColor: liv.swatchHex }
                  }
                  className={`h-5 w-5 rounded-xs border transition-transform ${
                    active ? 'scale-110' : 'border-[#b9bec7] hover:scale-105'
                  }`}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={onToggleLabels}
            aria-pressed={showLabels}
            aria-label="Toggle Callout Labels"
            className={`flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              showLabels
                ? 'border-[#16181b] bg-[#16181b] text-white'
                : 'border-[#d5d8de] bg-[#fafafc]/95 text-[#16181b] hover:bg-white'
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
            <span>Labels</span>
          </button>

          <button
            type="button"
            onClick={onToggleTour}
            aria-pressed={tourActive}
            aria-label="Toggle Auto Tour"
            style={
              tourActive
                ? { backgroundColor: accent, borderColor: accent, color: '#ffffff' }
                : undefined
            }
            className={`flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              tourActive
                ? ''
                : 'border-[#d5d8de] bg-[#fafafc]/95 text-[#16181b] hover:bg-white'
            }`}
          >
            <RotateCw className={`h-3.5 w-3.5 ${tourActive ? 'animate-spin' : ''}`} />
            <span>Tour</span>
          </button>

          <button
            type="button"
            onClick={onToggleUiHidden}
            aria-label="Hide Controls"
            className="hidden sm:flex items-center gap-1.5 rounded border border-[#d5d8de] bg-[#fafafc]/95 px-2.5 py-1.5 text-xs font-medium text-[#16181b] whitespace-nowrap shrink-0 transition-colors hover:bg-white"
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span>Hide</span>
          </button>
        </div>
      </div>

      {/* Minimal Projected Callout Pins */}
      {showLabels &&
        callouts.map((pt) => {
          if (!pt.visible) return null;
          const isSelected = subsystem === pt.id;
          return (
            <button
              key={pt.id}
              type="button"
              onClick={() => onSubsystemChange(isSelected ? 'all' : pt.id)}
              style={{
                transform: `translate(${Math.round(pt.x)}px, ${Math.round(pt.y)}px) translate(-50%, -100%)`,
              }}
              className="pointer-events-auto fixed top-0 left-0 z-10 flex flex-col items-center group"
            >
              <span
                style={
                  isSelected
                    ? { backgroundColor: accent, borderColor: accent, color: '#ffffff' }
                    : undefined
                }
                className={`rounded-xs border px-2 py-0.5 text-[11px] font-semibold tracking-tight whitespace-nowrap shadow-xs transition-colors ${
                  isSelected ? '' : 'border-[#cfd3da] bg-[#fafafc]/95 text-[#16181b]'
                }`}
              >
                {pt.label}
              </span>
              <span
                style={isSelected ? { backgroundColor: accent } : undefined}
                className={`h-4 w-px ${isSelected ? '' : 'bg-[#8d939c]'}`}
                aria-hidden="true"
              />
              <span
                style={isSelected ? { backgroundColor: accent } : undefined}
                className={`h-1.5 w-1.5 rounded-full ${isSelected ? '' : 'bg-[#16181b]'}`}
                aria-hidden="true"
              />
            </button>
          );
        })}

      {/* Collapsible Bottom Control Dock */}
      <div className="pointer-events-none flex flex-col items-center">
        <div className="pointer-events-auto flex flex-col items-center w-full max-w-[900px]">
          <button
            type="button"
            onClick={onToggleDock}
            aria-expanded={!dockCollapsed}
            aria-label={dockCollapsed ? 'Expand Controls' : 'Collapse Controls'}
            className="flex items-center gap-1 rounded-t border border-b-0 border-[#d5d8de] bg-[#fafafc]/95 px-3 py-1 text-[11px] font-medium text-[#4a4f57] hover:text-[#16181b]"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Minimize</span>
              </>
            )}
          </button>

          {!dockCollapsed && (
            <div className="w-full rounded border border-[#d5d8de] bg-[#fafafc]/95 px-4 py-3 shadow-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6">
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="explode-slider"
                    className="w-16 text-xs font-semibold text-[#16181b] whitespace-nowrap shrink-0"
                  >
                    Teardown
                  </label>
                  <input
                    id="explode-slider"
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(explode * 100)}
                    onChange={(e) => onExplodeChange(Number(e.target.value) / 100)}
                    className="teardown-slider w-full cursor-pointer"
                  />
                  <span
                    className="font-mono-tabular w-10 text-right text-xs font-semibold shrink-0"
                    style={{ color: accent }}
                  >
                    {Math.round(explode * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onTogglePlay}
                    aria-label={playing ? 'Pause Engine' : 'Run Engine'}
                    className="flex h-7 w-7 items-center justify-center rounded-xs border border-[#d5d8de] bg-white text-[#16181b] hover:border-[#16181b] shrink-0"
                  >
                    {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onStepCrank(-15)}
                    aria-label="Step Crank -15 degrees"
                    className="h-7 rounded-xs border border-[#d5d8de] bg-white px-1.5 font-mono-tabular text-[11px] font-medium text-[#16181b] hover:border-[#16181b] shrink-0"
                  >
                    −15°
                  </button>
                  <button
                    type="button"
                    onClick={() => onStepCrank(15)}
                    aria-label="Step Crank +15 degrees"
                    className="h-7 rounded-xs border border-[#d5d8de] bg-white px-1.5 font-mono-tabular text-[11px] font-medium text-[#16181b] hover:border-[#16181b] shrink-0"
                  >
                    +15°
                  </button>
                  <input
                    id="rpm-slider"
                    aria-label="Engine RPM"
                    type="range"
                    min={0}
                    max={vehicle.engine.maxRpm}
                    step={50}
                    value={rpm}
                    onChange={(e) => onRpmChange(Number(e.target.value))}
                    className="teardown-slider w-full cursor-pointer"
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#e5e7ec] pt-2.5">
                <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Isolate Subsystem">
                  {SUBSYSTEM_ORDER.map((id) => {
                    const active = subsystem === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onSubsystemChange(id)}
                        aria-pressed={active}
                        aria-label={`Isolate ${vehicle.subsystems[id].shortLabel}`}
                        className={`rounded-xs px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                          active
                            ? 'bg-[#16181b] text-white'
                            : 'bg-[#eceef2] text-[#4a4f57] hover:bg-[#e1e4ea] hover:text-[#16181b]'
                        }`}
                      >
                        {vehicle.subsystems[id].shortLabel}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-xs bg-[#eceef2] p-0.5" role="group" aria-label="Cutaway Mode">
                    {MODE_OPTIONS.map((m) => {
                      const active = mode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => onModeChange(m.id)}
                          aria-pressed={active}
                          style={active ? { backgroundColor: accent, color: '#ffffff' } : undefined}
                          className={`rounded-xs px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                            active ? '' : 'text-[#4a4f57] hover:text-[#16181b]'
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="hidden md:flex items-center gap-1 rounded-xs bg-[#eceef2] p-0.5" role="group" aria-label="Camera Presets">
                    {VIEW_ORDER.map((vid) => {
                      const active = cameraPreset === vid;
                      return (
                        <button
                          key={vid}
                          type="button"
                          onClick={() => onCameraPresetChange(vid)}
                          aria-pressed={active}
                          aria-label={`Camera ${vehicle.cameraPresets[vid].label}`}
                          className={`rounded-xs px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                            active
                              ? 'bg-white text-[#16181b] shadow-xs'
                              : 'text-[#4a4f57] hover:text-[#16181b]'
                          }`}
                        >
                          {vehicle.cameraPresets[vid].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-4 border-t border-[#e5e7ec] pt-2 text-[11px] text-[#5f656e]">
                <span className="font-semibold text-[#16181b] whitespace-nowrap">
                  {activeSpec.label}
                </span>
                <span className="font-mono-tabular truncate">{activeSpec.specLine}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
