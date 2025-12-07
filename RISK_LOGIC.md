# Risk Level Detection Logic

## Overview

The system uses a multi-sensor approach to detect fire risk with three levels: NORMAL, WARNING, and DANGER.

---

## Current Implementation (Phase 1: Hardware Sensors)

### 🟢 NORMAL
All sensors in safe ranges:
- Temperature < 35°C
- MQ Smoke < 850 PPM
- Gas < 850 PPM
- No flame detection OR flame with high ambient light (LDR ≥ 200)
- Flame AO < 1500

### 🟡 WARNING
Any of these conditions triggers WARNING:

1. **Flame + Low LDR** (Primary fire indicator)
   - `flame = true AND ldr < 200`
   - Indicates actual fire/flame producing light in low ambient light
   - Most reliable hardware-based fire detection

2. **Elevated Temperature**
   - `temp ≥ 35°C`
   - Above normal room temperature

3. **Elevated Smoke (MQ-135)**
   - `mq ≥ 850 PPM`
   - Significant smoke detection

4. **Elevated Gas**
   - `gas ≥ 850 PPM`
   - Combustible gas present

5. **High Flame Analog**
   - `flameAO ≥ 1500`
   - Strong infrared detection

### 🔴 DANGER
**Phase 1:** Only extreme hardware readings trigger DANGER:
- Temperature ≥ 55°C (critical heat)
- MQ Smoke ≥ 1000 PPM (critical smoke)
- Gas ≥ 1000 PPM (critical gas)
- Flame AO ≥ 3000 (extreme flame reading)

**Phase 2:** (Coming soon with AI integration)
- YOLO fire detection model confirms fire in ESP32-CAM image
- Combined with hardware sensor readings for high confidence

---

## LDR (Light Sensor) Logic

### Why LDR?

The LDR helps distinguish between:
- **Real fire**: Flame sensor triggers + low ambient light (LDR < 200) = likely real fire producing its own light
- **False positive**: Flame sensor triggers + high ambient light (LDR ≥ 200) = might be sunlight/lamp interference

### LDR Value Ranges (ESP32 ADC: 0-4095)

| LDR Value | Condition | Interpretation |
|-----------|-----------|----------------|
| 0-200 | Very dark | Flame detection here is highly suspicious |
| 200-1000 | Dim/Indoor | Normal indoor lighting |
| 1000-2500 | Bright | Well-lit room or near window |
| 2500-4095 | Very bright | Direct sunlight or very bright lights |

### Example Scenarios

**Scenario 1: Real Fire at Night**
```
LDR: 50 (dark room)
Flame: Detected
MQ: 900 PPM
→ Result: WARNING (flame + low LDR)
```

**Scenario 2: False Alarm (Sunlight)**
```
LDR: 2000 (bright sunlight)
Flame: Detected (infrared from sun)
MQ: 200 PPM (normal)
→ Result: NORMAL (flame ignored due to high LDR)
```

**Scenario 3: Real Fire with Smoke**
```
LDR: 100 (dark)
Flame: Detected
MQ: 950 PPM
Gas: 900 PPM
→ Result: WARNING (multiple indicators)
```

**Scenario 4: Extreme Conditions**
```
Temperature: 60°C
MQ: 1100 PPM
→ Result: DANGER (extreme readings)
```

---

## Phase 2: AI Integration (Coming Soon)

### YOLO Fire Detection Model

Will add ESP32-CAM image analysis to confirm fire visually.

**Planned Logic:**
```javascript
// DANGER will include AI detection
const danger =
  (ai_fire_detected && ai_confidence > 0.8) ||  // AI confirms fire
  (flame && ldr < 200 && mq >= 850) ||          // Multiple sensors agree
  temp >= 55 ||
  mq >= 1000 ||
  gas >= 1000

// WARNING for lower confidence AI or single sensor triggers
const warning =
  (ai_fire_detected && ai_confidence > 0.5) ||  // AI suspects fire
  (flame && ldr < 200) ||                       // Flame in darkness
  temp >= 35 ||
  mq >= 850 ||
  gas >= 850
```

### AI Integration Benefits

1. **Visual Confirmation**: Camera sees actual flames/smoke
2. **Reduce False Positives**: Cross-validate hardware sensors
3. **Smoke Detection**: AI can detect smoke patterns even without flame
4. **Scene Understanding**: Distinguish cooking smoke from fire smoke

---

## Sensor Threshold Summary

| Sensor | WARNING | DANGER | Unit |
|--------|---------|--------|------|
| Temperature | ≥ 35°C | ≥ 55°C | °C |
| MQ Smoke | ≥ 850 | ≥ 1000 | PPM |
| Gas | ≥ 850 | ≥ 1000 | PPM |
| Flame + LDR | flame=true & LDR<200 | - | - |
| Flame AO | ≥ 1500 | ≥ 3000 | ADC |
| AI Confidence | (Phase 2) | (Phase 2) | 0-1 |

---

## Testing the Logic

### Test WARNING with LDR

1. **Cover LDR sensor** (make it dark, LDR < 200)
2. **Trigger flame sensor** (lighter flame near sensor)
3. **Expected**: WARNING level triggered

### Test Normal Operation

1. **Normal lighting** (LDR > 200)
2. **No flame**
3. **Expected**: NORMAL level

### Test DANGER

1. **Heat DHT22** to 55°C+ (carefully with hot air)
2. OR **High smoke** (incense near MQ sensor, MQ ≥ 1000)
3. **Expected**: DANGER level triggered

---

## Firestore Schema

The computed `risk_level` is stored with each sensor log:

```javascript
{
  timestamp: 1733234567890,
  node_id: "gw-1",
  temp: 27.8,
  humidity: 61.0,
  mq_arduino: 1065,
  mq_gateway: 1065,
  flame: true,
  gas_gateway: 1065,
  light: 0.63,              // Normalized 0-1 (from LDR)
  risk_level: "WARNING",     // ⬅️ Computed by our logic
  ai_fire_detected: false,   // Phase 2
  ai_confidence: 0.0,        // Phase 2
  image_url: null,           // Phase 2
  source: "gateway"
}
```

---

## LINE Notifications

Firebase Cloud Functions monitor `risk_level`:
- **WARNING**: Sends caution alert with sensor readings
- **DANGER**: Sends urgent alert with immediate action required

---

## Future Enhancements

### Phase 2: AI Integration
- [ ] ESP32-CAM captures images
- [ ] YOLO model detects fire/smoke
- [ ] Confidence score added to risk calculation
- [ ] Image URL stored in Firestore

### Phase 3: Advanced Logic
- [ ] Time-based patterns (rapid temperature rise)
- [ ] Multi-zone sensor correlation
- [ ] Historical trend analysis
- [ ] Predictive warnings

---

## Code Reference

Main risk computation: `scripts/ingestFromEsp32.js`

```javascript
function computeRiskLevel({ temp, mq, gas, flame, flameAO, ldr }) {
  // DANGER: Extreme conditions
  const danger = temp >= 55 || mq >= 1000 || gas >= 1000 || flameAO >= 3000
  if (danger) return 'DANGER'

  // WARNING: Flame + low LDR or elevated readings
  const warning = 
    (flame && ldr < 200) ||  // 🔥 Key logic: Flame in darkness
    temp >= 35 || 
    mq >= 850 || 
    gas >= 850 || 
    flameAO >= 1500
  if (warning) return 'WARNING'

  return 'NORMAL'
}
```

---

## Calibration Notes

You may need to adjust thresholds based on your environment:

- **LDR threshold (200)**: Test in your room's darkness level
- **MQ/Gas (850/1000)**: Calibrate based on baseline air quality
- **Temperature (35/55)**: Adjust for climate (hot countries may need higher)
- **Flame AO (1500/3000)**: Test with different flame distances

Monitor false positives/negatives and tune accordingly!
