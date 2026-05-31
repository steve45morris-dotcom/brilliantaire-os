import React, { useEffect, useState, useRef } from "react";
import { Play, Music, Camera, Globe, MessageSquare, BookOpen, Activity } from "lucide-react";

interface PlatformData {
  platform: string;
  metrics: Record<string, number>;
  status: string;
}

const FALLBACK_METRICS: PlatformData[] = [
  { platform: "YouTube", metrics: { Subscribers: 12400, Views: 342000, Engagement: 8400 }, status: "SUCCESS" },
  { platform: "TikTok", metrics: { Followers: 58200, Likes: 1200000, Views: 890000 }, status: "SUCCESS" },
  { platform: "Instagram", metrics: { Followers: 23500, Reach: 98000, Engagement: 4200 }, status: "SUCCESS" },
  { platform: "Facebook", metrics: { Followers: 12100, Reach: 45000, Engagement: 2100 }, status: "SUCCESS" },
  { platform: "WhatsApp", metrics: { Contacts: 450, "Sent Messages": 12400, "Read Rate %": 98 }, status: "SUCCESS" },
  { platform: "Obsidian", metrics: { Notes: 1240, "Active Tasks": 42, "Linked Nodes": 312 }, status: "SUCCESS" }
];

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  youtube: <Play className="w-6 h-6 text-red-500 fill-red-500/20" />,
  tiktok: <Music className="w-6 h-6 text-cyan-400" />,
  instagram: <Camera className="w-6 h-6 text-pink-500" />,
  facebook: <Globe className="w-6 h-6 text-blue-600" />,
  whatsapp: <MessageSquare className="w-6 h-6 text-green-500" />,
  obsidian: <BookOpen className="w-6 h-6 text-purple-500" />
};

function AnimatedNumber({ value }: { value: number }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const duration = 1500; // 1.5s
          const startTime = performance.now();

          const animate = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            // Ease out quad
            const ease = progress * (2 - progress);
            setCurrent(Math.floor(ease * value));

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCurrent(value);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [value, hasAnimated]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toString();
  };

  return <span ref={ref}>{formatNumber(current)}</span>;
}

export default function MetricsPreview() {
  const [platforms, setPlatforms] = useState<PlatformData[]>(FALLBACK_METRICS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        // Try local Next.js endpoint
        const res = await fetch("http://localhost:8000/api/metrics");
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          // Normalize platforms casing
          const normalized = json.data.map((item: any) => ({
            platform: item.platform,
            metrics: item.metrics,
            status: item.status
          }));
          
          // Re-order to have a consistent order
          const order = ["youtube", "tiktok", "instagram", "facebook", "whatsapp", "obsidian"];
          const sorted = order.map(p => {
            const found = normalized.find((n: any) => n.platform.toLowerCase() === p);
            if (found) return found;
            return FALLBACK_METRICS.find(f => f.platform.toLowerCase() === p)!;
          });
          setPlatforms(sorted);
        }
      } catch (err) {
        console.warn("Could not fetch live metrics, using fallback metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
      {platforms.map((platformData) => {
        const key = platformData.platform.toLowerCase();
        const icon = PLATFORM_ICONS[key] || <Activity className="w-6 h-6 text-gray-400" />;
        
        return (
          <div 
            key={platformData.platform} 
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(109,40,217,0.15)] group"
          >
            {/* Background ambient glow on hover */}
            <div className="absolute -inset-px bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  {icon}
                </div>
                <h3 className="font-display font-bold text-lg text-white tracking-wide">
                  {platformData.platform}
                </h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono tracking-wider ${
                platformData.status === "SUCCESS" 
                  ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                  : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
              }`}>
                {platformData.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
              {Object.entries(platformData.metrics).map(([metricName, val]) => (
                <div key={metricName} className="text-center">
                  <div className="text-xl font-bold font-mono text-white tracking-tight mb-1">
                    <AnimatedNumber value={val} />
                  </div>
                  <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider truncate">
                    {metricName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
