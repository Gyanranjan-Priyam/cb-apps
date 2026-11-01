import type { RoadmapData } from "../../types";

export const roboticsAutomationRoadmap: RoadmapData = {
  id: "robotics-automation",
  slug: "robotics-automation",
  title: "Robotics & Automation",
  description: "Complete, all-in-one guide to Robotics Engineering & Industrial Automation. Master Kinematics & Dynamics (Forward/Inverse, Jacobians), ROS 2 (DDS, Nodes, Actions, URDF), LiDAR SLAM & EKF Sensor Fusion, Autonomous Navigation (Nav2, Costmaps), Motor Control (PID, MPC), and Industrial PLCs (Ladder Logic, Structured Text) without needing external materials.",
  category: "robotics",
  badgeText: "Robotics Track",
  iconName: "Bot",
  version: 2,
  isPublished: true,
  nodes: [
    {
      id: "title-node",
      type: "title",
      position: { x: 550, y: 30 },
      data: { label: "Robotics & Automation Roadmap" },
    },
    // 1. Robot Kinematics & Dynamics
    {
      id: "kinematics-dynamics",
      type: "topic",
      position: { x: 550, y: 120 },
      data: {
        label: "Kinematics, Dynamics & Spatial Math",
        category: "Mathematics & Physics",
        description: `### 🦾 Robot Kinematics & Manipulator Mathematics

Calculate end-effector tool positions and joint velocities for multi-axis robotic arms.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-forward-inverse-kinematics",
      type: "subtopic",
      position: { x: 860, y: 100 },
      data: {
        label: "Forward & Inverse Kinematics (DH Parameters)",
        colorKey: "C",
        description: `### 📐 Denavit-Hartenberg (DH) Transformation Matrix

$$T_i^{i-1} = \\begin{bmatrix} 
\\cos\\theta_i & -\\sin\\theta_i\\cos\\alpha_i & \\sin\\theta_i\\sin\\alpha_i & a_i\\cos\\theta_i \\\\ 
\\sin\\theta_i & \\cos\\theta_i\\cos\\alpha_i & -\\cos\\theta_i\\sin\\alpha_i & a_i\\sin\\theta_i \\\\ 
0 & \\sin\\alpha_i & \\cos\\alpha_i & d_i \\\\ 
0 & 0 & 0 & 1 
\\end{bmatrix}$$

- **Forward Kinematics (FK)**: Calculates tool pose $(x, y, z, \\text{roll}, \\text{pitch}, \\text{yaw})$ given joint angles $(\\theta_1, \\theta_2, \\dots, \\theta_n)$.
- **Inverse Kinematics (IK)**: Computes required joint angles to reach a target spatial coordinate (solved via analytical geometric equations or numerical Jacobian damping).
`,
      },
    },
    {
      id: "sub-jacobians-dynamics",
      type: "subtopic",
      position: { x: 860, y: 150 },
      data: {
        label: "Jacobians, Singularities & Euler-Lagrange Dynamics",
        colorKey: "C",
        description: `### ⚡ Velocity Jacobian & Singularity Avoidance

$$v = J(\\theta) \\cdot \\dot{\\theta}$$

- Relates joint velocities $\\dot{\\theta}$ directly to end-effector Cartesian linear and angular velocities $v$.
- **Kinematic Singularity**: When $\\det(J) = 0$, the robot loses one or more degrees of freedom, requiring infinite joint speeds to move in specific directions!
`,
      },
    },

    // 2. Robot Operating System (ROS 2)
    {
      id: "ros2-framework",
      type: "topic",
      position: { x: 550, y: 320 },
      data: {
        label: "Robot Operating System (ROS 2)",
        category: "Middleware",
        description: `### 🤖 ROS 2 DDS Middleware, Nodes, Topics, Services & Actions

The industry standard modular robotics software framework.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 30,
      },
    },
    {
      id: "sub-ros2-nodes-dds",
      type: "subtopic",
      position: { x: 240, y: 280 },
      data: {
        label: "ROS 2 Architecture: DDS, Topics, Services & Actions",
        colorKey: "C",
        description: `### 🐍 ROS 2 Python Node (rclpy) Example

\`\`\`python
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist

class VelocityPublisher(Node):
    def __init__(self):
        super().__init__('velocity_publisher')
        self.publisher_ = self.create_publisher(Twist, '/cmd_vel', 10)
        self.timer = self.create_timer(0.1, self.publish_velocity) # 10 Hz loop

    def publish_velocity(self):
        msg = Twist()
        msg.linear.x = 0.5  # Move forward at 0.5 m/s
        msg.angular.z = 0.1 # Turn left at 0.1 rad/s
        self.publisher_.publish(msg)

def main(args=None):
    rclpy.init(args=args)
    node = VelocityPublisher()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()
\`\`\`
`,
      },
    },
    {
      id: "sub-urdf-gazebo-sim",
      type: "subtopic",
      position: { x: 240, y: 330 },
      data: {
        label: "URDF Modeling, Xacro & Gazebo Simulation",
        colorKey: "C",
        description: `### 🌐 Robot Description (URDF) & Physical Simulation

- Define link inertial moments, visual meshes, and joint effort limits in XML.
- Simulate gravity, contact friction, and camera sensors in Gazebo.
`,
      },
    },

    // 3. Perception & Sensor Fusion
    {
      id: "perception-sensor-fusion",
      type: "topic",
      position: { x: 550, y: 520 },
      data: {
        label: "Perception, LiDAR & Sensor Fusion (EKF)",
        category: "Perception",
        description: `### 👁️ LiDAR Point Clouds, Depth Cameras & Extended Kalman Filters

Fuse IMU, wheel encoder odometry, and LiDAR scans into precise state estimates.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-lidar-depth-cameras",
      type: "subtopic",
      position: { x: 860, y: 480 },
      data: {
        label: "LiDAR Point Clouds, RGB-D & OpenCV",
        colorKey: "C",
        description: `### 📡 2D/3D LiDAR Processing

Filter ground plane reflections with RANSAC algorithms and cluster obstacle point clouds using Euclidean clustering (PCL / Open3D).
`,
      },
    },
    {
      id: "sub-ekf-sensor-fusion",
      type: "subtopic",
      position: { x: 860, y: 530 },
      data: {
        label: "Extended Kalman Filter (EKF) & Odometry",
        colorKey: "C",
        description: `### 📈 Extended Kalman Filter Formulation

1. **Prediction Step**: Predict current state using nonlinear kinematic motion model $x_t = f(x_{t-1}, u_t)$.
2. **Measurement Update**: Compute Kalman gain $K_t$ and correct state with incoming IMU orientation and wheel encoder ticks.
`,
      },
    },

    // 4. SLAM & Autonomous Navigation
    {
      id: "slam-autonomous-nav",
      type: "topic",
      position: { x: 550, y: 720 },
      data: {
        label: "SLAM & Nav2 Autonomous Navigation",
        category: "Navigation",
        description: `### 🗺️ Cartographer SLAM, Costmaps & Nav2 Behavior Trees

Simultaneously build 2D/3D environmental maps and navigate autonomously.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-slam-mapping",
      type: "subtopic",
      position: { x: 240, y: 680 },
      data: {
        label: "SLAM: Cartographer, RTAB-Map & LIO-SAM",
        colorKey: "C",
        description: `### 🗺️ Occupancy Grid Mapping

Map environmental obstacles into a 2D probability grid ($P(\\text{occupied}) \\in [0, 100]$) with loop closure optimization.
`,
      },
    },
    {
      id: "sub-nav2-costmaps",
      type: "subtopic",
      position: { x: 240, y: 730 },
      data: {
        label: "Nav2 Stack: Global/Local Costmaps & Path Planners",
        colorKey: "C",
        description: `### 🧭 Nav2 Autonomous Planners

- **Global Planner**: Computes complete collision-free shortest path from Start to Goal (A* / Dijkstra / Smac Planner).
- **Local Controller (DWB / MPPI)**: Computes real-time motor velocity commands $(v, \\omega)$ every $50\\text{ms}$ while dodging dynamic obstacles!
`,
      },
    },

    // 5. Control Systems & Motor Actuation
    {
      id: "control-systems-motors",
      type: "topic",
      position: { x: 550, y: 920 },
      data: {
        label: "Feedback Control (PID/MPC) & BLDC Actuators",
        category: "Control",
        description: `### ⚙️ PID Tuning, Model Predictive Control & FOC Motor Drives

Regulate joint positions and drive motors smoothly with closed-loop feedback.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-pid-tuning-mpc",
      type: "subtopic",
      position: { x: 860, y: 880 },
      data: {
        label: "PID Tuning & Model Predictive Control (MPC)",
        colorKey: "C",
        description: `### 🎛️ Continuous PID Controller Formula

$$u(t) = K_p e(t) + K_i \\int_0^t e(\\tau) d\\tau + K_d \\frac{de(t)}{dt}$$

- $K_p$: Proportional gain (corrects present error).
- $K_i$: Integral gain (eliminates steady-state offset error).
- $K_d$: Derivative gain (dampens rapid oscillations and overshoots).
`,
      },
    },
    {
      id: "sub-bldc-foc-steppers",
      type: "subtopic",
      position: { x: 860, y: 930 },
      data: {
        label: "BLDC Motors, Field-Oriented Control (FOC) & Encoders",
        colorKey: "C",
        description: `### 🌀 Field Oriented Control (FOC)

Transform 3-phase AC stator currents ($I_a, I_b, I_c$) using Clarke and Park transforms into orthogonal torque ($I_q$) and flux ($I_d$) components.
`,
      },
    },

    // 6. Industrial Automation & PLCs
    {
      id: "industrial-automation-plc",
      type: "topic",
      position: { x: 550, y: 1120 },
      data: {
        label: "Industrial Automation, PLCs & SCADA",
        category: "Industrial",
        description: `### 🏭 PLC Programming (Ladder Logic / Structured Text) & SCADA

Deploy deterministic factory floor automation systems.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-plc-ladder-st",
      type: "subtopic",
      position: { x: 240, y: 1080 },
      data: {
        label: "IEC 61131-3: Ladder Logic & Structured Text (ST)",
        colorKey: "C",
        description: `### 🏭 Structured Text (ST) Industrial PLC Code

\`\`\`pascal
PROGRAM ConveyorControl
VAR
    StartPB AT %IX0.0 : BOOL;
    StopPB  AT %IX0.1 : BOOL;
    MotorRun AT %QX0.0 : BOOL;
    Timer1  : TON;
END_VAR

// Latch motor running logic with 10s automatic shutoff timer
IF StartPB AND NOT StopPB THEN
    MotorRun := TRUE;
ELSIF StopPB OR Timer1.Q THEN
    MotorRun := FALSE;
END_IF;

Timer1(IN := MotorRun, PT := T#10S);
END_PROGRAM
\`\`\`
`,
      },
    },
    {
      id: "sub-scada-modbus-opcua",
      type: "subtopic",
      position: { x: 240, y: 1130 },
      data: {
        label: "SCADA Systems, Modbus TCP & OPC-UA Protocols",
        colorKey: "C",
        description: `### 🏭 OPC Unified Architecture (OPC-UA)

Cross-platform industrial machine-to-machine communication standard featuring end-to-end encryption and semantic data models.
`,
      },
    },

    // 7. Milestone
    {
      id: "milestone-robotics-lead",
      type: "milestone",
      position: { x: 550, y: 1320 },
      data: {
        label: "Certified Robotics & Automation Engineer",
        category: "Milestone",
        description: `### 🎓 Robotics & Automation Mastery Attained!

Congratulations! You have mastered robotics engineering:
- Spatial math, DH parameters, Forward/Inverse Kinematics, and Jacobians.
- ROS 2 middleware (Nodes, Topics, Services, Actions, URDF, Gazebo).
- Perception, LiDAR processing, and Extended Kalman Filter sensor fusion.
- Autonomous mapping (SLAM) and navigation (Nav2 Costmaps & Planners).
- Closed-loop PID & MPC feedback control for high-torque BLDC motors.
- Industrial automation, PLC Structured Text programming, and OPC-UA.
`,
        difficulty: "advanced",
        color: "gold",
        status: "not-started",
      },
    },
  ],
  edges: [
    { id: "e-ro-1", source: "kinematics-dynamics", target: "ros2-framework", type: "interactive" },
    { id: "e-ro-2", source: "ros2-framework", target: "perception-sensor-fusion", type: "interactive" },
    { id: "e-ro-3", source: "perception-sensor-fusion", target: "slam-autonomous-nav", type: "interactive" },
    { id: "e-ro-4", source: "slam-autonomous-nav", target: "control-systems-motors", type: "interactive" },
    { id: "e-ro-5", source: "control-systems-motors", target: "industrial-automation-plc", type: "interactive" },
    { id: "e-ro-6", source: "industrial-automation-plc", target: "milestone-robotics-lead", type: "interactive" },

    // Subtopics
    { id: "e-ro-sub-1", source: "kinematics-dynamics", target: "sub-forward-inverse-kinematics" },
    { id: "e-ro-sub-2", source: "kinematics-dynamics", target: "sub-jacobians-dynamics" },

    { id: "e-ro-sub-3", source: "ros2-framework", target: "sub-ros2-nodes-dds" },
    { id: "e-ro-sub-4", source: "ros2-framework", target: "sub-urdf-gazebo-sim" },

    { id: "e-ro-sub-5", source: "perception-sensor-fusion", target: "sub-lidar-depth-cameras" },
    { id: "e-ro-sub-6", source: "perception-sensor-fusion", target: "sub-ekf-sensor-fusion" },

    { id: "e-ro-sub-7", source: "slam-autonomous-nav", target: "sub-slam-mapping" },
    { id: "e-ro-sub-8", source: "slam-autonomous-nav", target: "sub-nav2-costmaps" },

    { id: "e-ro-sub-9", source: "control-systems-motors", target: "sub-pid-tuning-mpc" },
    { id: "e-ro-sub-10", source: "control-systems-motors", target: "sub-bldc-foc-steppers" },

    { id: "e-ro-sub-11", source: "industrial-automation-plc", target: "sub-plc-ladder-st" },
    { id: "e-ro-sub-12", source: "industrial-automation-plc", target: "sub-scada-modbus-opcua" },
  ],
};
