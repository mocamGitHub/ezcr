'use client';

import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useState } from 'react';

/**
 * FRAMER MOTION EXAMPLES FOR EZ CYCLE RAMP
 *
 * This file demonstrates practical Framer Motion animations that can be
 * integrated into the EZ Cycle application. Copy and adapt these patterns
 * to enhance your product cards, configurator, and UI interactions.
 *
 * Framer Motion is already installed (v12.23.22)
 */

// ============================================================================
// 1. ENHANCED PRODUCT CARD WITH HOVER ANIMATIONS
// ============================================================================

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

export function AnimatedProductCard({ product }: { product: Product }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative overflow-hidden rounded-lg border bg-white shadow-sm"
      // Scale up on hover
      whileHover={{ scale: 1.03 }}
      // Press down on click
      whileTap={{ scale: 0.98 }}
      // Smooth spring animation
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="relative h-48 overflow-hidden">
        <motion.img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover"
          // Zoom image on hover
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.4 }}
        />

        {/* Animated overlay on hover */}
        <motion.div
          className="absolute inset-0 bg-primary/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Slide in "View Details" button */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-4"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: isHovered ? 0 : 100, opacity: isHovered ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <button className="w-full rounded bg-white px-4 py-2 font-semibold text-primary shadow-lg">
            View Details
          </button>
        </motion.div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{product.name}</h3>
        <motion.p
          className="mt-1 text-lg font-bold text-primary"
          // Pulse price on hover
          animate={{ scale: isHovered ? 1.05 : 1 }}
        >
          ${product.price.toFixed(2)}
        </motion.p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// 2. CONFIGURATOR STEP TRANSITIONS (PAGE TRANSITIONS)
// ============================================================================

interface ConfiguratorStepProps {
  step: number;
  direction: 'forward' | 'backward';
  children: React.ReactNode;
}

export function ConfiguratorStepTransition({
  step,
  direction,
  children,
}: ConfiguratorStepProps) {
  // Slide animation variants
  const variants = {
    enter: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={step}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: 'spring', stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 },
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// 3. ANIMATED PROGRESS BAR FOR CONFIGURATOR
// ============================================================================

export function AnimatedProgressBar({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
      <motion.div
        className="h-full bg-gradient-to-r from-primary to-secondary"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      />

      {/* Animated shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 0.5,
        }}
      />
    </div>
  );
}

// ============================================================================
// 4. SHOPPING CART ITEM ANIMATIONS (ADD/REMOVE)
// ============================================================================

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export function AnimatedCartList({ items }: { items: CartItem[] }) {
  return (
    <div className="space-y-2">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout // Automatic layout animation when items move
            initial={{ opacity: 0, x: -50, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={{ opacity: 0, x: 50, height: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between rounded-lg border bg-white p-4"
          >
            <div className="flex items-center gap-4">
              <motion.div
                className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-lg font-bold text-primary">
                  {item.quantity}
                </span>
              </motion.div>
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-600">${item.price}</p>
              </div>
            </div>
            <motion.button
              className="rounded-full bg-red-100 p-2 text-red-600"
              whileHover={{ scale: 1.1, backgroundColor: '#fee2e2' }}
              whileTap={{ scale: 0.9 }}
            >
              Remove
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// 5. STAGGER ANIMATION FOR FEATURE LISTS
// ============================================================================

export function StaggeredFeatureList({
  features,
}: {
  features: string[];
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Delay between each child animation
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
  };

  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      {features.map((feature, index) => (
        <motion.li
          key={index}
          variants={itemVariants}
          className="flex items-center gap-3"
        >
          <motion.div
            className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100"
            whileHover={{ rotate: 360, scale: 1.2 }}
            transition={{ duration: 0.3 }}
          >
            <svg
              className="h-4 w-4 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>
          <span>{feature}</span>
        </motion.li>
      ))}
    </motion.ul>
  );
}

// ============================================================================
// 6. SCROLL-TRIGGERED ANIMATIONS
// ============================================================================

export function ScrollReveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }} // Trigger 100px before entering viewport
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// Parallax scroll effect
export function ParallaxSection({ children }: { children: React.ReactNode }) {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0]);

  return (
    <motion.div style={{ y, opacity }} className="relative">
      {children}
    </motion.div>
  );
}

// ============================================================================
// 7. BUTTON VARIANTS WITH LOADING STATES
// ============================================================================

export function AnimatedButton({
  children,
  isLoading = false,
  onClick,
}: {
  children: React.ReactNode;
  isLoading?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      className="relative overflow-hidden rounded-lg bg-primary px-6 py-3 font-semibold text-white shadow-lg"
      whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(11, 83, 148, 0.3)' }}
      whileTap={{ scale: 0.95 }}
      disabled={isLoading}
      onClick={onClick}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2"
          >
            <motion.div
              className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <span>Loading...</span>
          </motion.div>
        ) : (
          <motion.span
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Ripple effect on click */}
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ scale: 0, opacity: 0.5 }}
        whileTap={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.5 }}
      />
    </motion.button>
  );
}

// ============================================================================
// 8. MODAL/DIALOG ANIMATIONS
// ============================================================================

export function AnimatedModal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// 9. NUMBER COUNTER ANIMATION
// ============================================================================

export function AnimatedCounter({
  from = 0,
  to,
  duration = 2,
}: {
  from?: number;
  to: number;
  duration?: number;
}) {
  const [count, setCount] = useState(from);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.span
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5 }}
      >
        {Math.round(count)}
      </motion.span>
    </motion.span>
  );
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

export function FramerMotionDemo() {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { id: '1', name: 'Standard Ramp', quantity: 1, price: 299.99 },
    { id: '2', name: 'Premium Ramp', quantity: 2, price: 499.99 },
  ]);

  const sampleProduct: Product = {
    id: '1',
    name: 'EZ Cycle Ramp Pro',
    price: 399.99,
    image: '/placeholder-ramp.jpg',
  };

  const features = [
    'Durable aluminum construction',
    'Easy to install and remove',
    'Fits most truck beds',
    'Weight capacity: 500 lbs',
  ];

  return (
    <div className="space-y-12 p-8">
      <section>
        <h2 className="mb-4 text-2xl font-bold">1. Animated Product Card</h2>
        <div className="max-w-sm">
          <AnimatedProductCard product={sampleProduct} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">2. Animated Cart</h2>
        <AnimatedCartList items={cartItems} />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">3. Staggered Feature List</h2>
        <StaggeredFeatureList features={features} />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">4. Animated Buttons</h2>
        <div className="flex gap-4">
          <AnimatedButton>Add to Cart</AnimatedButton>
          <AnimatedButton isLoading>Processing...</AnimatedButton>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">5. Progress Bar</h2>
        <AnimatedProgressBar currentStep={3} totalSteps={5} />
      </section>
    </div>
  );
}
