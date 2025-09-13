import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const StatsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.3 });
  
  const [counters, setCounters] = useState({
    patients: 0,
    appointments: 0,
    satisfaction: 0,
    doctors: 0
  });

  const finalValues = {
    patients: 10000,
    appointments: 50000,
    satisfaction: 98,
    doctors: 1200
  };

  useEffect(() => {
    if (isInView) {
      const duration = 2000; // 2 seconds
      const steps = 60; // 60 steps for smooth animation
      const stepDuration = duration / steps;

      const animate = (key, finalValue) => {
        let currentStep = 0;
        const increment = finalValue / steps;
        
        const timer = setInterval(() => {
          currentStep++;
          const currentValue = Math.round(increment * currentStep);
          
          setCounters(prev => ({
            ...prev,
            [key]: currentValue >= finalValue ? finalValue : currentValue
          }));
          
          if (currentStep >= steps) {
            clearInterval(timer);
          }
        }, stepDuration);
        
        return timer;
      };

      // Start animations with delays
      const timers = [
        setTimeout(() => animate('patients', finalValues.patients), 200),
        setTimeout(() => animate('appointments', finalValues.appointments), 400),
        setTimeout(() => animate('satisfaction', finalValues.satisfaction), 600),
        setTimeout(() => animate('doctors', finalValues.doctors), 800)
      ];

      return () => {
        timers.forEach(clearTimeout);
      };
    }
  }, [isInView]);

  const stats = [
    {
      key: 'patients',
      label: 'Patients Served',
      value: counters.patients,
      suffix: '+',
      icon: '👥',
      description: 'Trust our platform',
      color: 'from-blue-500 to-blue-600'
    },
    {
      key: 'appointments',
      label: 'Appointments Booked',
      value: counters.appointments,
      suffix: '+',
      icon: '📅',
      description: 'Successfully scheduled',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      key: 'satisfaction',
      label: 'Satisfaction Rate',
      value: counters.satisfaction,
      suffix: '%',
      icon: '⭐',
      description: 'User satisfaction',
      color: 'from-purple-500 to-purple-600'
    },
    {
      key: 'doctors',
      label: 'Healthcare Providers',
      value: counters.doctors,
      suffix: '+',
      icon: '👨‍⚕️',
      description: 'Medical professionals',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.9 
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section ref={ref} className="py-20 px-4 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
            className="inline-block"
          >
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              📊 Platform Impact
            </div>
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Trusted by Healthcare
            <span className="block text-primary">Communities Worldwide</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our numbers tell the story of improved healthcare access, better patient outcomes, 
            and streamlined medical practice management.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.key}
              variants={itemVariants}
              whileHover={{ 
                y: -10,
                scale: 1.05,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              className="relative group"
            >
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center relative overflow-hidden">
                {/* Animated Background */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  animate={{ 
                    background: [
                      `linear-gradient(45deg, transparent, transparent)`,
                      `linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1))`,
                      `linear-gradient(45deg, transparent, transparent)`
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Icon */}
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.2
                  }}
                  className="text-4xl mb-4"
                >
                  {stat.icon}
                </motion.div>

                {/* Counter */}
                <motion.div 
                  className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}
                >
                  <motion.span
                    key={stat.value}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {stat.value.toLocaleString()}{stat.suffix}
                  </motion.span>
                </motion.div>

                {/* Label */}
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                  {stat.label}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  {stat.description}
                </p>

                {/* Progress Ring Animation */}
                <motion.div
                  className="absolute top-4 right-4 w-8 h-8"
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                    <motion.circle
                      cx="16"
                      cy="16"
                      r="12"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="text-border"
                    />
                    <motion.circle
                      cx="16"
                      cy="16"
                      r="12"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="text-primary"
                      strokeDasharray={`${2 * Math.PI * 12}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 12 }}
                      animate={isInView ? { strokeDashoffset: 0 } : {}}
                      transition={{ 
                        duration: 2, 
                        delay: 0.5 + index * 0.1,
                        ease: "easeInOut" 
                      }}
                    />
                  </svg>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Achievement Badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 flex flex-wrap justify-center gap-6"
        >
          {[
            { icon: '🏆', text: 'Industry Leader' },
            { icon: '🔒', text: 'HIPAA Certified' },
            { icon: '⚡', text: '99.9% Uptime' },
            { icon: '🌟', text: 'Top Rated' }
          ].map((badge, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ 
                duration: 0.5, 
                delay: 1 + index * 0.1,
                type: "spring",
                stiffness: 200
              }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="bg-white rounded-full px-6 py-3 shadow-healthcare border border-border flex items-center gap-2"
            >
              <span className="text-xl">{badge.icon}</span>
              <span className="text-sm font-medium text-foreground">{badge.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;