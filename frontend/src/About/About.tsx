import React from "react";
import { World } from "../physics_engine/physics_engine";
import * as THREE from "three";
import { OrbitControls } from "three-orbitcontrols-ts";
import { Box } from "../physics_engine/Box";
import { Sphere } from "../physics_engine/Sphere";
import { Vector3 } from "three";

import "./About.css";

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 200;

// camera
const camera = new THREE.PerspectiveCamera(45, CANVAS_WIDTH / CANVAS_HEIGHT, 1, 1000);
camera.position.set(0, 0, CANVAS_HEIGHT / 4);
camera.up.set(0, 1, 0);

// add lighting
const light_color = 0xffffff;
const intensity = 1;
const point_light = new THREE.PointLight(light_color, intensity);
point_light.position.set(0, 0, 50);

const ambient_light = new THREE.AmbientLight(light_color, 0.2);

export default class Home extends React.Component {
    canvasRef: any;
    private w: World;
    private renderer: any;
    private animationRequestID: any;

    constructor(props: any) {
        super(props);
        this.canvasRef = React.createRef();
        this.w = new World();

        // graphics
        this.renderer = null;
        this.animationRequestID = null;
    }

    componentDidMount(): void {
        this.w = new World();

        // graphics
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvasRef.current, alpha: true })
        this.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);

        // orbit controls
        // const controls = new OrbitControls(camera, this.renderer.domElement);

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

    onVisualize() {
        // cancel ongoing animation
        if (this.animationRequestID) {
            cancelAnimationFrame(this.animationRequestID);
        }

        this.w = new World();

        const box = new Box(new Vector3(0, 0, 0), 15, 15, 15);
        box.angularMomentum = new Vector3(2, 2, 1).applyMatrix3(box.getInertia());
        this.w.addObject(box);

        const boxMesh = box.mesh;
        
        const scene = new THREE.Scene();
        scene.add(boxMesh);
        scene.add(point_light, ambient_light);

        const currentInstance = this;
        function animate() {
            currentInstance.animationRequestID = requestAnimationFrame(animate);

            currentInstance.w.integrateObjects(1/60);
            currentInstance.w.updateMeshes();

            currentInstance.renderer.render(scene, camera);
        }

        animate();
    }

    render() {
        return (
            <div className="about" >
                <h2>About</h2>
                <p>Hello. I recently created a simpe rigid-body physics engine as a personal project.
                     This site is meant to serve as a visual demo to showcase its functionality. </p>
                <p>For anyone interested, the source code is available on the <a href="https://github.com/dannyh2021/physics_game_engine" target="_blank">Github repo</a>.</p>
                <div id="canvas_container">
                    <canvas ref={this.canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
                </div>
            </div>
        )
    }
}