const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

const GATE_WIDTH = 90, GATE_HEIGHT = 60, INPUT_WIDTH = 60, INPUT_HEIGHT = 40, OUTPUT_WIDTH = 60, OUTPUT_HEIGHT = 40;
const gates = [];
const connections = [];
let draggingGate = null, offsetX = 0, offsetY = 0;
let selectedGateType = 'AND';
let connecting = null; // {gateIdx, port: 'out'|'inA'|'inB'}
let selectedGate = null; // indeks zaznaczonego elementu

const gateTypes = {
    INPUT: {inputs: 0, outputs: 1},
    OUTPUT: {inputs: 1, outputs: 0},
    NOT: {inputs: 1, outputs: 1},
    AND: {inputs: 2, outputs: 1},
    OR: {inputs: 2, outputs: 1},
    EXOR: {inputs: 2, outputs: 1},
    NAND: {inputs: 2, outputs: 1},
    NOR: {inputs: 2, outputs: 1},
    EXNOR: {inputs: 2, outputs: 1}
};

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw connections (white cable)
    connections.forEach(conn => {
        const from = gates[conn.from.gate];
        const to = gates[conn.to.gate];
        if (!from || !to) return;
        const outPos = getPortPos(from, conn.from.port);
        const inPos = getPortPos(to, conn.to.port);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(outPos.x, outPos.y);
        // Kabel z łukiem
        const midX = (outPos.x + inPos.x) / 2;
        ctx.bezierCurveTo(midX, outPos.y, midX, inPos.y, inPos.x, inPos.y);
        ctx.stroke();
    });
    // Draw gates
    gates.forEach((gate, idx) => {
        drawGateSymbolic(gate, idx, idx === selectedGate);
    });
}

function drawGateSymbolic(gate, idx, isSelected) {
    ctx.save();
    ctx.translate(gate.x, gate.y);

    let w = GATE_WIDTH, h = GATE_HEIGHT;
    if (gate.type === 'INPUT') { w = INPUT_WIDTH; h = INPUT_HEIGHT; }
    if (gate.type === 'OUTPUT') { w = OUTPUT_WIDTH; h = OUTPUT_HEIGHT; }
    if (isSelected) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 4;
        ctx.strokeRect(-6, -6, w+12, h+12);
    }

    // Styl bramki
    ctx.shadowColor = "#222";
    ctx.shadowBlur = 8;

    // --- Rysowanie symboli bramek ---
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.fillStyle = "#222";
    switch (gate.type) {
        case 'AND':
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(w * 0.55, 0);
            ctx.arc(w * 0.55, h / 2, h / 2, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;
        case 'OR':
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(w * 0.18, h / 2, 0, h);
            ctx.quadraticCurveTo(w * 0.45, h / 2, 0, 0);
            ctx.moveTo(0, 0);
            ctx.lineTo(w * 0.7, 0);
            ctx.quadraticCurveTo(w, h / 2, w * 0.7, h);
            ctx.lineTo(0, h);
            ctx.stroke();
            ctx.fill();
            break;
        case 'NOT':
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(w, h / 2);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(w + 14, h / 2, 8, 0, 2 * Math.PI);
            ctx.fillStyle = "#222";
            ctx.fill();
            ctx.stroke();
            break;
        case 'NAND':
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(w * 0.55, 0);
            ctx.arc(w * 0.55, h / 2, h / 2, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(w + 14, h / 2, 8, 0, 2 * Math.PI);
            ctx.fillStyle = "#222";
            ctx.fill();
            ctx.stroke();
            break;
        case 'NOR':
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(w * 0.18, h / 2, 0, h);
            ctx.quadraticCurveTo(w * 0.45, h / 2, 0, 0);
            ctx.moveTo(0, 0);
            ctx.lineTo(w * 0.7, 0);
            ctx.quadraticCurveTo(w, h / 2, w * 0.7, h);
            ctx.lineTo(0, h);
            ctx.stroke();
            ctx.fill();
            ctx.beginPath();
            ctx.arc(w + 14, h / 2, 8, 0, 2 * Math.PI);
            ctx.fillStyle = "#222";
            ctx.fill();
            ctx.stroke();
            break;
        case 'EXOR':
            ctx.beginPath();
            ctx.moveTo(-14, 0);
            ctx.quadraticCurveTo(w * 0.09, h / 2, -14, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(w * 0.18, h / 2, 0, h);
            ctx.quadraticCurveTo(w * 0.45, h / 2, 0, 0);
            ctx.moveTo(0, 0);
            ctx.lineTo(w * 0.7, 0);
            ctx.quadraticCurveTo(w, h / 2, w * 0.7, h);
            ctx.lineTo(0, h);
            ctx.stroke();
            ctx.fill();
            break;
        case 'EXNOR':
            ctx.beginPath();
            ctx.moveTo(-14, 0);
            ctx.quadraticCurveTo(w * 0.09, h / 2, -14, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(w * 0.18, h / 2, 0, h);
            ctx.quadraticCurveTo(w * 0.45, h / 2, 0, 0);
            ctx.moveTo(0, 0);
            ctx.lineTo(w * 0.7, 0);
            ctx.quadraticCurveTo(w, h / 2, w * 0.7, h);
            ctx.lineTo(0, h);
            ctx.stroke();
            ctx.fill();
            ctx.beginPath();
            ctx.arc(w + 14, h / 2, 8, 0, 2 * Math.PI);
            ctx.fillStyle = "#222";
            ctx.fill();
            ctx.stroke();
            break;
    }

    // --- Porty wejściowe/wyjściowe ---
    const inputs = gateTypes[gate.type].inputs;
    for (let i = 0; i < inputs; i++) {
        let val = (gate.inputs && typeof gate.inputs[i] !== 'undefined') ? gate.inputs[i] : null;
        ctx.beginPath();
        ctx.arc(0, 15 + i * 30, 10, 0, 2 * Math.PI);
        ctx.fillStyle = val === 1 ? "#0f0" : (val === 0 ? "#f00" : "#888");
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 15px monospace";
        ctx.fillText(val !== null ? val : "?", -22, 20 + i * 30);
        ctx.font = "bold 12px monospace";
        ctx.fillText(i === 0 ? "A" : "B", -22, 10 + i * 30);
    }
    // Output port
    let outVal = typeof gate.output !== 'undefined' ? gate.output : null;
    ctx.beginPath();
    ctx.arc(w, h / 2, 10, 0, 2 * Math.PI);
    ctx.fillStyle = outVal === 1 ? "#0f0" : (outVal === 0 ? "#f00" : "#888");
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 15px monospace";
    ctx.fillText(outVal !== null ? outVal : "?", w + 18, h / 2 + 6);
    ctx.font = "bold 12px monospace";
    ctx.fillText("OUT", w + 18, h / 2 - 10);

    // --- INPUT/OUTPUT bloki ---
    if (gate.type === 'INPUT') {
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#333";
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(0, 0, INPUT_WIDTH, INPUT_HEIGHT);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.fillText("IN", INPUT_WIDTH / 2, INPUT_HEIGHT / 2 - 2);
        ctx.fillStyle = gate.value ? "#0f0" : "#f00";
        ctx.font = "bold 18px monospace";
        ctx.fillText(gate.value ? "1" : "0", INPUT_WIDTH / 2, INPUT_HEIGHT / 2 + 18);
        ctx.beginPath();
        ctx.arc(INPUT_WIDTH, INPUT_HEIGHT / 2, 10, 0, 2 * Math.PI);
        ctx.fillStyle = gate.value ? "#0f0" : "#f00";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.stroke();
    }
    if (gate.type === 'OUTPUT') {
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#333";
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.fillText("OUT", OUTPUT_WIDTH / 2, OUTPUT_HEIGHT / 2 - 2);
        ctx.fillStyle = gate.inputVal ? "#0f0" : "#f00";
        ctx.font = "bold 18px monospace";
        ctx.fillText(typeof gate.inputVal !== 'undefined' ? (gate.inputVal ? "1" : "0") : "?", OUTPUT_WIDTH / 2, OUTPUT_HEIGHT / 2 + 18);
        ctx.beginPath();
        ctx.arc(0, OUTPUT_HEIGHT / 2, 10, 0, 2 * Math.PI);
        ctx.fillStyle = gate.inputVal === 1 ? "#0f0" : (gate.inputVal === 0 ? "#f00" : "#888");
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.stroke();
    }

    ctx.restore();
}

function getPortPos(gate, port) {
    if (gate.type === 'INPUT') {
        if (port === 'out') return {x: gate.x + INPUT_WIDTH, y: gate.y + INPUT_HEIGHT/2};
        return {x: gate.x, y: gate.y};
    }
    if (gate.type === 'OUTPUT') {
        if (port === 'inA') return {x: gate.x, y: gate.y + OUTPUT_HEIGHT/2};
        return {x: gate.x, y: gate.y};
    }
    if (port === 'out') return {x: gate.x + GATE_WIDTH, y: gate.y + GATE_HEIGHT/2};
    if (port === 'inA') return {x: gate.x, y: gate.y + 15};
    if (port === 'inB') return {x: gate.x, y: gate.y + 45};
    return {x: gate.x, y: gate.y};
}

canvas.addEventListener('mousedown', e => {
    const {offsetX: mx, offsetY: my} = e;
    selectedGate = null;
    // Check gate drag & select
    for (let i=gates.length-1; i>=0; i--) {
        const g = gates[i];
        let w = g.type === 'INPUT' ? INPUT_WIDTH : (g.type === 'OUTPUT' ? OUTPUT_WIDTH : GATE_WIDTH);
        let h = g.type === 'INPUT' ? INPUT_HEIGHT : (g.type === 'OUTPUT' ? OUTPUT_HEIGHT : GATE_HEIGHT);
        if (mx > g.x && mx < g.x+w && my > g.y && my < g.y+h) {
            draggingGate = i;
            offsetX = mx - g.x;
            offsetY = my - g.y;
            selectedGate = i;
            // Toggle input value if input block
            if (g.type === 'INPUT') {
                if (mx > g.x && mx < g.x+w && my > g.y && my < g.y+h) {
                    g.value = g.value ? 0 : 1;
                    propagateSignals();
                    drawBoard();
                    return;
                }
            }
            drawBoard();
            return;
        }
    }
    // Check port click for connection
    for (let i=gates.length-1; i>=0; i--) {
        const g = gates[i];
        // Output
        let out = getPortPos(g, 'out');
        if (distance(mx, my, out.x, out.y) < 12) {
            connecting = {gate: i, port: 'out'};
            return;
        }
        // Inputs
        if (g.type !== 'INPUT') {
            if (gateTypes[g.type].inputs >= 1) {
                let inA = getPortPos(g, 'inA');
                if (distance(mx, my, inA.x, inA.y) < 12) {
                    if (connecting && connecting.port === 'out') {
                        connections.push({from: connecting, to: {gate: i, port: 'inA'}});
                        connecting = null;
                        propagateSignals();
                        drawBoard();
                    } else {
                        connecting = {gate: i, port: 'inA'};
                    }
                    return;
                }
            }
            if (gateTypes[g.type].inputs === 2) {
                let inB = getPortPos(g, 'inB');
                if (distance(mx, my, inB.x, inB.y) < 12) {
                    if (connecting && connecting.port === 'out') {
                        connections.push({from: connecting, to: {gate: i, port: 'inB'}});
                        connecting = null;
                        propagateSignals();
                        drawBoard();
                    } else {
                        connecting = {gate: i, port: 'inB'};
                    }
                    return;
                }
            }
        }
        // OUTPUT input
        if (g.type === 'OUTPUT') {
            let inA = getPortPos(g, 'inA');
            if (distance(mx, my, inA.x, inA.y) < 12) {
                if (connecting && connecting.port === 'out') {
                    connections.push({from: connecting, to: {gate: i, port: 'inA'}});
                    connecting = null;
                    propagateSignals();
                    drawBoard();
                } else {
                    connecting = {gate: i, port: 'inA'};
                }
                return;
            }
        }
    }
});

canvas.addEventListener('mousemove', e => {
    if (draggingGate !== null) {
        const {offsetX: mx, offsetY: my} = e;
        let g = gates[draggingGate];
        let w = g.type === 'INPUT' ? INPUT_WIDTH : (g.type === 'OUTPUT' ? OUTPUT_WIDTH : GATE_WIDTH);
        let h = g.type === 'INPUT' ? INPUT_HEIGHT : (g.type === 'OUTPUT' ? OUTPUT_HEIGHT : GATE_HEIGHT);
        g.x = mx - offsetX;
        g.y = my - offsetY;
        drawBoard();
    }
});

canvas.addEventListener('mouseup', e => {
    draggingGate = null;
});

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x1-x2)**2 + (y1-y2)**2);
}

// Toolbar logic
document.querySelectorAll('.toolbar button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.toolbar button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedGateType = btn.dataset.gate;
    });
});

// Add gate on board double click
canvas.addEventListener('dblclick', e => {
    const {offsetX: mx, offsetY: my} = e;
    if (selectedGateType === 'INPUT') {
        gates.push({
            type: 'INPUT',
            x: mx - INPUT_WIDTH/2,
            y: my - INPUT_HEIGHT/2,
            value: 1 // domyślnie 1
        });
    } else if (selectedGateType === 'OUTPUT') {
        gates.push({
            type: 'OUTPUT',
            x: mx - OUTPUT_WIDTH/2,
            y: my - OUTPUT_HEIGHT/2,
            inputVal: undefined
        });
    } else {
        gates.push({
            type: selectedGateType,
            x: mx - GATE_WIDTH/2,
            y: my - GATE_HEIGHT/2,
            inputs: [],
            output: undefined
        });
    }
    propagateSignals();
    drawBoard();
});

// Propagate signals through connections
function propagateSignals() {
    // Reset all gate inputs/outputs except INPUT/OUTPUT
    gates.forEach(g => {
        if (g.type !== 'INPUT' && g.type !== 'OUTPUT') {
            g.inputs = [];
            g.output = undefined;
        }
        if (g.type === 'OUTPUT') {
            g.inputVal = undefined;
        }
    });

    // Set outputs for INPUT gates
    gates.forEach((g, idx) => {
        if (g.type === 'INPUT') {
            g.output = g.value;
        }
    });

    // Propagate signals (simple forward, not recursive)
    // Repeat a few times to propagate through chains
    for (let step = 0; step < 5; step++) {
        connections.forEach(conn => {
            const fromGate = gates[conn.from.gate];
            const toGate = gates[conn.to.gate];
            if (!fromGate || !toGate) return;
            let val = fromGate.type === 'OUTPUT' ? fromGate.inputVal : fromGate.output;
            if (typeof val === 'undefined') return;
            if (toGate.type === 'OUTPUT') {
                toGate.inputVal = val;
            } else {
                if (!toGate.inputs) toGate.inputs = [];
                if (conn.to.port === 'inA') toGate.inputs[0] = val;
                if (conn.to.port === 'inB') toGate.inputs[1] = val;
            }
        });
        // Calculate outputs for gates
        gates.forEach(g => {
            if (g.type !== 'INPUT' && g.type !== 'OUTPUT') {
                g.output = evalGate(g.type, g.inputs);
            }
        });
    }
}

function evalGate(type, inputs) {
    if (!inputs) return undefined;
    switch(type) {
        case 'NOT': return inputs[0] === 0 ? 1 : 0;
        case 'AND': return (inputs[0] === 1 && inputs[1] === 1) ? 1 : 0;
        case 'OR': return (inputs[0] === 1 || inputs[1] === 1) ? 1 : 0;
        case 'EXOR': return (inputs[0] !== inputs[1]) ? 1 : 0;
        case 'NAND': return (inputs[0] === 1 && inputs[1] === 1) ? 0 : 1;
        case 'NOR': return (inputs[0] === 1 || inputs[1] === 1) ? 0 : 1;
        case 'EXNOR': return (inputs[0] === inputs[1]) ? 1 : 0;
        default: return undefined;
    }
}

// Dodaj przycisk INPUT i OUTPUT do toolbar
(function addToolbarButtons() {
    const toolbar = document.querySelector('.toolbar');
    if (!toolbar.querySelector('[data-gate="INPUT"]')) {
        const btn = document.createElement('button');
        btn.textContent = 'INPUT';
        btn.setAttribute('data-gate', 'INPUT');
        toolbar.insertBefore(btn, toolbar.firstChild);
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toolbar button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedGateType = 'INPUT';
        });
    }
    if (!toolbar.querySelector('[data-gate="OUTPUT"]')) {
        const btn = document.createElement('button');
        btn.textContent = 'OUTPUT';
        btn.setAttribute('data-gate', 'OUTPUT');
        toolbar.appendChild(btn);
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toolbar button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedGateType = 'OUTPUT';
        });
    }
})();

// Initial draw
propagateSignals();
drawBoard();