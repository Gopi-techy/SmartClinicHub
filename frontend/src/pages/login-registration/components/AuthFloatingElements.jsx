import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';

const AuthFloatingElements = () => {
  const lottieRef = useRef();

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Lottie Animation Background */}
      <div className="absolute inset-0 w-full h-full">
        <Lottie
          lottieRef={lottieRef}
          path="/assets/SM1JqhrQU4.json"
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
          className="w-full h-full object-cover"
        />
      </div>

    </div>
  );
};

export default AuthFloatingElements;
