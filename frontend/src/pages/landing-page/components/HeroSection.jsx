import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const HeroSection = () => {
  const navigate = useNavigate();
  const [typewriterText, setTypewriterText] = useState('');
  const fullText = 'Transform Your Healthcare Experience';

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypewriterText(fullText.substring(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
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
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20 pt-28">
      {/* Animated Background Gradient */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-emerald-50"
        animate={{
          background: [
            "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #ecfdf5 100%)",
            "linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdf4 100%)",
            "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #ecfdf5 100%)"
          ]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Text Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center lg:text-left space-y-8 pt-0"
        >
          {/* Top Section - Badge and Title */}
          <motion.div variants={itemVariants} className="space-y-16">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block"
            >
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                🚀 Welcome to the Future of Healthcare
              </div>
            </motion.div>
            
            <div className="h-32 md:h-36 lg:h-40 flex items-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                <span className="block">{typewriterText}</span>
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="inline-block w-1 h-12 bg-primary ml-1"
                />
              </h1>
            </div>
          </motion.div>

          {/* Bottom Section - All Other Elements */}
          <div className="space-y-8 pt-12">
            {/* Description */}
            <motion.div 
              variants={itemVariants}
            >
              <div className="text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
                Connect with healthcare professionals, manage your health records, 
                and book appointments seamlessly in our revolutionary digital platform.
              </div>
            </motion.div>

            {/* Buttons */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="xl" 
                  onClick={() => navigate('/login-registration')}
                  className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-white/10 rounded-lg"
                  />
                  <span className="relative z-10">Get Started Today</span>
                  <Icon name="ArrowRight" className="ml-2 group-hover:translate-x-1 transition-transform duration-300" size={20} />
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
                  className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold px-8 py-4 rounded-lg transition-all duration-300"
                >
                  <Icon name="Play" className="mr-2" size={20} />
                  Learn More
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div 
              variants={itemVariants}
              className="flex items-center justify-center lg:justify-start gap-8 pt-4"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Patients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Doctors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">99%</div>
                <div className="text-sm text-muted-foreground">Satisfaction</div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Visual Elements */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="relative"
        >
          <div className="relative max-w-lg mx-auto">
            {/* Main Illustration Container */}
            <motion.div
              variants={floatingVariants}
              animate="animate"
              className="relative bg-white rounded-3xl shadow-healthcare-lg p-8 border border-border"
            >
              <div className="space-y-6">
                {/* Medical Icons Grid */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: 'Heart', color: 'text-red-500', bg: 'bg-red-50' },
                    { icon: 'Activity', color: 'text-blue-500', bg: 'bg-blue-50' },
                    { icon: 'Shield', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { icon: 'Calendar', color: 'text-purple-500', bg: 'bg-purple-50' },
                    { icon: 'FileText', color: 'text-orange-500', bg: 'bg-orange-50' },
                    { icon: 'Users', color: 'text-indigo-500', bg: 'bg-indigo-50' },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        duration: 0.8, 
                        delay: 0.8 + index * 0.1,
                        type: "spring",
                        stiffness: 200
                      }}
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      className={`${item.bg} ${item.color} p-4 rounded-xl flex items-center justify-center cursor-pointer`}
                    >
                      <Icon name={item.icon} size={24} />
                    </motion.div>
                  ))}
                </div>

                {/* Animated Progress Bars */}
                <div className="space-y-3">
                  {[
                    { label: 'Health Score', value: 95, color: 'bg-emerald-500' },
                    { label: 'Appointments', value: 80, color: 'bg-blue-500' },
                    { label: 'Records', value: 88, color: 'bg-purple-500' },
                  ].map((item, index) => (
                    <motion.div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.5 + index * 0.2 }}
                          className="font-medium"
                        >
                          {item.value}%
                        </motion.span>
                      </div>
                      <div className="bg-muted rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 1, delay: 1.5 + index * 0.2, ease: "easeOut" }}
                          className={`${item.color} h-full rounded-full`}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Floating Elements */}
            {[
              { icon: 'Stethoscope', position: 'top-4 -right-4', delay: 2 },
              { icon: 'Pill', position: 'bottom-4 -left-4', delay: 2.5 },
              { icon: 'Thermometer', position: 'top-1/2 -left-8', delay: 3 },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: item.delay, type: "spring", stiffness: 200 }}
                className={`absolute ${item.position} bg-white rounded-full p-3 shadow-healthcare-lg border border-border`}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Icon name={item.icon} className="text-primary" size={20} />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;