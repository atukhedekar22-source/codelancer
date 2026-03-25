import { motion } from 'framer-motion';
import { UserPlus, FileText, Users, CheckCircle, Wallet } from 'lucide-react';

const developerSteps = [
  {
    icon: UserPlus,
    title: 'Create Account',
    description: 'Sign up as a developer and complete your profile verification.'
  },
  {
    icon: FileText,
    title: 'Post Project',
    description: 'Describe your project, set budget, deadline, and required skills.'
  },
  {
    icon: Users,
    title: 'Review Bids',
    description: 'Receive AI-matched bids and select the best freelancer.'
  },
  {
    icon: CheckCircle,
    title: 'Approve Work',
    description: 'Review submitted work, request revisions, and approve completion.'
  },
  {
    icon: Wallet,
    title: 'Release Payment',
    description: 'Release secure payment to the freelancer upon satisfaction.'
  }
];

const freelancerSteps = [
  {
    icon: UserPlus,
    title: 'Join Platform',
    description: 'Sign up as a freelancer and showcase your skills and portfolio.'
  },
  {
    icon: FileText,
    title: 'Browse Projects',
    description: 'Explore projects matching your skills with smart filters.'
  },
  {
    icon: Users,
    title: 'Submit Bids',
    description: 'Place competitive bids with compelling proposals.'
  },
  {
    icon: CheckCircle,
    title: 'Complete Work',
    description: 'Deliver quality work within the agreed timeline.'
  },
  {
    icon: Wallet,
    title: 'Get Paid',
    description: 'Receive 90% payment directly to your account.'
  }
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            Simple Process
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            How <span className="gradient-text">CodeLancer</span> Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Whether you're a developer with too much work or a freelancer looking for opportunities, our platform makes it simple.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Developer Flow */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card rounded-3xl p-8 border border-border"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">D</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-foreground">For Developers</h3>
            </div>

            <div className="space-y-6">
              {developerSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Freelancer Flow */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card rounded-3xl p-8 border border-border"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                <span className="text-secondary-foreground font-bold text-lg">F</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-foreground">For Freelancers</h3>
            </div>

            <div className="space-y-6">
              {freelancerSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
