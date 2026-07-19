import sys
sys.path.append('./backend')
from sensor_fusion import HiveGuardSensors

try:
    s = HiveGuardSensors()
    print("Tabular Ready:", s.tabular_ready)
    print("Vision Ready:", s.vision_ready)
except Exception as e:
    print("Error:", e)
