import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Download, Star, Users, Play, Tv, Film, Radio, Clapperboard, ChevronDown, Shield, Zap, Smartphone } from "lucide-react";
import screenshotHome from "@/assets/screenshot-home.jpg";
import screenshotMovies from "@/assets/screenshot-movies.jpg";
import screenshotPlayer from "@/assets/screenshot-player.jpg";

const REVIEWS = [
  { name: "Lucas M.", stars: 5, text: "Melhor app de IPTV que já usei! Interface linda e funciona perfeitamente na minha TV." },
  { name: "Ana C.", stars: 5, text: "Incrível! Todos os canais ao vivo funcionando sem travar. Recomendo demais!" },
  { name: "Pedro H.", stars: 4, text: "Muito bom, catálogo enorme de filmes e séries. Fácil de usar." },
  { name: "Maria S.", stars: 5, text: "Substituiu todos os outros apps. Qualidade HD e sem anúncios!" },
  { name: "João R.", stars: 5, text: "O compartilhamento de links é genial. Mandei pra família toda." },
  { name: "Fernanda L.", stars: 4, text: "App leve e rápido. Funciona bem até em celulares mais simples." },
  { name: "Carlos D.", stars: 5, text: "Painel admin é muito prático pra gerenciar. App profissional!" },
  { name: "Bruna F.", stars: 5, text: "Amo a splash screen cinematográfica. Detalhes que fazem diferença." },
];

const STATS = {
  downloads: "12.847",
  activeUsers: "3.291",
  rating: "4.8",
  channels: "5.000+",
};

const LandingPage: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  useEffect(() => {
    // Override body overflow for this page
    document.body.style.overflow = "auto";
    
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    return () => {
      document.body.style.overflow = "hidden";
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback - redirect to main app
      window.location.href = "/";
    }
  };

  const screenshots = [
    { src: screenshotHome, label: "Catálogo de Filmes" },
    { src: screenshotMovies, label: "Detalhes do Filme" },
    { src: screenshotPlayer, label: "Player de Vídeo" },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero Section with 3D perspective */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsla(135,100%,50%,0.08)_0%,_transparent_70%)]" />
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/30"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0],
                y: [0, -200],
                x: Math.random() * 20 - 10,
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${50 + Math.random() * 50}%`,
              }}
            />
          ))}
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {/* 3D Logo */}
          <motion.div
            initial={{ scale: 0, rotateY: -180 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, type: "spring", stiffness: 80 }}
            className="mb-8"
            style={{ perspective: "1000px" }}
          >
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-gradient-to-br from-primary to-primary/40 shadow-[0_0_80px_hsla(135,100%,50%,0.4)]"
              style={{ transform: "rotateX(10deg) rotateY(-5deg)", transformStyle: "preserve-3d" }}>
              <span className="font-display text-6xl font-black" style={{ color: "hsl(var(--primary-foreground))" }}>T</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="font-display text-4xl md:text-6xl font-bold tracking-[0.2em] mb-4 logo-animated"
            style={{ color: "hsl(var(--primary))" }}
          >
            THAYSON TV
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-muted-foreground text-lg md:text-xl mb-4 tracking-wider"
          >
            ENTRETENIMENTO DE ELITE
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-muted-foreground/70 text-sm md:text-base mb-10 max-w-xl mx-auto"
          >
            Filmes, Séries, Canais Ao Vivo e muito mais — tudo grátis, com qualidade HD e sem anúncios.
          </motion.p>

          {/* Download button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1, type: "spring" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleInstall}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-[0_0_40px_hsla(135,100%,50%,0.3)]"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            <Download className="w-6 h-6" />
            {installed ? "Já Instalado ✓" : "Instalar App Grátis"}
          </motion.button>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="flex justify-center gap-8 mt-10 flex-wrap"
          >
            {[
              { icon: Download, label: "Downloads", value: STATS.downloads },
              { icon: Users, label: "Usuários Ativos", value: STATS.activeUsers },
              { icon: Star, label: "Avaliação", value: STATS.rating },
              { icon: Tv, label: "Canais", value: STATS.channels },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="w-5 h-5 mx-auto mb-1" style={{ color: "hsl(var(--primary))" }} />
                <p className="text-foreground font-bold text-xl">{stat.value}</p>
                <p className="text-muted-foreground text-xs">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ delay: 2, duration: 2, repeat: Infinity }}
            className="mt-16"
          >
            <ChevronDown className="w-6 h-6 mx-auto text-muted-foreground/50" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-2xl md:text-3xl font-bold text-center mb-16 tracking-wider"
            style={{ color: "hsl(var(--primary))" }}
          >
            POR QUE ESCOLHER O THAYSON TV?
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Film, title: "Filmes & Séries", desc: "Catálogo com milhares de títulos atualizados diariamente em HD e Full HD." },
              { icon: Radio, title: "Canais Ao Vivo", desc: "Mais de 5.000 canais de TV ao vivo de todo o mundo, sem travamentos." },
              { icon: Zap, title: "Ultra Rápido", desc: "Carregamento instantâneo e streaming sem buffer com servidores otimizados." },
              { icon: Shield, title: "100% Seguro", desc: "Autenticação com Google, dados criptografados e sem anúncios invasivos." },
              { icon: Smartphone, title: "Multi-Plataforma", desc: "Funciona no celular, tablet, PC e Smart TV. Instale como app nativo." },
              { icon: Clapperboard, title: "Interface Premium", desc: "Design moderno estilo cinema com animações suaves e navegação intuitiva." },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all"
              >
                <feature.icon className="w-8 h-8 mb-4" style={{ color: "hsl(var(--primary))" }} />
                <h3 className="text-foreground font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots with 3D perspective */}
      <section className="py-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-2xl md:text-3xl font-bold text-center mb-16 tracking-wider"
            style={{ color: "hsl(var(--primary))" }}
          >
            VEJA O APP EM AÇÃO
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {screenshots.map((ss, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, rotateY: -15, scale: 0.9 }}
                whileInView={{ opacity: 1, rotateY: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.8 }}
                whileHover={{ scale: 1.05, rotateY: 5 }}
                className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl"
                style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
              >
                <img
                  src={ss.src}
                  alt={ss.label}
                  className="w-full aspect-video object-cover"
                  loading="lazy"
                  width={1280}
                  height={720}
                />
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-background/90 to-transparent">
                  <p className="text-foreground font-semibold text-sm">{ss.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-2xl md:text-3xl font-bold text-center mb-4 tracking-wider"
            style={{ color: "hsl(var(--primary))" }}
          >
            O QUE NOSSOS USUÁRIOS DIZEM
          </motion.h2>
          <p className="text-center text-muted-foreground mb-12 text-sm">
            Mais de {STATS.downloads} downloads e nota {STATS.rating}/5
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {REVIEWS.map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-5 rounded-2xl border border-border/50 bg-card/50 space-y-3"
              >
                <div className="flex items-center gap-1">
                  {[...Array(review.stars)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-primary" style={{ color: "hsl(var(--primary))" }} />
                  ))}
                  {[...Array(5 - review.stars)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 text-muted-foreground/30" />
                  ))}
                </div>
                <p className="text-foreground/80 text-sm leading-relaxed">"{review.text}"</p>
                <p className="text-muted-foreground text-xs font-medium">— {review.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsla(135,100%,50%,0.06)_0%,_transparent_70%)]" />
        <div className="relative max-w-2xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/40 shadow-[0_0_60px_hsla(135,100%,50%,0.4)] mb-6">
              <span className="font-display text-4xl font-black" style={{ color: "hsl(var(--primary-foreground))" }}>T</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-wider mb-4" style={{ color: "hsl(var(--primary))" }}>
              BAIXE AGORA
            </h2>
            <p className="text-muted-foreground mb-8">
              Instale o Thayson TV no seu dispositivo e tenha acesso a todo o conteúdo gratuitamente.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleInstall}
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg shadow-[0_0_40px_hsla(135,100%,50%,0.3)]"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              <Download className="w-6 h-6" />
              {installed ? "Já Instalado ✓" : "Instalar Grátis"}
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Tv className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
            <span className="font-display text-sm font-bold tracking-wider" style={{ color: "hsl(var(--primary))" }}>THAYSON TV</span>
          </div>
          <p className="text-muted-foreground text-xs">© 2026 Thayson TV. Entretenimento de Elite.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
