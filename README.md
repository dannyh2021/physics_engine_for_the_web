# physics_engine_for_the_web

## About the Project
In order to challenge myself and improve my skills, I tried designing and implementing a simple rigid-body dynamics physics engine. This is probably the most difficult and time-consuming coding project I've pursued thus far, but I feel that it's been worthwhile. I gained insight into how physics engines worked, and it was also rewarding to apply concepts I've learned before (such vectors, matrices, and quaternions) towards a tangible product. You can view a visual demo on https://physics-engine-fa69e.web.app/, where I set up a few scenes that simulate objects using the physics engine.

## Built with
* Language: Typescript
* [Three.js](https://threejs.org) (for the 3D web graphics and some helpful math classes).
* React (for the demo website)
* NodeJS and Express (simple server to host the demo)

## How it Works
There are three classes, Box, Sphere, and Plane, that represent rigid body objects that can be simulated. Each class holds information describing the state of an object, such as it's inverse mass, position, velocity, accumulated force, orientation, angular momentum, and bounding box. They also contain Three.js Mesh objects that can be used for visualization.

The main class is the World class. To use the engine, one would create a new instance of the World class. Then, you can create objects, set their initial states, and add them to the World class. The World class also holds constants that can be modified, such as the constant of restitution. That's it for the intialization. During the simulation loop, there a few functions from the World class to be called at each timestep, which can apply forces and integrate objects' positions/orientations or update their meshes.

There is also a math-library file, which includes a handful of auxiliary linear algebra functions I ended up implementing for the project.

A typical simulation using the engine essentially works as follows:
* Initially, the World instance is created and set with its objects and initial state.
* At each time step, the engine updates the velocities based on the forces accumulated by objects during some frame and resets the forces accumulated.
* The engine first checks for bounding box intersections, going through the objects using a sort and sweep algorithm. If two objects' bounding boxes intersect, another function is run that check if the objects actually collide. If two objects collide, contact data needed to resolve the collision is returned. Finally, the collisions are tested to see if they are colliding collisions and applies an impulse to each object if needed.
* Once collisions are detected and resolved, each objects orientation and position are updated by another integration tick.

## Room for Improvement
* Currently, there are three types of objects that are simulated. More simple shapes can be added and the collision detection algorithm (using separating axes) can be extended to work for any convex polyhedra. However, more complex shapes would probably require a different approach.
* Currently, only one contact point is generated for each collision even though intersecting objects can have multiple points of contact. Thus, a function to generate the complete contact manifold (perhaps using the GJK algorithm instead) and resolve multiple contact points at once would increase the accuracy of the simulation.
* Currently, collisions are detected and resolved on the same frame. For increased accuracy, one can calculate the time of collision t_c and rewind the simulation t_c before resuming the collision so that collisions are resolve exactly when they happen. One way to find t_c is to use a bisection algorithm.
* As of now, the engine treats colliding and resting collisions the same, by applying small impulse to keep objects separate. A better approach would be to treat resting collisions differently, which might increase stability and allow friction to be simulated as well.
* Finally, more tests could be written to improve stability and some of the code could be rewritten for optimization.

## Some References I Found Helpful

* [<em>Rigid Body Dynamics Lecture Notes 1 (Unconstrained Motion)</em>, David Baraff](https://www.cs.cmu.edu/~baraff/sigcourse/notesd1.pdf)
* [<em>Rigid Body Dynamics Lecture Notes 2 (Constrained Motion)</em>, David Baraff](https://www.cs.cmu.edu/~baraff/sigcourse/notesd2.pdf)
* ["Rigid Body Collision Response", Ladislav Kavan](https://www.cs.utah.edu/~ladislav/kavan03rigid/kavan03rigid.pdf)
* <em>Real-Time Collision Detection</em>, Christer Ericson
* <em>Game Physics Engine Development</em>, Ian Millington
* <em>Visualizing Quaternions</em>, Andrew J. Hanson
