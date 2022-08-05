import React from "react";
import { World, Sphere, Box } from "../physics_engine/physics_engine";
import * as THREE from "three";
import { Vector3 } from "three";
import { OrbitControls } from "three-orbitcontrols-ts";

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

const ambient_light = new THREE.AmbientLight(light_color, 0.2);

export default class Demo1 extends React.Component {
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
        const sphere = new Sphere(new Vector3(0, 0, 0), 5);
        const sphere2 = new Sphere(new Vector3(30, 20, 40), 3);
        const box = new Box(new Vector3(30, 0, 0), 4, 4, 4);
        const box2 = new Box(new Vector3(-50, 0, 20), 5, 5, 5);
        const box3 = new Box(new Vector3(-40, -40, -20), 2, 2, 8);

        sphere.inverseMass = 1/300000;

        sphere.velocity = new Vector3(0, 0, 0);
        sphere2.velocity = new Vector3(-10, 100, -10);
        box.velocity = new Vector3(0, 150, 0);
        box2.velocity = new Vector3(0, -100, 0);
        box3.velocity = new Vector3(70, 0, -10);

        box.angularMomentum = new Vector3(0, 3, 3).applyMatrix3(box.getInertia());
        box2.angularMomentum = new Vector3(5, 5, 5).applyMatrix3(box2.getInertia());
        box3.angularMomentum = new Vector3(-3, 1, 0).applyMatrix3(box3.getInertia());

        this.w.addObject(sphere);
        this.w.addObject(sphere2);
        this.w.addObject(box);
        this.w.addObject(box2);
        this.w.addObject(box3);

        // add object meshes and bounding box meshes to scene
        for (let object of this.w.objects) {
            this.scene.add(object.mesh);
            //this.scene.add(object.boundingBoxMesh);
        }

        // add gridHelper
        const gridHelper = new THREE.GridHelper( 100, 10 );
        gridHelper.rotateOnWorldAxis(new Vector3(1, 0, 0), Math.PI/2);
        this.scene.add(gridHelper);

        // add lighting
        this.scene.add(point_light, ambient_light);
    }

    onVisualize(): void {
        // cancel ongoing animation
        if (this.animationRequestID) {
            cancelAnimationFrame(this.animationRequestID);
        }

        const renderer = this.renderer;
        const scene = this.scene;
        const world = this.w;
        const objects = world.objects;

        let gravitational_constant = 1;

        const currentInstance = this;
        function animate() {
            currentInstance.animationRequestID = requestAnimationFrame(animate);

            const toBeRemovedFromScene = [];

            // apply forces
            for (let obj1 of objects) {
                if (obj1.inverseMass === 0) {
                    continue;
                }

                const mass1 = 1/obj1.inverseMass;

                for (let obj2 of objects) {
                    const relative_position = obj2.position.clone().sub(obj1.position);
                    if (obj2.inverseMass === 0 || relative_position.length() === 0) {
                        continue;
                    }

                    const mass2 = 1/obj2.inverseMass;
                    const u_12 = relative_position.clone().normalize();
                    const radius_squared = relative_position.length() * relative_position.length();
                    obj1.forceAccum.addScaledVector(u_12, gravitational_constant * mass1 * mass2 / radius_squared)
                    obj2.forceAccum.addScaledVector(u_12, -gravitational_constant * mass1 * mass2 / radius_squared);
                }
            }

            // add arrows to represent force vectors
            for (let object of objects) {
                const direction = object.forceAccum.clone().normalize();
                const length = object.forceAccum.length()/2000;
                const origin = object.position;
                const hex = 0xff5c77;
                const arrow = new THREE.ArrowHelper(direction, origin, length, hex);
                toBeRemovedFromScene.push(arrow);
                scene.add(arrow);
            }

            // physics step
            // world.integrateObjects(1/60);
            world.tick(1/60);
            
            // graphics step
            world.updateMeshes();

            // add arrows to represent velocity vectors
            for (let object of objects) {
                
                const direction = object.velocity.clone().normalize();
                const length = object.velocity.length() / 5;
                const origin = object.position;
                const hex = 0x4dd091;
                const arrow = new THREE.ArrowHelper(direction, origin, length, hex);
                toBeRemovedFromScene.push(arrow);
                scene.add(arrow);
            }

            renderer.render(scene, camera);

            for (let object of toBeRemovedFromScene) {
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
                <h2>Demo 1</h2>
                <p>This scene shows how the physics engine is able to simulate unconstrained motion. At each time step, a gravitational force is applied to each object. Then, each object's position and orientiation is updated based on its velocity and angular momentum.</p>
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