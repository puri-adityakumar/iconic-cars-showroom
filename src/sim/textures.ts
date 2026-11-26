import * as THREE from 'three';

export interface ProceduralTextures {
  vdoGaugeMap: THREE.CanvasTexture;
  bmwGaugeMap: THREE.CanvasTexture;
  gtrMfdMap: THREE.CanvasTexture;
  pepitaSeatMap: THREE.CanvasTexture;
  mClothSeatMap: THREE.CanvasTexture;
  brakeDiscMap: THREE.CanvasTexture;
  tireTreadBump: THREE.CanvasTexture;
  brushedMetalBump: THREE.CanvasTexture;
  asphaltBump: THREE.CanvasTexture;
  taillightBump: THREE.CanvasTexture;
  studioShadowMap: THREE.CanvasTexture;
  headlightFresnelMap: THREE.CanvasTexture;
  porscheCrestMap: THREE.CanvasTexture;
  bmwRoundelMap: THREE.CanvasTexture;
  bmwM3BadgeMap: THREE.CanvasTexture;
  bmwM5BadgeMap: THREE.CanvasTexture;
  bmwMPowerPlaqueMap: THREE.CanvasTexture;
  nissanBadgeMap: THREE.CanvasTexture;
  gtrBadgeMap: THREE.CanvasTexture;
  takumiPlaqueMap: THREE.CanvasTexture;
  rearCarreraBadgeMap: THREE.CanvasTexture;
  rearPorscheLetteringMap: (scriptHex: string) => THREE.CanvasTexture;
  carreraSideStripe: (scriptHex: string, bodyHex: string) => THREE.CanvasTexture;
  licensePlateMap: THREE.CanvasTexture;
  createPlateMap: (text: string) => THREE.CanvasTexture;
}

function finalizeColorTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

function finalizeDataTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextures {
  const aniso = Math.min(8, Math.max(1, maxAnisotropy));

  // 1. Classic Porsche 5-Dial VDO Instrument Cluster
  const vdoCanvas = document.createElement('canvas');
  vdoCanvas.width = 1024;
  vdoCanvas.height = 256;
  const vctx = vdoCanvas.getContext('2d')!;
  vctx.fillStyle = '#121316';
  vctx.fillRect(0, 0, 1024, 256);

  const dialConfigs = [
    { cx: 140, r: 74, title: 'OIL', ticks: 8, redStart: 7, maxLabel: '150' },
    { cx: 315, r: 84, title: 'FUEL', ticks: 8, redStart: 99, maxLabel: '1/1' },
    { cx: 512, r: 106, title: 'x1000', ticks: 8, redStart: 7, maxLabel: '8', isTach: true },
    { cx: 709, r: 84, title: 'KM/H', ticks: 10, redStart: 99, maxLabel: '250' },
    { cx: 884, r: 74, title: 'TIME', ticks: 12, redStart: 99, maxLabel: '12' },
  ];

  dialConfigs.forEach((d) => {
    // Chrome bezel ring
    vctx.beginPath();
    vctx.arc(d.cx, 128, d.r + 5, 0, Math.PI * 2);
    vctx.strokeStyle = '#9aa0a8';
    vctx.lineWidth = 4;
    vctx.stroke();

    // Matte black dial face
    vctx.beginPath();
    vctx.arc(d.cx, 128, d.r, 0, Math.PI * 2);
    vctx.fillStyle = '#090a0c';
    vctx.fill();

    // Redline arc on tachometer
    if (d.isTach) {
      vctx.beginPath();
      vctx.arc(d.cx, 128, d.r - 12, -0.35, 0.55);
      vctx.strokeStyle = '#d6182b';
      vctx.lineWidth = 7;
      vctx.stroke();
    }

    // Tick marks
    for (let i = 0; i <= d.ticks; i++) {
      const angle = (Math.PI * 0.75) + (i / d.ticks) * (Math.PI * 1.5);
      const x1 = d.cx + Math.cos(angle) * (d.r - 8);
      const y1 = 128 + Math.sin(angle) * (d.r - 8);
      const x2 = d.cx + Math.cos(angle) * (d.r - 20);
      const y2 = 128 + Math.sin(angle) * (d.r - 20);
      vctx.beginPath();
      vctx.moveTo(x1, y1);
      vctx.lineTo(x2, y2);
      vctx.strokeStyle = i >= d.redStart ? '#d6182b' : '#f1f3f5';
      vctx.lineWidth = 2.5;
      vctx.stroke();
    }

    // Needle
    const needleAngle = d.isTach ? -Math.PI * 0.65 : -Math.PI * 0.85;
    vctx.beginPath();
    vctx.moveTo(d.cx, 128);
    vctx.lineTo(
      d.cx + Math.cos(needleAngle) * (d.r - 16),
      128 + Math.sin(needleAngle) * (d.r - 16),
    );
    vctx.strokeStyle = '#ef4c23';
    vctx.lineWidth = 3.5;
    vctx.stroke();

    // Center cap
    vctx.beginPath();
    vctx.arc(d.cx, 128, 8, 0, Math.PI * 2);
    vctx.fillStyle = '#25282e';
    vctx.fill();

    vctx.fillStyle = '#cfd4dc';
    vctx.font = 'bold 14px sans-serif';
    vctx.textAlign = 'center';
    vctx.fillText(d.title, d.cx, 128 + d.r * 0.48);
  });

  // 2. Classic 1970s Porsche Pepita Houndstooth Fabric Texture
  const pepitaCanvas = document.createElement('canvas');
  pepitaCanvas.width = 256;
  pepitaCanvas.height = 256;
  const pctx = pepitaCanvas.getContext('2d')!;
  pctx.fillStyle = '#e7e4dc';
  pctx.fillRect(0, 0, 256, 256);
  pctx.fillStyle = '#191a1d';
  const step = 32;
  for (let y = 0; y < 256; y += step) {
    for (let x = 0; x < 256; x += step) {
      const odd = ((x / step) + (y / step)) % 2 === 0;
      if (odd) {
        pctx.fillRect(x, y, step * 0.55, step * 0.55);
        pctx.beginPath();
        pctx.moveTo(x + step * 0.55, y);
        pctx.lineTo(x + step, y);
        pctx.lineTo(x + step * 0.55, y + step * 0.45);
        pctx.closePath();
        pctx.fill();
      }
    }
  }
  const pepitaSeatMap = finalizeColorTexture(pepitaCanvas, aniso);
  pepitaSeatMap.wrapS = THREE.RepeatWrapping;
  pepitaSeatMap.wrapT = THREE.RepeatWrapping;
  pepitaSeatMap.repeat.set(3, 5);

  // 3. Cross-Drilled Ventilated Brake Rotor Texture
  const discCanvas = document.createElement('canvas');
  discCanvas.width = 512;
  discCanvas.height = 512;
  const dctx = discCanvas.getContext('2d')!;
  dctx.fillStyle = '#9aa1aa';
  dctx.fillRect(0, 0, 512, 512);
  // Concentric rotor sweep grooves
  for (let r = 90; r < 248; r += 2) {
    dctx.beginPath();
    dctx.arc(256, 256, r, 0, Math.PI * 2);
    dctx.strokeStyle = r % 6 === 0 ? 'rgba(40,44,50,0.22)' : 'rgba(220,224,230,0.16)';
    dctx.lineWidth = 1;
    dctx.stroke();
  }
  // Cross-drilled ventilation holes
  dctx.fillStyle = '#1b1d21';
  for (let spoke = 0; spoke < 16; spoke++) {
    const baseAngle = (spoke / 16) * Math.PI * 2;
    for (let h = 0; h < 3; h++) {
      const rr = 148 + h * 30;
      const a = baseAngle + h * 0.11;
      dctx.beginPath();
      dctx.arc(256 + Math.cos(a) * rr, 256 + Math.sin(a) * rr, 5.5, 0, Math.PI * 2);
      dctx.fill();
    }
  }

  // 4. Tire Tread Bump Map
  const treadCanvas = document.createElement('canvas');
  treadCanvas.width = 256;
  treadCanvas.height = 256;
  const tctx = treadCanvas.getContext('2d')!;
  tctx.fillStyle = '#808080';
  tctx.fillRect(0, 0, 256, 256);
  tctx.fillStyle = '#202020';
  // Circumferential ribs + angled vintage Cinturato sipes
  [54, 102, 154, 202].forEach((rx) => {
    tctx.fillRect(rx - 4, 0, 8, 256);
  });
  for (let y = 0; y < 256; y += 24) {
    tctx.beginPath();
    tctx.moveTo(12, y);
    tctx.lineTo(98, y + 14);
    tctx.lineWidth = 5;
    tctx.strokeStyle = '#2a2a2a';
    tctx.stroke();

    tctx.beginPath();
    tctx.moveTo(244, y);
    tctx.lineTo(158, y + 14);
    tctx.stroke();
  }

  // 5. Brushed Aluminum Bump Map
  const metalCanvas = document.createElement('canvas');
  metalCanvas.width = 256;
  metalCanvas.height = 256;
  const mctx = metalCanvas.getContext('2d')!;
  mctx.fillStyle = '#808080';
  mctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 600; i++) {
    const y = (i * 19) % 256;
    const shade = 110 + ((i * 37) % 45);
    mctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    mctx.fillRect(0, y, 256, 1);
  }

  // 5b. Tarmac Asphalt Aggregate Bump Map
  const asphaltCanvas = document.createElement('canvas');
  asphaltCanvas.width = 256;
  asphaltCanvas.height = 256;
  const actx = asphaltCanvas.getContext('2d')!;
  actx.fillStyle = '#7e7e7e';
  actx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4200; i++) {
    const x = (i * 73 + (i % 19) * 11) % 256;
    const y = (i * 137 + (i % 23) * 7) % 256;
    const s = 88 + ((i * 41) % 85);
    actx.fillStyle = `rgb(${s},${s},${s})`;
    actx.fillRect(x, y, 2, 2);
  }

  // 5c. Fluted Taillight Fresnel Rib Bump Map
  const tlCanvas = document.createElement('canvas');
  tlCanvas.width = 128;
  tlCanvas.height = 128;
  const tlctx = tlCanvas.getContext('2d')!;
  tlctx.fillStyle = '#808080';
  tlctx.fillRect(0, 0, 128, 128);
  for (let x = 0; x < 128; x += 8) {
    tlctx.fillStyle = '#cfcfcf';
    tlctx.fillRect(x, 0, 3, 128);
    tlctx.fillStyle = '#404040';
    tlctx.fillRect(x + 4, 0, 3, 128);
  }

  // 6. Studio Floor Contact Shadow (soft elliptical radial gradient)
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 512;
  shadowCanvas.height = 512;
  const sctx = shadowCanvas.getContext('2d')!;
  sctx.clearRect(0, 0, 512, 512);
  const grad = sctx.createRadialGradient(256, 256, 40, 256, 256, 248);
  grad.addColorStop(0, 'rgba(18, 22, 28, 0.42)');
  grad.addColorStop(0.55, 'rgba(18, 22, 28, 0.22)');
  grad.addColorStop(0.85, 'rgba(18, 22, 28, 0.05)');
  grad.addColorStop(1, 'rgba(18, 22, 28, 0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 512, 512);
  const studioShadowMap = new THREE.CanvasTexture(shadowCanvas);
  studioShadowMap.colorSpace = THREE.SRGBColorSpace;
  studioShadowMap.needsUpdate = true;

  // 7. Classic German Plate (S · RS 2773)
  const plateCanvas = document.createElement('canvas');
  plateCanvas.width = 512;
  plateCanvas.height = 112;
  const plctx = plateCanvas.getContext('2d')!;
  plctx.fillStyle = '#f6f6f2';
  plctx.fillRect(0, 0, 512, 112);
  plctx.strokeStyle = '#181a1d';
  plctx.lineWidth = 8;
  plctx.strokeRect(4, 4, 504, 104);
  plctx.fillStyle = '#181a1d';
  plctx.font = 'bold 64px "Plus Jakarta Sans", sans-serif';
  plctx.textAlign = 'center';
  plctx.textBaseline = 'middle';
  plctx.fillText('S · RS 2773', 256, 58);

  // 8. Fluted Classic H4 Headlight Fresnel Lens Optics Map (translucent optical lines over dark clear lens)
  const hlCanvas = document.createElement('canvas');
  hlCanvas.width = 256;
  hlCanvas.height = 256;
  const hlctx = hlCanvas.getContext('2d')!;
  hlctx.fillStyle = '#9aa8b8';
  hlctx.fillRect(0, 0, 256, 256);
  // Concentric optical rings
  for (let r = 22; r < 126; r += 16) {
    hlctx.beginPath();
    hlctx.arc(128, 128, r, 0, Math.PI * 2);
    hlctx.strokeStyle = 'rgba(255,255,255,0.42)';
    hlctx.lineWidth = 2;
    hlctx.stroke();
  }
  // Vertical Fresnel flutes
  for (let x = 16; x < 248; x += 12) {
    hlctx.beginPath();
    hlctx.moveTo(x, 0);
    hlctx.lineTo(x, 256);
    hlctx.strokeStyle = 'rgba(235,244,255,0.34)';
    hlctx.lineWidth = 1.8;
    hlctx.stroke();
  }
  // Subtle dark rim vignette + crisp center optical highlight
  const hlGrad = hlctx.createRadialGradient(128, 128, 8, 128, 128, 118);
  hlGrad.addColorStop(0, 'rgba(255, 252, 240, 0.55)');
  hlGrad.addColorStop(0.32, 'rgba(180, 196, 214, 0.12)');
  hlGrad.addColorStop(1, 'rgba(35, 45, 58, 0.45)');
  hlctx.fillStyle = hlGrad;
  hlctx.fillRect(0, 0, 256, 256);

  // 9. Heraldic Stuttgart Porsche Crest Emblem (Hood & Fuchs Center Caps)
  const crestCanvas = document.createElement('canvas');
  crestCanvas.width = 128;
  crestCanvas.height = 128;
  const cctx = crestCanvas.getContext('2d')!;
  cctx.clearRect(0, 0, 128, 128);
  // Shield path
  cctx.beginPath();
  cctx.moveTo(22, 12);
  cctx.lineTo(106, 12);
  cctx.lineTo(102, 74);
  cctx.quadraticCurveTo(92, 104, 64, 118);
  cctx.quadraticCurveTo(36, 104, 26, 74);
  cctx.closePath();
  cctx.fillStyle = '#d4a632';
  cctx.fill();
  cctx.lineWidth = 4;
  cctx.strokeStyle = '#181a1d';
  cctx.stroke();

  cctx.save();
  cctx.clip();
  // Quarters: red/black Württemberg stripes + antlers
  cctx.fillStyle = '#b41723';
  cctx.fillRect(64, 12, 44, 48);
  cctx.fillRect(20, 60, 44, 58);
  cctx.fillStyle = '#181a1d';
  cctx.fillRect(22, 24, 42, 8);
  cctx.fillRect(22, 40, 42, 8);
  cctx.fillRect(64, 70, 40, 8);
  cctx.fillRect(64, 86, 40, 8);
  cctx.restore();

  // Inner Stuttgart escutcheon
  cctx.fillStyle = '#ecc048';
  cctx.fillRect(49, 42, 30, 34);
  cctx.strokeStyle = '#181a1d';
  cctx.lineWidth = 3;
  cctx.strokeRect(49, 42, 30, 34);
  // Prancing horse silhouette
  cctx.fillStyle = '#181a1d';
  cctx.beginPath();
  cctx.arc(64, 60, 6, 0, Math.PI * 2);
  cctx.fill();
  cctx.fillRect(62, 50, 5, 14);

  // 10. Rear Ducktail Carrera RS Badge (transparent background)
  const badgeCanvas = document.createElement('canvas');
  badgeCanvas.width = 512;
  badgeCanvas.height = 128;
  const bctx = badgeCanvas.getContext('2d')!;
  bctx.clearRect(0, 0, 512, 128);
  bctx.fillStyle = '#181a1f';
  bctx.font = 'italic 800 54px Georgia, "Times New Roman", serif';
  bctx.textAlign = 'center';
  bctx.textBaseline = 'middle';
  bctx.fillText('Carrera RS', 256, 66);
  const rearCarreraBadgeMap = finalizeColorTexture(badgeCanvas, aniso);

  // 10b. Rear Deck PORSCHE Block-Band Stencil (matching Porsche Museum RS 2.7)
  const rearPorscheLetteringMap = (scriptHex: string) => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 1024, 128);

    ctx.fillStyle = scriptHex;
    // Compact side anchor blocks & crisp horizontal pinstripe rails matching Museum RS 2.7
    ctx.fillRect(0, 26, 78, 76);
    ctx.fillRect(946, 26, 78, 76);
    ctx.fillRect(0, 18, 1024, 12);
    ctx.fillRect(0, 98, 1024, 12);

    ctx.font = '900 70px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const letters = ['P', 'O', 'R', 'S', 'C', 'H', 'E'];
    letters.forEach((ch, idx) => {
      const x = 148 + idx * 121;
      ctx.fillText(ch, x, 66);
    });
    return finalizeColorTexture(c, aniso);
  };

  // 11. Authentic 1973 Carrera RS Side Script Stripe
  const carreraSideStripe = (scriptHex: string, _bodyHex: string) => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 192;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 1024, 192);

    ctx.fillStyle = scriptHex;
    // Upper & lower pin stripes running end-to-end
    ctx.fillRect(0, 26, 1024, 15);
    ctx.fillRect(0, 151, 1024, 15);

    // Solid end blocks flanking the cursive Carrera script window
    ctx.fillRect(0, 50, 152, 92);
    ctx.fillRect(872, 50, 152, 92);

    // Classic slanted cursive-inspired Carrera lettering centered cleanly
    ctx.save();
    ctx.translate(512, 99);
    ctx.transform(1, 0, -0.24, 1, 0, 0);
    ctx.font = 'italic 900 86px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Carrera', 0, 0);
    ctx.restore();

    return finalizeColorTexture(c, aniso);
  };

  const createPlateMap = (plateText: string) => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 112;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#f6f6f2';
    ctx.fillRect(0, 0, 512, 112);
    ctx.strokeStyle = '#181a1d';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 504, 104);
    ctx.fillStyle = '#181a1d';
    ctx.font = 'bold 58px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(plateText, 256, 58);
    return finalizeColorTexture(c, aniso);
  };

  // 12. BMW Roundel + M Badges + Gauges + M-Cloth
  const roundelCanvas = document.createElement('canvas');
  roundelCanvas.width = 128;
  roundelCanvas.height = 128;
  const rctx = roundelCanvas.getContext('2d')!;
  rctx.clearRect(0, 0, 128, 128);
  rctx.beginPath();
  rctx.arc(64, 64, 60, 0, Math.PI * 2);
  rctx.fillStyle = '#d8dde4';
  rctx.fill();
  rctx.beginPath();
  rctx.arc(64, 64, 55, 0, Math.PI * 2);
  rctx.fillStyle = '#101215';
  rctx.fill();
  rctx.beginPath();
  rctx.arc(64, 64, 36, 0, Math.PI * 2);
  rctx.fillStyle = '#f4f6f8';
  rctx.fill();
  // Blue Bavarian quarters
  rctx.fillStyle = '#1c78d4';
  rctx.beginPath();
  rctx.moveTo(64, 64);
  rctx.arc(64, 64, 35, Math.PI, Math.PI * 1.5);
  rctx.closePath();
  rctx.fill();
  rctx.beginPath();
  rctx.moveTo(64, 64);
  rctx.arc(64, 64, 35, 0, Math.PI * 0.5);
  rctx.closePath();
  rctx.fill();
  rctx.strokeStyle = '#d8dde4';
  rctx.lineWidth = 3;
  rctx.beginPath();
  rctx.moveTo(29, 64);
  rctx.lineTo(99, 64);
  rctx.moveTo(64, 29);
  rctx.lineTo(64, 99);
  rctx.stroke();

  const makeMBadge = (suffix: string) => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 80;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 80);
    const stripes = ['#2aa8e0', '#1d3c8f', '#d91e2a'];
    stripes.forEach((col, i) => {
      ctx.beginPath();
      const x = 18 + i * 24;
      ctx.moveTo(x + 14, 14);
      ctx.lineTo(x + 36, 14);
      ctx.lineTo(x + 22, 66);
      ctx.lineTo(x, 66);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
    });
    ctx.fillStyle = '#eef2f6';
    ctx.font = 'italic 900 54px "Plus Jakarta Sans", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(suffix, 92, 42);
    return finalizeColorTexture(c, aniso);
  };

  // M Power Plenum / Cam Cover Plaque
  const mPowerCanvas = document.createElement('canvas');
  mPowerCanvas.width = 512;
  mPowerCanvas.height = 128;
  const mpctx = mPowerCanvas.getContext('2d')!;
  mpctx.fillStyle = '#181b20';
  mpctx.fillRect(0, 0, 512, 128);
  mpctx.fillStyle = '#2aa8e0';
  mpctx.fillRect(22, 24, 24, 80);
  mpctx.fillStyle = '#1d3c8f';
  mpctx.fillRect(50, 24, 24, 80);
  mpctx.fillStyle = '#d91e2a';
  mpctx.fillRect(78, 24, 24, 80);
  mpctx.fillStyle = '#e8ecf2';
  mpctx.font = '900 56px "Plus Jakarta Sans", sans-serif';
  mpctx.textBaseline = 'middle';
  mpctx.fillText('BMW M Power', 120, 66);

  // BMW M Analog Gauge Cluster (amber/white M dials)
  const bmwGCanvas = document.createElement('canvas');
  bmwGCanvas.width = 1024;
  bmwGCanvas.height = 256;
  const bgctx = bmwGCanvas.getContext('2d')!;
  bgctx.fillStyle = '#14161b';
  bgctx.fillRect(0, 0, 1024, 256);
  [
    { cx: 290, r: 96, title: 'KM/H', isTach: false },
    { cx: 690, r: 96, title: 'x1000', isTach: true },
  ].forEach((d) => {
    bgctx.beginPath();
    bgctx.arc(d.cx, 128, d.r + 5, 0, Math.PI * 2);
    bgctx.strokeStyle = '#7b828e';
    bgctx.lineWidth = 4;
    bgctx.stroke();
    bgctx.beginPath();
    bgctx.arc(d.cx, 128, d.r, 0, Math.PI * 2);
    bgctx.fillStyle = '#1b1f26';
    bgctx.fill();
    if (d.isTach) {
      bgctx.beginPath();
      bgctx.arc(d.cx, 128, d.r - 12, -0.45, 0.52);
      bgctx.strokeStyle = '#e0242b';
      bgctx.lineWidth = 9;
      bgctx.stroke();
    }
    bgctx.strokeStyle = '#f25c2a';
    bgctx.lineWidth = 4;
    bgctx.beginPath();
    bgctx.moveTo(d.cx, 128);
    bgctx.lineTo(d.cx - 48, 72);
    bgctx.stroke();
    bgctx.fillStyle = '#e2e6ed';
    bgctx.font = 'bold 16px sans-serif';
    bgctx.textAlign = 'center';
    bgctx.fillText(d.title, d.cx, 174);
  });

  // Anthracite Sport Cloth with Tricolor M Stripes (E30 M3 Sport Evo / Recaro)
  const mClothCanvas = document.createElement('canvas');
  mClothCanvas.width = 256;
  mClothCanvas.height = 256;
  const mcctx = mClothCanvas.getContext('2d')!;
  mcctx.fillStyle = '#23262c';
  mcctx.fillRect(0, 0, 256, 256);
  mcctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let y = 0; y < 256; y += 8) {
    mcctx.fillRect(0, y, 256, 2);
  }
  mcctx.fillStyle = '#2aa8e0';
  mcctx.fillRect(92, 0, 18, 256);
  mcctx.fillStyle = '#1d3c8f';
  mcctx.fillRect(114, 0, 18, 256);
  mcctx.fillStyle = '#d91e2a';
  mcctx.fillRect(136, 0, 18, 256);

  // 13. Nissan & GT-R R35 Badges, Polyphony MFD Display & Takumi Engine Plaque
  const nissanCanvas = document.createElement('canvas');
  nissanCanvas.width = 128;
  nissanCanvas.height = 128;
  const nctx = nissanCanvas.getContext('2d')!;
  nctx.clearRect(0, 0, 128, 128);
  nctx.strokeStyle = '#d8dee6';
  nctx.lineWidth = 10;
  nctx.beginPath();
  nctx.arc(64, 64, 44, 0, Math.PI * 2);
  nctx.stroke();
  nctx.fillStyle = '#d8dee6';
  nctx.fillRect(12, 48, 104, 32);
  nctx.fillStyle = '#16181d';
  nctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
  nctx.textAlign = 'center';
  nctx.textBaseline = 'middle';
  nctx.fillText('NISSAN', 64, 64);

  const gtrCanvas = document.createElement('canvas');
  gtrCanvas.width = 256;
  gtrCanvas.height = 140;
  const gctx = gtrCanvas.getContext('2d')!;
  gctx.fillStyle = '#1a1d22';
  gctx.fillRect(8, 8, 240, 124);
  gctx.strokeStyle = '#ced4de';
  gctx.lineWidth = 6;
  gctx.strokeRect(8, 8, 240, 124);
  gctx.fillStyle = '#e5e9f0';
  gctx.font = '900 54px "Plus Jakarta Sans", sans-serif';
  gctx.textBaseline = 'middle';
  gctx.fillText('GT-', 24, 72);
  gctx.fillStyle = '#d91b24';
  gctx.font = 'italic 900 76px "Plus Jakarta Sans", sans-serif';
  gctx.fillText('R', 132, 72);

  const mfdCanvas = document.createElement('canvas');
  mfdCanvas.width = 512;
  mfdCanvas.height = 256;
  const mfdCtx = mfdCanvas.getContext('2d')!;
  mfdCtx.fillStyle = '#0c1118';
  mfdCtx.fillRect(0, 0, 512, 256);
  [92, 256, 420].forEach((cx, idx) => {
    mfdCtx.beginPath();
    mfdCtx.arc(cx, 128, 66, Math.PI * 0.75, Math.PI * 2.25);
    mfdCtx.strokeStyle = idx === 1 ? '#e03e2d' : '#2ea8f2';
    mfdCtx.lineWidth = 10;
    mfdCtx.stroke();
    mfdCtx.fillStyle = '#eef4fa';
    mfdCtx.font = 'bold 26px monospace';
    mfdCtx.textAlign = 'center';
    mfdCtx.fillText(idx === 0 ? 'BOOST' : idx === 1 ? '1.3G' : 'OIL °C', cx, 134);
  });

  const takumiCanvas = document.createElement('canvas');
  takumiCanvas.width = 256;
  takumiCanvas.height = 96;
  const tkctx = takumiCanvas.getContext('2d')!;
  tkctx.fillStyle = '#191c22';
  tkctx.fillRect(0, 0, 256, 96);
  tkctx.strokeStyle = '#c89e3c';
  tkctx.lineWidth = 5;
  tkctx.strokeRect(4, 4, 248, 88);
  tkctx.fillStyle = '#f2f4f8';
  tkctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
  tkctx.textAlign = 'center';
  tkctx.fillText('TAKUMI CRAFTED', 128, 36);
  tkctx.fillStyle = '#e0312c';
  tkctx.font = 'bold 22px monospace';
  tkctx.fillText('VR38DETT · R35', 128, 68);

  return {
    vdoGaugeMap: finalizeColorTexture(vdoCanvas, aniso),
    bmwGaugeMap: finalizeColorTexture(bmwGCanvas, aniso),
    gtrMfdMap: finalizeColorTexture(mfdCanvas, aniso),
    pepitaSeatMap,
    mClothSeatMap: finalizeColorTexture(mClothCanvas, aniso),
    brakeDiscMap: finalizeColorTexture(discCanvas, aniso),
    tireTreadBump: finalizeDataTexture(treadCanvas, aniso, 1, 6),
    brushedMetalBump: finalizeDataTexture(metalCanvas, aniso, 2, 2),
    asphaltBump: finalizeDataTexture(asphaltCanvas, aniso, 18, 18),
    taillightBump: finalizeDataTexture(tlCanvas, aniso, 2, 1),
    studioShadowMap,
    headlightFresnelMap: finalizeColorTexture(hlCanvas, aniso),
    porscheCrestMap: finalizeColorTexture(crestCanvas, aniso),
    bmwRoundelMap: finalizeColorTexture(roundelCanvas, aniso),
    bmwM3BadgeMap: makeMBadge('M3'),
    bmwM5BadgeMap: makeMBadge('M5'),
    bmwMPowerPlaqueMap: finalizeColorTexture(mPowerCanvas, aniso),
    nissanBadgeMap: finalizeColorTexture(nissanCanvas, aniso),
    gtrBadgeMap: finalizeColorTexture(gtrCanvas, aniso),
    takumiPlaqueMap: finalizeColorTexture(takumiCanvas, aniso),
    rearCarreraBadgeMap,
    rearPorscheLetteringMap,
    carreraSideStripe,
    licensePlateMap: finalizeColorTexture(plateCanvas, aniso),
    createPlateMap,
  };
}
