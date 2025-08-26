/**
 * BUMBA Specialized Technical Expertise
 * Sprint 29: IoT, Embedded, AR/VR, Robotics, Bioinformatics
 */

const specializedTechnicalExpertise = {
  getIoTExpertise() {
    return {
      core: {
        protocols: 'MQTT, CoAP, LoRaWAN, Zigbee, BLE, NB-IoT',
        platforms: 'AWS IoT, Azure IoT, Google Cloud IoT, ThingsBoard',
        hardware: 'ESP32, Raspberry Pi, Arduino, STM32, nRF52',
        edge: 'Edge computing, fog computing, gateway design'
      },
      capabilities: [
        'Design IoT architectures',
        'Develop embedded firmware',
        'Implement MQTT brokers',
        'Build IoT dashboards',
        'Configure edge computing',
        'Implement OTA updates',
        'Develop sensor networks',
        'Build industrial IoT solutions',
        'Implement device management',
        'Create digital twins',
        'Develop smart home systems',
        'Build asset tracking solutions',
        'Implement predictive maintenance',
        'Create energy management systems',
        'Develop agricultural IoT',
        'Build healthcare IoT devices'
      ],
      bestPractices: [
        'Implement end-to-end encryption',
        'Use lightweight protocols',
        'Design for intermittent connectivity',
        'Implement power management',
        'Use edge processing when possible',
        'Implement secure boot',
        'Design for scalability',
        'Use time-series databases',
        'Implement device provisioning',
        'Monitor device health',
        'Use message queuing',
        'Implement data compression',
        'Design for harsh environments',
        'Use redundancy for critical systems',
        'Implement proper firmware updates'
      ],
      codePatterns: {
        esp32Firmware: `
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// Configuration
const char* ssid = "IoT-Network";
const char* password = "secure-password";
const char* mqtt_server = "broker.hivemq.com";
const char* device_id = "esp32-sensor-001";

// Hardware
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define LED_PIN 2

DHT dht(DHT_PIN, DHT_TYPE);
WiFiClient espClient;
PubSubClient client(espClient);

// State
unsigned long lastMsg = 0;
const int MSG_INTERVAL = 5000;

void setup() {
    Serial.begin(115200);
    
    // Initialize hardware
    pinMode(LED_PIN, OUTPUT);
    dht.begin();
    
    // Connect to WiFi
    setup_wifi();
    
    // Configure MQTT
    client.setServer(mqtt_server, 1883);
    client.setCallback(mqtt_callback);
    
    // Connect to MQTT
    reconnect();
}

void setup_wifi() {
    delay(10);
    Serial.println("Connecting to WiFi...");
    
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    
    Serial.println("");
    Serial.println("WiFi connected");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
}

void mqtt_callback(char* topic, byte* payload, unsigned int length) {
    Serial.print("Message arrived [");
    Serial.print(topic);
    Serial.print("] ");
    
    // Parse JSON command
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, payload, length);
    
    if (error) {
        Serial.print("JSON parsing failed: ");
        Serial.println(error.c_str());
        return;
    }
    
    // Handle commands
    const char* command = doc["command"];
    if (strcmp(command, "led_on") == 0) {
        digitalWrite(LED_PIN, HIGH);
        send_status("LED turned on");
    } else if (strcmp(command, "led_off") == 0) {
        digitalWrite(LED_PIN, LOW);
        send_status("LED turned off");
    } else if (strcmp(command, "reboot") == 0) {
        send_status("Rebooting...");
        delay(1000);
        ESP.restart();
    }
}

void reconnect() {
    while (!client.connected()) {
        Serial.print("Attempting MQTT connection...");
        
        // Create client ID
        String clientId = String(device_id);
        
        // Attempt to connect with will message
        if (client.connect(clientId.c_str(), 
                           NULL, NULL,
                           "devices/status", 0, true,
                           "{\"device\":\"esp32-sensor-001\",\"status\":\"offline\"}")) {
            Serial.println("connected");
            
            // Publish online status
            send_status("online");
            
            // Subscribe to command topic
            client.subscribe("devices/esp32-sensor-001/commands");
        } else {
            Serial.print("failed, rc=");
            Serial.print(client.state());
            Serial.println(" try again in 5 seconds");
            delay(5000);
        }
    }
}

void send_sensor_data() {
    // Read sensor data
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();
    
    if (isnan(humidity) || isnan(temperature)) {
        Serial.println("Failed to read from DHT sensor!");
        return;
    }
    
    // Create JSON payload
    StaticJsonDocument<200> doc;
    doc["device_id"] = device_id;
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;
    doc["timestamp"] = millis();
    doc["rssi"] = WiFi.RSSI();
    
    char buffer[256];
    serializeJson(doc, buffer);
    
    // Publish to MQTT
    client.publish("sensors/environmental", buffer);
    
    Serial.print("Published: ");
    Serial.println(buffer);
}

void loop() {
    if (!client.connected()) {
        reconnect();
    }
    client.loop();
    
    unsigned long now = millis();
    if (now - lastMsg > MSG_INTERVAL) {
        lastMsg = now;
        send_sensor_data();
    }
}`
      }
    };
  },

  getEmbeddedSystemsExpertise() {
    return {
      core: {
        platforms: 'ARM Cortex, AVR, PIC, RISC-V, x86 embedded',
        rtos: 'FreeRTOS, Zephyr, ThreadX, VxWorks, QNX',
        protocols: 'I2C, SPI, UART, CAN, USB, Ethernet',
        tools: 'GCC, Keil, IAR, JTAG, oscilloscope, logic analyzer'
      },
      capabilities: [
        'Develop bare-metal firmware',
        'Implement RTOS applications',
        'Design bootloaders',
        'Develop device drivers',
        'Implement communication protocols',
        'Optimize for power consumption',
        'Design interrupt handlers',
        'Implement DMA controllers',
        'Develop safety-critical systems',
        'Create hardware abstraction layers',
        'Implement cryptographic functions',
        'Design fault-tolerant systems',
        'Develop motor control systems',
        'Implement sensor fusion',
        'Create embedded Linux systems',
        'Design real-time control systems'
      ],
      bestPractices: [
        'Use static memory allocation',
        'Implement watchdog timers',
        'Design for deterministic behavior',
        'Use volatile for hardware registers',
        'Implement proper interrupt priorities',
        'Minimize interrupt latency',
        'Use DMA for data transfers',
        'Implement error detection and correction',
        'Design for testability',
        'Use code coverage tools',
        'Implement power management',
        'Follow MISRA-C guidelines',
        'Use hardware abstraction layers',
        'Implement defensive programming',
        'Document timing requirements'
      ]
    };
  },

  getARVRExpertise() {
    return {
      core: {
        platforms: 'Unity XR, Unreal VR, WebXR, ARCore, ARKit',
        devices: 'Meta Quest, HoloLens, Magic Leap, Vive, PSVR',
        sdks: 'OpenXR, Oculus SDK, SteamVR, MRTK, Vuforia',
        concepts: '6DOF tracking, hand tracking, spatial anchors, occlusion'
      },
      capabilities: [
        'Develop VR applications',
        'Create AR experiences',
        'Implement hand tracking',
        'Build mixed reality apps',
        'Develop spatial computing',
        'Create immersive training',
        'Build social VR platforms',
        'Implement haptic feedback',
        'Develop medical VR',
        'Create architectural visualization',
        'Build VR games',
        'Implement eye tracking',
        'Develop industrial AR',
        'Create virtual showrooms',
        'Build educational VR',
        'Implement multiplayer VR'
      ],
      bestPractices: [
        'Maintain 90+ FPS for comfort',
        'Implement comfort options',
        'Use foveated rendering',
        'Optimize draw calls',
        'Implement proper locomotion',
        'Design for accessibility',
        'Use spatial audio',
        'Implement guardian systems',
        'Test on target hardware',
        'Design intuitive interactions',
        'Minimize motion sickness',
        'Use LOD for performance',
        'Implement proper scaling',
        'Design for room-scale',
        'Test with diverse users'
      ],
      codePatterns: {
        unityXR: `
using UnityEngine;
using UnityEngine.XR;
using UnityEngine.XR.Interaction.Toolkit;

public class VRInteractionSystem : MonoBehaviour
{
    [Header("XR Controllers")]
    [SerializeField] private XRController leftController;
    [SerializeField] private XRController rightController;
    
    [Header("Interaction")]
    [SerializeField] private XRRayInteractor leftRayInteractor;
    [SerializeField] private XRRayInteractor rightRayInteractor;
    [SerializeField] private LineRenderer leftLineRenderer;
    [SerializeField] private LineRenderer rightLineRenderer;
    
    [Header("Haptics")]
    [SerializeField] private float hapticIntensity = 0.5f;
    [SerializeField] private float hapticDuration = 0.1f;
    
    private void Start()
    {
        // Configure ray interactors
        ConfigureRayInteractor(leftRayInteractor, leftLineRenderer);
        ConfigureRayInteractor(rightRayInteractor, rightLineRenderer);
        
        // Subscribe to events
        leftRayInteractor.selectEntered.AddListener(OnSelectEntered);
        rightRayInteractor.selectEntered.AddListener(OnSelectEntered);
    }
    
    private void ConfigureRayInteractor(XRRayInteractor interactor, LineRenderer line)
    {
        interactor.raycastMask = LayerMask.GetMask("Interactable", "UI");
        interactor.maxRaycastDistance = 10f;
        
        // Configure line renderer
        line.startWidth = 0.01f;
        line.endWidth = 0.001f;
        line.material.color = Color.white;
    }
    
    private void Update()
    {
        UpdateRayVisuals(leftRayInteractor, leftLineRenderer);
        UpdateRayVisuals(rightRayInteractor, rightLineRenderer);
        
        HandleInput();
    }
    
    private void UpdateRayVisuals(XRRayInteractor interactor, LineRenderer line)
    {
        if (interactor.TryGetCurrent3DRaycastHit(out RaycastHit hit))
        {
            line.SetPosition(0, interactor.transform.position);
            line.SetPosition(1, hit.point);
            line.material.color = Color.green;
        }
        else
        {
            Vector3 endPoint = interactor.transform.position + 
                              interactor.transform.forward * interactor.maxRaycastDistance;
            line.SetPosition(0, interactor.transform.position);
            line.SetPosition(1, endPoint);
            line.material.color = Color.white;
        }
    }
    
    private void HandleInput()
    {
        // Teleportation
        if (leftController.inputDevice.TryGetFeatureValue(
            CommonUsages.primary2DAxisClick, out bool leftStickPressed) && leftStickPressed)
        {
            InitiateTeleport();
        }
        
        // Menu
        if (rightController.inputDevice.TryGetFeatureValue(
            CommonUsages.menuButton, out bool menuPressed) && menuPressed)
        {
            ToggleMenu();
        }
    }
    
    private void OnSelectEntered(SelectEnterEventArgs args)
    {
        // Haptic feedback
        XRBaseController controller = args.interactor as XRBaseController;
        if (controller != null)
        {
            SendHapticFeedback(controller);
        }
        
        // Handle different interactable types
        if (args.interactable.TryGetComponent<VRButton>(out VRButton button))
        {
            button.OnPress();
        }
        else if (args.interactable.TryGetComponent<VRGrabbable>(out VRGrabbable grabbable))
        {
            grabbable.OnGrab(args.interactor);
        }
    }
    
    private void SendHapticFeedback(XRBaseController controller)
    {
        if (controller.inputDevice.TryGetHapticCapabilities(out HapticCapabilities capabilities))
        {
            if (capabilities.supportsImpulse)
            {
                controller.inputDevice.SendHapticImpulse(0, hapticIntensity, hapticDuration);
            }
        }
    }
}`
      }
    };
  },

  getRoboticsExpertise() {
    return {
      core: {
        frameworks: 'ROS2, MoveIt, Gazebo, OpenCV, PCL',
        hardware: 'Arduino, Raspberry Pi, NVIDIA Jetson, Intel RealSense',
        algorithms: 'SLAM, path planning, kinematics, computer vision',
        protocols: 'DDS, MQTT, MAVLink, CANopen'
      },
      capabilities: [
        'Develop ROS2 packages',
        'Implement SLAM algorithms',
        'Design motion planning',
        'Build computer vision systems',
        'Develop autonomous navigation',
        'Implement sensor fusion',
        'Create robotic simulations',
        'Build manipulation systems',
        'Develop drone software',
        'Implement obstacle avoidance',
        'Create human-robot interaction',
        'Build swarm robotics',
        'Develop industrial automation',
        'Implement machine learning for robotics',
        'Create robotic perception systems',
        'Build teleoperation systems'
      ]
    };
  },

  getBioinformaticsExpertise() {
    return {
      core: {
        languages: 'Python, R, Perl, Julia',
        tools: 'Biopython, Bioconductor, BLAST, BWA, GATK',
        databases: 'GenBank, UniProt, PDB, KEGG, Ensembl',
        concepts: 'Genomics, proteomics, phylogenetics, systems biology'
      },
      capabilities: [
        'Analyze genomic sequences',
        'Perform RNA-seq analysis',
        'Build phylogenetic trees',
        'Develop variant calling pipelines',
        'Implement protein structure prediction',
        'Create metabolic pathway analysis',
        'Build drug discovery tools',
        'Develop CRISPR design tools',
        'Implement microbiome analysis',
        'Create visualization tools',
        'Build clinical genomics pipelines',
        'Develop machine learning models',
        'Implement statistical analysis',
        'Create database integration',
        'Build workflow automation',
        'Develop precision medicine tools'
      ]
    };
  }
};

module.exports = specializedTechnicalExpertise;