import { useEffect } from 'react';
import './App.css';
import { Canvas, useFrame, useGraph } from '@react-three/fiber';
import { Color, Euler, Matrix4, Vector3 } from 'three';
import { FaceLandmarker, FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { useGLTF } from '@react-three/drei';

let video: HTMLVideoElement;
let faceLandmarker: FaceLandmarker;
let poseLandmarker: PoseLandmarker;
let lastVideoTime = -1;
let frameCount = 0; // For generating strictly increasing timestamps
let headMesh: any;

let faceRotation: Euler | null = null; // For face rotation
let poseRotation: any = null; // For pose landmark data

function App() {
  const handleOnChange = () => {
    // Handle avatar selection logic here
  };

  // Initialize video and landmarker models
  const setup = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    // Initialize FaceLandmarker
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU',
      },
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
      runningMode: 'VIDEO',
    });

    // Initialize PoseLandmarker
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
    });

    // Setup video stream
    video = document.getElementById('video') as HTMLVideoElement;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      video.srcObject = stream;
    } catch (error) {
      console.error('Error accessing the camera:', error);
      alert('Could not access the camera. Please check your permissions and try again.');
    }

    video.addEventListener('loadeddata', () => {
      // Start prediction loop after video is ready
      setTimeout(predict, 100);
    });
  };

  // Function to calculate rotation angles for the shoulder
  const calculateShoulderRotation = (
    joint12: { x: number; y: number; z: number },
    joint14: { x: number; y: number; z: number }
  ) => {
    const shoulder = new Vector3(joint12.x, joint12.y, joint12.z);
    const elbow = new Vector3(joint14.x, joint14.y, joint14.z);

    // Calculate the direction vector from the shoulder to the elbow
    const direction = new Vector3().subVectors(elbow, shoulder).normalize();

    // Use atan2 to calculate the angles
    const rotationX = Math.atan2(direction.y, direction.z); // Rotation around the X-axis
    const rotationY = Math.atan2(direction.x, direction.z); // Rotation around the Y-axis
    const rotationZ = Math.atan2(direction.x, direction.y); // Rotation around the Z-axis

    return new Euler(rotationX, rotationY, rotationZ);
  };

  // Prediction loop to process video frames
  const predict = () => {
    const nowInMs = frameCount * 33.3; // Generate increasing timestamps (30 FPS assumed)
    frameCount++;

    if (lastVideoTime !== video.currentTime) {
      lastVideoTime = video.currentTime;

      try {
        
        // Perform face landmark detection
        const faceResult = faceLandmarker.detectForVideo(video, nowInMs);
        if (
          faceResult.facialTransformationMatrixes &&
          faceResult.facialTransformationMatrixes.length > 0
        ) {
          const matrix = new Matrix4().fromArray(faceResult.facialTransformationMatrixes[0].data);
          faceRotation = new Euler().setFromRotationMatrix(matrix);
        }

        // Perform pose landmark detection
        const poseResult = poseLandmarker.detectForVideo(video, nowInMs);

        if (poseResult.landmarks && poseResult.landmarks.length > 0) {
          poseRotation = poseResult.landmarks;
        }
      } catch (error) {
        console.error('Error during prediction:', error);
      }
    }

    requestAnimationFrame(predict);
  };

  useEffect(() => {
    setup();
  }, []);

  // Avatar component for rendering the 3D model
  function Avatar() {
    const avatar = useGLTF('/Model.glb');
    const { nodes } = useGraph(avatar.scene);

    useEffect(() => {
      headMesh = nodes.Wolf3D_Avatar;

      // Log nodes data once when the component mounts
      console.log('Nodes data:', nodes);

      return () => {
        headMesh = null; // Cleanup when component unmounts
      };
    }, [nodes]);

    useFrame(() => {
      if (nodes && faceRotation) {
        // Apply face rotation
        nodes.Head.rotation.set(faceRotation.x, faceRotation.y, faceRotation.z);
        nodes.Neck.rotation.set(faceRotation.x, faceRotation.y, faceRotation.z);
      }

      if (nodes && poseRotation) {

        // Right Hand
        const joint12 = poseRotation[0][12]; 
        const joint14 = poseRotation[0][14]; 
        const joint16 = poseRotation[0][16];

        // Left Hand
        const joint11 = poseRotation[0][11];
        const joint13 = poseRotation[0][13];
        const joint15 = poseRotation[0][15];

        applyBoneRotation(joint12, joint14, nodes.RightShoulder);
        applyBoneRotation(joint12, joint14, nodes.RightForeArm);

        applyBoneRotation(joint11, joint13, nodes.LeftArm);
        applyBoneRotation(joint13, joint15, nodes.LeftForeArm);


      } else if (nodes) {
        // Reset the rotation if poseRotation is null
        nodes.RightShoulder.rotation.set(0, 0, 0);
        nodes.RightArm.rotation.set(0,0,0);
        nodes.LeftArm.rotation.set(0,0,0);
        nodes.LeftShoulder.rotation.set(0, 0, 0);
      }
    });

    return <primitive object={avatar.scene} position={[0, -1, 3]} />;
  }

  function applyBoneRotation(
    parentJoint: { x: number; y: number; z: number; visibility: number },
    childJoint: { x: number; y: number; z: number; visibility: number },
    boneNode: any
  ) {
    if (
      parentJoint && childJoint &&
      parentJoint.visibility > 0.5 && childJoint.visibility > 0.5
    ) {
      // console.log('Detected joints:', { parentJoint, childJoint });

      const boneRotation = calculateShoulderRotation(parentJoint, childJoint);

      // console.log('Calculated Bone Rotation:', {
      //   x: boneRotation.x,
      //   y: boneRotation.y,
      //   z: boneRotation.z,
      // });

      // Apply the calculated rotation to the specified bone
      boneNode.rotation.set(
        boneRotation.x,
        boneRotation.y,
        boneRotation.z
      );
    } else {
      // Reset the rotation if visibility is not sufficient
      boneNode.rotation.set(0, 0, 0);
    }
  }

  return (
    <div className="App" style={{ position: 'relative', height: '100vh', width: '100vw' }}>
      <Canvas id="canvas" style={{ height: '100%', width: '100%' }}>
        <ambientLight intensity={1.5} />
        <pointLight position={[1, 1, 1]} color={new Color(1, 0, 0)} intensity={1.5} />
        <pointLight position={[-1, 0, 1]} color={new Color(0, 1, 0)} intensity={1.5} />
        <Avatar />
      </Canvas>
      <div
        id="video-popup"
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          width: '200px',
          height: '150px',
          border: '2px solid #ccc',
          backgroundColor: '#000',
          zIndex: 10,
          cursor: 'move',
        }}
      >
        <video autoPlay id="video" style={{ width: '100%', height: '100%' }}></video>
      </div>
    </div>
  );
}

export default App;
