import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Code2, Brain, Sparkles, TrendingUp, ShieldCheck, CheckCircle2, Play } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";

const features = [
  { 
    title: "Real-time Voice & Video", 
    desc: "Grok-powered conversational AI that interacts naturally, adapting to candidate responses in real-time.",
    icon: <Bot className="size-6 text-blue-400" />
  },
  { 
    title: "Multi-Round Handoff", 
    desc: "Seamlessly transition from HR screening to Technical to Coding rounds with context preservation.",
    icon: <ArrowRight className="size-6 text-purple-400" />
  },
  { 
    title: "Live Coding IDE", 
    desc: "Built-in Monaco editor with automated test execution and real-time pair-programming analysis.",
    icon: <Code2 className="size-6 text-green-400" />
  },
  { 
    title: "Automated Scorecards", 
    desc: "Comprehensive competency scoring, strengths, and red flags generated instantly after the interview.",
    icon: <TrendingUp className="size-6 text-orange-400" />
  },
  { 
    title: "Enterprise Security", 
    desc: "SOC2 compliant infrastructure ensuring candidate data privacy and secure role configurations.",
    icon: <ShieldCheck className="size-6 text-indigo-400" />
  },
  { 
    title: "Candidate Practice Portal", 
    desc: "Allow candidates to simulate real interview scenarios to build confidence and hone their skills.",
    icon: <Brain className="size-6 text-pink-400" />
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[--grok-dark] text-[--grok-white] selection:bg-[--grok-accent]/30 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-40">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[--grok-accent]/20 via-transparent to-transparent opacity-60 pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[--grok-accent]/10 text-[--grok-accent] border border-[--grok-accent]/20 mb-8 animate-fade-in-up">
            <Sparkles className="size-4" />
            <span className="text-sm font-medium">The Future of Technical Hiring</span>
          </div>
          
          <h1 className="max-w-4xl mx-auto text-5xl font-bold tracking-tight text-white sm:text-7xl mb-8 animate-fade-in-up [animation-delay:100ms]">
            Hire the top 1% with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-[--grok-accent] to-purple-500">
              Grok-Powered Interviews
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg leading-8 text-[--grok-gray-300] mb-10 animate-fade-in-up [animation-delay:200ms]">
            Automate your entire interview pipeline from HR screening to live coding assessments. 
            Get deep, unbiased insights into every candidate's true potential.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up [animation-delay:300ms]">
            <Button size="lg" className="w-full sm:w-auto bg-[--grok-accent] hover:bg-[--grok-accent-hover] text-black font-semibold h-12 px-8 text-base transition-all hover:scale-105" asChild>
              <Link href="/dashboard">
                For Companies
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base border-[--color-border] hover:bg-white/5 transition-all hover:scale-105" asChild>
              <Link href="/practice">
                <Play className="ml-2 size-4 mr-2" />
                For Candidates
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="border-y border-[--color-border] bg-[--grok-gray-900]/50 backdrop-blur-sm py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">3x</div>
              <div className="text-sm text-[--grok-gray-400]">Faster Time-to-Hire</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">98%</div>
              <div className="text-sm text-[--grok-gray-400]">Assessment Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">10k+</div>
              <div className="text-sm text-[--grok-gray-400]">Interviews Conducted</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-sm text-[--grok-gray-400]">Candidate Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
              A Complete Hiring Ecosystem
            </h2>
            <p className="text-lg text-[--grok-gray-400]">
              Everything you need to evaluate candidates fairly, thoroughly, and efficiently at scale.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div 
                key={f.title} 
                className="group relative rounded-2xl border border-[--color-border] bg-[--grok-gray-900] p-8 hover:bg-[--grok-gray-800] transition-colors duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                <div className="mb-6 inline-flex size-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                  {f.icon}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">{f.title}</h3>
                <p className="text-[--grok-gray-400] leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works / 3 Rounds */}
      <section className="py-24 bg-[--grok-gray-900] relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-[600px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
                The 3-Round Intelligence
              </h2>
              <p className="text-lg text-[--grok-gray-400] mb-8">
                Our platform mimics the most rigorous technical hiring pipelines, completely automated by Grok.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1 size-8 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30 text-orange-400 font-bold">1</div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">HR & Behavioral Screening</h4>
                    <p className="text-[--grok-gray-400]">Evaluates culture fit, motivation, and communication skills via conversational AI.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1 size-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400 font-bold">2</div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Technical Deep Dive</h4>
                    <p className="text-[--grok-gray-400]">Assesses domain knowledge, system design, and fundamental concepts.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1 size-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 text-green-400 font-bold">3</div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Live Coding Execution</h4>
                    <p className="text-[--grok-gray-400]">Tests algorithmic problem solving with real-time compilation and automated test cases.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-[--grok-accent]/20 to-purple-500/20 blur-3xl" />
              <div className="relative rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">G</div>
                    <div>
                      <div className="font-semibold text-white">Grok Interviewer</div>
                      <div className="text-xs text-green-400 flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Listening...
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4 text-sm text-[--grok-gray-300]">
                    "Can you explain how you would optimize the database queries for the high-traffic feature you mentioned in your resume?"
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= 3 ? 'bg-blue-500 animate-pulse' : 'bg-white/10'}`} style={{ animationDelay: `${i * 100}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden border border-[--grok-accent]/30 bg-[--grok-gray-900] p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[--grok-accent]/10 to-transparent pointer-events-none" />
            <h2 className="text-3xl font-bold text-white mb-6">Ready to transform your hiring process?</h2>
            <p className="text-lg text-[--grok-gray-400] mb-8 max-w-2xl mx-auto">
              Join forward-thinking engineering teams using Interact AI to identify and hire the best talent faster.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" className="bg-white text-black hover:bg-[--grok-gray-200] font-semibold" asChild>
                <Link href="/dashboard">Get Started Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-[--color-border] py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-[--grok-accent]" />
            <span className="font-bold text-lg">Interact AI</span>
          </div>
          <p className="text-sm text-[--grok-gray-500]">
            © {new Date().getFullYear()} Interact AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
