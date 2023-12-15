'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let line;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices, normals) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.BufferDataLine = function (vertices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        this.count = vertices.length / 3;
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }

    this.DrawLine = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.drawArrays(gl.LINE_STRIP, 0, this.count);

    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI / 8, 1, 8, 12);
    // const projVal = 17;
    // let projection = m4.orthographic(-projVal, projVal, -projVal, projVal, -projVal, projVal);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);
    const normalMat = m4.identity();
    m4.inverse(modelView, normalMat);
    m4.transpose(normalMat, normalMat);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.uniformMatrix4fv(shProgram.iNormalMat, false, normalMat);

    /* Draw the six faces of a cube, with different colors. */
    gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1]);
    let red = document.getElementById('red').value
    let green = document.getElementById('green').value
    let blue = document.getElementById('blue').value
    gl.uniform3fv(shProgram.iDiffuseColor, [red, green, blue]);

    gl.uniform1i(shProgram.iLighted, true);
    surface.Draw();
    gl.uniform1i(shProgram.iLighted, false);
    // directional light has no position. animating direction by x axis
    line.BufferDataLine([0, 0, 0, 0.1 * -sin(Date.now() * 0.001), 0, 0.1])
    gl.uniform3fv(shProgram.iLightDirection, [sin(Date.now() * 0.001), 0, 1]);
    gl.uniformMatrix4fv(shProgram.iLightMat, false, m4.multiply(m4.multiply(m4.translation(0, 0.5, 0), m4.axisRotation([1, 0, 0], PI / 4)), m4.identity()));
    line.DrawLine();
}

function animation() {
    draw()
    window.requestAnimationFrame(animation)
}

const { cos, sin, sqrt, pow, PI } = Math
function CreateSurfaceData() {
    let vertexList = [];
    const NUM_STEPS_U = parseInt(document.getElementById('numU').value),
        NUM_STEPS_Z = parseInt(document.getElementById('numZ').value),
        MAX_U = PI * 2,
        MAX_Z = 3,
        STEP_U = MAX_U / NUM_STEPS_U,
        STEP_Z = MAX_Z / NUM_STEPS_Z
    for (let u = 0; u < MAX_U; u += STEP_U) {
        for (let z = -3; z < MAX_Z; z += STEP_Z) {
            let vertex = cassiniVertex(u, z)
            vertexList.push(...vertex)
            vertex = cassiniVertex(u + STEP_U, z)
            vertexList.push(...vertex)
            vertex = cassiniVertex(u, z + STEP_Z)
            vertexList.push(...vertex)
            vertexList.push(...vertex)
            vertex = cassiniVertex(u + STEP_U, z)
            vertexList.push(...vertex)
            vertex = cassiniVertex(u + STEP_U, z + STEP_Z)
            vertexList.push(...vertex)
        }
    }
    return vertexList;
}

function r(u, z) {
    return sqrt(c(z) * c(z) * cos(2 * u) + sqrt(pow(a, 4) - pow(c(z), 4) * pow(sin(2 * u), 2)))
}
function c(z) {
    return 3 * z;
}

const a = 8
const scaler = 0.1;

function cassiniVertex(u, z) {
    // console.log(r(u, z))
    let x = r(u, z) * cos(u),
        y = r(u, z) * sin(u),
        cZ = z;
    return [scaler * x, scaler * y, scaler * cZ];
}

function CreateNormals() {
    let normalList = [];
    const NUM_STEPS_U = parseInt(document.getElementById('numU').value),
        NUM_STEPS_Z = parseInt(document.getElementById('numZ').value),
        MAX_U = PI * 2,
        MAX_Z = 3,
        STEP_U = MAX_U / NUM_STEPS_U,
        STEP_Z = MAX_Z / NUM_STEPS_Z
    for (let u = 0; u < MAX_U; u += STEP_U) {
        for (let z = -3; z < MAX_Z; z += STEP_Z) {
            let vertex = normalAnalytic(u, z)
            normalList.push(...vertex)
            vertex = normalAnalytic(u + STEP_U, z)
            normalList.push(...vertex)
            vertex = normalAnalytic(u, z + STEP_Z)
            normalList.push(...vertex)
            normalList.push(...vertex)
            vertex = normalAnalytic(u + STEP_U, z)
            normalList.push(...vertex)
            vertex = normalAnalytic(u + STEP_U, z + STEP_Z)
            normalList.push(...vertex)
        }
    }
    return normalList;
}
const e = 0.0001
function normalAnalytic(u, z) {
    let u1 = cassiniVertex(u, z),
        u2 = cassiniVertex(u + e, z),
        z1 = cassiniVertex(u, z),
        z2 = cassiniVertex(u, z + e);
    const dU = [], dZ = []
    for (let i = 0; i < 3; i++) {
        dU.push((u1[i] - u2[i]) / e)
        dZ.push((z1[i] - z2[i]) / e)
    }
    const n = m4.normalize(m4.cross(dU, dZ))
    return n
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iNormalMat = gl.getUniformLocation(prog, "normalMat");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iDiffuseColor = gl.getUniformLocation(prog, "diffuseColor");
    shProgram.iLighted = gl.getUniformLocation(prog, "isLighted");
    shProgram.iLightDirection = gl.getUniformLocation(prog, "lightDirection");
    shProgram.iLightMat = gl.getUniformLocation(prog, "lightMat");

    surface = new Model('Surface');
    line = new Model('Light Line');
    surface.BufferData(CreateSurfaceData(), CreateNormals());
    line.BufferDataLine([0, 0, 0, sin(Date.now() * 0.01), 0, 1])
    // surface.BufferData(CreateSurfaceData(), CreateSurfaceData());
    // CreateNormals()

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    document.getElementById('numU').onchange = (e) => {
        surface.BufferData(CreateSurfaceData(), CreateNormals());
        draw()
    }
    document.getElementById('numZ').onchange = (e) => {
        surface.BufferData(CreateSurfaceData(), CreateNormals());
        draw()
    }
    document.getElementById('red').onchange = (e) => {
        draw()
    }
    document.getElementById('green').onchange = (e) => {
        draw()
    }
    document.getElementById('blue').onchange = (e) => {
        draw()
    }
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    // draw();
    animation();
}
