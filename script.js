const Config = {
    fitts_a: 50.0, fitts_b: 150.0, target_width: 20.0,
    undershoot_min: 0.92, undershoot_max: 0.97,
    peak_time_ratio: 0.35, primary_sigma_min: 0.18, primary_sigma_max: 0.28,
    overshoot_prob: 0.15, overshoot_min: 1.02, overshoot_max: 1.08,
    correction_sigma_min: 0.12, correction_sigma_max: 0.20,
    curvature_scale: 0.025, ou_theta: 3.5, ou_sigma: 1.2,
    tremor_freq_low: 8.0, tremor_freq_high: 12.0, 
    tremor_amp_low: 0.15, tremor_amp_high: 0.55,
    sdn_k: 0.04, sample_dt_mean: 7.8, gamma_shape: 3.5
};

const CategorizedSliders = [
    {
        category: "Task Geometry",
        sliders: [
            { key: 'fitts_a', min: 0, max: 200, step: 1, label: 'Fitts Constant (a)', tooltip: 'The start-up time. High values simulate lower reaction time before the hand begins moving.' },
            { key: 'fitts_b', min: 50, max: 400, step: 1, label: 'Index of Difficulty (b)', tooltip: 'How much the speed drops as distance increases. high values make long-range flicks much slower.' },
            { key: 'target_width', min: 5, max: 100, step: 1, label: 'Effective Target Width', tooltip: 'How precise the brain thinks the target is. Smaller widths cause more cautious, slower deceleration.' },
        ], 
    },
    {
        category: "Kinematic Theory (Sigma-Log)",
        sliders: [
            { key: 'peak_time_ratio', min: 0.1, max: 0.8, step: 0.01, label: 'Velocity Peak Location', tooltip: 'Shifts the maximum speed. Low values (0.2) create a sudden burst; high values (0.6) create a slow ramp up.' },
            { key: 'primary_sigma_min', min: 0.05, max: 0.5, step: 0.01, label: 'Stroke Asymmetry Min', tooltip: 'Controls jerkiness. Higher variance makes the acceleration/deceleration feel less robotic and more organic.' },
            { key: 'primary_sigma_max', min: 0.05, max: 0.5, step: 0.01, label: 'Stroke Asymmetry Max', tooltip: 'Controls jerkiness. Higher variance makes the acceleration/deceleration feel less robotic and more organic.' },
            { key: 'curvature_scale', min: 0, max: 0.1, step: 0.001, label: 'Biomechanical Curvature', tooltip: 'Simulates the natural arc of the human wrist/eblow. Higher values produce more pronounced "bowing" in the path.' },
        ]
    },
    {
        category: "Surge Architecture",
        sliders: [
            { key: 'overshoot_prob', min: 0, max: 1, step: 0.01, label: 'Overshoot Probability', tooltip: 'The chance (0-1) that the initial movement flies past the target, requiring a correcting flick in the opposite direction.' },
            { key: 'undershoot_min', min: 0.5, max: 1, step: 0.01, label: 'Ballistic Reach Min', tooltip: 'The distance the cursor will travel in its first burst.' },
            { key: 'undershoot_max', min: 0.5, max: 1.1, step: 0.01, label: 'Ballistic Reach Max', tooltip: 'The distance the cursor will travel in its first burst.' },
        ]
    },
    {
        category: "Stochastic Noise (OU/HW)",
        sliders: [
            { key: 'ou_theta', min: 0, max: 10, step: 0.1, label: 'Mean Reversion (Theta)', tooltip: 'How agressively the cursor tries to stay on the intended path. Higher values cause stiffer movement.' },
            { key: 'ou_sigma', min: 0, max: 5, step: 0.1, label: 'Lateral Diffusion (Sigma)', tooltip: 'Random drift or shakiness away from the path. Simulates external noise or hand instability.' },
            { key: 'tremor_freq_low', min: 1, max: 20, step: 0.5, label: 'Tremor Lower Bound', tooltip: 'High-frequency micro-shaking. Simulates the physical limits of human muscle fibers.' },
            { key: 'tremor_freq_high', min: 1, max: 20, step: 0.5, label: 'Tremor Upper Bound', tooltip: 'High-frequency micro-shaking. Simulates the physical limits of human muscle fibers.' },
            { key: 'tremor_amp_high', min: 0, max: 2, step: 0.05, label: 'Tremor Amplitude Max', tooltip: 'High-frequency micro-shaking. Simulates the physical limits of human muscle fibers.' },
        ]
    },
    {
        category: "Temporal Dynamics",
        sliders: [
            { key: 'sample_dt_mean', min: 1, max: 30, step: 0.1, label: 'Mean Polling Rate', tooltip: 'The average time between cursor updates. Lower values create a smooth, high-frequency path, while higher values simulate a choppier, low-polling rate device.' },
            { key: 'gamma_shape', min: 1, max: 10, step: 0.1, label: 'Inter-Sample Jitter', tooltip: 'Simulates inconsistent PC performance or stuttery human input rather than a perfect equally-spaced stream.' }
        ]
    }
];

function initSliders() {
    const container = document.getElementById('controls');
    CategorizedSliders.forEach(cat => {
        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerText = cat.category;
        container.appendChild(header);

        cat.sliders.forEach(def => {
            const row = document.createElement('div');
            row.className = 'slider-row';
            row.innerHTML = `
                <div class="slider-label">
                    <span>
                        ${def.label} 
                        <span class="tooltip-trigger" data-tooltip="${def.tooltip || ''}">?</span>
                    </span>
                    <span id="val-${def.key}">${Config[def.key]}</span>
                </div>
                <input type="range" min="${def.min}" max="${def.max}" step="${def.step}" value="${Config[def.key]}" data-key="${def.key}">
            `;
            container.appendChild(row);
        });
    });

    container.addEventListener('input', (e) => {
        const key = e.target.getAttribute('data-key');
        const val = parseFloat(e.target.value);
        Config[key] = val;
        document.getElementById(`val-${key}`).innerText = val.toFixed(key.includes('sigma') || key.includes('prob') || key.includes('scale') ? 3 : 1);
        if (key === 'target_width') state.tw = val;
    });
}

const MathUtils = {
    erf: (x) => {
        const a1 =  0.254829592, a2 = -0.284496736, a3 =  1.421413741;
        const a4 = -1.453152027, a5 =  1.061405429, p  =  0.3275911;
        const sign = (x < 0) ? -1 : 1;
        x = Math.abs(x);
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return sign * y;
    },
    normal_cdf: (x) => 0.5 * (1.0 + MathUtils.erf(x / Math.sqrt(2))),
    lognormal_cdf: (t, t0, mu, sigma) => (t <= t0) ? 0 : MathUtils.normal_cdf((Math.log(t - t0) - mu) / sigma),
    lognormal_pdf: (t, t0, mu, sigma) => {
        if (t <= t0) return 0;
        const dt = t - t0;
        const z = (Math.log(dt) - mu) / sigma;
        return 1.0 / (sigma * Math.sqrt(2 * Math.PI) * dt) * Math.exp(-0.5 * z * z);
    },
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
    rand: (min, max) => Math.random() * (max - min) + min,
    boxMuller: () => Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random()),
    gamma: (shape, scale) => {
        let d = shape - 1/3, c = 1 / Math.sqrt(9 * d);
        while (true) {
            let x, v, u = Math.random();
            do { x = MathUtils.boxMuller(); v = 1 + c * x; } while (v <= 0);
            v = v * v * v;
            if (u < 1 - 0.0331 * x * x * x * x) return d * v * scale;
            if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * scale;
        }
    }
};

const SigmaDrift = {
    generate: (x0, y0, x1, y1) => {
        const dx = x1 - x0, dy = y1 - y0;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const tx = dx / dist, ty = dy / dist;
        const nx = -ty, ny = tx;

        const id = Math.log2(dist / Config.target_width + 1.0);
        let mt = (Config.fitts_a + Config.fitts_b * id) * Math.exp(MathUtils.boxMuller() * 0.08);
        mt = Math.max(mt, 80);

        const overshoot = Math.random() < Config.overshoot_prob;
        const reach = overshoot ? MathUtils.rand(Config.overshoot_min, Config.overshoot_max) 
                                : MathUtils.rand(Config.undershoot_min, Config.undershoot_max);
        
        const primary_D = dist * reach;
        const primary_sigma = MathUtils.rand(Config.primary_sigma_min, Config.primary_sigma_max);
        const peak_t = mt * MathUtils.rand(Config.peak_time_ratio - 0.03, Config.peak_time_ratio + 0.03);
        const primary_mu = Math.log(peak_t) + primary_sigma * primary_sigma;

        const corrections = [];
        let remaining = dist - primary_D;
        if (Math.abs(remaining) > 0.5) {
            const dir = remaining > 0 ? 1 : -1;
            const cD = Math.abs(remaining) * MathUtils.rand(0.88, 1.02);
            const cS = MathUtils.rand(Config.correction_sigma_min, Config.correction_sigma_max);
            corrections.push({ 
                D: cD, t0: mt * MathUtils.rand(0.55, 0.68), 
                mu: Math.log(mt * MathUtils.rand(0.12, 0.18)) + cS * cS, sigma: cS, 
                dx: tx * dir, dy: ty * dir 
            });
        }

        const curv_amp = dist * Config.curvature_scale * (0.5 + 0.8 * Math.abs(Math.sin(angle))) * MathUtils.boxMuller();
        const tremor_freq = MathUtils.rand(Config.tremor_freq_low, Config.tremor_freq_high);
        const tremor_amp = MathUtils.rand(Config.tremor_amp_low, Config.tremor_amp_high);
        let ou_x = 0, ou_y = 0;

        const pts = [];
        const total_t = mt * 1.15;
        for (let t = 0; t < total_t + 15; ) {
            const dt_ms = MathUtils.clamp(MathUtils.gamma(Config.gamma_shape, Config.sample_dt_mean / Config.gamma_shape), 2, 25);
            const dt_s = dt_ms / 1000;
            
            const s = MathUtils.lognormal_cdf(t, 0, primary_mu, primary_sigma);
            let bx = x0 + tx * primary_D * s;
            let by = y0 + ty * primary_D * s;

            const curv_prof = (s > 0 && s < 1) ? (Math.pow(s, 2) * Math.pow(1 - s, 3)) / (0.16 * 0.216) : 0;
            bx += nx * curv_amp * curv_prof;
            by += ny * curv_amp * curv_prof;

            corrections.forEach(c => {
                const cs = MathUtils.lognormal_cdf(t, c.t0, c.mu, c.sigma);
                bx += c.dx * c.D * cs; by += c.dy * c.D * cs;
            });

            const speed = primary_D * MathUtils.lognormal_pdf(t, 0, primary_mu, primary_sigma);
            ou_x += -Config.ou_theta * ou_x * dt_s + Config.ou_sigma * Math.sqrt(dt_s) * MathUtils.boxMuller();
            ou_y += -Config.ou_theta * ou_y * dt_s + Config.ou_sigma * Math.sqrt(dt_s) * MathUtils.boxMuller();

            const trem_mod = 1.0 / (1.0 + speed * 0.3);
            bx += ou_x + tremor_amp * trem_mod * Math.sin(2 * Math.PI * tremor_freq * (t/1000));
            by += ou_y + tremor_amp * trem_mod * Math.sin(2 * Math.PI * tremor_freq * (t/1000) + 1);

            pts.push({ x: bx, y: by, t: t });
            t += dt_ms;
        }
        return pts;
    }
};

const WindMouse = {
    generate: (x0, y0, x1, y1) => {
        let xs = x0, ys = y0, vx = 0, vy = 0, wx = 0, wy = 0;
        let t = 0;
        const pts = [{x: xs, y: ys, t: 0}];
        const gravity = 9.0, wind_str = 3.0, target_area = 8.0;
        let step = 15.0;

        for (let i = 0; i < 2000; i++) {
            let dist = Math.hypot(x1 - xs, y1 - ys);
            if (dist < 1) break;

            let w = Math.min(wind_str, dist);
            if (dist >= target_area) {
                wx = wx / Math.sqrt(3) + (Math.random()*2*w - w) / Math.sqrt(5);
                wy = wy / Math.sqrt(3) + (Math.random()*2*w - w) / Math.sqrt(5);
            } else {
                wx /= Math.sqrt(3); wy /= Math.sqrt(3);
                step = (step < 3) ? MathUtils.rand(3, 6) : step / Math.sqrt(5);
            }

            vx += wx + gravity * (x1 - xs) / dist;
            vy += wy + gravity * (y1 - ys) / dist;
            let vmag = Math.hypot(vx, vy);
            if (vmag > step) {
                let r = step/2 + Math.random()*step/2;
                vx = (vx/vmag)*r; vy = (vy/vmag)*r;
            }
            xs += vx; ys += vy; t += MathUtils.rand(5, 15);
            pts.push({x: xs, y: ys, t: t});
        }
        return pts;
    }
};

const state = {
    sx: 150, sy: 200, ex: 600, ey: 200, tw: 20,
    algo: [], wind: [], human: [],
    animIdx: 0, isAnim: false, isRecording: false,
    startTime: 0
};

const mainCanvas = document.getElementById('mainCanvas');
const graphCanvas = document.getElementById('graphCanvas');
const ctx = mainCanvas.getContext('2d');
const gctx = graphCanvas.getContext('2d');

function resize() {
    const container = document.getElementById('canvas-container');
    mainCanvas.width = container.clientWidth;
    mainCanvas.height = container.clientHeight;
    graphCanvas.width = document.getElementById('graph-container').clientWidth;
    graphCanvas.height = 140;
    draw();
}

function computeMetrics(pts, tx, ty) {
    if (pts.length < 2) return null;
    let length = 0, maxSpd = 0;
    const speeds = [];
    for (let i = 1; i < pts.length; i++) {
        let d = Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y);
        let dt = pts[i].t - pts[i-1].t;
        let s = d / dt;
        length += d;
        speeds.push(s);
        if (s > maxSpd) maxSpd = s;
    }
    const straight = Math.hypot(tx - pts[0].x, ty - pts[0].y);
    const err = Math.hypot(pts[pts.length-1].x - tx, pts[pts.length-1].y - ty);
    
    let sub = 0;
    for(let i=1; i<speeds.length-1; i++) {
        if (speeds[i] > maxSpd * 0.15 && speeds[i] > speeds[i-1] && speeds[i] > speeds[i+1]) sub++;
    }

    return {
        mt: pts[pts.length-1].t - pts[0].t,
        eff: straight / length,
        peak: maxSpd,
        sub: Math.max(1, sub),
        err: err,
        fitts: Config.fitts_a + Config.fitts_b * Math.log2(straight / state.tw + 1)
    };
}

function drawPath(p, color, limit) {
    if (p.length < 2) return;
    const n = Math.min(limit || p.length, p.length);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p[0].x, p[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(p[i].x, p[i].y);
    ctx.stroke();
    
    ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
        ctx.beginPath(); ctx.arc(p[i].x, p[i].y, 1.5, 0, 7); ctx.fill();
    }
    
    if (n < p.length) {
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(p[n-1].x, p[n-1].y, 4, 0, 7); ctx.fill();
    }
}

function draw() {
    ctx.fillStyle = "#16161c";
    ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

    ctx.strokeStyle = "#282832";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    for(let x=0; x<mainCanvas.width; x+=100) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x, mainCanvas.height); ctx.stroke(); }
    for(let y=0; y<mainCanvas.height; y+=100) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(mainCanvas.width, y); ctx.stroke(); }
    ctx.setLineDash([]);

    ctx.fillStyle = "#00ff64";
    ctx.beginPath(); ctx.arc(state.sx, state.sy, 6, 0, 7); ctx.fill();
    ctx.strokeStyle = "#ffa500";
    ctx.beginPath(); ctx.arc(state.ex, state.ey, state.tw, 0, 7); ctx.stroke();

    drawPath(state.algo, "#6495ed", state.isAnim ? state.animIdx : null);
    drawPath(state.wind, "#ff6347");
    drawPath(state.human, "#22c850");
    
    drawGraphs();
}

function drawGraphs() {
    gctx.fillStyle = "#121216";
    gctx.fillRect(0, 0, graphCanvas.width, graphCanvas.height);

    const getAllSpeeds = (pts) => {
        const s = [];
        for(let i=1; i<pts.length; i++) {
            const dt = pts[i].t - pts[i-1].t;
            if (dt > 0) s.push({t: pts[i].t, v: Math.hypot(pts[i].x-pts[i-1].x, pts[i].y-pts[i-1].y)/dt});
        }
        return s;
    };

    const sAlgo = getAllSpeeds(state.algo);
    const sWind = getAllSpeeds(state.wind);
    const sHuman = getAllSpeeds(state.human);

    let maxT = 1000, maxV = 1.0;
    [sAlgo, sWind, sHuman].forEach(arr => arr.forEach(p => {
        if (p.t > maxT) maxT = p.t;
        if (p.v > maxV) maxV = p.v;
    }));

    const drawCurve = (samples, col) => {
        if (samples.length < 2) return;
        gctx.strokeStyle = col;
        gctx.beginPath();
        samples.forEach((p, i) => {
            const x = (p.t / maxT) * graphCanvas.width;
            const y = graphCanvas.height - (p.v / maxV) * (graphCanvas.height - 20);
            if (i === 0) gctx.moveTo(x, y); else gctx.lineTo(x, y);
        });
        gctx.stroke();
    };

    drawCurve(sAlgo, "#6495ed");
    drawCurve(sWind, "#ff6347");
    drawCurve(sHuman, "#22c850");
}

function updateMetricsUI() {
    const am = computeMetrics(state.algo, state.ex, state.ey);
    const wm = computeMetrics(state.wind, state.ex, state.ey);
    
    if (am) document.getElementById('algoMetrics').innerText = 
        `[SigmaDrift] MT=${am.mt.toFixed(0)}ms Fitts=${am.fitts.toFixed(0)}ms PL=${am.eff.toFixed(3)} Pk=${am.peak.toFixed(2)} Sub=${am.sub} Err=${am.err.toFixed(1)}px`;
    if (wm) document.getElementById('windMetrics').innerText = 
        `[WindMouse]  MT=${wm.mt.toFixed(0)}ms PL=${wm.eff.toFixed(3)} Pk=${wm.peak.toFixed(2)} Sub=${wm.sub} Err=${wm.err.toFixed(1)}px`;
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        state.algo = SigmaDrift.generate(state.sx, state.sy, state.ex, state.ey);
        state.isAnim = true; state.animIdx = 0; state.startTime = performance.now();
        updateMetricsUI();
    } else if (e.key.toLowerCase() === 'w') {
        state.wind = WindMouse.generate(state.sx, state.sy, state.ex, state.ey);
        updateMetricsUI();
    } else if (e.key.toLowerCase() === 'r') {
        state.isRecording = !state.isRecording;
        if (state.isRecording) { state.human = []; state.startTime = performance.now(); }
        document.getElementById('recordingTag').style.display = state.isRecording ? 'block' : 'none';
    } else if (e.key.toLowerCase() === 'c') {
        state.algo = []; state.wind = []; state.human = [];
    }
});

mainCanvas.addEventListener('mousedown', (e) => {
    const rect = mainCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (e.button === 0) { state.sx = x; state.sy = y; }
    else { state.ex = x; state.ey = y; }
    e.preventDefault();
});
mainCanvas.addEventListener('contextmenu', e => e.preventDefault());

mainCanvas.addEventListener('mousemove', (e) => {
    if (state.isRecording) {
        const rect = mainCanvas.getBoundingClientRect();
        state.human.push({ 
            x: e.clientX - rect.left, 
            y: e.clientY - rect.top, 
            t: performance.now() - state.startTime 
        });
    }
});

function loop() {
    if (state.isAnim) {
        const elapsed = performance.now() - state.startTime;
        while (state.animIdx < state.algo.length && state.algo[state.animIdx].t <= elapsed) state.animIdx++;
        if (state.animIdx >= state.algo.length) state.isAnim = false;
    }
    draw();
    requestAnimationFrame(loop);
}

window.addEventListener('resize', resize);
initSliders();
resize();
loop();
