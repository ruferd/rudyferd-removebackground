document.getElementById('btnClearSel').onclick = () => {
  selCtx.clearRect(0, 0, selCanvas.width, selCanvas.height);
  renderView();
};

document.getElementById('btnAutoBg').onclick = () => {
  if (!isLoaded) return alert('Pilih gambar dulu!');
  const w = workCanvas.width, h = workCanvas.height;
  floodRemove([{ x: 1, y: 1 }, { x: w - 2, y: 1 }, { x: 1, y: h - 2 }, { x: w - 2, y: h - 2 }]);
};

function floodRemove(pts) {
  statusEl.textContent = 'Menghapus background...';
  setTimeout(() => {
    const w = workCanvas.width, h = workCanvas.height;
    const imgData = workCtx.getImageData(0, 0, w, h), d = imgData.data;
    const tol = parseInt(tolRange.value), visited = new Uint8Array(w * h), stack = [];
    for (let p of pts) {
      if (p.x >= 0 && p.x < w && p.y >= 0 && p.y < h) {
        const i = (p.y * w + p.x) * 4;
        if (d[i + 3] > 0) stack.push({ x: p.x, y: p.y, r: d[i], g: d[i + 1], b: d[i + 2] });
      }
    }
    while (stack.length > 0) {
      const c = stack.pop(), pos = c.y * w + c.x;
      if (visited[pos]) continue; visited[pos] = 1;
      const i = pos * 4;
      const dist = Math.hypot(d[i] - c.r, d[i + 1] - c.g, d[i + 2] - c.b);
      if (dist <= tol) {
        d[i + 3] = 0;
        const nr = d[i], ng = d[i + 1], nb = d[i + 2];
        if (c.x > 0) stack.push({ x: c.x - 1, y: c.y, r: nr, g: ng, b: nb });
        if (c.x < w - 1) stack.push({ x: c.x + 1, y: c.y, r: nr, g: ng, b: nb });
        if (c.y > 0) stack.push({ x: c.x, y: c.y - 1, r: nr, g: ng, b: nb });
        if (c.y < h - 1) stack.push({ x: c.x, y: c.y + 1, r: nr, g: ng, b: nb });
      } else if (dist <= tol + 15) {
        d[i + 3] = Math.min(d[i + 3], Math.round(255 * ((dist - tol) / 15)));
      }
    }
    workCtx.putImageData(imgData, 0, 0);
    renderView();
    statusEl.textContent = 'Background dihapus! Gunakan Kuas Hapus/Pulihkan jika perlu.';
  }, 20);
}

document.getElementById('btnExecObj').onclick = () => {
  if (!isLoaded) return;
  statusEl.textContent = 'Menghapus objek terpilih...';
  setTimeout(() => {
    const w = workCanvas.width, h = workCanvas.height;
    const imgData = workCtx.getImageData(0, 0, w, h), d = imgData.data;
    const mData = selCtx.getImageData(0, 0, w, h).data;
    const hole = new Uint8Array(w * h);
    let minX = w, minY = h, maxX = 0, maxY = 0, found = false;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (mData[i * 4 + 3] > 20) {
          hole[i] = 1; found = true;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    if (!found) { statusEl.textContent = 'Usap dulu objek yang ingin dihapus!'; return; }
    minX = Math.max(1, minX - 6); minY = Math.max(1, minY - 6);
    maxX = Math.min(w - 2, maxX + 6); maxY = Math.min(h - 2, maxY + 6);
    const iters = Math.max(maxX - minX, maxY - minY) * 2;
    for (let it = 0; it < iters; it++) {
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const i = y * w + x;
          if (hole[i] === 1) {
            let r = 0, g = 0, b = 0, cnt = 0;
            const nb = [i - 1, i + 1, i - w, i + w];
            for (let k = 0; k < 4; k++) {
              const ni = nb[k];
              if (ni >= 0 && ni < w * h) {
                const wt = hole[ni] === 0 ? 3 : 1;
                r += d[ni * 4] * wt; g += d[ni * 4 + 1] * wt; b += d[ni * 4 + 2] * wt; cnt += wt;
              }
            }
            d[i * 4] = r / cnt; d[i * 4 + 1] = g / cnt; d[i * 4 + 2] = b / cnt;
          }
        }
      }
    }
    workCtx.putImageData(imgData, 0, 0);
    selCtx.clearRect(0, 0, w, h);
    renderView();
    statusEl.textContent = 'Objek terpilih berhasil dihapus!';
  }, 20);
};

document.getElementById('btnUpscale').onclick = () => {
  if (!isLoaded) return alert('Pilih gambar dulu!');
  statusEl.textContent = 'Memperbesar gambar...';
  setTimeout(() => {
    const scale = parseInt(document.getElementById('scaleSelect').value);
    const tw = workCanvas.width * scale, th = workCanvas.height * scale;
    let cur = document.createElement('canvas'); cur.width = workCanvas.width; cur.height = workCanvas.height;
    cur.getContext('2d').drawImage(workCanvas, 0, 0);
    while (cur.width < tw) {
      const nw = Math.min(tw, Math.round(cur.width * 1.5)), nh = Math.min(th, Math.round(cur.height * 1.5));
      const nxt = document.createElement('canvas'); nxt.width = nw; nxt.height = nh;
      const nctx = nxt.getContext('2d'); nctx.imageSmoothingEnabled = true; nctx.imageSmoothingQuality = 'high';
      nctx.drawImage(cur, 0, 0, nw, nh); cur = nxt;
    }
    workCanvas.width = selCanvas.width = tw;
    workCanvas.height = selCanvas.height = th;
    workCtx.drawImage(cur, 0, 0);
    selCtx.clearRect(0, 0, tw, th);
    renderView();
    const mp = ((tw * th) / 1000000).toFixed(2);
    statusEl.textContent = `Selesai diperbesar: ${tw} x ${th} px (${mp} MP).`;
  }, 20);
};

document.getElementById('btnSavePng').onclick = () => {
  if (!isLoaded) return;
  const a = document.createElement('a'); a.download = 'studio-result.png'; a.href = workCanvas.toDataURL('image/png'); a.click();
};

document.getElementById('btnSaveJpg').onclick = () => {
  if (!isLoaded) return;
  const jpgC = document.createElement('canvas'); jpgC.width = workCanvas.width; jpgC.height = workCanvas.height;
  const jctx = jpgC.getContext('2d'); jctx.fillStyle = '#ffffff'; jctx.fillRect(0, 0, jpgC.width, jpgC.height);
  jctx.drawImage(workCanvas, 0, 0);
  const a = document.createElement('a'); a.download = 'studio-result.jpg'; a.href = jpgC.toDataURL('image/jpeg', 0.95); a.click();
};
