import { Vector3 } from "three";
import { Sphere } from "./physics_engine/Sphere";
import { World } from "./physics_engine/physics_engine";
import { Matrix3, Matrix4 } from "three";
import { convertMatrix3ToMatrix4, addMatrices } from "./physics_engine/math_library";

const s1 = new Sphere(new Vector3(-1, 0, 0), 2);
const s2 = new Sphere(new Vector3(0, 0, 0), 2);
/*s1.velocity = new Vector3(1, 0, 0);
s1.inverseMass = 1/5;

const w = new World();
w.addObject(s1);
w.addObject(s2);

console.log(w.getObjects());

console.log("collision check: ", w.checkCollisionSpheres(s1, s2));
w.resolveCollisionSpheres(s1, s2);*/

function xRotationMatrix3(angle: number) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    const m = new Matrix3()
    m.set(
        1, 0, 0,
        0, c, -s,
        0, s, c
    );
    return m;
}

function yRotationMatrix3(angle: number) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    const m = new Matrix3();
    m.set(
        c, 0, s,
        0, 1, 0,
        -s, 0, c,
    );
    return m;
}

function zRotationMatrix3(angle: number) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    const m = new Matrix3();
    m.set(
        c, -s, 0,
        s, c, 0,
        0, 0, 1,
    );
    return m;
}

// R = R_z(phi) R_y(theta) R_x(psi)
// Two solutions if theta not equal to +1 or -1, otherwise infinite solutions (gimbal lock)
/** Returns Euler angles assuming matrix is a rotation matrix. */
function printEulerAngles(rotationMatrix: Matrix3) {
    const elements = rotationMatrix.elements;
    const r_11 = elements[0];
    const r_12 = elements[3];
    const r_13 = elements[6];
    const r_21 = elements[1];
    const r_31 = elements[2];
    const r_32 = elements[5];
    const r_33 = elements[8];

    if (!(r_31 === 1 || r_31 === -1)) {
        const theta_1 = - Math.asin(r_31);
        const theta_2 = Math.PI - theta_1;

        const psi_1 = Math.atan2(r_32/Math.cos(theta_1), r_33/Math.cos(theta_1));
        const psi_2 = Math.atan2(r_32/Math.cos(theta_2), r_33/Math.cos(theta_2));

        const phi_1 = Math.atan2(r_21/Math.cos(theta_1), r_11/Math.cos(theta_1));
        const phi_2 = Math.atan2(r_21/Math.cos(theta_2), r_11/Math.cos(theta_2));

        console.log(`psi_1: ${psi_1}, psi_2: ${psi_2}`);
        console.log(`theta_1: ${theta_1}, theta_2: ${theta_2}`);
        console.log(`phi_1: ${phi_1}, phi_2: ${phi_2}`);
    } else {
        const phi = 0;
        let theta: number;
        let psi: number;

        if (r_31 === -1) {
            theta = Math.PI/2;
            psi = phi + Math.atan2(r_12, r_13);
        } else {
            theta = -Math.PI/2;
            psi = -phi + Math.atan2(-r_12, -r_13);
        }

        console.log(`psi: ${psi},`);
        console.log(`theta: ${theta}`);
        console.log(`phi: ${phi}`);
    }
};

/**
 * R = R_z(phi) R_y(theta) R_x(psi)
 * @param rotationMatrix assumes valid rotation matrix
 * @return JSON of euler angles psi, theta, and phi {psi: number, theta: number, phi: number}
 */
function getEulerAngles(rotationMatrix: Matrix3) {
    const elements = rotationMatrix.elements;
    const r_11 = elements[0];
    const r_12 = elements[3];
    const r_13 = elements[6];
    const r_21 = elements[1];
    const r_31 = elements[2];
    const r_32 = elements[5];
    const r_33 = elements[8];

    let psi: number;
    let theta: number;
    let phi: number;

    if (!(r_31 === 1 || r_31 === -1)) {
        theta = - Math.asin(r_31);

        psi = Math.atan2(r_32/Math.cos(theta), r_33/Math.cos(theta));

        phi = Math.atan2(r_21/Math.cos(theta), r_11/Math.cos(theta));
    } else {
        phi = 0;

        if (r_31 === -1) {
            theta = Math.PI/2;
            psi = phi + Math.atan2(r_12, r_13);
        } else {
            theta = -Math.PI/2;
            psi = -phi + Math.atan2(-r_12, -r_13);
        }
    }

    const angles = {psi: psi, theta: theta, phi: phi};
    return angles;
}

function printMatrix3(matrix: Matrix3) {
    const elements = matrix.elements;
    console.log(`Matrix3: [${elements[0]} ${elements[3]} ${elements[6]}`);
    console.log(`          ${elements[1]} ${elements[4]} ${elements[7]}`);
    console.log(`          ${elements[2]} ${elements[5]} ${elements[8]}]`);
}

function printMatrix4(matrix: Matrix4) {
    const elements = matrix.elements;
    console.log(`Matrix4: [${elements[0]} ${elements[4]} ${elements[8]} ${elements[12]}`);
    console.log(`         [${elements[1]} ${elements[5]} ${elements[9]} ${elements[13]}`);
    console.log(`         [${elements[2]} ${elements[6]} ${elements[10]} ${elements[14]}`);
    console.log(`         [${elements[3]} ${elements[7]} ${elements[11]} ${elements[15]}]`);
}

const xRotation = xRotationMatrix3(Math.PI/4);
const yRotation = yRotationMatrix3(Math.PI/3);
const zRotation = zRotationMatrix3(Math.PI/4);

/*console.log("xRotation");
printEulerAngles(xRotation);

console.log("yRotation");
printEulerAngles(yRotation);

console.log("zRotation");
printEulerAngles(zRotation);

let testMatrix = zRotation.clone().multiply(yRotation).multiply(xRotation);
printEulerAngles(testMatrix);

console.log("xRotation angles", getEulerAngles(xRotation));
console.log("testMatrix euler angles: ", getEulerAngles(testMatrix));*/

/*const testMatrix = new Matrix3();
testMatrix.set(
    1, 2, 3,
    4, 5, 6,
    7, 8, 9
);
const testMatrix4 = convertMatrix3ToMatrix4(testMatrix);
printMatrix4(testMatrix4);*/

const m1 = new Matrix3(), m2 = new Matrix3();
m1.set(
    1, 2, 3,
    4, 5, 6,
    7, 8, 9
);
m2.set(
    0, 0, 0,
    1, 1, 1,
    2, 2, 2
);
const m3 = addMatrices(m1, m2);
printMatrix3(m3);