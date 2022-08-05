import * as THREE from "three";
import { Vector3, Matrix3, Quaternion, Mesh, LineSegments } from "three";
import { getVectorCrossMatrix, addMatrices, convertQuaternionToMatrix, addQuaternions, scaleQuaternion, getEulerAngles, printEulerAngles } from "./math_library";

export class Box {
    public inverseMass: number;

    public width: number;
    public length: number;
    public height: number;

    public inertia_body: Matrix3; // inertia tensor in body space

    public position: Vector3;
    public velocity: Vector3;
    // public momentum: Vector3;

    public rotation: Quaternion // the orientation
    public angularMomentum: Vector3;

    // holds the accumulated force to be applied to the next simulation iteration only.
    public forceAccum: Vector3;

    public boundingBox: Vector3 // width, length, and height of the bounding box

    // for graphics
    public mesh: Mesh;
    public boundingBoxMesh: LineSegments;

    constructor(position: Vector3, width: number, length: number, height: number) {
        this.inverseMass = 1 / (width * length * height);

        this.width = width;
        this.length = length;
        this.height = height;

        this.inertia_body = new Matrix3();
        this.setInertia();
        
        this.position = position;
        this.velocity = new Vector3(0, 0, 0);
        // this.momentum = (new Vector3(1, 0, 0)).multiplyScalar(1/this.inverseMass);

        this.rotation = new Quaternion(0, 0, 0, 1);
        this.angularMomentum = new Vector3(0, 0, 0).applyMatrix3(this.getInertia());

        this.forceAccum = new Vector3(0, 0, 0);

        this.setBoundingBox();

        // for graphics
        this.createMesh();
        this.updateMesh();
        this.createBoundingBoxMesh();
        this.updateBoundingBoxMesh();
    }

    private setInertia(): void {
        const mass = 1 / this.inverseMass;
        const I_xx = (1/12) * mass * (this.length*this.length + this.height*this.height);
        const I_yy = (1/12) * mass * (this.width*this.width + this.height*this.height);
        const I_zz = (1/12) * mass * (this.width*this.width + this.length*this.length);

        this.inertia_body.set(
            I_xx, 0, 0,
            0, I_yy, 0,
            0, 0, I_zz
        );
    }

    getInertia(): Matrix3 {
        const rotationMatrix = convertQuaternionToMatrix(this.rotation);
        const inertia = rotationMatrix.clone().multiply(this.inertia_body).multiply(rotationMatrix.clone().transpose());
        return inertia;
    }

    getI_inverse(): Matrix3 {
        const I_body_inverse = this.inertia_body.clone().invert();
        const rotationMatrix = convertQuaternionToMatrix(this.rotation);
        const I_inverse = rotationMatrix.clone().multiply(I_body_inverse).multiply(rotationMatrix.clone().transpose());
        return I_inverse;
    }

    getAngularVelocity(): Vector3 {
        const I_inverse = this.getInertia().invert();
        const angularVelocity = this.angularMomentum.clone().applyMatrix3(I_inverse);
        return angularVelocity;
    }

    // update velocity based on forceAccum and clear forceAccum
    integrateForceAccum(duration: number): void {
        // Don't integrate if mass is infinite or duration <= 0.
        if (this.inverseMass <= 0 || duration <= 0) {
            return;
        }

        this.velocity.addScaledVector(this.forceAccum, duration*this.inverseMass);
        this.clearAccumulator();
    }

    integrate(duration: number): void {
        // Don't integrate if mass is infinite or duration <= 0.
        if (this.inverseMass <= 0 || duration <= 0) {
            return;
        }

        // update velocity based on force and then clear forces
        // this.velocity.addScaledVector(this.forceAccum, duration*this.inverseMass);
        // this.clearAccumulator();

        // update position
        this.position.addScaledVector(this.velocity, duration);

        // this.position.addScaledVector(this.momentum, this.inverseMass * duration);

        // update rotation
        const angularVelocity = this.getAngularVelocity();

        // ddt_q = (1/2) * w(t) * q(t)
        const ddt_Rotation = (new Quaternion(angularVelocity.x/2, angularVelocity.y/2, angularVelocity.z/2, 0)).multiply(this.rotation);
        this.rotation = addQuaternions(this.rotation, scaleQuaternion(ddt_Rotation, duration));
        this.rotation.normalize();
    }

    // Clears the forces applied to the particle.
    clearAccumulator(): void {
        this.forceAccum = new Vector3(0, 0, 0);
    }

    applyImpulse(point: Vector3, impulse: Vector3) {
        // const linearComponent = this.position.clone().sub(point).normalize().dot(impulse);
        // const linearImpulse = this.position.clone().sub(point).normalize().multiplyScalar(linearComponent);
        // this.velocity.addScaledVector(linearImpulse, this.inverseMass);
        this.velocity.addScaledVector(impulse, this.inverseMass);
        


        const r = point.clone().sub(this.position);
        /*
        const angularUnitVector = impulse.clone().cross(this.position.sub(point)).cross(r).normalize();
        const angularImpulse = angularUnitVector.clone().multiplyScalar(impulse.dot(angularUnitVector));*/
        // this.angularMomentum.add(r.clone().cross(angularImpulse));
        this.angularMomentum.add(r.clone().cross(impulse));
    }

    // for now, set to big enough bounding box so that we don't need to update it.
    private setBoundingBox(): void {
        const radius = Math.sqrt((this.width/2)*(this.width/2) + (this.length/2)*(this.length/2) + (this.height/2)*(this.height/2));
        this.boundingBox = new Vector3(radius * 2, radius * 2, radius * 2);
    };

    private createMesh(): void {
        const boxGeometry = new THREE.BoxGeometry(this.width, this.length, this.height);
        const material = new THREE.MeshPhongMaterial({ color: 0x00bcd6 });
        this.mesh = new THREE.Mesh(boxGeometry, material);
    }

    // updates mesh to current position and orientation
    updateMesh(): void {
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh.setRotationFromQuaternion(this.rotation);
    }

    private createBoundingBoxMesh(): void {
        const boxGeometry = new THREE.BoxGeometry(this.boundingBox.x, this.boundingBox.y, this.boundingBox.z);
        const wireframe = new THREE.WireframeGeometry(boxGeometry);
        this.boundingBoxMesh = new THREE.LineSegments( wireframe );
        this.boundingBoxMesh.material = new THREE.LineBasicMaterial({ color: 0xffffff });
    }

    updateBoundingBoxMesh(): void {
        this.boundingBoxMesh.position.set(this.position.x, this.position.y, this.position.z);
    }
}