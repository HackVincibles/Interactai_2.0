import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Code2, MessageSquare, Play, Sparkles, Clock, Coins, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { MockPackWithId } from "@/lib/firestore-service";

export default function PracticePortal() {
  const [mockPacks, setMockPacks] = useState<MockPackWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMockPacks = async () => {
      try {
        const response = await fetch("/api/mock-packs");
        if (response.ok) {
          const data = await response.json();
          setMockPacks(data.packs || []);
        }
      } catch (error) {
        console.error("Failed to fetch mock packs:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMockPacks();
  }, []);

  return (
    <div className="min-h-screen bg-[--grok-dark] text-[--grok-white]">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[--grok-gray-900] to-[--grok-dark] pt-16 pb-20">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4 border-[--grok-accent]/50 text-[--grok-accent] bg-[--grok-accent]/10 backdrop-blur-sm px-4 py-1.5">
              <Sparkles className="mr-2 size-4" />
              Candidate Practice Portal
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-6">
              Nail Your Next Interview with <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-[--grok-accent] to-blue-500">Grok AI</span>
            </h1>
            <p className="text-lg leading-8 text-[--grok-gray-300]">
              Simulate realistic HR and Technical interviews tailored to specific roles. 
              Get instant, actionable feedback and automated scorecards to improve your performance.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Brain className="text-[--grok-accent] size-6" />
              Available Mock Packs
            </h2>
            <p className="text-[--grok-gray-400] mt-1">Select a pack to start your simulated interview journey.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-[--grok-gray-900]/50 border-[--color-border] animate-pulse">
                <CardHeader className="h-32 bg-[--grok-gray-800]/50 rounded-t-xl" />
                <CardContent className="h-40" />
              </Card>
            ))}
          </div>
        ) : mockPacks.length === 0 ? (
          <div className="text-center py-24 rounded-2xl border border-[--color-border] bg-[--grok-gray-900]/30 backdrop-blur-sm">
            <div className="inline-flex items-center justify-center size-16 rounded-full bg-[--grok-gray-800] mb-4">
              <Sparkles className="size-8 text-[--grok-gray-400]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No mock packs available yet</h3>
            <p className="text-[--grok-gray-400]">Check back later for new interview simulations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockPacks.map((pack) => (
              <Card key={pack.id} className="group relative overflow-hidden bg-[--grok-gray-900] border-[--color-border] hover:border-[--grok-accent]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[--grok-accent]/10 flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-[--grok-accent]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="bg-[--grok-gray-800] text-[--grok-gray-300]">
                      {pack.companyTheme}
                    </Badge>
                    <Badge variant="outline" className={`
                      ${pack.difficulty === 'Easy' ? 'text-green-400 border-green-400/30 bg-green-400/10' : ''}
                      ${pack.difficulty === 'Medium' ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' : ''}
                      ${pack.difficulty === 'Hard' ? 'text-red-400 border-red-400/30 bg-red-400/10' : ''}
                    `}>
                      {pack.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl leading-tight text-white">{pack.title}</CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-[--grok-gray-300]">
                        <Clock className="size-4 text-[--grok-gray-500]" />
                        {pack.durationMinutes} mins
                      </div>
                      <div className="flex items-center gap-2 text-[--grok-gray-300]">
                        <Coins className="size-4 text-[--grok-accent]" />
                        ₹{pack.price}
                      </div>
                    </div>
                    
                    <div className="space-y-2 pt-4 border-t border-[--color-border]">
                      <div className="flex items-center gap-2 text-sm text-[--grok-gray-400]">
                        <CheckCircle2 className="size-4 text-green-500/70" />
                        Live HR Screening
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[--grok-gray-400]">
                        <CheckCircle2 className="size-4 text-green-500/70" />
                        Technical Deep Dive
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[--grok-gray-400]">
                        <CheckCircle2 className="size-4 text-green-500/70" />
                        AI Scorecard & Feedback
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="pt-4 border-t border-[--color-border] bg-black/20">
                  <Button className="w-full bg-[--grok-accent] hover:bg-[--grok-accent-hover] text-black font-semibold transition-all group-hover:scale-[1.02]" asChild>
                    <Link href={`/interview/mock-${pack.id}`}>
                      <Play className="size-4 mr-2" />
                      Start Practice
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
