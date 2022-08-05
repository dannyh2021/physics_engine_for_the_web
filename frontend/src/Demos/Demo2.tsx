import React from "react";
import { World, Sphere, Box, Plane, checkCollision, getAllContacts, resolveCollision } from "../physics_engine/physics_engine";
import * as THREE from "three";
import { Matrix3, Scene, Vector3 } from "three";
import { OrbitControls } from "three-orbitcontrols-ts";
import { yRotationMatrix3, zRotationMatrix3, convertMatrix3ToMatrix4, xRotationMatrix3, getQuaternionRotatingV1ToV2 } from "../physics_engine/math_library";

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
point_light.position.set(10, 10, 50);

const ambient_light = new THREE.AmbientLight(light_color, 0.2);

export default class Demo2 extends React.Component {
    private canvasRef: any;

    private w: World;

    private renderer: any;
    private animationRequestID: any;
    private scene: THREE.Scene;

    constructor(props: any) {
        super(props);
        this.canvasRef = React.createRef();
        this.w = new World();

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

    componentWillUnmount() {
        if(this.renderer) {
            this.renderer = null;
        }

        if (this.animationRequestID) {
            cancelAnimationFrame(this.animationRequestID);
        }
    }

    initialize(): void {
        // cancel ongoing animation
        if (this.animationRequestID) {
            cancelAnimationFrame(this.animationRequestID);
        }

        this.w = new World();
        this.scene = new THREE.Scene();

        // set up objects
        const sphere = new Sphere(new Vector3(-50, 10, 10), 5);
        sphere.velocity = new Vector3(15, 0, 0);
        const sphere2 = new Sphere(new Vector3(-20, 10, 10), 5);
        const sphere3 = new Sphere(new Vector3(10, 10, 10), 5);
        const box = new Box(new Vector3(30, 10, 10), 10, 10, 10);
        
        this.w.addObject(sphere);
        this.w.addObject(sphere2);
        this.w.addObject(sphere3);
        this.w.addObject(box);

        const box2 = new Box(new Vector3(-50, -20, 10), 10, 10, 10);
        box2.velocity.x = 15;
        const box3 = new Box(new Vector3(-20, -20, 10), 10, 10, 10);
        box3.rotation.setFromUnitVectors(new Vector3(1, 1, 1).normalize(), new Vector3(1, 0, 0));
        const box4 = new Box(new Vector3(10, -20, 10), 10, 10, 10);
        const sphere4 = new Sphere(new Vector3(30, -20, 10), 5);

        this.w.addObject(box2);
        this.w.addObject(box3);
        this.w.addObject(box4);
        this.w.addObject(sphere4);

        // add plane
        const plane = new Plane(new Vector3(55, 0, 0), new Vector3(-1, 0, 0), 1000, 1000);
        this.w.addObject(plane);

        // add object meshes and bounding box meshes to scene
        for (let object of this.w.objects) {
            this.scene.add(object.mesh);

            if (object instanceof Plane) {
                continue;
            }
            this.scene.add(object.boundingBoxMesh);
        }

        // add gridHelper
        const gridHelper = new THREE.GridHelper( 100, 10 );
        gridHelper.rotateOnWorldAxis(new Vector3(1, 0, 0), Math.PI/2);
        this.scene.add(gridHelper);

        // add lighting
        this.scene.add(point_light, ambient_light);
    }

    onVisualize() {
        // cancel ongoing animation
        if (this.animationRequestID) {
            cancelAnimationFrame(this.animationRequestID);
        }

        const renderer = this.renderer;
        const scene = this.scene;
        const world = this.w;
        const objects = world.objects;

        let boundingBoxIntersections;
        let contacts;

        const currentInstance = this;
        function animate() {
            currentInstance.animationRequestID = requestAnimationFrame(animate);

            // update bounding box intersections and contacts, for visualization
            boundingBoxIntersections = world.getAllBoundingBoxIntersections();
            contacts = getAllContacts(boundingBoxIntersections);

            // resolve contacts
            for (let contact of contacts) {
                resolveCollision(contact);
            }

            // physics step
            world.integrateObjects(1/60);

            // graphics step
            world.updateMeshes();

            // reset mesh colors
            for (let object of objects) {
                object.mesh.material = new THREE.MeshPhongMaterial({ color: 0x00bcd6 })
                object.mesh.material.opacity = 0.6;
                object.mesh.material.transparent = true;

                if (object instanceof Plane) {
                    object.mesh.material = new THREE.MeshPhongMaterial({ color: 0xffcb3e });
                    continue;
                }
                object.boundingBoxMesh.material = new THREE.LineBasicMaterial({ color: 0xffffff });
            }

            // color the bound boxes of intersecting boxes
            for (let intersection of boundingBoxIntersections) {
                const a = intersection.a, b = intersection.b;
                if (!(a instanceof Plane) && ! (b instanceof Plane)) {
                    a.boundingBoxMesh.material = new THREE.LineBasicMaterial({ color: 0xff0000 });
                    b.boundingBoxMesh.material = new THREE.LineBasicMaterial({ color: 0xff0000 });
                }

                // check for collisions and color them
                if (checkCollision(a, b)) {
                    const red_material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
                    red_material.opacity = 0.6;
                    red_material.transparent = true;
                    a.mesh.material = red_material;
                    b.mesh.material = red_material;
                }
            }

            const toBeRemoved: any[] = [];

            for (let contact of contacts) {
                const sphere_geometry = new THREE.SphereGeometry(1);
                const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
                const sphere = new THREE.Mesh(sphere_geometry, material);
                sphere.position.set(contact.contactPoint.x, contact.contactPoint.y, contact.contactPoint.z);
                scene.add(sphere);
                toBeRemoved.push(sphere);
                const dir = contact.contactNormal.clone().normalize();
                const origin = contact.contactPoint;
                const length = 20;
                const hex = 0xffff00;
                const arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
                scene.add(arrowHelper);
                toBeRemoved.push(arrowHelper);

                if (contact.type === "vertex-face") {

                } else if (contact.type === "edge-edge") {
                    const a_points = [contact.edge_a.a, contact.edge_a.b];
                    const b_points = [contact.edge_b.a, contact.edge_b.b];
                    const material = new THREE.LineBasicMaterial({color: 0xffff00});
                    const geometry_a = new THREE.BufferGeometry().setFromPoints(a_points);
                    const geometry_b = new THREE.BufferGeometry().setFromPoints(b_points);
                    const line_a = new THREE.Line(geometry_a, material);
                    const line_b = new THREE.Line(geometry_b, material);
                    scene.add(line_a);
                    scene.add(line_b);
                    toBeRemoved.push(line_a);
                    toBeRemoved.push(line_b);
                } else {
                    console.error("contact type not recognized");
                }
            }

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
                <h2>Demo 2</h2>
                <p>This scene shows how the physics engine detects and resolves collisions between spheres, boxes, and planes. At each time step, the engine first checks for all bounding box intersections using a sort and sweep algorithm. Then, the engine checks each bounding box intersection for collisions using the separating axis technique. If a collision is detected, contact data is generated that includes the information needed to resolve the collision. Finally, all colliding collisions are resolved by calculating and applying an impulse.</p>
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