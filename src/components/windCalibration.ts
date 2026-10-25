// Measured from the bundled CC0 recordings after the matching low-pass filter.
// Wind faders keep even worst-case adjacent crossfade peaks below full scale.
export const windCalibration = {
  "breeze": {
    "trim": 19.00241,
    "lowpassHz": 3200,
    "rmsDb": -47.58,
    "peakDb": -28.44
  },
  "windy": {
    "trim": 3.68923,
    "lowpassHz": 3500,
    "rmsDb": -33.34,
    "peakDb": -16.71
  },
  "storm": {
    "trim": 1.45452,
    "lowpassHz": 2800,
    "rmsDb": -25.25,
    "peakDb": -5.79
  }
} as const;
