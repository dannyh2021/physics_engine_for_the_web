import { Matrix3, Matrix4, Vector3 } from "three";

/**
* R = R_z(phi) R_y(theta) R_x(psi)
* @param rotationMatrix assumes valid rotation matrix
* @return JSON of euler angles psi, theta, and phi {psi: number, theta: number, phi: number}
*/
export function getEulerAngles(rotationMatrix: Matrix3) {
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

export function xRotationMatrix3(angle: number) {
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

export function yRotationMatrix3(angle: number) {
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

export function zRotationMatrix3(angle: number) {
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

export function convertMatrix3ToMatrix4(matrix: Matrix3) {
    const elements = matrix.elements;
    
    const m = new Matrix4();
    m.set(
        elements[0], elements[3], elements[6], 0,
        elements[1], elements[4], elements[7], 0,
        elements[2], elements[5], elements[8], 0,
        0, 0, 0, 1
    );

    return m;
}

/**
 * Not sure what it's called but suppose you have vectors a and b.
 * Then this function will return a matrix a_star, where a_star(b) = a x b
 * In other words, a_star is a linear map that acts returns the cross product of a with its input.
 * Derived in chapter 4.8 of Goldstein's Classical Mechanics book.
 * @param vector the vector
 */
export function getVectorCrossMatrix(v: Vector3) {
    const m = new Matrix3();
    m.set(
        0, -v.z, v.y,
        v.z, 0, -v.x,
        -v.y, v.x, 0
    );
    return m;
}

export function addMatrices(a: Matrix3, b: Matrix3) {
    const aElements = a.elements;
    const bElements = b.elements;
    const m = new Matrix3();
    const elements = [];
    for (let i = 0; i < 9; i++) {
        elements.push(aElements[i] + bElements[i]);
    }
    m.elements = elements;
    return m;
};