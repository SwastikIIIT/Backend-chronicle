import LoginEvent from "../models/LoginEvent.js";
import { UAParser } from "ua-parser-js";
import geoip from "geoip-lite";

export const recordLoginEvent = async ({
  userId,
  headers,
  success,
  provider,
  ipAddress = null,
  userAgent = "Unknown",
  reason = null,
}) => {
  try {
    // User Agent se device and browser info
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const browserName = result.browser.name || "Unknown Browser";
    const osName = result.os.name || "Unknown OS";
    let deviceType = result.device.type || "desktop";
    const cleanDevice = deviceType.charAt(0).toUpperCase() + deviceType.slice(1).toLowerCase();

    const deviceVendor = result.device.vendor ? ` ${result.device.vendor}` : "";
    const deviceModel = result.device.model ? ` ${result.device.model}` : "";

    const deviceInfo = `${browserName} on ${osName} (${cleanDevice}${deviceVendor}${deviceModel})`;
    //  Location info via IP address
    const geo = geoip.lookup(ipAddress);
    const country = geo?.country || "Unknown";
    const region = geo?.region || "Unknown";
    const timezone = geo?.timezone || "UTC";
    
    console.log("Device Info:", deviceInfo);
    console.log("Location details:", geo);

    await LoginEvent.create({
      userId,
      success,
      provider,
      location: { country, region, timezone },
      device: deviceInfo,
      ipAddress,
      reason,
    });

    console.log(`Login recorded: ${deviceInfo} from ${region}, ${country}`);
  } catch (err) {
    console.error("Login event recording failed:", err);
  }
};
