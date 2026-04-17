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
  Settings2 
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/lib/authStore';
import './Dock.css';

interface DockItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  mouseX: any;
  spring: any;
  distance: number;
  magnification: number;
  baseItemSize: number;
  href?: string;
  imgSrc?: string;
}

function DockItem({ children, className = '', onClick, mouseX, spring, distance, magnification, baseItemSize, href, imgSrc }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val: any) => {
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
           {Children.map(children, (child: any) => cloneElement(child, { isHovered }))}
        </Link>
      ) : (
        Children.map(children, (child: any) => cloneElement(child, { isHovered }))
      )}
    </motion.div>
  );
}

function DockLabel({ children, className = '', ...rest }: { children: React.ReactNode; className?: string; isHovered?: any }) {
  const { isHovered } = rest;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
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
  const { role } = useAuth();
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
    { name: 'Network', icon: UsersRound, href: '/accounts', adminOnly: false },
    { name: 'Ledger', icon: Wallet, href: '/payments', adminOnly: true },
    { name: 'Forecast', icon: LineChart, href: '/analytics', adminOnly: false },
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

  return (
    <motion.div style={{ height, scrollbarWidth: 'none' }} className="dock-outer">
      <motion.div
        onMouseMove={({ pageX }) => {
          isHoveredIndicator.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHoveredIndicator.set(0);
          mouseX.set(Infinity);
        }}
        className="dock-panel"
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
              <DockLabel className="font-black text-[10px] uppercase tracking-[0.2em]">{item.name}</DockLabel>
            </DockItem>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

