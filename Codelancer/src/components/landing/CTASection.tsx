import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CTASection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl gradient-hero p-12 md:p-16 text-center"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-primary-foreground text-sm font-medium mb-6"
            >
              <Sparkles className="h-4 w-4" />
              Start Your Journey Today
            </motion.div>

            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
              Ready to Transform Your Workflow?
            </h2>

            <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-8">
              Join CodeLancer today and experience the future of freelancing. Whether you're looking to delegate work or find exciting projects, we've got you covered.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="xl" 
                className="bg-white text-primary hover:bg-white/90 shadow-xl"
                asChild
              >
                <Link to="/signup" className="flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="xl" 
                className="border-white/30 text-primary-foreground hover:bg-white/10"
                asChild
              >
                <Link to="/how-it-works">Learn More</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
