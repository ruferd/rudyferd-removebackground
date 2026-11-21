const statusEl = document.getElementById('status');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const tolRange = document.getElementById('tolRange');
const brushSize = document.getElementById('brushSize');

let origCanvas = document.createElement('canvas'), origCtx = origCanvas.getContext('2d');
let workCanvas = document.createElement('canvas'), workCtx = workCanvas.getContext('2d');
let selCanvas = document.createElement('canvas'), selCtx = selCanvas.getContext('2d');
let isLoaded = false, isDrawing = false, mode = 'tap';

tolRange.oninput = () => document.getElementById('tolVal').textContent = tolRange.value;
brushSize.oninput = () => document.getElementById('brushVal').textContent = brushSize.value;

function setMode(m) {
  mode = m;
  ['Tap', 'Erase', 'Restore', 'Obj'].forEach(k => {
    document.getElementById('m' + k).classList.toggle('active', k.toLowerCase() === m);
  });
  document.getElementById('boxTol').classList.toggle('hidden', m !== 'tap');
  document.getElementById('boxBrush').classList.toggle('hidden', m === 'tap');
  document.getElementById('boxObjAction').classList.toggle('hidden', m !== 'obj');
  renderView();
}

document.getElementById('mTap').onclick = () => setMode('tap');
document.getElementById('mErase').onclick = () => setMode('erase');
document.getElementById('mRestore').onclick = () => setMode('restore');
document.getElementById('mObj').onclick = () => setMode('obj');

document.getElementById('fileInput').onchange = function(e) {
  const file = e.target.files.item(0);
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    const img = new Image();
    img.onload = function() {
      origCanvas.width = workCanvas.width = selCanvas.width = canvas.width = img.width;
      origCanvas.height = workCanvas.height = selCanvas.height = canvas.height = img.height;
      origCtx.drawImage(img, 0, 0);
      workCtx.drawImage(img, 0, 0);
      selCtx.clearRect(0, 0, img.width, img.height);
      isLoaded = true;
      renderView();
      statusEl.textContent = `Siap (${img.width} x ${img.height} px).`;
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
};

function renderView() {
  if (!isLoaded) return;
  canvas.width = workCanvas.width;
  canvas.height = workCanvas.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(workCanvas, 0, 0);
  if (mode === 'obj') {
    ctx.save(); ctx.globalAlpha = 0.55; ctx.drawImage(selCanvas, 0, 0); ctx.restore();
  }
}

document.getElementById('btnReset').onclick = () => {
  if (!isLoaded) return;
  workCanvas.width = selCanvas.width = origCanvas.width;
  workCanvas.height = selCanvas.height = origCanvas.height;
  workCtx.drawImage(origCanvas, 0, 0);
  selCtx.clearRect(0, 0, selCanvas.width, selCanvas.height);
  renderView();
  statusEl.textContent = 'Gambar dikembalikan ke kondisi asli.';
};

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches ? e.touches.item(0) : e;
  return {
    x: (touch.clientX - rect.left) * (workCanvas.width / rect.width),
    y: (touch.clientY - rect.top) * (workCanvas.height / rect.height)
  };
}

function paintBrush(pos) {
  const r = (parseInt(brushSize.value) / 2) * (workCanvas.width / canvas.getBoundingClientRect().width);
  if (mode === 'erase') {
    workCtx.save(); workCtx.globalCompositeOperation = 'destination-out';
    workCtx.beginPath(); workCtx.arc(pos.x, pos.y, r, 0, Math.PI * 2); workCtx.fill(); workCtx.restore();
  } else if (mode === 'restore') {
    workCtx.save(); workCtx.beginPath(); workCtx.arc(pos.x, pos.y, r, 0, Math.PI * 2); workCtx.clip();
    workCtx.drawImage(origCanvas, 0, 0, workCanvas.width, workCanvas.height); workCtx.restore();
  } else if (mode === 'obj') {
    selCtx.fillStyle = '#ef4444'; selCtx.beginPath(); selCtx.arc(pos.x, pos.y, r, 0, Math.PI * 2); selCtx.fill();
  }
  renderView();
}

const onStart = (e) => {
  if (!isLoaded) return;
  const pos = getPos(e);
  if (mode === 'tap') { floodRemove([{ x: Math.floor(pos.x), y: Math.floor(pos.y) }]); }
  else { e.preventDefault(); isDrawing = true; paintBrush(pos); }
};
const onMove = (e) => { if (isDrawing && mode !== 'tap') { e.preventDefault(); paintBrush(getPos(e)); } };
const onEnd = () => { isDrawing = false; };

canvas.addEventListener('mousedown', onStart); canvas.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onEnd);
canvas.addEventListener('touchstart', onStart, { passive: false }); canvas.addEventListener('touchmove', onMove, { passive: false }); window.addEventListener('touchend', onEnd);
