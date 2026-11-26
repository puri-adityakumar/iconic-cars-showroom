import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ENVIRONMENTS,
  PORSCHE_SPECS,
  VEHICLES,
  VEHICLE_LIST,
  computeDisplacementCc,
  solveFlat6Kinematics,
  solveEngineKinematics,
  computeTeardownPose,
} from './specs';

test('All four showroom engines match verified factory displacement', () => {
  assert.equal(
    computeDisplacementCc(
      PORSCHE_SPECS.engine.boreMm,
      PORSCHE_SPECS.engine.strokeMm,
      PORSCHE_SPECS.engine.cylinders,
    ),
    2687,
  );
  assert.equal(
    computeDisplacementCc(
      VEHICLES['bmw-e30-m3'].engine.boreMm,
      VEHICLES['bmw-e30-m3'].engine.strokeMm,
      VEHICLES['bmw-e30-m3'].engine.cylinders,
    ),
    2467,
  );
  assert.equal(
    computeDisplacementCc(
      VEHICLES['bmw-e39-m5'].engine.boreMm,
      VEHICLES['bmw-e39-m5'].engine.strokeMm,
      VEHICLES['bmw-e39-m5'].engine.cylinders,
    ),
    4941,
  );
  assert.equal(
    computeDisplacementCc(
      VEHICLES['nissan-r35-gtr'].engine.boreMm,
      VEHICLES['nissan-r35-gtr'].engine.strokeMm,
      VEHICLES['nissan-r35-gtr'].engine.cylinders,
    ),
    3799,
  );
});

test('Flat-6 slider-crank reaches TDC and BDC accurately and preserves opposed boxer balance', () => {
  const atZero = solveFlat6Kinematics(0);
  const cyl1 = atZero.cylinders.find((c) => c.cylinderNumber === 1)!;
  const cyl4 = atZero.cylinders.find((c) => c.cylinderNumber === 4)!;

  const expectedTdc = PORSCHE_SPECS.engine.rodLength + PORSCHE_SPECS.engine.crankRadius;
  assert.ok(Math.abs(cyl1.pistonOffset - expectedTdc) < 1e-6);
  assert.ok(Math.abs(cyl4.pistonOffset + expectedTdc) < 1e-6);
  assert.ok(cyl1.combustionIntensity > 0.5);

  const at180 = solveFlat6Kinematics(180);
  const cyl1Bdc = at180.cylinders.find((c) => c.cylinderNumber === 1)!;
  const expectedBdc = PORSCHE_SPECS.engine.rodLength - PORSCHE_SPECS.engine.crankRadius;
  assert.ok(Math.abs(cyl1Bdc.pistonOffset - expectedBdc) < 1e-6);
});

test('Multi-car firing orders peak in exact mechanical ignition sequence', () => {
  // Porsche Flat-6: 1-6-2-4-3-5 every 120 deg
  [1, 6, 2, 4, 3, 5].forEach((cylNum, idx) => {
    const state = solveFlat6Kinematics(idx * 120 + 16);
    const hottest = state.cylinders.reduce((best, cur) =>
      cur.combustionIntensity > best.combustionIntensity ? cur : best,
    );
    assert.equal(hottest.cylinderNumber, cylNum);
    assert.ok(hottest.combustionIntensity > 0.8);
  });

  // BMW E30 M3 S14 I4: 1-3-4-2 every 180 deg, flat-plane pair balance (1&4 at TDC, 2&3 at BDC)
  const i4 = VEHICLES['bmw-e30-m3'].engine;
  [1, 3, 4, 2].forEach((cylNum, idx) => {
    const state = solveEngineKinematics(i4, idx * 180 + 16);
    const hottest = state.cylinders.reduce((best, cur) =>
      cur.combustionIntensity > best.combustionIntensity ? cur : best,
    );
    assert.equal(hottest.cylinderNumber, cylNum);
  });

  // BMW E39 M5 S62 V8: 1-5-4-8-6-3-7-2 every 90 deg
  const v8 = VEHICLES['bmw-e39-m5'].engine;
  [1, 5, 4, 8, 6, 3, 7, 2].forEach((cylNum, idx) => {
    const state = solveEngineKinematics(v8, idx * 90 + 16);
    const hottest = state.cylinders.reduce((best, cur) =>
      cur.combustionIntensity > best.combustionIntensity ? cur : best,
    );
    assert.equal(hottest.cylinderNumber, cylNum);
  });

  // Nissan GT-R VR38DETT V6: 1-2-3-4-5-6 every 120 deg
  const v6 = VEHICLES['nissan-r35-gtr'].engine;
  [1, 2, 3, 4, 5, 6].forEach((cylNum, idx) => {
    const state = solveEngineKinematics(v6, idx * 120 + 16);
    const hottest = state.cylinders.reduce((best, cur) =>
      cur.combustionIntensity > best.combustionIntensity ? cur : best,
    );
    assert.equal(hottest.cylinderNumber, cylNum);
  });
});

test('Teardown pose starts at zero and separates monotonically without overlap', () => {
  const closed = computeTeardownPose(0);
  assert.equal(closed.bodyLiftY, 0);
  assert.equal(closed.engineBackZ, 0);
  assert.equal(closed.wheelOutX, 0);

  const mid = computeTeardownPose(0.5);
  const full = computeTeardownPose(1.0);
  assert.ok(full.bodyLiftY > mid.bodyLiftY && mid.bodyLiftY > 0);
  assert.ok(full.engineBackZ < mid.engineBackZ && mid.engineBackZ < 0);
  assert.ok(full.exhaustBackZ < full.engineBackZ);
  assert.ok(full.engineBackZ < full.transaxleBackZ);
});

test('All four showroom vehicles and environments have complete liveries and specs', () => {
  assert.equal(VEHICLE_LIST.length, 4);
  VEHICLE_LIST.forEach((v) => {
    assert.ok(v.liveries.length >= 5);
    assert.ok(v.wheelbase > 2.0 && v.length > 4.0);
  });

  const ids = ENVIRONMENTS.map((e) => e.id);
  assert.deepEqual(ids, ['sakura', 'canada', 'india', 'studio']);
  const studio = ENVIRONMENTS.find((e) => e.id === 'studio')!;
  assert.equal(studio.isOutdoor, false);
});
