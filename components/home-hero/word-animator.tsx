import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import React from "react";

interface WordAnimatorProps {
  words: string[];
  duration?: number;
  className?: string;
}

const WordAnimator: React.FC<WordAnimatorProps> = ({
  words,
  duration = 2,
  className = "",
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, duration * 1000);

    return () => clearInterval(interval);
  }, [words.length, duration]);

  return (
    <span
      style={{
        display: "inline-block",
        position: "relative",
        verticalAlign: "bottom",
      }}
      className={cn(" text-left overflow-hidden border rounded-md ", className)}
    >
      <span className="absolute top-0 left-0 w-full h-full content-[''] z-10 pointer-events-none bg-[url('/noise.gif')] opacity-10"></span>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={currentIndex}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{
            duration: 0.5,
            ease: [0.4, 0.0, 0.2, 1], // Custom easing for smooth animation
          }}
          style={{
            position: "absolute",
            display: "block",
            left: 0,
            right: 0,
          }}
          className="bg-gradient-to-t w-full from-[#a2b6fa] to-[#334cec] bg-clip-text text-transparent"
        >
          {words[currentIndex]}
        </motion.span>
      </AnimatePresence>
      {/* Invisible text to maintain correct spacing */}
      <span style={{ visibility: "hidden" }}>{words[currentIndex]}</span>
    </span>
  );
};

export default WordAnimator;
