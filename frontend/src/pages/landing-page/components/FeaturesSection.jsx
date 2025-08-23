import React from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9 
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const features = [
    {
      icon: 'Calendar',
      title: 'Smart Appointment Booking',
      description: 'Book appointments with your preferred healthcare providers instantly. Real-time availability and automated reminders.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      icon: 'FileText',
      title: 'Digital Health Records',
      description: 'Secure, centralized access to all your medical records. Share with healthcare providers seamlessly.',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      icon: 'Video',
      title: 'Telemedicine Platform',
      description: 'Connect with doctors virtually for consultations, follow-ups, and emergency care from anywhere.',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      icon: 'Shield',
      title: 'HIPAA Compliant Security',
      description: 'Bank-level encryption and HIPAA compliance ensure your health data is always protected and private.',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      icon: 'Activity',
      title: 'Health Analytics',
      description: 'Track your health metrics, medication adherence, and get personalized insights for better wellness.',
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      icon: 'Users',
      title: 'Care Team Coordination',
      description: 'Connect your entire care team including doctors, nurses, specialists, and family members.',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    }
  ];

  return (
    <section id="features" ref={ref} className="py-20 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={controls}
          variants={{
            visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
          }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={controls}
            variants={{
              visible: { scale: 1, transition: { duration: 0.6, type: "spring", stiffness: 200 } }
            }}
            className="inline-block"
          >
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              ✨ Powerful Features
            </div>
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Everything You Need for
            <span className="block text-primary">Complete Healthcare Management</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our comprehensive platform brings together patients, healthcare providers, 
            and administrators in one seamless digital ecosystem.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          animate={controls}
          initial="hidden"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ 
                y: -10,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              className={`group relative bg-card border ${feature.borderColor} rounded-xl p-8 shadow-healthcare hover:shadow-healthcare-lg transition-all duration-300 cursor-pointer`}
            >
              {/* Background Decoration */}
              <motion.div
                className={`absolute top-0 right-0 w-32 h-32 ${feature.bgColor} rounded-full opacity-10 -translate-y-16 translate-x-16 group-hover:scale-125 transition-transform duration-500`}
              />
              
              <div className="relative z-10">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className={`${feature.bgColor} ${feature.color} w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon name={feature.icon} size={28} />
                </motion.div>

                <h3 className="text-xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>

                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Arrow */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileHover={{ opacity: 1, x: 0 }}
                  className="flex items-center mt-4 text-primary font-medium"
                >
                  Learn More
                  <Icon name="ArrowRight" className="ml-2" size={16} />
                </motion.div>
              </div>

              {/* Interactive Elements */}
              <motion.div
                className="absolute inset-0 border-2 border-primary rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Interactive Demo Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={controls}
          variants={{
            visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.6 } }
          }}
          className="mt-20 text-center"
        >
          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-3xl p-12 border border-border">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mb-6"
            >
              <Icon name="Zap" className="text-primary mx-auto" size={48} />
            </motion.div>
            
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to Experience the Future?
            </h3>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of patients and healthcare providers who have transformed 
              their healthcare experience with SmartClinicHub.
            </p>

            <motion.div className="flex flex-wrap justify-center gap-4">
              {['🏥 500+ Clinics', '👨‍⚕️ 2000+ Doctors', '🏆 99% Uptime', '🔒 100% Secure'].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={controls}
                  variants={{
                    visible: { 
                      opacity: 1, 
                      scale: 1, 
                      transition: { delay: 0.8 + index * 0.1, type: "spring", stiffness: 200 } 
                    }
                  }}
                  className="bg-white rounded-full px-6 py-3 text-sm font-medium shadow-healthcare border border-border"
                >
                  {stat}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;