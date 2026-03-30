/**
 * DLNA/UPnP Device Discovery & Control
 * Works in Capacitor native context using CapacitorHttp for local network requests.
 * Uses SSDP-like discovery via multicast (requires native plugin) or manual IP scan.
 */

export interface DLNADevice {
  name: string;
  location: string;
  ip: string;
  type: 'tv' | 'renderer' | 'unknown';
  manufacturer?: string;
}

// Known DLNA/UPnP ports to scan
const UPNP_PORTS = [8008, 8060, 1400, 49152, 49153, 49154];

// Parse device description XML
function parseDeviceXml(xml: string): Partial<DLNADevice> {
  const getName = (tag: string) => {
    const match = xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`));
    return match?.[1] || '';
  };
  return {
    name: getName('friendlyName') || getName('modelName') || 'Unknown Device',
    manufacturer: getName('manufacturer'),
    type: xml.includes('MediaRenderer') ? 'renderer' : xml.includes('TV') ? 'tv' : 'unknown',
  };
}

// Try to fetch UPnP device description from an IP
async function probeDevice(ip: string, port: number, signal?: AbortSignal): Promise<DLNADevice | null> {
  try {
    const url = `http://${ip}:${port}/description.xml`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    
    const resp = await fetch(url, { signal: signal || controller.signal });
    clearTimeout(timeout);
    
    if (!resp.ok) return null;
    const xml = await resp.text();
    const info = parseDeviceXml(xml);
    
    return {
      name: info.name || `Device ${ip}`,
      location: url,
      ip,
      type: info.type || 'unknown',
      manufacturer: info.manufacturer,
    };
  } catch {
    return null;
  }
}

// Scan local network subnet for DLNA devices
export async function scanForDevices(
  subnetBase = '192.168.1',
  rangeStart = 1,
  rangeEnd = 254,
  onFound?: (device: DLNADevice) => void,
): Promise<DLNADevice[]> {
  const devices: DLNADevice[] = [];
  const batchSize = 20;

  for (let i = rangeStart; i <= rangeEnd; i += batchSize) {
    const promises: Promise<void>[] = [];
    for (let j = i; j < Math.min(i + batchSize, rangeEnd + 1); j++) {
      const ip = `${subnetBase}.${j}`;
      for (const port of UPNP_PORTS) {
        promises.push(
          probeDevice(ip, port).then((dev) => {
            if (dev && !devices.find((d) => d.ip === dev.ip)) {
              devices.push(dev);
              onFound?.(dev);
            }
          })
        );
      }
    }
    await Promise.allSettled(promises);
  }

  return devices;
}

// Send video URL to a DLNA renderer via AVTransport
export async function playOnDevice(device: DLNADevice, videoUrl: string): Promise<boolean> {
  try {
    // First get the device description to find AVTransport control URL
    const descResp = await fetch(device.location);
    const descXml = await descResp.text();
    
    // Extract AVTransport control URL
    const controlMatch = descXml.match(
      /AVTransport.*?<controlURL>(.*?)<\/controlURL>/s
    );
    const controlPath = controlMatch?.[1] || '/MediaRenderer/AVTransport/Control';
    const baseUrl = device.location.replace(/\/[^/]*$/, '');
    const controlUrl = controlPath.startsWith('http') ? controlPath : `${baseUrl}${controlPath}`;

    // SetAVTransportURI SOAP action
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <s:Body>
    <u:SetAVTransportURI xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">
      <InstanceID>0</InstanceID>
      <CurrentURI>${videoUrl}</CurrentURI>
      <CurrentURIMetaData></CurrentURIMetaData>
    </u:SetAVTransportURI>
  </s:Body>
</s:Envelope>`;

    const setResp = await fetch(controlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset="utf-8"',
        'SOAPAction': '"urn:schemas-upnp-org:service:AVTransport:1#SetAVTransportURI"',
      },
      body: soapBody,
    });

    if (!setResp.ok) return false;

    // Play SOAP action
    const playBody = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <s:Body>
    <u:Play xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">
      <InstanceID>0</InstanceID>
      <Speed>1</Speed>
    </u:Play>
  </s:Body>
</s:Envelope>`;

    const playResp = await fetch(controlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset="utf-8"',
        'SOAPAction': '"urn:schemas-upnp-org:service:AVTransport:1#Play"',
      },
      body: playBody,
    });

    return playResp.ok;
  } catch (e) {
    console.error('DLNA play error:', e);
    return false;
  }
}

// Stop playback on device
export async function stopOnDevice(device: DLNADevice): Promise<boolean> {
  try {
    const descResp = await fetch(device.location);
    const descXml = await descResp.text();
    const controlMatch = descXml.match(/AVTransport.*?<controlURL>(.*?)<\/controlURL>/s);
    const controlPath = controlMatch?.[1] || '/MediaRenderer/AVTransport/Control';
    const baseUrl = device.location.replace(/\/[^/]*$/, '');
    const controlUrl = controlPath.startsWith('http') ? controlPath : `${baseUrl}${controlPath}`;

    const stopBody = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <s:Body>
    <u:Stop xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">
      <InstanceID>0</InstanceID>
    </u:Stop>
  </s:Body>
</s:Envelope>`;

    const resp = await fetch(controlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset="utf-8"',
        'SOAPAction': '"urn:schemas-upnp-org:service:AVTransport:1#Stop"',
      },
      body: stopBody,
    });
    return resp.ok;
  } catch {
    return false;
  }
}
