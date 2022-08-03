import { LineSegments, Matrix3, Mesh, Quaternion, Vector3 } from "three";
import * as THREE from "three";
import { convertMatrix3ToMatrix4, getQuaternionRotatingV1ToV2, yRotationMatrix3 } from "./math_library";

export class Plane {
    public position: Vector3;
    public normal: Vector3; // should be normalized

    public inverseMass: number;
    public velocity: Vector3; // plane not implemented to actually move, this is just set to 0 to help the collision resolution

    public width: number;
    public length: number;

    public boundingBox: Vector3;

    // for graphics
    public mesh: Mesh;
    public boundingBoxMesh: LineSegments;

    constructor(position: Vector3, normal: Vector3, width: number, length: number) {
        this.position = position;
        this.normal = normal;

        this.inverseMass = 0;
        this.velocity = new Vector3(0, 0, 0);

        this.width = width;
        this.length = length;

        const r = Math.sqrt(width*width + length*length);
        this.boundingBox = new Vector3(2*r, 2*r, 2*r);

        this.createMesh();
        this.createBoundingBoxMesh();
    }

    private createMesh(): void {
        const planeGeometry = new THREE.PlaneGeometry(this.width, this.length);
        const material = new THREE.MeshPhongMaterial({ color: 0xffcb3e });
        this.mesh = new THREE.Mesh(planeGeometry, material);

        // set orientation based on normal
        const rotation = getQuaternionRotatingV1ToV2(new Vector3(0, 0, 1), this.normal);
        this.mesh.setRotationFromQuaternion(rotation);

        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    }

    private createBoundingBoxMesh(): void {
        const boxGeometry = new THREE.BoxGeometry(this.boundingBox.x, this.boundingBox.y, this.boundingBox.z);
        const wireframe = new THREE.WireframeGeometry(boxGeometry);
        this.boundingBoxMesh = new THREE.LineSegments( wireframe );
        this.boundingBoxMesh.material = new THREE.LineBasicMaterial({ color: 0xffffff });
    }

    // below are just functions written because they are called by the collision resolution step
    getAngularVelocity(): Vector3 {
        const angularVelocity = new Vector3(0, 0, 0);
        return angularVelocity;
    }

    getInertia(): Matrix3 {
        // set to zero matrix, so that the inverse is also the zero matrix when called by collision resolution function
        const m = new Matrix3();
        m.set(
            0, 0, 0,
            0, 0, 0,
            0, 0, 0
        );
        return m;
    }

    applyImpulse(point: Vector3, impulse: Vector3) {
        console.log("impulse magnitude: ", impulse.length());
    }
}