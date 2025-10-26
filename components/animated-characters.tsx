"use client";

import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

const Pupil = ({ 
  size = 12, 
  maxDistance = 5,
  pupilColor = "black",
  forceLookX,
  forceLookY
}: PupilProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const pupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const calculatePupilPosition = () => {
    if (!pupilRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const pupil = pupilRef.current.getBoundingClientRect();
    const pupilCenterX = pupil.left + pupil.width / 2;
    const pupilCenterY = pupil.top + pupil.height / 2;

    const deltaX = mouseX - pupilCenterX;
    const deltaY = mouseY - pupilCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  );
};

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

const EyeBall = ({ 
  size = 48, 
  pupilSize = 16, 
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  forceLookX,
  forceLookY
}: EyeBallProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const eyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const calculatePupilPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const eye = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = eye.left + eye.width / 2;
    const eyeCenterY = eye.top + eye.height / 2;

    const deltaX = mouseX - eyeCenterX;
    const deltaY = mouseY - eyeCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={eyeRef}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
        overflow: 'hidden',
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  );
};

export function AnimatedCharacters() {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;

    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => {
          setIsPurpleBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());

      return blinkTimeout;
    };

    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;

    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => {
          setIsBlackBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());

      return blinkTimeout;
    };

    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;

    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;

    const faceX = Math.max(-15, Math.min(15, deltaX / 20));
    const faceY = Math.max(-10, Math.min(10, deltaY / 30));
    const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));

    return { faceX, faceY, bodySkew };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  return (
    <div className="relative flex items-end justify-center h-full w-full">
      <div className="relative" style={{ width: '550px', height: '400px' }}>
        <div 
          ref={purpleRef}
          className="absolute bottom-0 transition-all duration-700 ease-in-out"
          style={{
            left: '70px',
            width: '180px',
            height: '400px',
            backgroundColor: '#6C3FF5',
            borderRadius: '10px 10px 0 0',
            zIndex: 1,
            transform: `skewX(${purplePos.bodySkew || 0}deg)`,
            transformOrigin: 'bottom center',
          }}
        >
          <div 
            className="absolute flex gap-8 transition-all duration-700 ease-in-out"
            style={{
              left: `${45 + purplePos.faceX}px`,
              top: `${40 + purplePos.faceY}px`,
            }}
          >
            <EyeBall 
              size={18} 
              pupilSize={7} 
              maxDistance={5} 
              eyeColor="white" 
              pupilColor="#2D2D2D" 
              isBlinking={isPurpleBlinking}
            />
            <EyeBall 
              size={18} 
              pupilSize={7} 
              maxDistance={5} 
              eyeColor="white" 
              pupilColor="#2D2D2D" 
              isBlinking={isPurpleBlinking}
            />
          </div>
        </div>

        <div 
          ref={blackRef}
          className="absolute bottom-0 transition-all duration-700 ease-in-out"
          style={{
            left: '240px',
            width: '120px',
            height: '310px',
            backgroundColor: '#2D2D2D',
            borderRadius: '8px 8px 0 0',
            zIndex: 2,
            transform: `skewX(${blackPos.bodySkew || 0}deg)`,
            transformOrigin: 'bottom center',
          }}
        >
          <div 
            className="absolute flex gap-6 transition-all duration-700 ease-in-out"
            style={{
              left: `${26 + blackPos.faceX}px`,
              top: `${32 + blackPos.faceY}px`,
            }}
          >
            <EyeBall 
              size={16} 
              pupilSize={6} 
              maxDistance={4} 
              eyeColor="white" 
              pupilColor="#2D2D2D" 
              isBlinking={isBlackBlinking}
            />
            <EyeBall 
              size={16} 
              pupilSize={6} 
              maxDistance={4} 
              eyeColor="white" 
              pupilColor="#2D2D2D" 
              isBlinking={isBlackBlinking}
            />
          </div>
        </div>

        <div 
          ref={orangeRef}
          className="absolute bottom-0 transition-all duration-700 ease-in-out"
          style={{
            left: '0px',
            width: '240px',
            height: '200px',
            zIndex: 3,
            backgroundColor: '#FF9B6B',
            borderRadius: '120px 120px 0 0',
            transform: `skewX(${orangePos.bodySkew || 0}deg)`,
            transformOrigin: 'bottom center',
          }}
        >
          <div 
            className="absolute flex gap-8 transition-all duration-200 ease-out"
            style={{
              left: `${82 + (orangePos.faceX || 0)}px`,
              top: `${90 + (orangePos.faceY || 0)}px`,
            }}
          >
            <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" />
            <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" />
          </div>
        </div>

        <div 
          ref={yellowRef}
          className="absolute bottom-0 transition-all duration-700 ease-in-out"
          style={{
            left: '310px',
            width: '140px',
            height: '230px',
            backgroundColor: '#E8D754',
            borderRadius: '70px 70px 0 0',
            zIndex: 4,
            transform: `skewX(${yellowPos.bodySkew || 0}deg)`,
            transformOrigin: 'bottom center',
          }}
        >
          <div 
            className="absolute flex gap-6 transition-all duration-200 ease-out"
            style={{
              left: `${52 + (yellowPos.faceX || 0)}px`,
              top: `${40 + (yellowPos.faceY || 0)}px`,
            }}
          >
            <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" />
            <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" />
          </div>
          <div 
            className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
            style={{
              left: `${40 + (yellowPos.faceX || 0)}px`,
              top: `${88 + (yellowPos.faceY || 0)}px`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
