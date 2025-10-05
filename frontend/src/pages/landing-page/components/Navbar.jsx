import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize isScrolled state but don't change it on scroll
  useEffect(() => {
    // Set initial state only
    setIsScrolled(false);
    
    // No scroll event listener needed as we want the navbar to stay transparent
  }, []);

  const navLinks = [];

  const scrollToSection = (sectionId) => {
    setIsMobileMenuOpen(false);
    if (sectionId.startsWith('#')) {
      document.querySelector(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Main Navbar */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/20 backdrop-blur-md border-b border-white/20 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center"
                >
                  <Icon 
                    name="Heart" 
                    size={28} 
                    className="text-primary mr-2" 
                  />
                  <span className="text-xl font-bold text-foreground">
                    Smart<span className="text-primary">Clinic</span>Hub
                  </span>
                </motion.div>
              </Link>
            </div>

            {/* No Desktop Navigation Links */}

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => window.location.href='/login-registration?mode=login'}
                className="text-foreground hover:text-primary"
              >
                Log in
              </Button>
              <Button 
                onClick={() => window.location.href='/login-registration?mode=register'}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Sign Up
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <Button
                variant="ghost"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-foreground"
              >
                <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={24} />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 z-40 w-full max-w-xs bg-white/90 backdrop-blur-md shadow-xl p-6 overflow-y-auto md:hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
                <Icon name="Heart" size={24} className="text-primary mr-2" />
                <span className="text-lg font-bold text-foreground">
                  Smart<span className="text-primary">Clinic</span>Hub
                </span>
              </Link>
              <Button
                variant="ghost"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <Icon name="X" size={20} />
              </Button>
            </div>

            {/* No Mobile Navigation Links */}

            <div className="mt-8 space-y-4">
              <Button 
                variant="outline" 
                fullWidth
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  window.location.href='/login-registration?mode=login';
                }}
                className="border-primary text-primary hover:bg-primary hover:text-white"
              >
                Log in
              </Button>
              <Button 
                fullWidth
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  window.location.href='/login-registration?mode=register';
                }}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Sign Up
              </Button>
            </div>

            {/* Social Links */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-muted-foreground mb-3">Connect with us</p>
              <div className="flex space-x-4">
                {["Facebook", "Twitter", "Instagram", "LinkedIn"].map((social) => (
                  <a 
                    key={social} 
                    href="#" 
                    className="p-2 rounded-full bg-background text-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    <Icon name={social === "Twitter" ? "Twitter" : social} size={20} />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-30 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;