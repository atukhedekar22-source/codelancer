import { motion } from 'framer-motion';
import { 
  Brain, 
  MessageSquare, 
  Shield, 
  CreditCard, 
  Star, 
  Clock, 
  FileCheck, 
  TrendingUp 
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI Skill Matching',
    description: 'Our intelligent algorithm matches projects with the most qualified freelancers based on skills, experience, and past performance.',
    color: 'bg-primary/10 text-primary'
  },
  {
    icon: MessageSquare,
    title: 'Real-time Chat',
    description: 'Communicate seamlessly with developers or freelancers through our built-in real-time messaging system.',
    color: 'bg-secondary/10 text-secondary'
  },
  {
    icon: Shield,
    title: 'Secure Escrow',
    description: 'Funds are held securely until project milestones are completed and approved, protecting both parties.',
    color: 'bg-success/10 text-success'
  },
  {
    icon: CreditCard,
    title: 'Easy Payments',
    description: 'Integrated Razorpay gateway for seamless payments with automatic commission handling.',
    color: 'bg-warning/10 text-warning'
  },
  {
    icon: Star,
    title: 'Ratings & Reviews',
    description: 'Build your reputation with verified reviews from successful project completions.',
    color: 'bg-primary/10 text-primary'
  },
  {
    icon: Clock,
    title: 'Deadline Tracking',
    description: 'Stay on track with project milestones, deadlines, and automated status updates.',
    color: 'bg-secondary/10 text-secondary'
  },
  {
    icon: FileCheck,
    title: 'Verified Profiles',
    description: 'Government ID verification ensures trust and authenticity for all platform users.',
    color: 'bg-success/10 text-success'
  },
  {
    icon: TrendingUp,
    title: 'Analytics Dashboard',
    description: 'Track your earnings, project history, and performance metrics in one place.',
    color: 'bg-warning/10 text-warning'
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Why Choose CodeLancer
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Powerful Features for{' '}
            <span className="gradient-text">Seamless Collaboration</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to manage projects, communicate with teams, and grow your freelance career.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-card rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="font-display font-semibold text-foreground text-lg mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
