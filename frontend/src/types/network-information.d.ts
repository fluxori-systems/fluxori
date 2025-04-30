// src/types/network-information.d.ts

interface NetworkInformation extends EventTarget {
  downlink: number;
  effectiveType: "slow-2g" | "2g" | "3g" | "4g";
  rtt: number;
  saveData: boolean;
  type: "bluetooth" | "cellular" | "ethernet" | "none" | "wifi" | "wimax" | "other" | "unknown";
  onchange?: EventListener;
}

interface Navigator {
  connection?: NetworkInformation;
}
