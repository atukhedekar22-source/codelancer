import { motion } from 'framer-motion';
import { ArrowRight, Code2, Users, Zap, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-x-clip pt-16">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/5 to-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
            >
              <Zap className="h-4 w-4" />
              AI-Powered Skill Matching
            </motion.div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Connect with{' '}
              <span className="gradient-text">Top Freelancers</span>{' '}
              for Your Projects
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              Overloaded with work? CodeLancer connects you with skilled freelancers who complete your projects efficiently. AI-powered matching ensures the perfect fit every time.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="xl" asChild>
                <Link to="/signup" className="flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/projects">Browse Projects</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-border">
              <div>
                <div className="font-display text-3xl font-bold text-foreground">10K+</div>
                <div className="text-sm text-muted-foreground">Freelancers</div>
              </div>
              <div>
                <div className="font-display text-3xl font-bold text-foreground">5K+</div>
                <div className="text-sm text-muted-foreground">Projects Done</div>
              </div>
              <div>
                <div className="font-display text-3xl font-bold text-foreground">98%</div>
                <div className="text-sm text-muted-foreground">Satisfaction</div>
              </div>
            </div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Main Card */}
              <motion.div
                className="glass rounded-3xl p-8 shadow-xl border border-border"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
                    <Code2 className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">React Dashboard Project</h3>
                    <p className="text-sm text-muted-foreground">Posted 2 hours ago</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['React', 'TypeScript', 'Tailwind CSS'].map((skill) => (
                    <span key={skill} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-foreground">₹25,000</span>
                  <Button variant="gradient" size="sm">Apply Now</Button>
                </div>
              </motion.div>

              {/* Floating Elements */}
              <motion.div
                className="absolute -top-6 -right-6 glass rounded-2xl p-4 shadow-lg border border-border"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">Secure Payments</div>
                    <div className="text-xs text-muted-foreground">Escrow Protected</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -left-8 glass rounded-2xl p-4 shadow-lg border border-border"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">15 Bids</div>
                    <div className="text-xs text-muted-foreground">AI Matched</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
