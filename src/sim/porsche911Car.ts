import * as THREE from 'three';
import { CarRig } from './carCommon';
import { buildPorsche911Body } from './porsche911Body';
import { buildPorsche911Drivetrain } from './porsche911Drivetrain';
import { LiverySpec, TeardownPose } from './specs';
import { ProceduralTextures } from './textures';

/**
 * Wraps the dedicated Porsche 911 Carrera RS 2.7 body and Flat-6 drivetrain
 * behind the multi-car showroom CarRig interface.
 */
export function buildPorsche911Car(
  textures: ProceduralTextures,
  isSoftwareGl: boolean,
  clippingPlanes: THREE.Plane[],
): CarRig {
  const root = new THREE.Group();
  root.name = 'porsche_911_rs_car';

  const bodyRig = buildPorsche911Body(textures, isSoftwareGl, clippingPlanes);
  const drivetrainRig = buildPorsche911Drivetrain(textures, clippingPlanes);
  root.add(bodyRig.root);
  root.add(drivetrainRig.root);

  const applyExplodePose = (p: TeardownPose) => {
    bodyRig.bodyShellGroup.position.set(0, p.bodyLiftY, 0);
    bodyRig.frontHoodGroup.position.set(0, p.bodyLiftY + p.hoodLiftY, p.hoodForwardZ);
    bodyRig.frontHoodGroup.rotation.x = p.hoodTiltX;
    bodyRig.ducktailGroup.position.set(0, p.bodyLiftY + p.ducktailLiftY, p.ducktailBackZ);
    bodyRig.ducktailGroup.rotation.x = p.ducktailTiltX;
    bodyRig.leftDoorGroup.position.set(p.doorOutX, p.bodyLiftY * 0.8, 0);
    bodyRig.rightDoorGroup.position.set(-p.doorOutX, p.bodyLiftY * 0.8, 0);

    drivetrainRig.interiorGroup.position.set(0, p.interiorLiftY, 0);
    drivetrainRig.transaxleGroup.position.set(0, 0, p.transaxleBackZ);

    drivetrainRig.engineBlockGroup.position.z = -1.58 + p.engineBackZ;
    drivetrainRig.engineShroudGroup.position.set(
      0,
      0.31 + p.engineShroudLiftY,
      -1.58 + p.engineBackZ,
    );
    drivetrainRig.leftHeadGroup.position.set(p.cylinderHeadOutX, 0.31, -1.58 + p.engineBackZ);
    drivetrainRig.rightHeadGroup.position.set(-p.cylinderHeadOutX, 0.31, -1.58 + p.engineBackZ);
    drivetrainRig.exhaustGroup.position.set(0, 0.31 + p.exhaustDropY, -1.58 + p.exhaustBackZ);

    drivetrainRig.frontSuspLeft.position.x = p.suspensionOutX;
    drivetrainRig.frontSuspRight.position.x = -p.suspensionOutX;
    drivetrainRig.rearSuspLeft.position.x = p.suspensionOutX;
    drivetrainRig.rearSuspRight.position.x = -p.suspensionOutX;

    drivetrainRig.wheels.forEach((w) => {
      w.wheelGroup.position.x = w.baseX + w.sideSign * p.wheelOutX;
      w.hubBrakeGroup.position.x =
        w.baseX - 0.035 * w.sideSign + w.sideSign * (p.wheelOutX * 0.55);
    });
  };

  return {
    root,
    bodyRoot: bodyRig.root,
    wheels: drivetrainRig.wheels,
    subsystemGroups: {
      body: [bodyRig.root],
      chassis: [
        drivetrainRig.chassisGroup,
        drivetrainRig.interiorGroup,
        drivetrainRig.frontSuspLeft,
        drivetrainRig.frontSuspRight,
        drivetrainRig.rearSuspLeft,
        drivetrainRig.rearSuspRight,
      ],
      transaxle: [drivetrainRig.transaxleGroup],
      engine: [drivetrainRig.engineRootGroup],
      wheels: drivetrainRig.wheels.flatMap((w) => [w.wheelGroup, w.hubBrakeGroup]),
    },
    fadeableBodyMaterials: [
      bodyRig.materials.paint,
      bodyRig.materials.trimBlack,
      bodyRig.materials.chrome,
      bodyRig.materials.amberLens,
      bodyRig.materials.tailRedLens,
      bodyRig.materials.reverseWhiteLens,
      bodyRig.materials.licensePlateMat,
      bodyRig.materials.bumperStripe,
    ],
    glassMaterials: [bodyRig.materials.glass],
    lensMaterials: [bodyRig.materials.headlightGlass],
    decalMaterials: [
      bodyRig.materials.carreraSideMat,
      bodyRig.materials.rearPorscheMat,
      bodyRig.materials.rearBadgeMat,
    ],
    applyExplodePose,
    updateKinematics: drivetrainRig.updateKinematics,
    setLivery: (livery: LiverySpec, tex: ProceduralTextures) => {
      bodyRig.setLivery(livery.bodyHex, livery.scriptHex, tex);
      drivetrainRig.setFuchsColor(livery.wheelAccentHex);
    },
    setEngineXray: drivetrainRig.setEngineXray,
  };
}
