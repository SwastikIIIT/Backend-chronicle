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
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    const browserName = result.browser.name || "Unknown Browser";
    const osName = result.os.name || "Unknown OS";
    let deviceType = result.device.type;
    
    if (!deviceType) {
        if(['Windows', 'Mac OS', 'Linux'].includes(osName)) deviceType = 'Desktop';
        else  deviceType = 'Unknown Device';
    }

    const deviceVendor = result.device.vendor ? `, ${result.device.vendor}` : "";
    const deviceModel = result.device.model ? ` ${result.device.model}` : "";

    const deviceInfo = `${browserName} on ${osName} (${deviceType}${deviceVendor}${deviceModel})`;
    const geo = geoip.lookup(ipAddress);
    

    const country = headers["cf-ipcountry"] || geo?.country || "Unknown";
    const city = headers["cf-city"] || geo?.city || "Unknown";
    const timezone = geo?.timezone || "UTC";

    await LoginEvent.create({
      userId,
      success,
      provider,
      location: { country, city, timezone },
      device: deviceInfo,
      ipAddress,
      userAgent,
      reason,
    });

    console.log(`Login recorded: ${deviceInfo} from ${city}, ${country}`);

  } catch (err) {
    console.error("Login event recording failed:", err);
    // Don't throw error here, otherwise login might fail just because logging failed
    // throw new Error(err?.message || "Login event recording failed");
  }
};