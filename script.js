const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

let width, height;

// Simulation parameters
let pixelsPerMeter = 100;
function getEScale() { return 8.99e3 * pixelsPerMeter * pixelsPerMeter; }
const stepSize = 2;
const maxSteps = 2000;
const fieldLineColor = 'rgba(255, 255, 255, 0.35)';
const chargeRadiusBase = 12;

let charges = [];
let isDragging = false;
let draggedCharge = null;
let currentChargeSign = 1;
let currentMagnitude = 1;
let linesPerCharge = 16;

let pointerX = 0, pointerY = 0;
let pointerX_m = 0, pointerY_m = 0;
let showPointer = false;
let showGrid   = true;
let snapEnabled = true;
let gridSpacingMeters = 0.5;
let showNodalLines = false;
let showNullPoints = false;
let showEquipotentials = false;

let cameraX = 0, cameraY = 0;
let isMouseDown = false, isPanning = false, hasMoved = false;
let lastMouseX = 0, lastMouseY = 0;

// Interaction flag: while true, skip expensive grid computations so drag stays fluid.
let _interacting = false;
let _idleTimer = 0;

// DOM elements
const btnPositive      = document.getElementById('btnPositive');
const btnNegative      = document.getElementById('btnNegative');
const magSlider        = document.getElementById('chargeMagnitude');
const magValue         = document.getElementById('magnitudeValue');
const densitySlider    = document.getElementById('lineDensity');
const densityValue     = document.getElementById('densityValue');
const gridCheckbox     = document.getElementById('showGrid');
const snapCheckbox     = document.getElementById('snapToGrid');
const gridSlider       = document.getElementById('gridSpacing');
const gridValue        = document.getElementById('gridSpacingValue');
const nodalCheckbox    = document.getElementById('showNodalLines');
const nullCheckbox     = document.getElementById('showNullPoints');
const equipCheckbox    = document.getElementById('showEquipotentials');
const zoomSlider       = document.getElementById('zoomLevel');
const zoomValue        = document.getElementById('zoomValue');
const btnClear         = document.getElementById('btnClear');
const btnUndo          = document.getElementById('btnUndo');
const valX   = document.getElementById('valX');
const valY   = document.getElementById('valY');
const valEx  = document.getElementById('valEx');
const valEy  = document.getElementById('valEy');
const valEmag = document.getElementById('valEmag');

// ─── Coordinate helpers ────────────────────────────────────────────────────

function updateChargePixels() {
    const cx = width/2 + cameraX, cy = height/2 + cameraY;
    for (let c of charges) {
        c.x = c.x_m * pixelsPerMeter + cx;
        c.y = -c.y_m * pixelsPerMeter + cy;
    }
}

function resize() {
    width  = window.innerWidth;
    height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = width  * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    updateChargePixels();
    if (challengeActive) updateTargetChargePixels();
    scheduleRender();
}
window.addEventListener('resize', resize);

// ─── UI listeners ─────────────────────────────────────────────────────────

btnPositive.addEventListener('click', () => {
    currentChargeSign = 1;
    btnPositive.classList.add('active');
    btnNegative.classList.remove('active');
});
btnNegative.addEventListener('click', () => {
    currentChargeSign = -1;
    btnNegative.classList.add('active');
    btnPositive.classList.remove('active');
});
magSlider.addEventListener('input', e => {
    currentMagnitude = parseInt(e.target.value);
    magValue.textContent = currentMagnitude;
});
densitySlider.addEventListener('input', e => {
    linesPerCharge = parseInt(e.target.value);
    densityValue.textContent = linesPerCharge;
    scheduleRender();
});
gridCheckbox.addEventListener('change', e => { showGrid = e.target.checked; scheduleRender(); });
snapCheckbox.addEventListener('change', e => { snapEnabled = e.target.checked; scheduleRender(); });
gridSlider.addEventListener('input', e => {
    gridSpacingMeters = parseFloat(e.target.value);
    gridValue.textContent = gridSpacingMeters.toFixed(1);
    scheduleRender();
});
nodalCheckbox.addEventListener('change', e => { showNodalLines = e.target.checked; scheduleRender(); });
nullCheckbox.addEventListener('change',  e => { showNullPoints = e.target.checked; scheduleRender(); });
equipCheckbox.addEventListener('change', e => { showEquipotentials = e.target.checked; scheduleRender(); });
zoomSlider.addEventListener('input', e => {
    pixelsPerMeter = parseInt(e.target.value);
    zoomValue.textContent = pixelsPerMeter;
    updateChargePixels();
    if (challengeActive) updateTargetChargePixels();
    if (showPointer) {
        const cx = width/2 + cameraX, cy = height/2 + cameraY;
        pointerX = pointerX_m * pixelsPerMeter + cx;
        pointerY = -pointerY_m * pixelsPerMeter + cy;
        const sn = getSnappedCoords(pointerX, pointerY);
        pointerX = sn.x; pointerY = sn.y;
    }
    scheduleRender();
});
btnClear.addEventListener('click', () => {
    _saveHistory();
    charges = [];
    cameraX = 0; cameraY = 0;
    scheduleRender();
});

// ─── Undo history ──────────────────────────────────────────────────────────

const _history = [];
function _saveHistory() {
    _history.push(charges.map(c => ({...c})));
    if (_history.length > 30) _history.shift();
    btnUndo.disabled = false;
}
function undo() {
    if (!_history.length) return;
    charges = _history.pop();
    btnUndo.disabled = _history.length === 0;
    scheduleRender();
}
btnUndo.addEventListener('click', undo);
document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
});

// ─── Canvas interaction ────────────────────────────────────────────────────

function getSnappedCoords(x, y) {
    if (!snapEnabled) return {x, y};
    const sp = gridSpacingMeters * pixelsPerMeter;
    const cx = width/2 + cameraX, cy = height/2 + cameraY;
    const rx = Math.round((x - cx) / sp) * sp;
    const ry = Math.round((y - cy) / sp) * sp;
    return {x: rx + cx, y: ry + cy};
}

canvas.addEventListener('mousedown', e => {
    isMouseDown = true; hasMoved = false;
    lastMouseX = e.clientX; lastMouseY = e.clientY;
    draggedCharge = charges.find(c => {
        const dx = e.clientX - c.x, dy = e.clientY - c.y;
        return Math.sqrt(dx*dx + dy*dy) < chargeRadiusBase + c.q * 2 + 5;
    });
    if (draggedCharge) isDragging = true;
    _interacting = true;
    clearTimeout(_idleTimer);
});

canvas.addEventListener('mousemove', e => {
    const mx = e.clientX, my = e.clientY;
    if (isMouseDown) {
        const dx = mx - lastMouseX, dy = my - lastMouseY;
        if (!hasMoved && Math.sqrt(dx*dx + dy*dy) > 3) {
            hasMoved = true;
            if (!isDragging) isPanning = true;
        }
        if (isPanning) {
            cameraX += dx; cameraY += dy;
            updateChargePixels();
            if (challengeActive) updateTargetChargePixels();
        }
    }
    lastMouseX = mx; lastMouseY = my;

    const sn = getSnappedCoords(mx, my);
    pointerX = sn.x; pointerY = sn.y;
    const cx = width/2 + cameraX, cy = height/2 + cameraY;
    pointerX_m =  (pointerX - cx) / pixelsPerMeter;
    pointerY_m = -(pointerY - cy) / pixelsPerMeter;
    showPointer = true;

    if (isDragging && draggedCharge) {
        draggedCharge.x = pointerX; draggedCharge.y = pointerY;
        draggedCharge.x_m = pointerX_m; draggedCharge.y_m = pointerY_m;
    }
    canvas.style.cursor = (isPanning || draggedCharge) ? 'grabbing' : 'crosshair';

    valX.textContent  = pointerX_m.toFixed(2);
    valY.textContent  = pointerY_m.toFixed(2);
    const E = getElectricField(pointerX, pointerY);
    const ES = getEScale();
    const realEx = E.x * ES, realEy = -E.y * ES;
    valEx.textContent  = realEx.toExponential(2);
    valEy.textContent  = realEy.toExponential(2);
    valEmag.textContent = Math.sqrt(realEx*realEx + realEy*realEy).toExponential(2);

    scheduleRender();
});

canvas.addEventListener('mouseleave', () => {
    showPointer = false; isMouseDown = false; isPanning = false;
    canvas.style.cursor = 'crosshair';
    _interacting = false;
    scheduleRender();
});

canvas.addEventListener('mouseup', e => {
    if (!hasMoved && !isDragging) {
        _saveHistory();
        const sn = getSnappedCoords(e.clientX, e.clientY);
        const cx = width/2 + cameraX, cy = height/2 + cameraY;
        charges.push({
            x_m: (sn.x - cx) / pixelsPerMeter,
            y_m: -(sn.y - cy) / pixelsPerMeter,
            x: sn.x, y: sn.y,
            q: currentMagnitude, sign: currentChargeSign,
        });
    }
    isMouseDown = false; isDragging = false; isPanning = false;
    draggedCharge = null;
    canvas.style.cursor = 'crosshair';
    // End interaction: render fast frame now, then full-quality after 80 ms.
    _interacting = false;
    scheduleRender();
    _idleTimer = setTimeout(scheduleRender, 80);
});

// Right-click to delete a charge
canvas.addEventListener('contextmenu', e => {
    e.preventDefault();
    const idx = charges.findIndex(c => {
        const dx = e.clientX - c.x, dy = e.clientY - c.y;
        return Math.sqrt(dx*dx + dy*dy) < chargeRadiusBase + c.q * 2 + 5;
    });
    if (idx !== -1) { _saveHistory(); charges.splice(idx, 1); scheduleRender(); }
});

// ─── Touch support ─────────────────────────────────────────────────────────

let _pinchStartDist = 0, _pinchStartZoom = 80;
let _longPressTimer = 0, _wasPinching = false;

function _fakeMouseEvent(type, clientX, clientY, button = 0) {
    return new MouseEvent(type, {clientX, clientY, button, buttons: button === 0 ? 1 : 0, bubbles: true, cancelable: true});
}

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (e.touches.length === 1) {
        _wasPinching = false;
        const {clientX, clientY} = e.touches[0];
        _longPressTimer = setTimeout(() => {
            const idx = charges.findIndex(c => {
                const dx = clientX - c.x, dy = clientY - c.y;
                return Math.sqrt(dx*dx + dy*dy) < chargeRadiusBase + c.q * 2 + 14;
            });
            if (idx !== -1) { _saveHistory(); charges.splice(idx, 1); hasMoved = true; scheduleRender(); }
        }, 450);
        canvas.dispatchEvent(_fakeMouseEvent('mousedown', clientX, clientY));
    } else if (e.touches.length === 2) {
        _wasPinching = true;
        hasMoved = true; // prevent charge placement when fingers lift
        clearTimeout(_longPressTimer);
        _pinchStartDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        _pinchStartZoom = pixelsPerMeter;
        isMouseDown = false; isDragging = false; isPanning = false; draggedCharge = null;
    }
}, {passive: false});

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    clearTimeout(_longPressTimer);
    if (e.touches.length === 1) {
        const {clientX, clientY} = e.touches[0];
        canvas.dispatchEvent(_fakeMouseEvent('mousemove', clientX, clientY));
    } else if (e.touches.length === 2) {
        const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        pixelsPerMeter = Math.max(20, Math.min(400, _pinchStartZoom * dist / _pinchStartDist));
        zoomSlider.value = pixelsPerMeter;
        zoomValue.textContent = Math.round(pixelsPerMeter);
        updateChargePixels();
        if (challengeActive) updateTargetChargePixels();
        scheduleRender();
    }
}, {passive: false});

canvas.addEventListener('touchend', e => {
    e.preventDefault();
    clearTimeout(_longPressTimer);
    if (e.touches.length === 0) {
        if (!_wasPinching && e.changedTouches.length >= 1) {
            const {clientX, clientY} = e.changedTouches[0];
            canvas.dispatchEvent(_fakeMouseEvent('mouseup', clientX, clientY));
        }
        _wasPinching = false;
    }
}, {passive: false});

// ─── Save / share image ────────────────────────────────────────────────────

document.getElementById('btnShare').addEventListener('click', () => {
    canvas.toBlob(async blob => {
        const file = new File([blob], 'campo-electrico.png', {type: 'image/png'});
        if (navigator.canShare?.({files: [file]})) {
            try { await navigator.share({title: 'Campo Eléctrico', files: [file]}); return; } catch {}
        }
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(blob), download: 'campo-electrico.png'
        });
        a.click(); URL.revokeObjectURL(a.href);
    }, 'image/png');
});

// ─── Mobile panel drawer ────────────────────────────────────────────────────

const controlPanel = document.getElementById('controlPanel');
const mobileHandle = document.getElementById('mobileHandle');
if (mobileHandle) {
    mobileHandle.addEventListener('click', () => controlPanel.classList.toggle('mobile-open'));
}

// ─── Desktop panel collapse ────────────────────────────────────────────────

const btnCollapsePanel = document.getElementById('btnCollapsePanel');
const btnExpandPanel   = document.getElementById('btnExpandPanel');
if (btnCollapsePanel) {
    btnCollapsePanel.addEventListener('click', () => {
        controlPanel.classList.add('desktop-collapsed');
        btnExpandPanel.hidden = false;
    });
    btnExpandPanel.addEventListener('click', () => {
        controlPanel.classList.remove('desktop-collapsed');
        btnExpandPanel.hidden = true;
    });
}

// ─── Init ──────────────────────────────────────────────────────────────────

charges.push({x_m: -1.5, y_m: 0, x: 0, y: 0, q: 2, sign:  1});
charges.push({x_m:  1.5, y_m: 0, x: 0, y: 0, q: 2, sign: -1});

window.addEventListener('load', () => {
    // Adapt legend text for touch devices
    if ('ontouchstart' in window) {
        const leg = document.getElementById('legendText');
        if (leg) leg.textContent = 'Toca para añadir · Arrastra para mover · Mantén pulsado para borrar · Pellizca para zoom';
    }
    resize();
    setTimeout(resize, 100);
    setTimeout(resize, 500);
    setTimeout(resize, 1000);
    initLessons();
    initLessonPanelEvents();
});

// ─── Physics engine ────────────────────────────────────────────────────────

// Reusable result objects — avoids heap allocation in hot paths.
// IMPORTANT: never hold two simultaneous live references from these functions
// (except evaluateChallenge, which copies values before the second call).
const _Eret = {x: 0, y: 0};

function getElectricField(x, y) {
    return getElectricFieldForCharges(x, y, charges);
}

function getElectricFieldForCharges(x, y, chargeList) {
    let Ex = 0, Ey = 0;
    for (let i = 0, n = chargeList.length; i < n; i++) {
        const c = chargeList[i];
        const dx = x - c.x, dy = y - c.y;
        const distSq = dx*dx + dy*dy;
        if (distSq < 1) continue;
        // Combined: sign*q / r³  (avoids separate sqrt + two divisions)
        const inv_r3 = (c.sign * c.q) / (distSq * Math.sqrt(distSq));
        Ex += inv_r3 * dx;
        Ey += inv_r3 * dy;
    }
    _Eret.x = Ex; _Eret.y = Ey;
    return _Eret;
}

// ─── Field line drawing ────────────────────────────────────────────────────

// Module-level RK4 intermediates — eliminates object allocation in the inner loop.
let _k1x=0, _k1y=0, _k2x=0, _k2y=0, _k3x=0, _k3y=0, _k4x=0, _k4y=0;

// Cached charge geometry for traceLine (rebuilt each drawFieldLines call).
let _traceN = 0;
let _traceX = new Float32Array(64), _traceY = new Float32Array(64);
let _traceR2 = new Float32Array(64), _traceSQ = new Float32Array(64);

function _buildTraceCache() {
    _traceN = charges.length;
    if (_traceN > _traceX.length) {
        _traceX = new Float32Array(_traceN); _traceY = new Float32Array(_traceN);
        _traceR2 = new Float32Array(_traceN); _traceSQ = new Float32Array(_traceN);
    }
    for (let i = 0; i < _traceN; i++) {
        const c = charges[i];
        _traceX[i] = c.x; _traceY[i] = c.y;
        const r = chargeRadiusBase + c.q * 2;
        _traceR2[i] = r * r;
        _traceSQ[i] = c.sign * c.q;
    }
}

// Returns false when field is zero; writes to _k1x/_k1y (or whichever caller uses).
function _setNormField(x, y, dirSign, outObj) {
    let Ex = 0, Ey = 0;
    for (let i = 0; i < _traceN; i++) {
        const dx = x - _traceX[i], dy = y - _traceY[i];
        const distSq = dx*dx + dy*dy;
        if (distSq < 1) continue;
        const inv_r3 = _traceSQ[i] / (distSq * Math.sqrt(distSq));
        Ex += inv_r3 * dx; Ey += inv_r3 * dy;
    }
    const mag2 = Ex*Ex + Ey*Ey;
    if (mag2 < 1e-24) return false;
    const invMag = dirSign / Math.sqrt(mag2);
    outObj.x = Ex * invMag; outObj.y = Ey * invMag;
    return true;
}

// Shared objects for the 4 RK4 stages (no heap allocation per step).
const _rk = [{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0}];

function drawFieldLines() {
    _buildTraceCache();
    ctx.beginPath();
    ctx.strokeStyle = fieldLineColor;
    ctx.lineWidth = 1.2;

    for (let i = 0; i < _traceN; i++) {
        const c = charges[i];
        const numLines = linesPerCharge * c.q;
        const dir = c.sign > 0 ? 1 : -1;
        const startR = chargeRadiusBase + c.q * 2 + 2;
        for (let j = 0; j < numLines; j++) {
            const angle = (j / numLines) * 2 * Math.PI;
            traceLine(c.x + Math.cos(angle) * startR, c.y + Math.sin(angle) * startR, dir);
        }
    }
    ctx.stroke();
}

function traceLine(startX, startY, dirSign) {
    let x = startX, y = startY;
    ctx.moveTo(x, y);
    for (let step = 0; step < maxSteps; step++) {
        if (x < 0 || x > width || y < 0 || y > height) break;
        let hit = false;
        for (let i = 0; i < _traceN; i++) {
            const dx = x - _traceX[i], dy = y - _traceY[i];
            if (dx*dx + dy*dy < _traceR2[i]) { hit = true; break; }
        }
        if (hit && step > 5) break;

        if (!_setNormField(x, y, dirSign, _rk[0])) break;
        const h = stepSize * 0.5;
        if (!_setNormField(x + h*_rk[0].x, y + h*_rk[0].y, dirSign, _rk[1])) break;
        if (!_setNormField(x + h*_rk[1].x, y + h*_rk[1].y, dirSign, _rk[2])) break;
        if (!_setNormField(x + stepSize*_rk[2].x, y + stepSize*_rk[2].y, dirSign, _rk[3])) break;

        x += (stepSize/6) * (_rk[0].x + 2*_rk[1].x + 2*_rk[2].x + _rk[3].x);
        y += (stepSize/6) * (_rk[0].y + 2*_rk[1].y + 2*_rk[2].y + _rk[3].y);
        ctx.lineTo(x, y);
    }
}

// Legacy wrapper (used by drawPointerField and evaluateChallenge via getElectricField).
function getNormalizedField(x, y, dirSign) {
    const E = getElectricField(x, y);
    const mag = Math.sqrt(E.x*E.x + E.y*E.y);
    if (mag < 1e-12) return null;
    return {x: (E.x/mag)*dirSign, y: (E.y/mag)*dirSign};
}

// ─── Marching squares (shared) ─────────────────────────────────────────────

function marchingSquares(vals, cols, rows, res, V_target, strokeStyle, lineDash) {
    ctx.beginPath();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 2.2;
    ctx.setLineDash(lineDash || []);

    const getT = (a, b) => (a - V_target) / (a - b);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const v0 = vals[y*(cols+1)+x];
            const v1 = vals[y*(cols+1)+(x+1)];
            const v2 = vals[(y+1)*(cols+1)+(x+1)];
            const v3 = vals[(y+1)*(cols+1)+x];
            const state = (v0>=V_target?1:0)|(v1>=V_target?2:0)|(v2>=V_target?4:0)|(v3>=V_target?8:0);
            if (state===0||state===15) continue;
            const px = x*res, py = y*res;
            let a=null, b=null;
            if (state===1||state===14)       { a=[px+res*getT(v0,v1),py];         b=[px,py+res*getT(v0,v3)]; }
            else if (state===2||state===13)  { a=[px+res*getT(v0,v1),py];         b=[px+res,py+res*getT(v1,v2)]; }
            else if (state===4||state===11)  { a=[px+res*getT(v3,v2),py+res];     b=[px+res,py+res*getT(v1,v2)]; }
            else if (state===8||state===7)   { a=[px+res*getT(v3,v2),py+res];     b=[px,py+res*getT(v0,v3)]; }
            else if (state===3||state===12)  { a=[px,py+res*getT(v0,v3)];         b=[px+res,py+res*getT(v1,v2)]; }
            else if (state===6||state===9)   { a=[px+res*getT(v0,v1),py];         b=[px+res*getT(v3,v2),py+res]; }
            else if (state===5) {
                ctx.moveTo(px,py+res*getT(v0,v3)); ctx.lineTo(px+res*getT(v0,v1),py);
                ctx.moveTo(px+res*getT(v3,v2),py+res); ctx.lineTo(px+res,py+res*getT(v1,v2));
            } else if (state===10) {
                ctx.moveTo(px+res*getT(v0,v1),py); ctx.lineTo(px+res,py+res*getT(v1,v2));
                ctx.moveTo(px,py+res*getT(v0,v3)); ctx.lineTo(px+res*getT(v3,v2),py+res);
            }
            if (a&&b) { ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); }
        }
    }
    ctx.stroke();
    ctx.setLineDash([]);
}

// Shared resolution for potential grid (used by both nodal and equipotentials).
const GRID_RES = 14;

// Pre-allocated segment buffers for drawEquipotentials — avoids per-frame Float32Array allocation.
const _MAX_LEVELS = 40;
const _segBufs = Array.from({length: _MAX_LEVELS}, () => new Float32Array(8192));
const _segNs   = new Int32Array(_MAX_LEVELS);

function buildPotentialGrid() {
    const cols = Math.ceil(width / GRID_RES);
    const rows = Math.ceil(height / GRID_RES);
    const w1 = cols + 1;
    const vals = new Float32Array(w1 * (rows + 1));
    const n = charges.length;
    // Cache charge data in flat typed arrays for better cache locality.
    const cx = new Float32Array(n), cy = new Float32Array(n), cq = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        cx[i] = charges[i].x; cy[i] = charges[i].y;
        cq[i] = charges[i].sign * charges[i].q;
    }
    for (let r = 0; r <= rows; r++) {
        const py = r * GRID_RES, base = r * w1;
        for (let c = 0; c <= cols; c++) {
            const px = c * GRID_RES;
            let V = 0;
            for (let i = 0; i < n; i++) {
                const dx = px - cx[i], dy = py - cy[i];
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist >= 1) V += cq[i] / dist;
            }
            vals[base + c] = V;
        }
    }
    return {vals, cols, rows};
}

function drawNodalLines(grid) {
    if (!showNodalLines || charges.length === 0 || !grid) return;
    marchingSquares(grid.vals, grid.cols, grid.rows, GRID_RES, 0, 'rgba(0,255,255,0.6)', [5,5]);
}

function drawEquipotentials(grid) {
    if (!showEquipotentials || charges.length === 0 || !grid) return;
    const {vals, cols, rows} = grid;

    // Percentile-clip to avoid singularities near charges.
    const fl = vals.length;
    let finite = [], fi = 0;
    for (let i = 0; i < fl; i++) {
        const v = vals[i];
        if (isFinite(v) && v < 1e7 && v > -1e7) finite[fi++] = v;
    }
    if (fi < 10) return;
    finite.length = fi;
    finite.sort((a, b) => a - b);
    const vMin = finite[fi * 0.08 | 0], vMax = finite[fi * 0.92 | 0];
    const range = vMax - vMin;
    if (range < 1e-6) return;

    // Build level descriptors using pre-allocated segment buffers.
    const numLevels = Math.round(linesPerCharge / 2);
    const levels = [];
    let bufIdx = 0;
    for (let i = 1; i < numLevels; i++) {
        const V = vMin + (i / numLevels) * range;
        if (Math.abs(V) < range * 0.02) continue;
        if (bufIdx >= _MAX_LEVELS) break;
        _segNs[bufIdx] = 0;
        levels.push({
            V,
            color:  V > 0 ? 'rgba(255,110,110,1.0)' : 'rgba(90,190,255,1.0)',
            shadow: V > 0 ? 'rgba(255,80,80,0.4)'   : 'rgba(60,160,255,0.4)',
            bi: bufIdx++,
        });
    }
    if (levels.length === 0) return;

    // Single grid pass — collect segments for every level simultaneously.
    const NL = levels.length, w1 = cols + 1;
    for (let ry = 0; ry < rows; ry++) {
        const py = ry * GRID_RES, base0 = ry * w1, base1 = (ry + 1) * w1;
        for (let rx = 0; rx < cols; rx++) {
            const v0 = vals[base0 + rx],     v1 = vals[base0 + rx + 1];
            const v2 = vals[base1 + rx + 1], v3 = vals[base1 + rx];
            const px = rx * GRID_RES;
            for (let li = 0; li < NL; li++) {
                const lv = levels[li], V = lv.V;
                const b0 = v0 >= V, b1 = v1 >= V, b2 = v2 >= V, b3 = v3 >= V;
                const state = (b0 ? 1 : 0) | (b1 ? 2 : 0) | (b2 ? 4 : 0) | (b3 ? 8 : 0);
                if (state === 0 || state === 15) continue;

                // Edge intersection points (computed lazily via switch).
                const R = GRID_RES;
                let ax, ay, bx, by, ax2, ay2, bx2, by2, two = false;
                switch (state) {
                    case  1: case 14: ax=px+R*(v0-V)/(v0-v1); ay=py;   bx=px;   by=py+R*(v0-V)/(v0-v3); break;
                    case  2: case 13: ax=px+R*(v0-V)/(v0-v1); ay=py;   bx=px+R; by=py+R*(v1-V)/(v1-v2); break;
                    case  4: case 11: ax=px+R*(v3-V)/(v3-v2); ay=py+R; bx=px+R; by=py+R*(v1-V)/(v1-v2); break;
                    case  8: case  7: ax=px+R*(v3-V)/(v3-v2); ay=py+R; bx=px;   by=py+R*(v0-V)/(v0-v3); break;
                    case  3: case 12: ax=px;                  ay=py+R*(v0-V)/(v0-v3); bx=px+R; by=py+R*(v1-V)/(v1-v2); break;
                    case  6: case  9: ax=px+R*(v0-V)/(v0-v1); ay=py;   bx=px+R*(v3-V)/(v3-v2); by=py+R; break;
                    case  5:
                        ax=px; ay=py+R*(v0-V)/(v0-v3); bx=px+R*(v0-V)/(v0-v1); by=py;
                        ax2=px+R*(v3-V)/(v3-v2); ay2=py+R; bx2=px+R; by2=py+R*(v1-V)/(v1-v2); two=true; break;
                    case 10:
                        ax=px+R*(v0-V)/(v0-v1); ay=py; bx=px+R; by=py+R*(v1-V)/(v1-v2);
                        ax2=px; ay2=py+R*(v0-V)/(v0-v3); bx2=px+R*(v3-V)/(v3-v2); by2=py+R; two=true; break;
                    default: continue;
                }
                const bi = lv.bi;
                let ns = _segNs[bi];
                const buf = _segBufs[bi];
                if (ns + 8 <= buf.length) {
                    buf[ns]=ax; buf[ns+1]=ay; buf[ns+2]=bx; buf[ns+3]=by;
                    _segNs[bi] = ns + 4;
                    if (two && ns + 8 <= buf.length) {
                        ns += 4;
                        buf[ns]=ax2; buf[ns+1]=ay2; buf[ns+2]=bx2; buf[ns+3]=by2;
                        _segNs[bi] = ns + 4;
                    }
                }
            }
        }
    }

    // Stroke each level in one batched path.
    ctx.lineWidth = 1.2;
    ctx.setLineDash([]);
    ctx.shadowBlur = 3;
    for (let li = 0; li < NL; li++) {
        const lv = levels[li], bi = lv.bi, ns = _segNs[bi];
        if (ns === 0) continue;
        ctx.strokeStyle = lv.color;
        ctx.shadowColor = lv.shadow;
        ctx.beginPath();
        const s = _segBufs[bi];
        for (let i = 0; i < ns; i += 4) {
            ctx.moveTo(s[i], s[i+1]);
            ctx.lineTo(s[i+2], s[i+3]);
        }
        ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
}

function drawNullPoints() {
    if (!showNullPoints || charges.length < 2) return;
    const res = 15;
    const cols = Math.ceil(width / res);
    const rows = Math.ceil(height / res);
    const magSq = new Float32Array(cols * rows);
    // Use the same typed-array cache as traceLine if already built, else rebuild.
    if (_traceN !== charges.length) _buildTraceCache();
    for (let y = 0; y < rows; y++) {
        const py = y * res;
        for (let x = 0; x < cols; x++) {
            const px = x * res;
            let Ex = 0, Ey = 0;
            for (let i = 0; i < _traceN; i++) {
                const dx = px - _traceX[i], dy = py - _traceY[i];
                const distSq = dx*dx + dy*dy;
                if (distSq < 1) continue;
                const inv_r3 = _traceSQ[i] / (distSq * Math.sqrt(distSq));
                Ex += inv_r3 * dx; Ey += inv_r3 * dy;
            }
            magSq[y * cols + x] = Ex*Ex + Ey*Ey;
        }
    }
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 2.5;
    for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
            const val = magSq[y*cols + x];
            if (val < magSq[(y-1)*cols+(x-1)] && val < magSq[(y-1)*cols+x] &&
                val < magSq[(y-1)*cols+(x+1)] && val < magSq[y*cols+(x-1)] &&
                val < magSq[y*cols+(x+1)]     && val < magSq[(y+1)*cols+(x-1)] &&
                val < magSq[(y+1)*cols+x]     && val < magSq[(y+1)*cols+(x+1)]) {

                let px = x*res, py2 = y*res, step = res/2, mv = val;
                for (let iter = 0; iter < 15; iter++) {
                    let bx = px, by = py2;
                    const offsets = [step,0, -step,0, 0,step, 0,-step,
                                     step,step, -step,-step, step,-step, -step,step];
                    for (let k = 0; k < 16; k += 2) {
                        const tx = px+offsets[k], ty = py2+offsets[k+1];
                        let Ex2=0, Ey2=0;
                        for (let i=0; i<_traceN; i++) {
                            const dx=tx-_traceX[i], dy2=ty-_traceY[i];
                            const dSq=dx*dx+dy2*dy2; if(dSq<1) continue;
                            const inv=_traceSQ[i]/(dSq*Math.sqrt(dSq));
                            Ex2+=inv*dx; Ey2+=inv*dy2;
                        }
                        const m = Ex2*Ex2+Ey2*Ey2;
                        if (m < mv) { mv=m; bx=tx; by=ty; }
                    }
                    if (bx === px && by === py2) step /= 2;
                    else { px = bx; py2 = by; }
                }
                ctx.beginPath();
                ctx.moveTo(px-6, py2-6); ctx.lineTo(px+6, py2+6);
                ctx.moveTo(px+6, py2-6); ctx.lineTo(px-6, py2+6);
                ctx.stroke();
            }
        }
    }
}

function drawPointerField() {
    if (!showPointer) return;
    const E = getElectricField(pointerX, pointerY);
    const mag = Math.sqrt(E.x*E.x + E.y*E.y);
    if (mag < 1e-12) return;
    const len = Math.min(Math.max(Math.log10(mag+1)*15, 20), 80);
    const dx = (E.x/mag)*len, dy = (E.y/mag)*len;

    ctx.beginPath();
    ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 2;
    ctx.moveTo(pointerX, pointerY);
    ctx.lineTo(pointerX+dx, pointerY+dy);
    ctx.stroke();

    const angle = Math.atan2(dy, dx);
    ctx.beginPath(); ctx.fillStyle = '#ffeb3b';
    ctx.moveTo(pointerX+dx, pointerY+dy);
    ctx.lineTo(pointerX+dx-10*Math.cos(angle-Math.PI/6), pointerY+dy-10*Math.sin(angle-Math.PI/6));
    ctx.lineTo(pointerX+dx-10*Math.cos(angle+Math.PI/6), pointerY+dy-10*Math.sin(angle+Math.PI/6));
    ctx.fill();

    ctx.beginPath(); ctx.fillStyle='#fff';
    ctx.arc(pointerX, pointerY, 4, 0, 2*Math.PI); ctx.fill();
}

function drawGrid() {
    if (!showGrid) return;
    const sp = gridSpacingMeters * pixelsPerMeter;
    const cx = width/2+cameraX, cy = height/2+cameraY;

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    let sx = cx%sp; if (sx<0) sx+=sp;
    for (let x=sx; x<width; x+=sp) { ctx.moveTo(x,0); ctx.lineTo(x,height); }
    let sy = cy%sp; if (sy<0) sy+=sp;
    for (let y=sy; y<height; y+=sp) { ctx.moveTo(0,y); ctx.lineTo(width,y); }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.30)'; ctx.beginPath();
    if (cx>=0&&cx<=width)  { ctx.moveTo(cx,0);     ctx.lineTo(cx,height); }
    if (cy>=0&&cy<=height) { ctx.moveTo(0,cy);     ctx.lineTo(width,cy); }
    ctx.stroke();
}

// ─── Challenge mode ────────────────────────────────────────────────────────

let challengeActive = false;
let challengeTargetChargesPx = [];

function updateTargetChargePixels() {
    const cx = width/2+cameraX, cy = height/2+cameraY;
    for (let c of challengeTargetChargesPx) {
        c.x = c.x_m * pixelsPerMeter + cx;
        c.y = -c.y_m * pixelsPerMeter + cy;
    }
}

function startChallenge(lesson) {
    if (!lesson?.challenge) return;
    challengeActive = true;
    challengeTargetChargesPx = lesson.challenge.target_charges.map(c => ({...c, x:0, y:0}));
    updateTargetChargePixels();
    charges = [];
    cameraX = 0; cameraY = 0;
    updateChargePixels();
    document.getElementById('challengeDesc').textContent = lesson.challenge.description;
    document.getElementById('challengeBar').classList.remove('hidden');
    const sd = document.getElementById('scoreDisplay');
    sd.classList.add('hidden');
    sd.className = 'score-display hidden';
    scheduleRender();
}

function exitChallenge() {
    challengeActive = false;
    challengeTargetChargesPx = [];
    document.getElementById('challengeBar').classList.add('hidden');
    if (currentLesson) {
        loadLesson(currentLesson);
        // Reopen lesson panel so the student can continue
        document.getElementById('lessonPanel').classList.remove('hidden');
        document.getElementById('btnToggleLessons').classList.add('panel-open');
    }
    scheduleRender();
}

function evaluateChallenge() {
    const N = 18;
    const stepX = width/(N+1), stepY = height/(N+1);
    let total = 0, valid = 0;
    for (let i=1; i<=N; i++) {
        for (let j=1; j<=N; j++) {
            const px = i*stepX, py = j*stepY;
            // Copy first result before the second call overwrites _Eret.
            const uE = getElectricFieldForCharges(px, py, charges);
            const uEx = uE.x, uEy = uE.y;
            const tE = getElectricFieldForCharges(px, py, challengeTargetChargesPx);
            const um = Math.sqrt(uEx*uEx + uEy*uEy);
            const tm = Math.sqrt(tE.x*tE.x + tE.y*tE.y);
            if (um < 1e-10 || tm < 1e-10) continue;
            const cos = (uEx*tE.x + uEy*tE.y) / (um*tm);
            total += Math.max(0, cos);
            valid++;
        }
    }
    const score = valid > 0 ? Math.round(100*total/valid) : 0;
    document.getElementById('scoreValue').textContent = score;
    const sd = document.getElementById('scoreDisplay');
    sd.classList.remove('hidden', 'good', 'ok', 'poor');
    sd.classList.add(score>=80 ? 'good' : score>=60 ? 'ok' : 'poor');
    return score;
}

function drawTargetCharges() {
    if (!challengeActive || challengeTargetChargesPx.length===0) return;
    updateTargetChargePixels();
    for (let c of challengeTargetChargesPx) {
        const r = chargeRadiusBase + c.q*2;
        ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, 2*Math.PI);
        ctx.fillStyle   = c.sign>0 ? 'rgba(255,59,107,0.1)' : 'rgba(0,229,255,0.1)';
        ctx.strokeStyle = c.sign>0 ? 'rgba(255,59,107,0.5)' : 'rgba(0,229,255,0.5)';
        ctx.lineWidth = 2; ctx.setLineDash([4,4]);
        ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = c.sign>0 ? 'rgba(255,59,107,0.55)' : 'rgba(0,229,255,0.55)';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.font = 'bold 14px Inter';
        ctx.fillText(c.sign>0?'+':'−', c.x, c.y);
    }
}

// ─── Render ────────────────────────────────────────────────────────────────

// RAF debounce: coalesce rapid event-driven render() calls into one frame.
let _rafPending = false;
function scheduleRender() {
    if (_rafPending) return;
    _rafPending = true;
    requestAnimationFrame(() => { _rafPending = false; render(); });
}

function render() {
    if (width!==window.innerWidth || height!==window.innerHeight) {
        width=window.innerWidth; height=window.innerHeight;
        const dpr=window.devicePixelRatio||1;
        canvas.width=width*dpr; canvas.height=height*dpr;
        ctx.scale(dpr,dpr);
        updateChargePixels();
        if (challengeActive) updateTargetChargePixels();
    }
    ctx.clearRect(0, 0, width, height);
    drawGrid();
    drawTargetCharges();
    if (charges.length > 0 || challengeActive) {
        // During drag/pan skip expensive grid computations — keeps interaction fluid.
        // A full-quality render fires automatically 80 ms after the mouse is released.
        const heavy = !_interacting;
        const needGrid = heavy && (showEquipotentials || showNodalLines);
        const grid = needGrid ? buildPotentialGrid() : null;
        drawEquipotentials(grid);
        drawNodalLines(grid);
        drawFieldLines();
        if (heavy) drawNullPoints();
    }
    // Draw charges
    for (let c of charges) {
        const r = chargeRadiusBase + c.q*2;
        ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, 2*Math.PI);
        ctx.shadowBlur = 25;
        if (c.sign > 0) { ctx.fillStyle='#ff3b6b'; ctx.shadowColor='rgba(255,59,107,1)'; }
        else             { ctx.fillStyle='#00e5ff'; ctx.shadowColor='rgba(0,229,255,1)'; }
        ctx.fill(); ctx.shadowBlur=0;
        ctx.fillStyle = c.sign>0 ? '#fff' : '#0b0f19';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.font='bold 18px Inter';
        ctx.fillText(c.sign>0?'+':'−', c.x, c.y);
        ctx.font='600 12px Inter'; ctx.shadowBlur=4; ctx.shadowColor='rgba(0,0,0,0.8)';
        ctx.fillStyle='rgba(255,255,255,0.9)';
        ctx.fillText(`${c.sign>0?'+':'−'}${c.q} µC`, c.x, c.y+r+14);
        ctx.shadowBlur=0;
    }
    drawPointerField();
}

// ─── Lesson system ─────────────────────────────────────────────────────────

let currentLessonIndex = -1;
let currentLesson      = null;
let hintsRevealed      = 0;

const TOPIC_LABELS = {
    cargas_puntuales:        'Cargas puntuales',
    distribuciones_continuas:'Distribuciones continuas',
    principio_superposicion: 'Superposición',
    reto_diseno:             'Reto de diseño',
};

function initLessons() {
    if (!window.LESSONS?.length) return;
    const listEl = document.getElementById('lessonList');
    window.LESSONS.forEach((lesson, idx) => {
        const item = document.createElement('div');
        item.className = 'lesson-item';
        item.dataset.idx = idx;
        const stars = '★'.repeat(lesson.difficulty) + '☆'.repeat(4-lesson.difficulty);
        item.innerHTML = `
            <span class="lesson-item-id">${lesson.id}</span>
            <div style="flex:1">
                <div class="topic-badge">${TOPIC_LABELS[lesson.topic]||lesson.topic}</div>
                <div class="lesson-item-title">${lesson.title}</div>
            </div>
            <span class="lesson-difficulty" title="Dificultad">${stars}</span>
        `;
        item.addEventListener('click', () => selectLesson(idx));
        listEl.appendChild(item);
    });
}

function selectLesson(idx) {
    currentLessonIndex = idx;
    currentLesson = window.LESSONS[idx];
    hintsRevealed = 0;
    document.querySelectorAll('.lesson-item').forEach((el,i) => el.classList.toggle('active', i===idx));
    loadLesson(currentLesson);
    showLessonDetail(currentLesson);
}

function loadLesson(lesson) {
    charges = lesson.charges.map(c => ({...c, x:0, y:0}));
    const s = lesson.settings;
    pixelsPerMeter = s.zoom;
    linesPerCharge = s.lineDensity;
    showNodalLines     = s.showNodalLines;
    showNullPoints     = s.showNullPoints;
    showEquipotentials = s.showEquipotentials ?? false;

    zoomSlider.value    = pixelsPerMeter; zoomValue.textContent    = pixelsPerMeter;
    densitySlider.value = linesPerCharge; densityValue.textContent = linesPerCharge;
    nodalCheckbox.checked = showNodalLines;
    nullCheckbox.checked  = showNullPoints;
    equipCheckbox.checked = showEquipotentials;

    cameraX = 0; cameraY = 0;
    updateChargePixels();
    scheduleRender();
}

function showLessonDetail(lesson) {
    const detail = document.getElementById('lessonDetail');
    detail.classList.remove('hidden');
    document.getElementById('lessonDetailId').textContent        = lesson.id;
    document.getElementById('lessonDetailTitle').textContent     = lesson.title;
    document.getElementById('lessonDetailObjective').textContent = lesson.objective;
    document.getElementById('lessonDetailTheory').textContent    = lesson.theory;

    ['theoryBody','hintsBody','questionsBody'].forEach(id =>
        document.getElementById(id).classList.add('hidden'));

    const hintsList = document.getElementById('lessonDetailHints');
    hintsList.innerHTML = '';
    lesson.hints.forEach((h,i) => {
        const li = document.createElement('li');
        li.textContent = h;
        if (i===0) li.classList.add('revealed');
        hintsList.appendChild(li);
    });
    hintsRevealed = 1;
    updateHintBtn();

    const qList = document.getElementById('lessonDetailQuestions');
    qList.innerHTML = '';
    lesson.questions.forEach(q => {
        const li = document.createElement('li'); li.textContent = q; qList.appendChild(li);
    });

    document.getElementById('challengeSection').classList.toggle('hidden', !lesson.challenge);
    document.getElementById('btnPrevLesson').disabled = currentLessonIndex === 0;
    document.getElementById('btnNextLesson').disabled = currentLessonIndex === window.LESSONS.length-1;

    // Scroll panel so the detail section is visible
    requestAnimationFrame(() => {
        const panel  = document.getElementById('lessonPanel');
        const detail = document.getElementById('lessonDetail');
        panel.scrollTo({ top: detail.offsetTop - 12, behavior: 'smooth' });
    });
}

function updateHintBtn() {
    const btn = document.getElementById('btnNextHint');
    const all = currentLesson?.hints.length ?? 0;
    btn.disabled = hintsRevealed >= all;
    btn.textContent = hintsRevealed >= all ? 'Todas las pistas mostradas' : 'Siguiente pista';
}

function revealNextHint() {
    if (!currentLesson || hintsRevealed >= currentLesson.hints.length) return;
    document.getElementById('lessonDetailHints').children[hintsRevealed]?.classList.add('revealed');
    hintsRevealed++;
    updateHintBtn();
}

// ─── Lesson panel events ───────────────────────────────────────────────────

function initLessonPanelEvents() {
    const toggleBtn  = document.getElementById('btnToggleLessons');
    const panel      = document.getElementById('lessonPanel');
    const closeBtn   = document.getElementById('btnCloseLessons');
    const closeLsn   = document.getElementById('btnCloseLesson');
    const prevBtn    = document.getElementById('btnPrevLesson');
    const nextBtn    = document.getElementById('btnNextLesson');
    const hintBtn    = document.getElementById('btnNextHint');
    const startChBtn = document.getElementById('btnStartChallenge');
    const evalBtn    = document.getElementById('btnEvaluate');
    const exitChBtn  = document.getElementById('btnExitChallenge');

    function openPanel() {
        panel.classList.remove('hidden');
        toggleBtn.classList.add('panel-open');
    }
    function closePanel() {
        panel.classList.add('hidden');
        toggleBtn.classList.remove('panel-open');
    }

    toggleBtn.addEventListener('click', openPanel);
    closeBtn.addEventListener('click', closePanel);

    closeLsn.addEventListener('click', () => {
        document.getElementById('lessonDetail').classList.add('hidden');
        document.querySelectorAll('.lesson-item').forEach(el => el.classList.remove('active'));
        currentLesson = null; currentLessonIndex = -1;
    });

    prevBtn.addEventListener('click', () => { if (currentLessonIndex>0) selectLesson(currentLessonIndex-1); });
    nextBtn.addEventListener('click', () => {
        if (currentLessonIndex < window.LESSONS.length-1) selectLesson(currentLessonIndex+1);
    });

    hintBtn.addEventListener('click', () => {
        document.getElementById('hintsBody').classList.remove('hidden');
        revealNextHint();
    });

    startChBtn.addEventListener('click', () => {
        if (currentLesson) startChallenge(currentLesson);
        closePanel();
    });

    evalBtn.addEventListener('click', evaluateChallenge);
    exitChBtn.addEventListener('click', exitChallenge);

    // Collapsibles
    document.querySelectorAll('.collapsible-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = document.getElementById(btn.dataset.target);
            if (!target) return;
            const open = !target.classList.contains('hidden');
            target.classList.toggle('hidden', open);
            const arrow = open ? '▼' : '▲';
            btn.textContent = btn.textContent.replace(/[▼▲]/g, arrow);
        });
    });
}
