import React from "react";
import { checkBoundingBoxIntersection, World } from "../physics_engine/physics_engine";
import * as THREE from "three";
import { Matrix3, Scene, Vector3 } from "three";
import { Sphere } from "../physics_engine/Sphere";
import { Box } from "../physics_engine/Box";
import { OrbitControls } from "three-orbitcontrols-ts";
import { getEulerAngles, xRotationMatrix3, yRotationMatrix3, zRotationMatrix3, convertMatrix3ToMatrix4 } from "../physics_engine/math_library";

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

export default class Playground4 extends React.Component {
    private canvasRef: any;
    private renderer: any;
    private animationRequestID: any;

    constructor(props: any) {
        super(props);
        this.canvasRef = React.createRef();

        // graphics
        this.renderer = null;
        this.animationRequestID = null;
    }

    componentDidMount(): void {
        // graphics
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvasRef.current, alpha: false })
        this.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);

        // orbit controls
        const controls = new OrbitControls(camera, this.renderer.domElement);

        this.onVisualize();
    }

    onVisualize() {
        // cancel ongoing animation
        if (this.animationRequestID) {
            cancelAnimationFrame(this.animationRequestID);
        }

        // set up objects
        const b = new Box(new Vector3(0, 0, 20), 30, 5, 5);
        const b2 = new Box(new Vector3(40, 20, 20), 5, 5, 20);
        const b3 = new Box(new Vector3(-40, 20, 20), 30, 5, 5);

        const b4 = new Box(new Vector3(-70, 10, 20), 5, 5, 5);
        b4.velocity = new Vector3(20, 0, 0);

        const boxes = [b, b2, b3, b4];

        // graphics set up
        // set up scene
        const scene = new THREE.Scene();

        // create box meshes
        //const meshes: any[] = []
        for (let box of boxes) {
            const mesh = box.mesh;
            //meshes.push(mesh);
            scene.add(mesh);
            
            // add bounding box mesh
            scene.add(box.boundingBoxMesh)
        }

        // add lighting
        scene.add(point_light, ambient_light);

        // add gridHelper
        const gridHelper = new THREE.GridHelper( 100, 10 );
        gridHelper.rotateOnWorldAxis(new Vector3(1, 0, 0), Math.PI / 2);
        scene.add(gridHelper);

        // let boundingBoxIntersections = getAllBoundingBoxIntersections(boxes);

        const currentInstance = this;
        function animate() {
            currentInstance.animationRequestID = requestAnimationFrame(animate);

            // physics step
            for (let box of boxes) {
                box.integrate(1/60);
            }

            // get bounding box intersections
            // boundingBoxIntersections = getAllBoundingBoxIntersections(boxes);

            // graphics step
            for (let box of boxes) {
                // update position and rotation of the box mesh
                box.updateMesh();
                box.updateBoundingBoxMesh();

                // clear bounding box color
                box.boundingBoxMesh.material = new THREE.LineBasicMaterial({ color: 0xffffff });
            }

            // color the bound boxes of intersecting boxes
            /*
            for(let i = 0; i < boundingBoxIntersections.length; i++) {
                const a = boundingBoxIntersections[i].a;
                const b = boundingBoxIntersections[i].b;
                a.boundingBoxMesh.material = new THREE.LineBasicMaterial({ color: 0xff0000 });
                b.boundingBoxMesh.material = new THREE.LineBasicMaterial({ color: 0xff0000 });
            }*/
            currentInstance.renderer.render(scene, camera);
        }
        animate();
    }

    render() {
        return (
            <div className="playground">
                <h2>Playground 4 page desu...</h2>
                <div id="canvas_container">
                    <canvas ref={this.canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
                </div>
            </div>
        )
    }
}