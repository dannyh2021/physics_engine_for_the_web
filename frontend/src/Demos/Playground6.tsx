import React from "react";
import { checkBoundingBoxIntersection, World, checkCollision, resolveCollision, getAllBoundingBoxIntersections, getAllContacts } from "../physics_engine/physics_engine";
import * as THREE from "three";
import { Matrix3, MeshPhongMaterial, Vector3 } from "three";
import { Sphere } from "../physics_engine/Sphere";
import { Box } from "../physics_engine/Box";
import { OrbitControls } from "three-orbitcontrols-ts";
import { convertMatrix3ToMatrix4, xRotationMatrix3, yRotationMatrix3, zRotationMatrix3 } from "../physics_engine/math_library";

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 500;

// camera
const camera = new THREE.PerspectiveCamera(45, CANVAS_WIDTH / CANVAS_HEIGHT, 1, 1000);
camera.position.set(0, -CANVAS_HEIGHT / 6, CANVAS_HEIGHT / 6);
camera.up.set(0, 1, 0);

// add lighting
const light_color = 0xffffff;
const intensity = 1;
const point_light = new THREE.PointLight(light_color, intensity);
point_light.position.set(50, 50, 50);

const ambient_light = new THREE.AmbientLight(light_color, 0.3);

export default class Playground6 extends React.Component {
    private canvasRef: any;
    private renderer: any;
    private animationRequestID: any;
    private scene: THREE.Scene;
    private boxes: any[];

    constructor(props: any) {
        super(props);
        this.canvasRef = React.createRef();
        this.scene = new THREE.Scene();
        this.boxes = [];

        // graphics
        this.renderer = null;
        this.animationRequestID = null;

        // bindings
        this.onRestart = this.onRestart.bind(this);
        this.onResume = this.onResume.bind(this);
        this.onPause = this.onPause.bind(this);
    }

    componentDidMount(): void {
        // graphics
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvasRef.current, alpha: false })
        this.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);

        // orbit controls
        const controls = new OrbitControls(camera, this.renderer.domElement);

        this.initialize();
        this.onVisualize();
    }

    initialize() {
        // cancel ongoing animation
        if (this.animationRequestID) {
            cancelAnimationFrame(this.animationRequestID);
        }

        this.scene = new THREE.Scene();

        // set up objects
        this.boxes = [];
        this.boxes.push(new Box(new Vector3(0, 0, 0), 10, 10, 10));

        this.boxes.push(new Box(new Vector3(1, 0, 18), 10, 10, 10));
        
        const yRotation = yRotationMatrix3(Math.PI/4);
        const zRotation = zRotationMatrix3(Math.PI/4);
        const rotationMatrix3 = yRotation.clone().multiply(zRotation);
        this.boxes[1].rotation.setFromRotationMatrix(convertMatrix3ToMatrix4(rotationMatrix3));

        this.boxes[1].velocity = new Vector3(0, 0, -0.5);

        this.boxes[0].angularMomentum = new Vector3(0, 0, 0);
        this.boxes[1].angularMomentum = (new Vector3(0, -0.1, 0)).applyMatrix3(this.boxes[1].getInertia());

        this.boxes.push(new Box(new Vector3(20, 0, 0), 10, 10, 10));
        this.boxes.push(new Box(new Vector3(25, 5, 12), 10, 10, 10));

        this.boxes[3].velocity = new Vector3(0, 0, -1);

        this.boxes[2].angularMomentum = new Vector3(0, 0, 0);
        this.boxes[3].angularMomentum = new Vector3(0, 0, 0);

        for (let box of this.boxes) {
            this.scene.add(box.mesh);
            
            // add bounding box mesh
            this.scene.add(box.boundingBoxMesh);
        }

        // add lighting
        this.scene.add(point_light, ambient_light);

        // add gridHelper
        const gridHelper = new THREE.GridHelper( 100, 10 );
        gridHelper.rotateOnWorldAxis(new Vector3(1, 0, 0), Math.PI/2);
        this.scene.add(gridHelper);
    }

    onVisualize() {
        // cancel ongoing animation
        if (this.animationRequestID) {
            cancelAnimationFrame(this.animationRequestID);
        }

        const scene = this.scene;
        const boxes = this.boxes;

        let boundingBoxIntersections = getAllBoundingBoxIntersections(boxes);

        let contacts = getAllContacts(boundingBoxIntersections);

        const currentInstance = this;
        function animate() {
            currentInstance.animationRequestID = requestAnimationFrame(animate);

            const toBeRemoved: any[] = [];

            // get bounding box intersections
            boundingBoxIntersections = getAllBoundingBoxIntersections(boxes);

            // get contacts
            contacts = getAllContacts(boundingBoxIntersections);

            // resolve contacts
            for (let contact of contacts) {
                resolveCollision(contact);
            }

            // physics step
            for (let box of boxes) {
                box.integrate(1/60);
            }

            // graphics step
            for (let box of boxes) {
                // update position and rotation of the box mesh
                box.updateMesh();
                box.updateBoundingBoxMesh();

                // clear bounding box color
                box.mesh.material = new THREE.MeshPhongMaterial({ color: 0x00bcd6 });
                box.mesh.material.transparent = true;
                box.mesh.material.opacity = 0.6;
                box.boundingBoxMesh.material = new THREE.LineBasicMaterial({ color: 0xffffff });
            }

            // color the bound boxes of intersecting boxes
            /*
            for (let i = 0; i < boundingBoxIntersections.length; i++) {
                const a = boundingBoxIntersections[i].a;
                const b = boundingBoxIntersections[i].b;
                a.boundingBoxMesh.material = new THREE.LineBasicMaterial({ color: 0xff0000 });
                b.boundingBoxMesh.material = new THREE.LineBasicMaterial({ color: 0xff0000 });

                // check for collisions and color them
                if (checkCollision(a, b)) {
                    const red_material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
                    red_material.transparent = true;
                    red_material.opacity = 0.6;
                    a.mesh.material = red_material;
                    b.mesh.material = red_material;
                }
            }*/

            
            /*
            for (let i = 0; i < contacts.length; i++) {
                let origin = new Vector3(0, 0, 0);
                if (contacts[i].type === "vertex-face") {
                    const sphere_geometry = new THREE.SphereGeometry(1);
                    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
                    const sphere = new THREE.Mesh(sphere_geometry, material);
                    sphere.position.set(contacts[i].contactPoint.x, contacts[i].contactPoint.y, contacts[i].contactPoint.z);
                    origin = contacts[i].contactPoint;
                    scene.add(sphere);
                    toBeRemoved.push(sphere);
                } else if (contacts[i].type === "edge-edge") {
                    const a_points = [contacts[i].edge_a.a, contacts[i].edge_a.b];
                    const b_points = [contacts[i].edge_b.a, contacts[i].edge_b.b];
                    const material = new THREE.LineBasicMaterial({color: 0xffff00});
                    const geometry_a = new THREE.BufferGeometry().setFromPoints(a_points);
                    const geometry_b = new THREE.BufferGeometry().setFromPoints(b_points);
                    const line_a = new THREE.Line(geometry_a, material);
                    const line_b = new THREE.Line(geometry_b, material);
                    scene.add(line_a);
                    scene.add(line_b);
                    toBeRemoved.push(line_a);
                    toBeRemoved.push(line_b);
                }
                const dir = contacts[i].contactNormal.clone().normalize();
                const length = 20;
                const hex = 0xffff00;
                const arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
                scene.add(arrowHelper);
                toBeRemoved.push(arrowHelper);
            }*/

            currentInstance.renderer.render(scene, camera);

            for (let object of toBeRemoved) {
                scene.remove(object);
            }
        }
        animate();
    }

    onRestart(): void {
        this.initialize();
        this.onVisualize();
    }

    onResume(): void {
        this.onVisualize();
    }

    onPause(): void {
        // cancel ongoing animation
        if (this.animationRequestID) {
            cancelAnimationFrame(this.animationRequestID);
        }
    }

    render() {
        return (
            <div className="playground">
                <h2>Playground 6 page desu...</h2>
                <button onClick={this.onRestart}>Restart</button>
                <button onClick={this.onResume}>Resume</button>
                <button onClick={this.onPause}>Pause</button>
                <div id="canvas_container">
                    <canvas ref={this.canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
                </div>
            </div>
        )
    }
}