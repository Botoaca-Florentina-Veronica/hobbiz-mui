import { forwardRef, useMemo, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import useMousePosition from '../hooks/useMousePosition';
import './VariableProximity.css';

const VariableProximity = forwardRef(
  (
    {
      text,
      fromFontVariationSettings,
      toFontVariationSettings,
      containerRef,
      radius = 50,
      falloff = 'linear',
      className = '',
      onClick,
      style,
      ...restProps
    },
    ref
  ) => {
    const letterRefs = useRef([]);
    const interpolatedSettingsRef = useRef([]);
    const mousePosition = useMousePosition();

    useEffect(() => {
      interpolatedSettingsRef.current = [];
    }, [text]);

    const parsedSettings = useMemo(() => {
      const parseSettings = (settingsStr) =>
        new Map(
          settingsStr
            .split(',')
            .map((s) => s.trim())
            .map((s) => {
              const [name, value] = s.split(' ');
              return [name.replace(/['"]/g, ''), parseFloat(value)];
            })
        );

      try {
        return {
          from: parseSettings(fromFontVariationSettings),
          to: parseSettings(toFontVariationSettings),
        };
      } catch (error) {
        console.error('Error parsing font variation settings:', error);
        return { from: new Map(), to: new Map() };
      }
    }, [fromFontVariationSettings, toFontVariationSettings]);

    const calculateDistance = (x1, y1, x2, y2) =>
      Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

    const calculateFalloff = (distance) => {
      const norm = Math.max(0, 1 - distance / radius);
      switch (falloff) {
        case 'exponential':
          return norm ** 2;
        case 'gaussian':
          return Math.exp(-((distance / (radius / 2)) ** 2) / 2);
        case 'linear':
        default:
          return norm;
      }
    };

    const words = (text || '').split(' ');

    return (
      <span
        ref={ref}
        className={`variable-proximity ${className}`}
        onClick={onClick}
        style={{ display: 'inline', ...style }}
        {...restProps}
      >
        {words.map((word, wordIndex) => (
          <span key={wordIndex} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {word.split('').map((letter, letterIndex) => {
              const index =
                words.slice(0, wordIndex).join('').length + letterIndex;

              let settings = interpolatedSettingsRef.current[index];

              if (
                mousePosition.x !== null &&
                mousePosition.y !== null &&
                containerRef?.current &&
                letterRefs.current[index]
              ) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const letterRect = letterRefs.current[index].getBoundingClientRect();

                const letterX = letterRect.left + letterRect.width / 2;
                const letterY = letterRect.top + letterRect.height / 2;

                const distance = calculateDistance(
                  mousePosition.x,
                  mousePosition.y,
                  letterX,
                  letterY
                );

                if (distance >= radius) {
                  settings = fromFontVariationSettings;
                } else {
                  const falloffValue = calculateFalloff(distance);
                  settings = Array.from(parsedSettings.from.entries())
                    .map(([axis, fromValue]) => {
                      const toValue = parsedSettings.to.get(axis) ?? fromValue;
                      const interpolatedValue =
                        fromValue + (toValue - fromValue) * falloffValue;
                      return `'${axis}' ${interpolatedValue}`;
                    })
                    .join(', ');
                }

                interpolatedSettingsRef.current[index] = settings;
              } else {
                settings = fromFontVariationSettings;
              }

              return (
                <motion.span
                  key={index}
                  ref={(el) => {
                    letterRefs.current[index] = el;
                  }}
                  style={{
                    display: 'inline-block',
                    fontVariationSettings: settings,
                    transition: 'font-variation-settings 0.1s ease-out',
                  }}
                  aria-hidden="true"
                >
                  {letter}
                </motion.span>
              );
            })}
            {wordIndex < words.length - 1 && (
              <span style={{ display: 'inline-block' }}>&nbsp;</span>
            )}
          </span>
        ))}
        <span className="sr-only">{text}</span>
      </span>
    );
  }
);

VariableProximity.displayName = 'VariableProximity';
export default VariableProximity;