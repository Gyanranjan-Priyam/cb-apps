import type { RoadmapData } from "../../types";

export const embeddedSystemsIotRoadmap: RoadmapData = {
  id: "embedded-systems-iot",
  slug: "embedded-systems-iot",
  title: "Embedded Systems & IoT",
  description: "Complete, all-in-one guide to Embedded Firmware & IoT Engineering. Master Embedded C/C++ (Pointers, Volatile, Bitwise), STM32 (ARM Cortex-M) & ESP32 Microcontrollers, Communication Protocols (UART, SPI, I2C, CAN), FreeRTOS Real-Time Tasks & Queues, Wireless IoT (MQTT, BLE, LoRaWAN), Dual-Bank OTA Firmware Updates, and Embedded Linux without needing external materials.",
  category: "systems",
  badgeText: "Hardware Track",
  iconName: "Cpu",
  version: 2,
  isPublished: true,
  nodes: [
    {
      id: "title-node",
      type: "title",
      position: { x: 550, y: 30 },
      data: { label: "Embedded Systems & IoT Roadmap" },
    },
    // 1. Embedded C & Computer Architecture
    {
      id: "embedded-c-foundations",
      type: "topic",
      position: { x: 550, y: 120 },
      data: {
        label: "Embedded C & MCU Architecture",
        category: "Foundations",
        description: `### ⚡ Low-Level Embedded C, Pointers & Hardware Registers

Manipulate hardware peripheral registers directly through memory-mapped I/O.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-bitwise-volatile",
      type: "subtopic",
      position: { x: 860, y: 100 },
      data: {
        label: "Bitwise Manipulation, Volatile & Memory Maps",
        colorKey: "C",
        description: `### 🔧 Bitwise Register Manipulation in C

\`\`\`c
#include <stdint.h>

// Base address for GPIO Port A
#define GPIOA_BASE   0x48000000UL
#define GPIOA_MODER  (*(volatile uint32_t *)(GPIOA_BASE + 0x00))
#define GPIOA_ODR    (*(volatile uint32_t *)(GPIOA_BASE + 0x14))

void init_led_pin5(void) {
    // 1. Clear mode bits for Pin 5 (bits 10-11)
    GPIOA_MODER &= ~(0x3U << (5 * 2));
    
    // 2. Set Pin 5 as General Purpose Output (01b)
    GPIOA_MODER |= (0x1U << (5 * 2));
}

void toggle_led_pin5(void) {
    // Toggle Pin 5 bit in Output Data Register
    GPIOA_ODR ^= (1U << 5);
}
\`\`\`
`,
      },
    },
    {
      id: "sub-mcu-stm32-esp32",
      type: "subtopic",
      position: { x: 860, y: 150 },
      data: {
        label: "STM32 (ARM Cortex-M) & ESP32 Architectures",
        colorKey: "C",
        description: `### 🎛️ MCU Architecture Comparison

- **STM32 (ARM Cortex-M4/M7)**: Deterministic nested vectored interrupt controller (NVIC), single-cycle hardware multipliers, hardware FPU.
- **ESP32 (Xtensa Dual-Core 240MHz)**: Built-in 2.4GHz Wi-Fi + Bluetooth 5.0 (BLE) stack, ideal for connected IoT nodes.
`,
      },
    },

    // 2. Communication Protocols
    {
      id: "embedded-protocols",
      type: "topic",
      position: { x: 550, y: 320 },
      data: {
        label: "Hardware Protocols: UART, SPI, I2C & CAN",
        category: "Protocols",
        description: `### 🔌 Serial Buses & Industrial Communication

Connect sensors, displays, and automotive electronic control units (ECUs).
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 18,
      },
    },
    {
      id: "sub-uart-spi-i2c",
      type: "subtopic",
      position: { x: 240, y: 280 },
      data: {
        label: "UART, SPI & I2C Serial Buses",
        colorKey: "C",
        description: `### 📊 Serial Protocol Comparison

| Protocol | Wires | Max Speed | Clocking | Multi-Device |
|---|---|---|---|---|
| **UART** | 2 (TX, RX) | Up to 1 Mbps | Asynchronous | Point-to-point |
| **I2C** | 2 (SDA, SCL) | 100 kHz - 3.4 MHz | Synchronous | Up to 127 devices (7-bit address) |
| **SPI** | 4 (MOSI, MISO, SCK, CS) | 10 - 80+ MHz | Synchronous | 1 Chip Select (CS) per slave |
`,
      },
    },
    {
      id: "sub-canbus-industrial",
      type: "subtopic",
      position: { x: 240, y: 330 },
      data: {
        label: "CAN Bus & Modbus for Automotive / Robotics",
        colorKey: "C",
        description: `### 🚗 CAN Bus (Controller Area Network)

Differential voltage pair (\`CAN_H\` and \`CAN_L\`) providing high noise immunity in automotive and industrial robotic actuators.
`,
      },
    },

    // 3. Real-Time Operating Systems (RTOS)
    {
      id: "rtos-freertos",
      type: "topic",
      position: { x: 550, y: 520 },
      data: {
        label: "Real-Time Operating Systems (FreeRTOS)",
        category: "RTOS",
        description: `### ⏱️ FreeRTOS Tasks, Semaphores, Queues & Priority Inversion

Schedule hard real-time tasks with microsecond preemption guarantees.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 22,
      },
    },
    {
      id: "sub-freertos-tasks",
      type: "subtopic",
      position: { x: 860, y: 480 },
      data: {
        label: "Task Creation, Preemptive Scheduling & Queues",
        colorKey: "C",
        description: `### ⏱️ FreeRTOS Task & Queue Implementation in C

\`\`\`c
#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"

static QueueHandle_t sensorQueue;

void vSensorTask(void *pvParameters) {
    uint32_t sensorVal = 0;
    while (1) {
        sensorVal = read_adc_channel(0);
        xQueueSend(sensorQueue, &sensorVal, portMAX_DELAY);
        vTaskDelay(pdMS_TO_TICKS(100)); // Non-blocking 100ms delay
    }
}

void vDisplayTask(void *pvParameters) {
    uint32_t receivedVal;
    while (1) {
        if (xQueueReceive(sensorQueue, &receivedVal, portMAX_DELAY) == pdTRUE) {
            update_oled_display(receivedVal);
        }
    }
}
\`\`\`
`,
      },
    },
    {
      id: "sub-mutexes-interrupts",
      type: "subtopic",
      position: { x: 860, y: 530 },
      data: {
        label: "Mutexes, Priority Inversion & ISR Deferred Handling",
        colorKey: "C",
        description: `### 🛡️ Priority Inheritance in FreeRTOS Mutexes

Prevents Priority Inversion where a medium-priority task preempts a low-priority task holding a mutex required by a high-priority task.
`,
      },
    },

    // 4. Wireless IoT Protocols & Networking
    {
      id: "iot-wireless-protocols",
      type: "topic",
      position: { x: 550, y: 720 },
      data: {
        label: "Wireless IoT: MQTT, BLE, Zigbee & LoRaWAN",
        category: "IoT",
        description: `### 📡 Low-Power Long-Range Wireless & Cloud Telemetry

Stream telemetry data from edge microcontrollers to cloud backends.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-mqtt-tls-cloud",
      type: "subtopic",
      position: { x: 240, y: 680 },
      data: {
        label: "MQTT (QoS 0/1/2), TLS & AWS IoT Core",
        colorKey: "C",
        description: `### 📨 MQTT Quality of Service (QoS) Levels

- **QoS 0 (At most once)**: Fire and forget (sensor telemetry where occasional loss is acceptable).
- **QoS 1 (At least once)**: Acknowledged by broker (guaranteed delivery, potential duplicates).
- **QoS 2 (Exactly once)**: 4-step handshake (firmware upgrade commands, critical actuators).
`,
      },
    },
    {
      id: "sub-ble-lorawan",
      type: "subtopic",
      position: { x: 240, y: 730 },
      data: {
        label: "Bluetooth Low Energy (GATT/GAP) & LoRaWAN",
        colorKey: "C",
        description: `### 📶 Long-Range IoT with LoRaWAN

Transmit sensor payloads over $10+\\text{ km}$ distance on coin-cell batteries using Chirp Spread Spectrum (CSS) modulation.
`,
      },
    },

    // 5. Embedded Security & OTA Updates
    {
      id: "embedded-security-ota",
      type: "topic",
      position: { x: 550, y: 920 },
      data: {
        label: "Secure Boot & Dual-Bank OTA Firmware Updates",
        category: "Security & Firmware",
        description: `### 🔒 Hardware Cryptographic Roots of Trust & A/B Partition Updates

Ensure remote devices cannot be bricked during firmware updates.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 18,
      },
    },
    {
      id: "sub-dual-bank-ota",
      type: "subtopic",
      position: { x: 860, y: 880 },
      data: {
        label: "Dual-Bank A/B Partition OTA & Rollback",
        colorKey: "C",
        description: `### 🔄 A/B Dual Bank Partition Layout

\`\`\`
[ Bootloader ] ──> Reads active flag
[ Slot A: Active Firmware (v1.2) ]
[ Slot B: Download Target (v1.3) ] ──> Verify SHA-256 Signature
[ Storage / NVS Partition ]
\`\`\`
- If v1.3 crashes during boot, hardware watchdog timer triggers reboot back into Slot A automatically!
`,
      },
    },
    {
      id: "sub-secure-boot-crypto",
      type: "subtopic",
      position: { x: 860, y: 930 },
      data: {
        label: "Secure Boot, Flash Encryption & Hardware HSMs",
        colorKey: "C",
        description: `### 🔐 Hardware Security Modules (e.g. ATECC608A)

Store private keys in tamper-proof silicon resistant to physical side-channel power analysis attacks.
`,
      },
    },

    // 6. Embedded Linux & Yocto
    {
      id: "embedded-linux-yocto",
      type: "topic",
      position: { x: 550, y: 1120 },
      data: {
        label: "Embedded Linux & Edge Compute (Yocto)",
        category: "Linux & Edge",
        description: `### 🐧 Custom Linux Kernels, Device Trees & Edge AI

Build production Linux images for Raspberry Pi CM4 and NXP i.MX platforms.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-device-tree-drivers",
      type: "subtopic",
      position: { x: 240, y: 1080 },
      data: {
        label: "Device Tree (.dts) & Linux Kernel Drivers",
        colorKey: "C",
        description: `### 🌲 Device Tree Source (.dts) Syntax

Describe hardware addresses and GPIO interrupt lines to the Linux kernel without recompiling binary drivers.
`,
      },
    },
    {
      id: "sub-yocto-buildroot",
      type: "subtopic",
      position: { x: 240, y: 1130 },
      data: {
        label: "Yocto Project Recipes & Buildroot",
        colorKey: "C",
        description: `### 🍳 Yocto BitBake Recipe

Generate minimal $<15\\text{MB}$ read-only root filesystems optimized for flash longevity.
`,
      },
    },

    // 7. Milestone
    {
      id: "milestone-embedded-lead",
      type: "milestone",
      position: { x: 550, y: 1320 },
      data: {
        label: "Certified Embedded & IoT Systems Engineer",
        category: "Milestone",
        description: `### 🎓 Embedded Systems & IoT Mastery Attained!

Congratulations! You have mastered embedded engineering:
- Low-level Embedded C, memory registers, and ARM Cortex-M architecture.
- Serial hardware buses: UART, high-speed SPI, multi-drop I2C, and automotive CAN.
- Real-Time Operating Systems (FreeRTOS) with preemption and queues.
- Wireless IoT connectivity with MQTT, Bluetooth Low Energy, and LoRaWAN.
- Dual-bank fail-safe OTA updates and hardware secure boot.
- Custom Embedded Linux images with Yocto and kernel device trees.
`,
        difficulty: "advanced",
        color: "gold",
        status: "not-started",
      },
    },
  ],
  edges: [
    { id: "e-em-1", source: "embedded-c-foundations", target: "embedded-protocols", type: "interactive" },
    { id: "e-em-2", source: "embedded-protocols", target: "rtos-freertos", type: "interactive" },
    { id: "e-em-3", source: "rtos-freertos", target: "iot-wireless-protocols", type: "interactive" },
    { id: "e-em-4", source: "iot-wireless-protocols", target: "embedded-security-ota", type: "interactive" },
    { id: "e-em-5", source: "embedded-security-ota", target: "embedded-linux-yocto", type: "interactive" },
    { id: "e-em-6", source: "embedded-linux-yocto", target: "milestone-embedded-lead", type: "interactive" },

    // Subtopics
    { id: "e-em-sub-1", source: "embedded-c-foundations", target: "sub-bitwise-volatile" },
    { id: "e-em-sub-2", source: "embedded-c-foundations", target: "sub-mcu-stm32-esp32" },

    { id: "e-em-sub-3", source: "embedded-protocols", target: "sub-uart-spi-i2c" },
    { id: "e-em-sub-4", source: "embedded-protocols", target: "sub-canbus-industrial" },

    { id: "e-em-sub-5", source: "rtos-freertos", target: "sub-freertos-tasks" },
    { id: "e-em-sub-6", source: "rtos-freertos", target: "sub-mutexes-interrupts" },

    { id: "e-em-sub-7", source: "iot-wireless-protocols", target: "sub-mqtt-tls-cloud" },
    { id: "e-em-sub-8", source: "iot-wireless-protocols", target: "sub-ble-lorawan" },

    { id: "e-em-sub-9", source: "embedded-security-ota", target: "sub-dual-bank-ota" },
    { id: "e-em-sub-10", source: "embedded-security-ota", target: "sub-secure-boot-crypto" },

    { id: "e-em-sub-11", source: "embedded-linux-yocto", target: "sub-device-tree-drivers" },
    { id: "e-em-sub-12", source: "embedded-linux-yocto", target: "sub-yocto-buildroot" },
  ],
};
