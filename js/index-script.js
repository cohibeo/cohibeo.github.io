const canvasLeft = document.getElementById('canvas-arrows');
const ctxLeft = canvasLeft.getContext('2d');
const canvasRight = document.getElementById('canvas-stars');
const ctxRight = canvasRight.getContext('2d');

let width, height;
let mouse = { x: -1000, y: -1000, active: false };
let arrowGrid = [];

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    [canvasLeft, canvasRight].forEach(c => {
        c.width = width;
        c.height = height;
    });
    initArrowGrid();
    initStars();
}

window.addEventListener('resize', resize);

const hero = document.querySelector('.hero-wrapper');
window.addEventListener('mousemove', (e) => {
    const rect = canvasLeft.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    const heroRect = hero.getBoundingClientRect();
    mouse.active = (e.clientY <= heroRect.bottom && e.clientY >= heroRect.top);

    mouseOnStars = e.clientX > window.innerWidth / 2;
});

let mouseOnStars = false;

function initArrowGrid() {
    arrowGrid = [];
    const spacing = 65;
    for (let x = spacing/2; x < width; x += spacing) {
        for (let y = spacing/2; y < height; y += spacing) {
            arrowGrid.push({
                x, y,
                currentAngle: -Math.PI / 2, // Start pointing up
            });
        }
    }
}

function drawArrows() {
    ctxLeft.clearRect(0, 0, width, height);
    const maxDist = 250;

    arrowGrid.forEach(a => {
        let targetAngle = -Math.PI / 2;
        
        if (mouse.active) {
            const dx = mouse.x - a.x;
            const dy = mouse.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < maxDist) {
                const mouseAngle = Math.atan2(dy, dx);
                const strength = 1 - (dist / maxDist);
                // Use a weighted average to "chase" the mouse angle
                targetAngle = targetAngle + (mouseAngle - targetAngle) * strength;
            }
        }

        a.currentAngle += (targetAngle - a.currentAngle) * 0.1;

        ctxLeft.save();
        ctxLeft.translate(a.x, a.y);
        ctxLeft.rotate(a.currentAngle);
        ctxLeft.beginPath();
        ctxLeft.moveTo(-6, 0); ctxLeft.lineTo(6, 0);
        ctxLeft.lineTo(2, -3); ctxLeft.moveTo(6,0); ctxLeft.lineTo(2, 3);
        ctxLeft.strokeStyle = 'rgba(17, 17, 17, 0.7)';
        ctxLeft.lineWidth = 1.5;
        ctxLeft.stroke();
        ctxLeft.restore();
    });
}

function drawArrows() {
    ctxLeft.clearRect(0, 0, width, height);
    const maxDist = 250;
    arrowGrid.forEach(a => {
        let targetAngle = -Math.PI / 2;
        if (mouse.active) {
            const dx = mouse.x - a.x;
            const dy = mouse.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < maxDist) {
                const strength = 1 - (dist / maxDist);
                targetAngle = targetAngle + (Math.atan2(dy, dx) - targetAngle) * strength;
            }
        }
        a.currentAngle += (targetAngle - a.currentAngle) * 0.1;
        ctxLeft.save();
        ctxLeft.translate(a.x, a.y);
        ctxLeft.rotate(a.currentAngle);
        ctxLeft.beginPath();
        ctxLeft.moveTo(-6, 0); ctxLeft.lineTo(6, 0);
        ctxLeft.lineTo(2, -3); ctxLeft.moveTo(6,0); ctxLeft.lineTo(2, 3);
        ctxLeft.strokeStyle = 'rgba(17, 17, 17, 0.7)';
        ctxLeft.lineWidth = 1.5;
        ctxLeft.stroke();
        ctxLeft.restore();
    });
}

let stars = [];
function initStars() {
    stars = [];
    for (let i = 0; i < 400; i++) {
        const x = Math.random() * width;
        const h = width * 0.5;
        
        // Path centerline
        const arcY = 0.0005 * Math.pow(x - h, 2) + (height * 0.2);
        
        // Assign a permanent offset so they don't squish to the center
        const inBand = Math.random() < 0.75;
        const personalOffset = inBand ? (Math.random() - 0.5) * 160 : (Math.random() - 0.5) * height;

        const temp = Math.random();
        let color = temp < 0.2 ? [180, 210, 255] : temp < 0.6 ? [255, 255, 255] : [255, 220, 180];
        const size = temp < 0.2 ? 2.2 : 0.8 + Math.random() * 1.2;

        stars.push({
            x: x, 
            y: arcY + personalOffset,
            baseX: x,
            // Store the offset permanently
            offsetY: personalOffset,
            vx: 0, 
            vy: 0,
            size, color,
            opacity: 0.4 + Math.random() * 0.5,
            flicker: 0.002 + Math.random() * 0.005
        });
    }
}

function drawStars() {
    ctxRight.clearRect(0, 0, width, height);
    
    stars.forEach(s => {
        // Natural drift along path
        s.baseX += 0.08; 
        if (s.baseX > width) {
            s.baseX -= width; // Wrap around smoothly
            s.x -= width; // Adjust current position to match
        }

        const h = width * 0.5;
        const currentPathY = 0.0005 * Math.pow(s.baseX - h, 2) + (height * 0.2);
        const targetX = s.baseX;
        const targetY = currentPathY + s.offsetY; // Maintains individual path

        // 2. Radial repulsion
        if (mouse.active) {
            const dx = s.x - mouse.x;
            const dy = s.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 180) {
                const force = (180 - dist) / 180;
                // Accumulate velocity away from mouse
                s.vx += (dx / dist) * force * 0.1;
                s.vy += (dy / dist) * force * 0.1;
            }
        }

        // Velocity & damping
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.90; // Friction/damping
        s.vy *= 0.90;

        // Pull back to their specific orbit
        s.x += (targetX - s.x) * 0.005;
        s.y += (targetY - s.y) * 0.005;

        // Visual rendering
        s.opacity += s.flicker;
        if (s.opacity > 0.9 || s.opacity < 0.3) s.flicker *= -1;

        ctxRight.shadowBlur = s.size > 1.8 ? s.size * 3 : 0;
        ctxRight.shadowColor = `rgb(${s.color[0]},${s.color[1]},${s.color[2]})`;
        ctxRight.fillStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${s.opacity})`;

        ctxRight.beginPath();
        ctxRight.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctxRight.fill();
    });
}

function animate() {
    drawArrows();
    drawStars();
    requestAnimationFrame(animate);
}
resize();
animate();