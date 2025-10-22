const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

const GATE_WIDTH = 90, GATE_HEIGHT = 60, INPUT_WIDTH = 60, INPUT_HEIGHT = 40, OUTPUT_WIDTH = 60, OUTPUT_HEIGHT = 40;
// 🔧 było const → musi być let, żeby działało usuwanie
let gates = [];
let connections = [];
let draggingGate = null, offsetX = 0, offsetY = 0;
let selectedGateType = 'AND';
let connecting = null; // {gateIdx, port: 'out'|'inA'|'inB'}
let selectedGate = null; // indeks zaznaczonego elementu
let selectionRect = null; // {x1, y1, x2, y2}
let multiSelectedGates = []; // indeksy zaznaczonych bramek

let isSelecting = false;

const gateTypes = {
    INPUT: { inputs: 0, outputs: 1 },
    OUTPUT: { inputs: 1, outputs: 0 },
    NOT: { inputs: 1, outputs: 1 },
    AND: { inputs: 2, outputs: 1 },
    OR: { inputs: 2, outputs: 1 },
    EXOR: { inputs: 2, outputs: 1 },
    NAND: { inputs: 2, outputs: 1 },
    NOR: { inputs: 2, outputs: 1 },
    EXNOR: { inputs: 2, outputs: 1 }
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
        drawGateSymbolic(gate, idx, idx === selectedGate || multiSelectedGates.includes(idx));
    });

    // Rysuj niebieski prostokąt zaznaczenia
    if (selectionRect) {
        ctx.save();
        ctx.strokeStyle = "#3399ff";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.globalAlpha = 0.5;
        const x = Math.min(selectionRect.x1, selectionRect.x2);
        const y = Math.min(selectionRect.y1, selectionRect.y2);
        const w = Math.abs(selectionRect.x2 - selectionRect.x1);
        const h = Math.abs(selectionRect.y2 - selectionRect.y1);
        ctx.strokeRect(x, y, w, h);
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "#3399ff";
        ctx.fillRect(x, y, w, h);
        ctx.restore();
    }
}

function drawGateSymbolic(gate, idx, isSelected) {
    ctx.save();
    ctx.translate(gate.x, gate.y);

    let w = GATE_WIDTH, h = GATE_HEIGHT;
    if (gate.type === 'INPUT') { w = INPUT_WIDTH; h = INPUT_HEIGHT; }
    if (gate.type === 'OUTPUT') { w = OUTPUT_WIDTH; h = OUTPUT_HEIGHT; }
    if (isSelected) {
        ctx.strokeStyle = multiSelectedGates.includes(idx) ? "#3399ff" : "#fff";
        ctx.lineWidth = 4;
        ctx.strokeRect(-6, -6, w + 12, h + 12);
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
            // Kuleczka negacji - środek na końcu bramki
            ctx.beginPath();
            ctx.arc(w, h / 2, 8, 0, 2 * Math.PI);
            ctx.fillStyle = "#222";
            ctx.fill();
            ctx.stroke();
            // Kreska od kuleczki do OUT
            ctx.beginPath();
            ctx.moveTo(w + 8, h / 2);
            ctx.lineTo(w + 40, h / 2);
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 3;
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
            // Kuleczka negacji
            ctx.beginPath();
            ctx.arc(w, h / 2, 8, 0, 2 * Math.PI);
            ctx.fillStyle = "#222";
            ctx.fill();
            ctx.stroke();
            // Kreska od kuleczki do OUT
            ctx.beginPath();
            ctx.moveTo(w + 8, h / 2);
            ctx.lineTo(w + 40, h / 2);
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 3;
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
            // Kuleczka negacji
            ctx.beginPath();
            ctx.arc(w, h / 2, 8, 0, 2 * Math.PI);
            ctx.fillStyle = "#222";
            ctx.fill();
            ctx.stroke();
            // Kreska od kuleczki do OUT
            ctx.beginPath();
            ctx.moveTo(w + 8, h / 2);
            ctx.lineTo(w + 40, h / 2);
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 3;
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
            // Kuleczka negacji
            ctx.beginPath();
            ctx.arc(w, h / 2, 8, 0, 2 * Math.PI);
            ctx.fillStyle = "#222";
            ctx.fill();
            ctx.stroke();
            // Kreska od kuleczki do OUT
            ctx.beginPath();
            ctx.moveTo(w + 8, h / 2);
            ctx.lineTo(w + 40, h / 2);
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 3;
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
    let outX = (['NOT', 'NAND', 'NOR', 'EXNOR'].includes(gate.type)) ? w + 40 : w;
    ctx.beginPath();
    ctx.arc(outX, h / 2, 10, 0, 2 * Math.PI);
    ctx.fillStyle = outVal === 1 ? "#0f0" : (outVal === 0 ? "#f00" : "#888");
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 15px monospace";
    ctx.fillText(outVal !== null ? outVal : "?", outX + 18, h / 2 + 6);
    ctx.font = "bold 12px monospace";
    ctx.fillText("OUT", outX + 18, h / 2 - 10);

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
        if (port === 'out') return { x: gate.x + INPUT_WIDTH, y: gate.y + INPUT_HEIGHT / 2 };
        return { x: gate.x, y: gate.y };
    }
    if (gate.type === 'OUTPUT') {
        if (port === 'inA') return { x: gate.x, y: gate.y + OUTPUT_HEIGHT / 2 };
        return { x: gate.x, y: gate.y };
    }
    if (port === 'out') return { x: gate.x + GATE_WIDTH, y: gate.y + GATE_HEIGHT / 2 };
    if (port === 'inA') return { x: gate.x, y: gate.y + 15 };
    if (port === 'inB') return { x: gate.x, y: gate.y + 45 };
    return { x: gate.x, y: gate.y };
}

canvas.addEventListener('mousedown', e => {
    const { offsetX: mx, offsetY: my } = e;
    let clicked = false;
    // Sprawdź, czy kliknięto na bramkę do przesuwania
    for (let i = gates.length - 1; i >= 0; i--) {
        const g = gates[i];
        let w = g.type === 'INPUT' ? INPUT_WIDTH : (g.type === 'OUTPUT' ? OUTPUT_WIDTH : GATE_WIDTH);
        let h = g.type === 'INPUT' ? INPUT_HEIGHT : (g.type === 'OUTPUT' ? OUTPUT_HEIGHT : GATE_HEIGHT);
        if (mx > g.x && mx < g.x + w && my > g.y && my < g.y + h) {
            draggingGate = i;
            offsetX = mx - g.x;
            offsetY = my - g.y;
            selectedGate = i;
            multiSelectedGates = [];
            drawBoard();
            // Toggle input value if input block
            if (g.type === 'INPUT') {
                if (mx > g.x && mx < g.x + w && my > g.y && my < g.y + h) {
                    g.value = g.value ? 0 : 1;
                    propagateSignals();
                    drawBoard();
                    clicked = true;
                    return;
                }
            }
            clicked = true;
            return;
        }
    }
    // Jeśli nie przesuwasz bramki, możesz rozpocząć zaznaczanie
    if (e.button === 0 && draggingGate === null) {
        isSelecting = true;
        selectionRect = { x1: mx, y1: my, x2: mx, y2: my };
        multiSelectedGates = [];
        drawBoard();
        selectedGate = null;
        clicked = true;
    }
    // Check port click for connection
    for (let i = gates.length - 1; i >= 0; i--) {
        const g = gates[i];
        let out = getPortPos(g, 'out');
        if (distance(mx, my, out.x, out.y) < 12) {
            connecting = { gate: i, port: 'out' };
            clicked = true;
            return;
        }
        // Inputs
        if (g.type !== 'INPUT') {
            if (gateTypes[g.type].inputs >= 1) {
                let inA = getPortPos(g, 'inA');
                if (distance(mx, my, inA.x, inA.y) < 12) {
                    if (connecting && connecting.port === 'out') {
                        if (connecting.gate !== i) {
                            connections.push({ from: connecting, to: { gate: i, port: 'inA' } });
                            connecting = null;
                            propagateSignals();
                            drawBoard();
                        } else {
                            connecting = null;
                        }
                    } else {
                        connecting = { gate: i, port: 'inA' };
                    }
                    clicked = true;
                    return;
                }
            }
            if (gateTypes[g.type].inputs === 2) {
                let inB = getPortPos(g, 'inB');
                if (distance(mx, my, inB.x, inB.y) < 12) {
                    if (connecting && connecting.port === 'out') {
                        if (connecting.gate !== i) {
                            connections.push({ from: connecting, to: { gate: i, port: 'inB' } });
                            connecting = null;
                            propagateSignals();
                            drawBoard();
                        } else {
                            connecting = null;
                        }
                    } else {
                        connecting = { gate: i, port: 'inB' };
                    }
                    clicked = true;
                    return;
                }
            }
        }
        if (g.type === 'OUTPUT') {
            let inA = getPortPos(g, 'inA');
            if (distance(mx, my, inA.x, inA.y) < 12) {
                if (connecting && connecting.port === 'out') {
                    if (connecting.gate !== i) {
                        connections.push({ from: connecting, to: { gate: i, port: 'inA' } });
                        connecting = null;
                        propagateSignals();
                        drawBoard();
                    } else {
                        connecting = null;
                    }
                } else {
                    connecting = { gate: i, port: 'inA' };
                }
                clicked = true;
                return;
            }
        }
    }
    // Jeśli nie kliknięto nic istotnego, resetuj zaznaczenie
    if (!clicked) selectedGate = null;
});

canvas.addEventListener('mousemove', e => {
    if (isSelecting && selectionRect) {
        selectionRect.x2 = e.offsetX;
        selectionRect.y2 = e.offsetY;
        // Zaznacz bramki w prostokącie
        multiSelectedGates = [];
        const x = Math.min(selectionRect.x1, selectionRect.x2);
        const y = Math.min(selectionRect.y1, selectionRect.y2);
        const w = Math.abs(selectionRect.x2 - selectionRect.x1);
        const h = Math.abs(selectionRect.y2 - selectionRect.y1);
        gates.forEach((g, idx) => {
            let gw = g.type === 'INPUT' ? INPUT_WIDTH : (g.type === 'OUTPUT' ? OUTPUT_WIDTH : GATE_WIDTH);
            let gh = g.type === 'INPUT' ? INPUT_HEIGHT : (g.type === 'OUTPUT' ? OUTPUT_HEIGHT : GATE_HEIGHT);
            if (
                g.x + gw > x &&
                g.x < x + w &&
                g.y + gh > y &&
                g.y < y + h
            ) {
                multiSelectedGates.push(idx);
            }
        });
        drawBoard();
    }
    if (draggingGate !== null) {
        const { offsetX: mx, offsetY: my } = e;
        let g = gates[draggingGate];
        let w = g.type === 'INPUT' ? INPUT_WIDTH : (g.type === 'OUTPUT' ? OUTPUT_WIDTH : GATE_WIDTH);
        let h = g.type === 'INPUT' ? INPUT_HEIGHT : (g.type === 'OUTPUT' ? OUTPUT_HEIGHT : GATE_HEIGHT);
        g.x = mx - offsetX;
        g.y = my - offsetY;
        drawBoard();
    }
});

canvas.addEventListener('mouseup', e => {
    if (isSelecting) {
        isSelecting = false;
        selectionRect = null;
        drawBoard();
    }
    draggingGate = null;
});

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
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
    const { offsetX: mx, offsetY: my } = e;
    if (selectedGateType === 'INPUT') {
        gates.push({
            type: 'INPUT',
            x: mx - INPUT_WIDTH / 2,
            y: my - INPUT_HEIGHT / 2,
            value: 1 // domyślnie 1
        });
    } else if (selectedGateType === 'OUTPUT') {
        gates.push({
            type: 'OUTPUT',
            x: mx - OUTPUT_WIDTH / 2,
            y: my - OUTPUT_HEIGHT / 2,
            inputVal: undefined
        });
    } else {
        gates.push({
            type: selectedGateType,
            x: mx - GATE_WIDTH / 2,
            y: my - GATE_HEIGHT / 2,
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
    switch (type) {
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

window.addEventListener('keydown', e => {
    // Zbierz indeksy bramek do usunięcia:
    // jeśli są zaznaczone w multiSelectedGates -> użyj ich,
    // w przeciwnym razie użyj selectedGate (jeśli nie null)
    let toDelete = [...multiSelectedGates];
    if (toDelete.length === 0 && selectedGate !== null) {
        toDelete = [selectedGate];
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && toDelete.length > 0) {
        // 1) Usuń połączenia powiązane z usuwanymi bramkami
        // connections structure: { from: { gate: idx, port: ... }, to: { gate: idx, port: ... } }
        connections = connections.filter(conn => {
            // jeśli któreś z końców odnosi się do usuwanej bramki -> usuń połączenie
            if (toDelete.includes(conn.from.gate)) return false;
            if (toDelete.includes(conn.to.gate)) return false;
            return true;
        });

        // 2) Usuń bramki - robimy to od największego indeksu do najmniejszego
        toDelete.sort((a, b) => b - a);
        toDelete.forEach(idx => {
            // zabezpieczenie: sprawdź czy indeks nadal istnieje
            if (idx >= 0 && idx < gates.length) {
                gates.splice(idx, 1);
            }
        });

        // 3) Zaktualizuj indeksy w istniejących połączeniach:
        // jeśli usunęliśmy bramkę o indeksie K, wszystkie indeksy większe od K powinny zostać zmniejszone o 1
        // zamiast komplikować, iterujemy przez wszystkie usunięte indeksy (rosnąco) i zmieniamy połączenia
        // NOTE: toDelete jest posortowane malejąco — utworzymy posortowaną rosnąco kopię:
        const removed = [...toDelete].sort((a,b)=>a-b);
        connections.forEach(conn => {
            removed.forEach(removedIdx => {
                if (conn.from.gate > removedIdx) conn.from.gate--;
                if (conn.to.gate > removedIdx) conn.to.gate--;
            });
        });

        // 4) Usuń duplikaty połączeń prowadzące do tego samego portu (opcjonalne, ale bezpieczne)
        const portMap = {};
        connections = connections.filter(conn => {
            const key = `${conn.to.gate}_${conn.to.port}`;
            if (portMap[key]) return false;
            portMap[key] = true;
            return true;
        });

        // 5) Zresetuj zaznaczenia i draggowanie
        multiSelectedGates = [];
        selectedGate = null;
        draggingGate = null;
        connecting = null;

        // 6) Przelicz sygnały i przerysuj planszę
        propagateSignals();
        drawBoard();
    }
});