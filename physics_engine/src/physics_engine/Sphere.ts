import * as THREE from "three";
import { LineSegments, Matrix3, Mesh, Vector3 } from "three";

const DAMPING = 0.999;

// should add rotation at some point?
export class Sphere {
    public inverseMass: number;

    public radius: number;
    
    public position: Vector3;
    public velocity: Vector3;

    // holds the accumulated force to be applied to the next simulation iteration only.
    public forceAccum: Vector3;

    public boundingBox: Vector3; // width, length, and height of bounding box

    // for graphics
    public mesh: Mesh;
    public boundingBoxMesh: LineSegments;

    constructor(position: Vector3, radius: number) {
        this.inverseMass = 1 / (4/3*Math.PI*Math.pow(radius, 3));
        this.radius = radius;

        this.position = position;
        this.velocity = new Vector3(0, 0, 0);

        this.forceAccum = new Vector3(0, 0, 0);

        this.boundingBox = new Vector3(2*radius, 2*radius, 2*radius);

        // for graphics
        this.createMesh();
        this.updateMesh();
        this.createBoundingBoxMesh();
        this.updateBoundingBoxMesh();
    }

    getInertia(): Matrix3 {
        const term = 2/5 * (1/this.inverseMass) * this.radius * this.radius;
        const inertia = new Matrix3;
        inertia.set(
            term, 0, 0,
            0, term, 0,
            0, 0, term
        );
        return inertia;
    }

    getAngularVelocity(): Vector3 {
        const angularVelocity = new Vector3(0, 0, 0);
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
        if (this.inverseMass <= 0 || duration <= 0)
            return;

        // update velocity based on force and then clear forces
        // this.velocity.addScaledVector(this.forceAccum, duration*this.inverseMass);
        // this.clearAccumulator();

        // update the linear position.
        this.position.addScaledVector(this.velocity, duration);

        // impose drag.
        // this.velocity.multiplyScalar(Math.pow(DAMPING, duration));

        // update the velocity from the acceleration.
        // this.velocity.addScaledVector(this.acceleration, duration);
    }

    applyImpulse(point: Vector3, impulse: Vector3) {
        this.velocity.add(impulse.clone().multiplyScalar(this.inverseMass));
    }

    // Clears the forces applied to the particle.
    clearAccumulator(): void {
        this.forceAccum = new Vector3(0, 0, 0);
    }

    private createMesh(): void {
        const sphereGeometry = new THREE.SphereGeometry(this.radius);
        const material = new THREE.MeshPhongMaterial({ color: 0x00bcd6 });
        this.mesh = new THREE.Mesh(sphereGeometry, material);
    }

    // updates mesh to current position and orientation
    updateMesh(): void {
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
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