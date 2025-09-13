import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const CTASection = () => {
  const ref = useRef(null);
  const navigate = useNavigate();
  const isInView = useInView(ref, { once: true, threshold: 0.2 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        duration: 0.8
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section ref={ref} className="py-20 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="relative overflow-hidden"
        >
          {/* Main CTA Container */}
          <div className="relative bg-gradient-to-r from-primary via-primary to-accent rounded-3xl p-12 md:p-16 text-center shadow-healthcare-lg">
            {/* Animated Background Pattern */}
            <motion.div
              className="absolute inset-0 opacity-10"
              animate={{
                background: [
                  "radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 50%, white 0%, transparent 50%), radial-gradient(circle at 20% 80%, white 0%, transparent 50%)",
                  "radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)"
                ]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Floating Elements */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-4 h-4 bg-white/20 rounded-full"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${10 + (i % 2) * 70}%`,
                }}
                animate={{
                  y: [-10, 10, -10],
                  x: [-5, 5, -5],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2
                }}
              />
            ))}

            <div className="relative z-10">
              <motion.div variants={itemVariants} className="mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
                  className="inline-block"
                >
                  <div className="bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
                    🚀 Start Your Healthcare Journey
                  </div>
                </motion.div>
                
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                  Ready to Transform Your
                  <span className="block">Healthcare Experience?</span>
                </h2>
                
                <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                  Join thousands of patients and healthcare providers who have revolutionized 
                  their medical care with SmartClinicHub's comprehensive platform.
                </p>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-6 justify-center mb-12"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="secondary"
                    size="xl" 
                    onClick={() => navigate('/login-registration')}
                    className="group bg-white text-primary hover:bg-white/90 font-bold px-10 py-5 relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 bg-primary/5 rounded-xl"
                    />
                    <span className="relative z-10 text-lg">Get Started Free Today</span>
                    <Icon name="ArrowRight" className="ml-3 group-hover:translate-x-1 transition-transform duration-300" size={22} />
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="outline" 
                    size="xl"
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="border-2 border-white/50 text-white hover:bg-white/20 font-semibold px-8 py-4 rounded-xl transition-all duration-300"
                  >
                    <Icon name="Play" className="mr-2" size={20} />
                    Watch Demo
                  </Button>
                </motion.div>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div variants={itemVariants}>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-white/80">
                  <div className="flex items-center gap-2">
                    <Icon name="Shield" size={20} />
                    <span className="text-sm">HIPAA Compliant</span>
                  </div>
                  <div className="hidden sm:block w-px h-6 bg-white/30"></div>
                  <div className="flex items-center gap-2">
                    <Icon name="Clock" size={20} />
                    <span className="text-sm">24/7 Support</span>
                  </div>
                  <div className="hidden sm:block w-px h-6 bg-white/30"></div>
                  <div className="flex items-center gap-2">
                    <Icon name="Zap" size={20} />
                    <span className="text-sm">Setup in Minutes</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Bottom Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 text-center"
          >
            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
                Frequently Asked Questions
              </h3>

              <div className="grid md:grid-cols-2 gap-8 text-left">
                {[
                  {
                    question: "Is my health data secure?",
                    answer: "Yes, we use bank-level encryption and are HIPAA compliant to ensure your data is always protected."
                  },
                  {
                    question: "Can I use this with my existing doctor?",
                    answer: "Absolutely! Invite your healthcare providers to join or connect with new ones in our network."
                  },
                  {
                    question: "Is there a mobile app available?",
                    answer: "Yes, our responsive web platform works seamlessly on all devices, with native apps coming soon."
                  },
                  {
                    question: "How much does it cost?",
                    answer: "We offer flexible pricing plans including a free tier for basic features. Upgrade anytime as you grow."
                  }
                ].map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-card border border-border rounded-xl p-6 hover:shadow-healthcare transition-all duration-300"
                  >
                    <h4 className="font-semibold text-foreground mb-3">{faq.question}</h4>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 1 }}
              className="mt-16 pt-8 border-t border-border"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <Icon name="Heart" className="text-primary" size={24} />
                  <span className="text-xl font-bold text-foreground">SmartClinicHub</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                  <a href="#privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
                  <a href="#terms" className="hover:text-primary transition-colors">Terms of Service</a>
                  <a href="#support" className="hover:text-primary transition-colors">Support</a>
                  <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
                </div>
                
                <div className="flex items-center gap-4">
                  {['Twitter', 'Facebook', 'Linkedin'].map((social, index) => (
                    <motion.a
                      key={social}
                      href={`#${social.toLowerCase()}`}
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
                    >
                      <Icon name={social} size={16} />
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;