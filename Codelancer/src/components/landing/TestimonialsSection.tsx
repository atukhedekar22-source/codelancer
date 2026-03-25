import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Rahul Sharma',
    role: 'Developer at TechCorp',
    avatar: 'RS',
    rating: 5,
    content: 'CodeLancer has been a game-changer for my team. When we\'re overloaded with client work, we can quickly find qualified freelancers who deliver quality code on time.',
    color: 'bg-primary'
  },
  {
    name: 'Priya Patel',
    role: 'Freelance Developer',
    avatar: 'PP',
    rating: 5,
    content: 'The AI matching is incredible! I get projects that perfectly match my skills. The escrow payment system gives me confidence that I\'ll be paid for my work.',
    color: 'bg-secondary'
  },
  {
    name: 'Amit Kumar',
    role: 'Startup Founder',
    avatar: 'AK',
    rating: 5,
    content: 'As a startup, we needed to scale quickly without hiring full-time. CodeLancer helped us find amazing React developers who built our MVP in just 3 weeks.',
    color: 'bg-success'
  },
  {
    name: 'Sneha Reddy',
    role: 'Full Stack Freelancer',
    avatar: 'SR',
    rating: 5,
    content: 'The platform is intuitive and the real-time chat makes collaboration seamless. I\'ve doubled my income since joining CodeLancer.',
    color: 'bg-warning'
  }
];

const TestimonialsSection = () => {
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
            Success Stories
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Our <span className="gradient-text">Users Say</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join thousands of satisfied developers and freelancers who trust CodeLancer for their projects.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-all duration-300 relative"
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-muted/30" />
              
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 ${testimonial.color} rounded-full flex items-center justify-center text-primary-foreground font-bold`}>
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed">
                "{testimonial.content}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
