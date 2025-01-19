# RealTime_Avatar_Mimicry

🎭 RealTime Avatar Mimicry
📜 Description
RealTime Avatar Mimicry is a live motion capture project that uses Mediapipe to extract landmarks and animates a 3D avatar to replicate human movements in real time. The project focuses on face and pose mimicry for creating immersive and interactive experiences.

✨ Features
📸 Live Landmark Extraction:

Utilizes the Mediapipe API by Google to extract pose and facial landmarks directly from a live camera feed.
🔢 Bone Angle Calculations:

For pose rotation, calculates angles between bones in 3D space using x, y, z axes.
Applies the tanh function to determine accurate bone rotations for realistic motion.
🕺 Real-Time Avatar Mimicry:

Translates facial movements and pose data into smooth, real-time animations for a 3D avatar, making it mimic the user’s movements dynamically.
🚀 How It Works
Landmark Extraction:
Mediapipe is used to extract facial and pose landmarks in real time.

Angle Calculation:

For each bone, the rotation angles are calculated using vector math in 3D space.
Tanh functions are applied to ensure smooth and precise movements.
Avatar Animation:
The calculated rotations are applied to the 3D avatar bones, creating real-time mimicry.


🌟 Future Enhancements
Add support for hand gestures and finer movements.
Optimize performance for low-latency mimicry.
Develop an intuitive UI for non-developers.
Expand compatibility with additional 3D formats and APIs.
🙌 Contributions
Feel free to fork the repository, create issues, or make pull requests to contribute to the project. All contributions are welcome!

📧 Contact
For questions or feedback, contact: priyanshuy2005@gmail.com
