import React, { useState } from "react";
import { Tv, Loader2, X, Wifi, Monitor } from "lucide-react";
import { DLNADevice, scanForDevices, playOnDevice, stopOnDevice } from "@/lib/dlna";
import { motion, AnimatePresence } from "framer-motion";

interface CastButtonProps {
  videoUrl: string;
}

const CastButton: React.FC<CastButtonProps> = ({ videoUrl }) => {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<DLNADevice[]>([]);
  const [casting, setCasting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    setDevices([]);
    try {
      const found = await scanForDevices('192.168.1', 1, 254, (dev) => {
        setDevices((prev) => [...prev, dev]);
      });
      if (found.length === 0) {
        // Try 192.168.0.x subnet too
        await scanForDevices('192.168.0', 1, 254, (dev) => {
          setDevices((prev) => [...prev, dev]);
        });
      }
    } catch {
      setError('Erro ao escanear a rede');
    }
    setScanning(false);
  };

  const handleCast = async (device: DLNADevice) => {
    setCasting(device.ip);
    const ok = await playOnDevice(device, videoUrl);
    if (!ok) {
      setError(`Falha ao transmitir para ${device.name}`);
    }
    setCasting(null);
  };

  const handleStop = async (device: DLNADevice) => {
    await stopOnDevice(device);
  };

  return (
    <>
      <button
        onClick={() => { setOpen(true); handleScan(); }}
        className="p-2 rounded-lg bg-primary/20 hover:bg-primary/40 text-primary transition-colors"
        title="Transmitir para TV"
      >
        <Tv className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl w-full max-w-sm p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-primary" />
                  Transmitir para TV
                </h3>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {scanning && (
                <div className="flex items-center gap-3 text-muted-foreground py-4 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Escaneando dispositivos na rede...</span>
                </div>
              )}

              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {devices.map((dev) => (
                  <button
                    key={dev.ip}
                    onClick={() => handleCast(dev)}
                    disabled={casting === dev.ip}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left"
                  >
                    <Monitor className="w-8 h-8 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{dev.name}</p>
                      <p className="text-xs text-muted-foreground">{dev.ip} • {dev.manufacturer || dev.type}</p>
                    </div>
                    {casting === dev.ip && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  </button>
                ))}
              </div>

              {!scanning && devices.length === 0 && !error && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Nenhum dispositivo encontrado.
                  <br />
                  <span className="text-xs">Certifique-se de estar na mesma rede WiFi.</span>
                </p>
              )}

              <button
                onClick={handleScan}
                disabled={scanning}
                className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {scanning ? 'Escaneando...' : 'Escanear novamente'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CastButton;
