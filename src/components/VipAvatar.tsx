import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const CROWN_3D_URL = 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Crown.png';
const GEM_3D_URL = 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Gem%20Stone.png';

interface VipAvatarProps {
  photoURL?: string | null;
  name?: string | null;
  email?: string | null;
  isPremium?: boolean;
  size?: number;
  showCrown?: boolean;
  showBadge?: boolean;
  badgeType?: 'vip' | 'edit' | 'online';
}

export function VipAvatar({
  photoURL,
  name,
  email,
  isPremium = false,
  size = 48,
  showCrown = true,
  showBadge = true,
  badgeType,
}: VipAvatarProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateCrown = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isPremium) return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateCrown, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(rotateCrown, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [isPremium]);

  const initial = (name || email || 'U').charAt(0).toUpperCase();

  const crownTilt = rotateCrown.interpolate({
    inputRange: [0, 1],
    outputRange: ['-6deg', '6deg'],
  });

  const crownSize = Math.max(16, size * 0.38);
  const badgeSize = Math.max(14, size * 0.32);
  const borderWidth = isPremium ? Math.max(2, size * 0.055) : 2;

  return (
    <View style={[styles.wrapper, { width: size + 8, height: size + 8 }]}>
      {/* GLOWING AURA FOR VIP USERS */}
      {isPremium && (
        <Animated.View
          style={[
            styles.vipAura,
            {
              width: size + 6,
              height: size + 6,
              borderRadius: (size + 6) / 2,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}

      {/* AVATAR RING */}
      {isPremium ? (
        <LinearGradient
          colors={['#FFE57F', '#FFD740', '#F59E0B', '#D97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              padding: borderWidth,
            },
          ]}
        >
          <View
            style={[
              styles.avatarInner,
              {
                width: size - borderWidth * 2,
                height: size - borderWidth * 2,
                borderRadius: (size - borderWidth * 2) / 2,
              },
            ]}
          >
            {photoURL ? (
              <Image
                source={{ uri: photoURL }}
                style={styles.fullImg}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <LinearGradient
                colors={['#2A1E0A', '#1A1305']}
                style={styles.fullGradientInitial}
              >
                <Text style={[styles.initialTextVip, { fontSize: size * 0.42 }]}>
                  {initial}
                </Text>
              </LinearGradient>
            )}
          </View>
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.standardRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          {photoURL ? (
            <Image
              source={{ uri: photoURL }}
              style={styles.fullImg}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.standardInitialBox}>
              <Text style={[styles.initialTextStandard, { fontSize: size * 0.42 }]}>
                {initial}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 3D FLOATING CROWN AT TOP FOR VIP */}
      {isPremium && showCrown && (
        <Animated.View
          style={[
            styles.crownWrapper,
            {
              top: -crownSize * 0.42,
              right: size * 0.08,
              transform: [{ rotate: crownTilt }],
            },
          ]}
        >
          <Image
            source={{ uri: CROWN_3D_URL }}
            style={{ width: crownSize, height: crownSize }}
            contentFit="contain"
          />
        </Animated.View>
      )}

      {/* BADGE AT BOTTOM-RIGHT (ONLY FOR NON-VIP EDIT / ONLINE IF REQUESTED) */}
      {!isPremium && showBadge && (
        <>
          {badgeType === 'edit' ? (
            <View
              style={[
                styles.editBadge,
                {
                  width: badgeSize,
                  height: badgeSize,
                  borderRadius: badgeSize / 2,
                  bottom: 0,
                  right: 0,
                },
              ]}
            >
              <Ionicons name="pencil" size={badgeSize * 0.55} color="#FFFFFF" />
            </View>
          ) : badgeType === 'online' ? (
            <View
              style={[
                styles.onlineBadge,
                {
                  width: Math.max(9, badgeSize * 0.7),
                  height: Math.max(9, badgeSize * 0.7),
                  borderRadius: Math.max(9, badgeSize * 0.7) / 2,
                  bottom: 1,
                  right: 1,
                },
              ]}
            />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  vipAura: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 215, 64, 0.28)',
    shadowColor: '#FFD740',
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 6,
  },
  gradientRing: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 5,
  },
  avatarInner: {
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  standardRing: {
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
  },
  fullImg: {
    width: '100%',
    height: '100%',
  },
  fullGradientInitial: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialTextVip: {
    fontWeight: '900',
    color: '#FFD740',
    letterSpacing: -0.5,
  },
  standardInitialBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialTextStandard: {
    fontWeight: '800',
    color: '#3B82F6',
  },
  crownWrapper: {
    position: 'absolute',
    zIndex: 10,
  },
  vipGemBadge: {
    position: 'absolute',
    backgroundColor: '#1E1B4B',
    borderWidth: 1.5,
    borderColor: '#FFD740',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD740',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
    zIndex: 5,
  },
  editBadge: {
    position: 'absolute',
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  onlineBadge: {
    position: 'absolute',
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 5,
  },
});
