import React from "react";
import { World } from "../physics_engine/physics_engine";
import * as THREE from "three";
import { OrbitControls } from "three-orbitcontrols-ts";
import { Box } from "../physics_engine/Box";
import { Sphere } from "../physics_engine/Sphere";
import { Vector3 } from "three";

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 500;

// camera
const camera = new THREE.PerspectiveCamera(45, CANVAS_WIDTH / CANVAS_HEIGHT, 1, 1000);
camera.position.set(0, 0, CANVAS_HEIGHT / 4);
camera.up.set(0, 1, 0);

// add lighting
const light_color = 0xffffff;
const intensity = 1;
const point_light = new THREE.PointLight(light_color, intensity);
point_light.position.set(10, 10, 10);

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

        this.onStart = this.onStart.bind(this);
        this.onStop = this.onStop.bind(this);
        this.onTest = this.onTest.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    componentDidMount(): void {
        this.w = new World();

        // graphics
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvasRef.current, alpha: false })
        this.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);

        // orbit controls
        const controls = new OrbitControls(camera, this.renderer.domElement);

        this.onVisualize();
    }

    onStart() {
        // this.w.startGameLoop();
    }

    onStop() {
        console.log('hi');
    }

    onTest() {
        console.log("onTest");
        const objects = this.w.objects;
        for (let i = 0; i < objects.length; i++) {
            console.log(i, objects[i].position);
        }
    }

    onKeyDown(e: any) {
        /*
        if (e.key === "ArrowLeft") {
            this.w.updateCharacterForce(new Vector3(-100, 0, 0));
        } else if (e.key === "ArrowRight") {
            this.w.updateCharacterForce(new Vector3(100, 0, 0));
        } else if (e.key === "ArrowUp") {
            this.w.updateCharacterForce(new Vector3(0, 100, 0));
        } else if (e.key === "ArrowDown") {
            this.w.updateCharacterForce(new Vector3(0, -100, 0));
        }*/
    }

    onVisualize() {
        // cancel ongoing animation
        if (this.animationRequestID) {
            cancelAnimationFrame(this.animationRequestID);
        }

        // create scene and add lighting
        // const scene = new THREE.Scene();
        // scene.add(point_light, ambient_light);

        // const sphere_geometry = new THREE.SphereGeometry(3);
        // const material = new THREE.MeshPhongMaterial({ color: 0x00bcd6 });

        // const spheres = [];
        // const sphere = new THREE.Mesh(sphere_geometry, material);
        // sphere.position.set(2, 0, 0);
        // spheres.push(sphere);
        // scene.add(sphere);

        const currentInstance = this;
        function animate() {
            currentInstance.animationRequestID = requestAnimationFrame(animate);

            const scene = new THREE.Scene();
            scene.add(point_light, ambient_light);

            const objects = currentInstance.w.objects;
            for (let object of objects) {
                if (object instanceof Sphere) {
                    const sphere_geometry = new THREE.SphereGeometry(object.radius);
                    const material = new THREE.MeshPhongMaterial({ color: 0x00bcd6 });

                    const sphere = new THREE.Mesh(sphere_geometry, material);
                    sphere.position.set(object.position.x, object.position.y, object.position.z);
                    scene.add(sphere);
                }
            }

            // add gridHelper
            const gridHelper = new THREE.GridHelper( 100, 10 );
            gridHelper.rotateOnWorldAxis(new Vector3(1, 0, 0), Math.PI / 2);
            scene.add(gridHelper);
            
            camera.lookAt(0, 0, 0);

            currentInstance.renderer.render(scene, camera);
        }

        animate();
    }

    render() {
        return (
            <div className="home"
                onKeyDown={ this.onKeyDown } >
                <h2>Home page desu...</h2>
                <button onClick={this.onStart}>Start</button>
                <button onClick={this.onStop}>Stop</button>
                <button onClick={this.onTest}>Test</button>
                <div id="canvas_container">
                    <canvas ref={this.canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
                </div>
            </div>
        )
    }
}