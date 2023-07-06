let drawing = false;
let pickingcolor = false;
let rainbow = false;
let brushSize = 12;
let lastPosX = -1;
let lastPosY = -1;
let lastPressure = -1;
let rainbowcounter = 0;

const rainbowcheckbox = document.getElementById('rainbow');
const colorpicker = document.getElementById('color');
const sizepicker = document.getElementById('size');
const clearcanvas = document.getElementById('clear');
const pipette = document.getElementById('pipette');
const canvas = document.getElementById('canvas');

// init canvas
const ctx = canvas.getContext("2d");
ctx.canvas.width  = canvas.clientWidth;
ctx.canvas.height = canvas.clientHeight;
const rect = canvas.getBoundingClientRect();

// resize canvas if window is resized
window.addEventListener('resize', ev => {
    ctx.canvas.width  = canvas.clientWidth;
    ctx.canvas.height = canvas.clientHeight;
})

function startDrawing() {
    if (!pickingcolor) {
        drawing = true;
    } else {
        document.body.style.cursor = 'unset'
    }
}
function stopDrawing(){
    lastPosX = -1;
    lastPosY = -1;
    drawing = false;
}

canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('pointerdown', startDrawing);
canvas.addEventListener('pointerup', stopDrawing);
canvas.addEventListener('pointerout', stopDrawing);

rainbowcheckbox.addEventListener('change', ev => {
    rainbow = ev.target.checked;
});
sizepicker.addEventListener('change', ev => {
    brushSize = ev.target.value;
});
clearcanvas.addEventListener('click', () => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.width)
})
pipette.addEventListener('click', () => {
    pickingcolor = true;
    document.body.style.cursor = 'copy';
})

const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
}).join('')

function pick(event) {
    if (pickingcolor){
        var x = event.layerX - rect.left;
        var y = event.layerY - rect.top;
        var pixel = ctx.getImageData(x, y, 1, 1);
        var data = pixel.data;
        // canvas is transparent, if transparent pixel selected return white
        const color = data[2] == 0 
            ? '#FFFFFF' 
            : rgbToHex(data[0], data[1], data[2]);
        colorpicker.value = color;
        pickingcolor = false;
    }
}

canvas.addEventListener('click', pick);

document.addEventListener('pointermove', ev => {
    // check if mouse is down & check if brush isnt painting over itself
    if (drawing && ((lastPosX != ev.clientX - rect.left) || (lastPosY != ev.clientY - rect.top))) {
        const posx = ev.clientX - rect.left;
        const posy = ev.clientY - rect.top;
        const psize = brushSize * ev.pressure;
        ctx.fillStyle = colorpicker.value;

        if (rainbow){
            rainbowcounter++
            ctx.fillStyle = `hsl(${rainbowcounter} 100% 50%)`
        }
        ctx.beginPath();
        ctx.arc(posx, posy, psize, 0, 2 * Math.PI, 0);
        ctx.fill();

        function interpolate(a, b, frac) // points A and B, frac between 0 and 1
        {
            var nx = a.x+(b.x-a.x)*frac;
            var ny = a.y+(b.y-a.y)*frac;
            return [nx,ny];
        }

        const brushSafeArea = brushSize / 4;

        // interpolated pxs
        for (let i = 1; i < 41; i++){
            const intPos = interpolate(
                {x:Math.random() * (2 * brushSize) - (1 * brushSize) + posx, 
                    y:Math.random() * (2 * brushSize) - (1 * brushSize) + posy}, 
                    {x:lastPosX,y:lastPosY}, i * 0.025);
            
            const intPress = interpolate({x:ev.pressure, y: 0}, {x: lastPressure, y: 0}, i * 0.025);
            // intPos[0] != ev.clientX is too wasteful, a block for each pxl instead
            if (
                    (
                    (intPos[0] - posx > brushSafeArea || intPos[0] - posx < -brushSafeArea) 
                        || 
                        (intPos[1] - posy > brushSafeArea || intPos[1] - posy < -brushSafeArea)
                    || 
                    (intPos[0] - lastPosX > brushSafeArea || intPos[0] - lastPosX < -brushSafeArea)
                        || 
                        (intPos[1] - lastPosY > brushSafeArea|| intPos[1] - lastPosY < -brushSafeArea)
                    ) 
                & lastPosX != -1)
            {
                const intSize = brushSize * intPress[0];
                ctx.fillStyle = colorpicker.value;

                if (rainbow){
                    rainbowcounter = rainbowcounter + 0.05;
                    ctx.fillStyle = `hsl(${rainbowcounter} 100% 50%)`
                }
                ctx.beginPath();
                ctx.arc(intPos[0], intPos[1], intSize, 0, 2 * Math.PI, 0);
                ctx.fill();
            }
        }
        lastPosX = posx;
        lastPosY = posy;
        lastPressure = ev.pressure;
    }
});