import { SplineScene } from "@/components/ui/spline";
import { Card, CardContent } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";
import { TrendingUp, Target, Zap } from 'lucide-react';

export function SplineSceneActivity() {
  return (
    <Card className="w-full h-[600px] bg-black/[0.96] relative overflow-hidden border-cyan-500/20">
      {/* Cursor-tracking spotlight effect */}
      <Spotlight
        className="from-cyan-500/40 via-purple-500/20"
        size={300}
      />
      
      <div className="flex h-full flex-col lg:flex-row">
        {/* Left content */}
        <div className="flex-1 p-8 lg:p-12 relative z-10 flex flex-col justify-center">
          <div className="space-y-6">
            <div className="inline-block">
              <span className="text-sm font-medium tracking-widest uppercase bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
                Your Productivity Hub
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
              Track. Complete. Achieve.
            </h1>
            
            <p className="mt-4 text-neutral-300 max-w-lg text-lg">
              Transform your daily tasks into achievements with our interactive 
              3D activity tracker. Stay focused, stay productive.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3 mt-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-cyan-300">Real-time Analytics</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                <Target className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-purple-300">Goal Tracking</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20">
                <Zap className="h-4 w-4 text-pink-400" />
                <span className="text-sm text-pink-300">Smart Reminders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right content - 3D Scene */}
        <div className="flex-1 relative min-h-[300px] lg:min-h-0">
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
          
          {/* Gradient overlay for blend */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/40 pointer-events-none"></div>
        </div>
      </div>

      {/* Bottom gradient border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
    </Card>
  );
}
