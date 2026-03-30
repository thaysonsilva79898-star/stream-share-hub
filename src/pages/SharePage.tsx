import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tv, Play, Pause, ExternalLink, Loader2, ShieldX, Maximize, SkipBack, SkipForward, ArrowLeft, Volume2, VolumeX, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import mpegts from "mpegts.js";

interface ShareData {
  stream_title: string;
  stream_url: string;
  stream_type: string;
  stream_id: number;
  extension: string | null;
  episode_id: number | null;
  season_num: number | null;
  episode_num: number | null;
  expires_at: string;
}

const SharePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appLink, setAppLink] = useState<string>("/");
  const [playing, setPlaying] = useState(false);

  // Player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<mpegts.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const controlsTimer = useRef<ReturnType<typeof setTimeout>>();
  const popupShownRef = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) { setError("Link inválido"); setLoading(false); return; }

      const { data: shareData, error: shareErr } = await supabase
        .from("share_tokens")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (shareErr || !shareData) {
        setError("Link expirado ou inválido");
        setLoading(false);
        return;
      }

      if (new Date(shareData.expires_at) < new Date()) {
        setError("Este link expirou");
        setLoading(false);
        return;
      }

      setData(shareData as ShareData);

      const { data: settings } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "app_link")
        .maybeSingle();

      if (settings?.value) {
        const val = typeof settings.value === "string" ? settings.value : (settings.value as any).url || "/";
        setAppLink(val);
      }

      setLoading(false);
    };
    fetchData();
  }, [token]);

  // Setup video player
  useEffect(() => {
    if (!playing || !data || !videoRef.current) return;

    const proxyBase = `${import.meta.env.VITE_SUPABASE_URL || ""}/functions/v1/iptv-proxy`;
    const streamUrl = `${proxyBase}?streamUrl=${encodeURIComponent(data.stream_url)}`;
    const video = videoRef.current;
    const isLive = data.stream_type === "live";

    if (playerRef.current) {
      try { playerRef.current.pause(); playerRef.current.unload(); playerRef.current.detachMediaElement(); playerRef.current.destroy(); } catch {}
      playerRef.current = null;
    }

    if (isLive && mpegts.isSupported()) {
      const player = mpegts.createPlayer({ type: "mpegts", isLive: true, url: streamUrl }, { enableWorker: true, lazyLoadMaxDuration: 300, seekType: "range" });
      player.attachMediaElement(video);
      player.load();
      player.play();
      playerRef.current = player;
    } else {
      video.src = streamUrl;
      video.load();
      video.play().catch(() => {});
    }

    setIsPlaying(true);
    hideControlsLater();

    return () => {
      if (playerRef.current) {
        try { playerRef.current.pause(); playerRef.current.unload(); playerRef.current.detachMediaElement(); playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
      video.removeAttribute("src");
      video.load();
    };
  }, [playing, data]);

  // 50 minute popup
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && video.currentTime >= 3000 && !popupShownRef.current) {
        popupShownRef.current = true;
        setShowPopup(true);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [playing]);

  const hideControlsLater = useCallback(() => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    setShowControls(true);
    controlsTimer.current = setTimeout(() => setShowControls(false), 4000);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play(); setIsPlaying(true); }
    else { videoRef.current.pause(); setIsPlaying(false); }
  };

  const seekTo = (time: number) => {
    if (!videoRef.current || !isFinite(videoRef.current.duration)) return;
    videoRef.current.currentTime = Math.max(0, Math.min(time, videoRef.current.duration));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current.requestFullscreen();
  };

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const goToApp = () => {
    if (appLink && appLink !== "/") window.open(appLink, "_blank", "noopener");
    else window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "hsl(var(--primary))" }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 p-6">
          <ShieldX className="w-16 h-16 mx-auto" style={{ color: "hsl(var(--destructive))" }} />
          <h1 className="font-display text-xl font-bold text-foreground">{error || "Erro"}</h1>
          <p className="text-muted-foreground text-sm">O link não é mais válido ou não existe.</p>
        </div>
      </div>
    );
  }

  // Full player view
  if (playing) {
    const isLive = data.stream_type === "live";
    return (
      <div ref={containerRef} className="h-screen bg-background relative" onMouseMove={hideControlsLater} onClick={hideControlsLater}>
        <video
          ref={videoRef}
          className="w-full h-full"
          playsInline
          onTimeUpdate={() => {
            const v = videoRef.current;
            if (v) { setCurrentTime(v.currentTime); if (v.duration && isFinite(v.duration)) setDuration(v.duration); }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Watermark - positioned away from buttons */}
        <div className="absolute top-4 right-4 opacity-30 pointer-events-none select-none z-40">
          <div className="flex items-center gap-1.5">
            <Tv className="w-4 h-4 text-foreground/50" />
            <span className="font-display text-xs text-foreground/50 tracking-wider">THAYSON TV</span>
          </div>
        </div>

        {/* Controls overlay */}
        <AnimatePresence>
          {showControls && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {/* Top */}
              <div className="flex items-center gap-3 p-4 bg-gradient-to-b from-background/80 to-transparent pointer-events-auto">
                <button onClick={() => setPlaying(false)} className="w-10 h-10 rounded-full bg-card/60 flex items-center justify-center">
                  <ArrowLeft className="w-5 h-5 text-foreground" />
                </button>
                <h2 className="text-foreground font-semibold text-lg truncate">{data.stream_title}</h2>
                {isLive && <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}>AO VIVO</span>}
              </div>

              {/* Center */}
              <div className="flex items-center justify-center gap-8 pointer-events-auto">
                {!isLive && (
                  <button onClick={() => seekTo(currentTime - 10)} className="w-14 h-14 rounded-full bg-card/40 flex items-center justify-center">
                    <SkipBack className="w-7 h-7 text-foreground" />
                  </button>
                )}
                <button onClick={togglePlay} className="w-20 h-20 rounded-full border-2 flex items-center justify-center" style={{ background: "hsla(135,100%,50%,0.2)", borderColor: "hsl(var(--primary))" }}>
                  {isPlaying ? <Pause className="w-10 h-10" style={{ color: "hsl(var(--primary))" }} /> : <Play className="w-10 h-10 ml-1" style={{ color: "hsl(var(--primary))" }} />}
                </button>
                {!isLive && (
                  <button onClick={() => seekTo(currentTime + 10)} className="w-14 h-14 rounded-full bg-card/40 flex items-center justify-center">
                    <SkipForward className="w-7 h-7 text-foreground" />
                  </button>
                )}
              </div>

              {/* Bottom */}
              <div className="p-4 bg-gradient-to-t from-background/80 to-transparent space-y-3 pointer-events-auto">
                {!isLive && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-14 text-right font-mono">{formatTime(currentTime)}</span>
                    <div ref={progressBarRef} className="flex-1 h-3 bg-secondary/60 rounded-full cursor-pointer relative"
                      onClick={(e) => {
                        const rect = progressBarRef.current?.getBoundingClientRect();
                        if (!rect || !duration) return;
                        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                        seekTo(pct * duration);
                      }}>
                      <div className="h-full rounded-full relative" style={{ width: `${Math.min(progressPct, 100)}%`, background: "hsl(var(--primary))" }}>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 shadow-lg transform translate-x-1/2" style={{ background: "hsl(var(--primary))", borderColor: "hsl(var(--primary-foreground))" }} />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-14 font-mono">{formatTime(duration)}</span>
                  </div>
                )}
                <div className="flex items-center justify-center gap-4">
                  <button onClick={() => { setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted; }}
                    className="w-10 h-10 rounded-full bg-card/60 flex items-center justify-center">
                    {muted ? <VolumeX className="w-5 h-5 text-foreground" /> : <Volume2 className="w-5 h-5 text-foreground" />}
                  </button>
                  <button onClick={toggleFullscreen} className="w-10 h-10 rounded-full bg-card/60 flex items-center justify-center">
                    <Maximize className="w-5 h-5 text-foreground" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 50 minute popup */}
        <AnimatePresence>
          {showPopup && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="absolute top-4 left-4 right-4 z-50 p-4 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-md shadow-xl"
            >
              <button onClick={() => setShowPopup(false)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                <X className="w-3 h-3 text-foreground" />
              </button>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "hsla(135,100%,50%,0.15)" }}>
                  <Tv className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
                </div>
                <div className="space-y-2 flex-1">
                  <p className="text-foreground font-semibold text-sm">Curtindo a reprodução? 🎬</p>
                  <p className="text-muted-foreground text-xs">
                    No app original você tem acesso a filmes, séries, canais ao vivo e muito mais — tudo grátis!
                  </p>
                  <button
                    onClick={goToApp}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                  >
                    <ExternalLink className="w-3 h-3" /> Ir pro App
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Share info page
  const expiresDate = new Date(data.expires_at).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  return (
    <div className="h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsla(135,100%,50%,0.6))" }}>
            <span className="font-display text-3xl font-black" style={{ color: "hsl(var(--primary-foreground))" }}>T</span>
          </div>
          <h1 className="font-display text-lg font-bold tracking-[0.2em]" style={{ color: "hsl(var(--primary))" }}>THAYSON TV</h1>
        </div>

        {/* Content info */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <Tv className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
            <h2 className="text-foreground font-semibold">{data.stream_title}</h2>
          </div>
          <p className="text-muted-foreground text-xs">
            {data.stream_type === "live" ? "🔴 Ao Vivo" : data.stream_type === "movie" ? "🎬 Filme" : "📺 Série"}
            {data.episode_num && ` • S${data.season_num}E${data.episode_num}`}
          </p>
          <p className="text-muted-foreground text-[10px]">Expira em: {expiresDate}</p>

          <div className="space-y-2 pt-2">
            <button
              onClick={goToApp}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              <ExternalLink className="w-4 h-4" /> Ir pro App
            </button>
            <button
              onClick={() => setPlaying(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-card border border-border text-foreground font-bold text-sm transition-all hover:bg-muted/50"
            >
              <Play className="w-4 h-4" /> Assistir via Navegador
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SharePage;
