import React from "react";
import * as THREE from "three";
import { OrbitControls } from "three-orbitcontrols-ts";
import { Matrix4, Vector3 } from "three";
import { World, Sphere, Box, Plane } from "../physics_engine/physics_engine";

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

export default class Demo3 extends React.Component {
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
        const s = new Sphere(new Vector3(-70, 0, 40), 8);
        s.velocity = new Vector3(30, 0, 0);

        this.w.addObject(s);

        // add pyramid of boxes
        let height = 7.5;
        for (let i = 0; i < 2 ; i++) {
            for (let j = 0; j < 2; j++) {
                const box = new Box(new Vector3(i * 25 + 5, j*17 - 7.5, height), 15, 15, 20);
                this.w.addObject(box);
            }
        }
        height += 15;
        const box1 = new Box(new Vector3(15, 0, height), 14, 14, 15);
        // this.w.addObject(box1);
        height += 15;
        
        const wall = new Box(new Vector3(50, 0, 25), 5, 80, 50);

        this.w.addObject(wall);

        // rotating cubes on corners
        const corners = [];
        corners.push(new Vector3(-55, 55, 40), new Vector3(-55, -55, 40), new Vector3(55, 55, 40), new Vector3(55, -55, 40));
        for (let corner of corners) {
            const rotatingCube = new Box(corner, 10, 10, 10);
            rotatingCube.angularMomentum = new Vector3(1, 1, 5).applyMatrix3(rotatingCube.getInertia());
            this.w.addObject(rotatingCube);
        }

        // add some bouncing balls at the top and bottom
        const sides =[];
        sides.push(new Vector3(0, 55, 40), new Vector3(0, -55, 40));
        for (let side of sides) {
            const bouncingBall = new Sphere(side, 5);
            this.w.addObject(bouncingBall);
        }

        // add plane
        const plane = new Plane(new Vector3(0, 0, 0), new Vector3(0, 0, 1), 1000, 1000);
        this.w.addObject(plane);

        // add object meshes and bounding box meshes to scene
        for (let object of this.w.objects) {
            this.scene.add(object.mesh);
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

        let boundingBoxIntersections;
        let contacts;

        const currentInstance = this;
        function animate() {
            currentInstance.animationRequestID = requestAnimationFrame(animate);

            // add gravity
            for (let object of objects) {
                if (object instanceof Plane) {
                    continue;
                }

                const mass = 1/object.inverseMass;
                object.forceAccum.addScaledVector(new Vector3(0, 0, -1), mass * 10);
            }

            world.tick(1/60);

            // graphics step
            world.updateMeshes();

            currentInstance.renderer.render(scene, camera);
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
            <div className="demo2">
                <h2>Demo 3</h2>
                <p>This scene shows how the physics engine simulates constrained dynamics. The sphere, set with some initial velocity, is launched into a small pile of cubes, and all objects are accelerated by the force of gravity. The engine may be extended to become part of physics-based game, such as one involving ballistics.</p>
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