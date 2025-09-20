import { Animated, Easing } from 'react-native';

// Fade In Animation
export const fadeIn = (value: Animated.Value, duration: number = 300) => {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  });
};

// Fade Out Animation
export const fadeOut = (value: Animated.Value, duration: number = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    easing: Easing.in(Easing.quad),
    useNativeDriver: true,
  });
};

// Scale Animation
export const scaleIn = (value: Animated.Value, duration: number = 300) => {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    easing: Easing.out(Easing.back(1.2)),
    useNativeDriver: true,
  });
};

// Scale Out Animation
export const scaleOut = (value: Animated.Value, duration: number = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    easing: Easing.in(Easing.back(1.2)),
    useNativeDriver: true,
  });
};

// Slide In from Bottom
export const slideInBottom = (value: Animated.Value, duration: number = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  });
};

// Slide Out to Bottom
export const slideOutBottom = (value: Animated.Value, duration: number = 300) => {
  return Animated.timing(value, {
    toValue: 300,
    duration,
    easing: Easing.in(Easing.quad),
    useNativeDriver: true,
  });
};

// Bounce Animation
export const bounce = (value: Animated.Value) => {
  return Animated.sequence([
    Animated.timing(value, {
      toValue: 1.1,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 1,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
  ]);
};

// Pulse Animation
export const pulse = (value: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1.1,
        duration: 1000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ])
  );
};

// Shake Animation
export const shake = (value: Animated.Value) => {
  return Animated.sequence([
    Animated.timing(value, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(value, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(value, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(value, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(value, { toValue: 0, duration: 50, useNativeDriver: true }),
  ]);
};

// Rotate Animation
export const rotate = (value: Animated.Value, duration: number = 1000) => {
  return Animated.loop(
    Animated.timing(value, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
};

// Stagger Animation for multiple items
export const stagger = (animations: Animated.CompositeAnimation[], delay: number = 100) => {
  return Animated.stagger(delay, animations);
};

// Parallel Animation for multiple properties
export const parallel = (animations: Animated.CompositeAnimation[]) => {
  return Animated.parallel(animations);
};
