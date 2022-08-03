import React from "react";
import { checkBoundingBoxIntersection, World, checkCollision } from "../physics_engine/physics_engine";
import * as THREE from "three";
import { Matrix3, MeshPhongMaterial, Vector3 } from "three";
import { Sphere } from "../physics_engine/Sphere";
import { Box } from "../physics_engine/Box";
import { OrbitControls } from "three-orbitcontrols-ts";

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
point_light.position.set(50, 50, 50);

const ambient_light = new THREE.AmbientLight(light_color, 0.2);

export default class Playground5 extends React.Component {
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
        const b = new Box(new Vector3(0, 0, 20), 30, 5, 5);
        const b2 = new Box(new Vector3(-30, 20, 20), 5, 5, 20);
        const b3 = new Box(new Vector3(30, 10, 20), 10, 10, 10);

        const b4 = new Box(new Vector3(-70, 10, 20), 5, 5, 5);
        b4.velocity = new Vector3(20, 0, 0);

        const b5 = new Box(new Vector3(30, -30, 20), 5, 10, 20);

        this.boxes = [b, b2, b3, b4, b5];

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

        //let boundingBoxIntersections = getAllBoundingBoxIntersections(boxes);

        const currentInstance = this;
        function animate() {
            currentInstance.animationRequestID = requestAnimationFrame(animate);

            // physics step
            for (let box of boxes) {
                box.integrate(1/60);
            }

            // get bounding box intersections
            //boundingBoxIntersections = getAllBoundingBoxIntersections(boxes);

            // graphics step
            for (let box of boxes) {
                // update position and rotation of the box mesh
                box.updateMesh();
                box.updateBoundingBoxMesh();

                // clear bounding box color
                box.mesh.material = new THREE.MeshPhongMaterial({ color: 0x00bcd6 });
                box.boundingBoxMesh.material = new THREE.LineBasicMaterial({ color: 0xffffff });
            }

            // color the bound boxes of intersecting boxes
            /*
            for(let i = 0; i < boundingBoxIntersections.length; i++) {
                const a = boundingBoxIntersections[i].a;
                const b = boundingBoxIntersections[i].b;
                a.boundingBoxMesh.material = new THREE.LineBasicMaterial({ color: 0xff0000 });
                b.boundingBoxMesh.material = new THREE.LineBasicMaterial({ color: 0xff0000 });

                // check for collisions and color them
                if (checkCollision(a, b)) {
                    const red_material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
                    a.mesh.material = red_material;
                    b.mesh.material = red_material;
                }
            }*/
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
            <div className="playground">
                <h2>Playground 5 page desu...</h2>
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