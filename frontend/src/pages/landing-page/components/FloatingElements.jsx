import React from 'react';
import { motion } from 'framer-motion';

const FloatingElements = () => {
  // Generate floating particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 10 + Math.random() * 20,
  }));

  const medicalElements = [
    { 
      icon: '🩺', 
      x: 10, 
      y: 20, 
      delay: 0,
      duration: 15,
      rotate: true
    },
    { 
      icon: '💊', 
      x: 80, 
      y: 30, 
      delay: 2,
      duration: 12,
      rotate: false
    },
    { 
      icon: '🏥', 
      x: 15, 
      y: 70, 
      delay: 1,
      duration: 18,
      rotate: true
    },
    { 
      icon: '⚕️', 
      x: 85, 
      y: 80, 
      delay: 3,
      duration: 14,
      rotate: false
    },
    { 
      icon: '🔬', 
      x: 50, 
      y: 10, 
      delay: 4,
      duration: 16,
      rotate: true
    },
    { 
      icon: '🧬', 
      x: 70, 
      y: 60, 
      delay: 1.5,
      duration: 13,
      rotate: false
    }
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Animated Background Gradient */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          background: [
            "radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 30%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 20% 70%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)",
            "radial-gradient(circle at 50% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 50% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)"
          ]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute bg-primary/10 rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.2, 0.8, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay,
          }}
        />
      ))}

      {/* Medical Icons */}
      {medicalElements.map((element, index) => (
        <motion.div
          key={index}
          className="absolute text-2xl opacity-10 select-none"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
          }}
          animate={{
            y: [-15, 15, -15],
            x: [-8, 8, -8],
            rotate: element.rotate ? [0, 360] : 0,
            scale: [0.8, 1.1, 0.8],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: element.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: element.delay,
          }}
        >
          {element.icon}
        </motion.div>
      ))}

      {/* Geometric Shapes */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`shape-${i}`}
          className={`absolute opacity-10 ${
            i % 3 === 0 ? 'bg-primary' : i % 3 === 1 ? 'bg-accent' : 'bg-secondary'
          }`}
          style={{
            width: 20 + (i % 3) * 15,
            height: 20 + (i % 3) * 15,
            left: `${10 + (i * 12)}%`,
            top: `${20 + (i % 4) * 20}%`,
            borderRadius: i % 2 === 0 ? '50%' : '10%',
          }}
          animate={{
            rotate: [0, 360],
            scale: [0.5, 1, 0.5],
            opacity: [0.05, 0.2, 0.05],
          }}
          transition={{
            duration: 15 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}

      {/* Pulse Circles */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`pulse-${i}`}
          className="absolute border border-primary/10 rounded-full"
          style={{
            width: 100 + i * 50,
            height: 100 + i * 50,
            left: `${25 + i * 15}%`,
            top: `${30 + i * 10}%`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.1, 0, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1,
          }}
        />
      ))}

      {/* Orbiting Elements */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`orbit-${i}`}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 30 + i * 10,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <motion.div
            className="w-3 h-3 bg-primary/20 rounded-full"
            style={{
              x: 200 + i * 100,
              y: -1.5,
            }}
            animate={{
              scale: [0.5, 1.2, 0.5],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.7,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingElements;