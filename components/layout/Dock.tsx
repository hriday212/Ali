'use client';

import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import React, { Children, cloneElement, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  UsersRound, 
  Wallet, 
  LineChart, 
  Settings2,
  Trophy,
  Hash,
  Film
} from 'lucide-react';
import { useAuth } from '@/lib/authStore';
import './Dock.css';

interface DockItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  mouseX: import('framer-motion').MotionValue<number>;
  spring: import('framer-motion').SpringOptions;
  distance: number;
  magnification: number;
  baseItemSize: number;
  href?: string;
}

function DockItem({ children, className = '', onClick, mouseX, spring, distance, magnification, baseItemSize, href }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val: number) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize
    };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
  const size = useSpring(targetSize, spring);

  return (
    <motion.div
      ref={ref}
      style={{
        width: size,
        height: size,
      }}
      whileHover={{ y: -8, scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onClick={onClick}
      className={`dock-item ${className}`}
      tabIndex={0}
    >
      {href ? (
        <Link href={href} className="w-full h-full flex items-center justify-center">
           {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
           {Children.map(children, (child) => React.isValidElement(child) ? cloneElement(child, { isHovered } as any) : child)}
        </Link>
      ) : (
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        Children.map(children, (child) => React.isValidElement(child) ? cloneElement(child, { isHovered } as any) : child)
      )}
    </motion.div>
  );
}

function DockLabel({ children, className = '', ...rest }: { children: React.ReactNode; className?: string; isHovered?: import('framer-motion').MotionValue<number> }) {
  const { isHovered } = rest;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    const unsubscribe = isHovered.on('change', (latest: number) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: -5, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 5, scale: 0.8, filter: 'blur(5px)' }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className={`dock-label ${className}`}
          style={{ x: '-50%' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className = '', isActive }: { children: React.ReactNode; className?: string; isActive?: boolean }) {
  return (
    <motion.div 
      className={`dock-icon ${className}`}
      animate={isActive ? {
        scale: [1, 1.08, 1],
        opacity: [0.8, 1, 0.8]
      } : {}}
      transition={isActive ? {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      } : {}}
    >
      {children}
    </motion.div>
  );
}

export default function Dock() {
  const pathname = usePathname();
  const { user, role } = useAuth();
  const mouseX = useMotionValue(Infinity);
  const isHoveredIndicator = useMotionValue(0);
  // Re-tuned for 'Liquid' Feel
  const spring = { mass: 0.1, stiffness: 150, damping: 15 };
  const magnification = 110;
  const distance = 180;
  const panelHeight = 88;
  const dockHeight = 220;
  const baseItemSize = 64;

  const allItems = [
    { name: 'Dashboard', icon: Home, href: '/', adminOnly: false },
    { name: 'Leaderboard', icon: Trophy, href: '/leaderboard', adminOnly: false },
    { name: 'Network', icon: UsersRound, href: '/accounts', adminOnly: false },
    { name: 'Library', icon: Film, href: '/videos', adminOnly: false },
    { name: 'Ledger', icon: Wallet, href: '/payments', adminOnly: true },
    { name: 'Forecast', icon: LineChart, href: '/forecast', adminOnly: false },
    { name: 'Intelligence', icon: Hash, href: '/hashtags', adminOnly: false },
    { name: 'System', icon: Settings2, href: '/settings', adminOnly: true },
  ];

  // Clients only see non-admin items
  const items = allItems.filter(item => !item.adminOnly || role === 'admin');

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + 30),
    [magnification, dockHeight]
  );
  const heightRow = useTransform(isHoveredIndicator, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  if (!user) return null;

  return (
    <motion.div style={{ height, scrollbarWidth: 'none' }} className="dock-outer w-full max-w-full overflow-x-auto overflow-y-hidden px-4 md:px-0 scroll-smooth">
      <motion.div
        onMouseMove={({ pageX }) => {
          isHoveredIndicator.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHoveredIndicator.set(0);
          mouseX.set(Infinity);
        }}
        className="dock-panel min-w-max md:min-w-0 mx-auto"
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label="Application dock"
      >
        {items.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <DockItem
              key={index}
              href={item.href}
              className={isActive ? 'border-white bg-white/10 shadow-lg shadow-white/5' : 'border-white/5 hover:border-white/20'}
              mouseX={mouseX}
              spring={spring}
              distance={distance}
              magnification={magnification}
              baseItemSize={baseItemSize}
            >
              <DockIcon isActive={isActive}>
                <item.icon className={isActive ? 'text-white' : 'text-neutral-500'} size={28} strokeWidth={2.5} />
              </DockIcon>
              <DockLabel className="font-black text-[10px] uppercase tracking-[0.2em] hidden md:block">{item.name}</DockLabel>
            </DockItem>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

