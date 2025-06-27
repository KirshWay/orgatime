import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

const style = `
  .perspective-1000 {
    perspective: 1000px;
  }
  .transform-style-3d {
    transform-style: preserve-3d;
  }
`;

type Props = {
  children: React.ReactNode;
  maxWidth?: string;
  aspectRatio?: string;
};

export const TiltCard = ({
  children,
  maxWidth = "700px",
  aspectRatio = "16/9",
}: Props) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 150, damping: 20 });
  const springY = useSpring(y, { stiffness: 150, damping: 20 });

  const getRotationIntensity = () => (windowWidth < 768 ? 5 : 10);

  const rotateX = useTransform(
    springY,
    [-0.5, 0.5],
    [getRotationIntensity(), -getRotationIntensity()],
  );
  const rotateY = useTransform(
    springX,
    [-0.5, 0.5],
    [-getRotationIntensity(), getRotationIntensity()],
  );
  const scale = useSpring(1, { stiffness: 150, damping: 20 });

  useEffect(() => {
    const touchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(touchDevice);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    setWindowWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const normalizedX = (e.clientX - centerX) / rect.width;
    const normalizedY = (e.clientY - centerY) / rect.height;

    x.set(normalizedX);
    y.set(normalizedY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!cardRef.current || e.touches.length < 1) return;

    const touch = e.touches[0];
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const touchFactor = windowWidth < 768 ? 0.2 : 0.3;

    const normalizedX = ((touch.clientX - centerX) / rect.width) * touchFactor;
    const normalizedY = ((touch.clientY - centerY) / rect.height) * touchFactor;

    x.set(normalizedX);
    y.set(normalizedY);
  };

  const handleMouseEnter = () => {
    if (!isTouchDevice) {
      scale.set(1.05);
    }
  };

  const handleMouseLeave = () => {
    if (!isTouchDevice) {
      x.set(0);
      y.set(0);
      scale.set(1);
    }
  };

  const handleTouchStart = () => {
    scale.set(1.02);
  };

  const handleTouchEnd = () => {
    x.set(0);
    y.set(0);
    scale.set(1);
  };

  return (
    <>
      <style>{style}</style>
      <motion.div
        ref={cardRef}
        className="relative mx-auto rounded-xl perspective-1000 cursor-pointer"
        style={{
          width: "100%",
          maxWidth,
          aspectRatio,
          rotateX: isTouchDevice ? 0 : rotateX,
          rotateY: isTouchDevice ? 0 : rotateY,
          scale,
          filter: "drop-shadow(0px 10px 25px rgba(0,0,0,0.15))",
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-full h-full relative rounded-xl overflow-hidden transform-style-3d">
          {children}

          <motion.div
            className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/0 to-white/40 dark:from-white/0 dark:via-white/0 dark:to-white/20 pointer-events-none rounded-xl"
            style={{
              opacity: useTransform(x, [-0.5, 0.5], [0, 0.5]),
            }}
          />
        </div>
      </motion.div>
    </>
  );
};
