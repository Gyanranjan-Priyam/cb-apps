import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, {
  Path,
  Rect,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  G,
  ClipPath,
} from "react-native-svg";

const { width } = Dimensions.get("window");

// Star sparkle SVG
function StarSparkle({
  size = 18,
  color = "#F5B544",
  style,
}: {
  size?: number;
  color?: string;
  style?: object;
}) {
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d="M12 0 C12 6, 18 12, 24 12 C18 12, 12 18, 12 24 C12 18, 6 12, 0 12 C6 12, 12 6, 12 0 Z"
          fill={color}
        />
      </Svg>
    </View>
  );
}

// Scalloped Stamp Background generator
function StampFrame({
  width = 135,
  height = 165,
  color = "#FED7AA",
  children,
}: {
  width?: number;
  height?: number;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.stampContainer, { width, height }]}>
      {/* Outer scalloped border effect */}
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <ClipPath id="inner-rect">
            <Rect x="10" y="10" width={width - 20} height={height - 20} rx="6" />
          </ClipPath>
        </Defs>

        {/* Base stamp background */}
        <Rect
          x="3"
          y="3"
          width={width - 6}
          height={height - 6}
          rx="10"
          fill={color}
          stroke="#FDBA74"
          strokeWidth="1.5"
        />

        {/* Perforated edge dots */}
        {/* Top & Bottom edges */}
        {Array.from({ length: 9 }).map((_, i) => (
          <React.Fragment key={`tb-${i}`}>
            <Circle cx={15 + i * ((width - 30) / 8)} cy={3} r={3.5} fill="#FFFFFF" />
            <Circle cx={15 + i * ((width - 30) / 8)} cy={height - 3} r={3.5} fill="#FFFFFF" />
          </React.Fragment>
        ))}
        {/* Left & Right edges */}
        {Array.from({ length: 11 }).map((_, i) => (
          <React.Fragment key={`lr-${i}`}>
            <Circle cx={3} cy={15 + i * ((height - 30) / 10)} r={3.5} fill="#FFFFFF" />
            <Circle cx={width - 3} cy={15 + i * ((height - 30) / 10)} r={3.5} fill="#FFFFFF" />
          </React.Fragment>
        ))}
      </Svg>

      {/* Stamp artwork content container */}
      <View style={[styles.innerArtwork, { width: width - 22, height: height - 22 }]}>
        {children}
      </View>
    </View>
  );
}

// Paris Stamp (Left)
function ParisStamp() {
  return (
    <StampFrame width={135} height={165} color="#FED7AA">
      <Svg width="100%" height="100%" viewBox="0 0 115 145">
        <Defs>
          <LinearGradient id="parisSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#60A5FA" />
            <Stop offset="60%" stopColor="#93C5FD" />
            <Stop offset="100%" stopColor="#DBEAFE" />
          </LinearGradient>
          <LinearGradient id="riverGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#38BDF8" />
            <Stop offset="100%" stopColor="#0284C7" />
          </LinearGradient>
        </Defs>

        {/* Sky */}
        <Rect width="115" height="145" rx="4" fill="url(#parisSky)" />

        {/* Clouds */}
        <Circle cx="25" cy="30" r="14" fill="#FFFFFF" opacity={0.85} />
        <Circle cx="40" cy="28" r="18" fill="#FFFFFF" opacity={0.9} />
        <Circle cx="55" cy="32" r="12" fill="#FFFFFF" opacity={0.8} />

        <Circle cx="85" cy="45" r="12" fill="#FFFFFF" opacity={0.7} />
        <Circle cx="98" cy="48" r="10" fill="#FFFFFF" opacity={0.75} />

        {/* Background Trees & Hills */}
        <Path d="M0 105 Q30 98 60 102 T115 100 L115 145 L0 145 Z" fill="#86EFAC" />
        <Path d="M0 112 Q40 106 70 110 T115 108 L115 145 L0 145 Z" fill="#4ADE80" />

        {/* Eiffel Tower */}
        <G>
          {/* Spire */}
          <Path d="M57 15 L58 35 L56 35 Z" fill="#B45309" />
          {/* Top Platform */}
          <Rect x="54" y="35" width="7" height="3" rx="1" fill="#78350F" />
          {/* Upper Section */}
          <Path d="M55 38 L52 65 L63 65 L60 38 Z" fill="#D97706" />
          {/* Middle Platform */}
          <Rect x="50" y="65" width="15" height="4" rx="1" fill="#78350F" />
          {/* Lower Legs & Arch */}
          <Path
            d="M51 69 L40 115 L48 115 L52 90 Q57.5 78 63 90 L67 115 L75 115 L64 69 Z"
            fill="#B45309"
          />
          {/* Base Arch detail */}
          <Path d="M49 115 Q57.5 96 66 115 Z" fill="#FDE68A" opacity={0.9} />
          {/* Grid lattice marks */}
          <Path d="M53 50 L62 50 M51 80 L64 80 M47 98 L68 98" stroke="#78350F" strokeWidth="1" />
        </G>

        {/* River Seine & Bridge */}
        <Path d="M0 125 Q57 120 115 125 L115 145 L0 145 Z" fill="url(#riverGrad)" />
        {/* Stone Bridge Arches */}
        <Path
          d="M10 120 Q30 115 60 118 T115 118 L115 128 Q80 124 55 126 T0 128 L0 120 Z"
          fill="#E2E8F0"
        />
        <Circle cx="30" cy="126" r="6" fill="#0284C7" />
        <Circle cx="65" cy="126" r="6" fill="#0284C7" />
        <Circle cx="100" cy="126" r="6" fill="#0284C7" />

        {/* Lush green bushes */}
        <Circle cx="15" cy="116" r="8" fill="#16A34A" />
        <Circle cx="26" cy="118" r="6" fill="#22C55E" />
        <Circle cx="88" cy="115" r="7" fill="#16A34A" />
        <Circle cx="98" cy="117" r="8" fill="#22C55E" />
      </Svg>
    </StampFrame>
  );
}

// Fuji Stamp (Right)
function FujiStamp() {
  return (
    <StampFrame width={140} height={170} color="#FDE68A">
      <Svg width="100%" height="100%" viewBox="0 0 118 148">
        <Defs>
          <LinearGradient id="fujiSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#38BDF8" />
            <Stop offset="55%" stopColor="#7DD3FC" />
            <Stop offset="100%" stopColor="#FBCFE8" />
          </LinearGradient>
          <LinearGradient id="mountainGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#3B82F6" />
            <Stop offset="100%" stopColor="#1E3A8A" />
          </LinearGradient>
          <LinearGradient id="lakeGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#38BDF8" />
            <Stop offset="100%" stopColor="#0369A1" />
          </LinearGradient>
        </Defs>

        {/* Sky */}
        <Rect width="118" height="148" rx="4" fill="url(#fujiSky)" />

        {/* Sun / Aura */}
        <Circle cx="59" cy="52" r="28" fill="#FDE047" opacity={0.35} />

        {/* Mount Fuji */}
        <G>
          {/* Mountain base body */}
          <Path d="M12 110 L59 40 L106 110 Z" fill="url(#mountainGrad)" />
          {/* Snow cap */}
          <Path
            d="M59 40 L44 65 L48 68 L53 62 L59 70 L65 62 L70 68 L74 65 Z"
            fill="#FFFFFF"
          />
        </G>

        {/* Tokyo Tower in background right */}
        <G opacity={0.95}>
          <Path d="M96 68 L97 88 L95 88 Z" fill="#EF4444" />
          <Rect x="94" y="88" width="5" height="2" fill="#FFFFFF" />
          <Path d="M94 90 L88 120 L92 120 L94.5 104 L97 120 L101 120 L97 90 Z" fill="#EF4444" />
          <Path d="M91 106 L98 106" stroke="#FFFFFF" strokeWidth="1.5" />
        </G>

        {/* Pagoda roof silhouettes */}
        <G>
          <Path d="M80 122 L98 122 L95 116 L83 116 Z" fill="#B91C1C" />
          <Path d="M78 128 L100 128 L97 122 L81 122 Z" fill="#991B1B" />
          <Path d="M75 136 L103 136 L100 128 L78 128 Z" fill="#7F1D1D" />
          {/* Golden finial */}
          <Path d="M89 110 L89 116" stroke="#F59E0B" strokeWidth="2" />
          <Circle cx="89" cy="109" r="2" fill="#F59E0B" />
        </G>

        {/* Lake Kawaguchi */}
        <Path d="M0 108 Q59 104 118 108 L118 148 L0 148 Z" fill="url(#lakeGrad)" />

        {/* Foreground Shore / greenery */}
        <Path d="M0 132 Q40 126 80 134 T118 130 L118 148 L0 148 Z" fill="#15803D" />

        {/* Cherry Blossom (Sakura) Branches & Flowers */}
        <G>
          {/* Branch */}
          <Path
            d="M0 15 Q25 22 45 10 T65 18"
            stroke="#78350F"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M25 20 Q35 32 42 38"
            stroke="#78350F"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Pink Sakura Blossoms */}
          <Circle cx="18" cy="16" r="6" fill="#F472B6" />
          <Circle cx="18" cy="16" r="2.5" fill="#FFFFFF" />
          <Circle cx="32" cy="14" r="7" fill="#FB7185" />
          <Circle cx="32" cy="14" r="3" fill="#FFFFFF" />
          <Circle cx="45" cy="12" r="6.5" fill="#F472B6" />
          <Circle cx="45" cy="12" r="2.5" fill="#FFFFFF" />
          <Circle cx="58" cy="18" r="5.5" fill="#FDA4AF" />
          <Circle cx="38" cy="32" r="6" fill="#FB7185" />
          <Circle cx="38" cy="32" r="2.5" fill="#FFFFFF" />
          <Circle cx="46" cy="40" r="5" fill="#F472B6" />

          {/* Floating petals in breeze */}
          <Circle cx="20" cy="48" r="2" fill="#FDA4AF" opacity={0.8} />
          <Circle cx="12" cy="62" r="2.5" fill="#F472B6" opacity={0.7} />
          <Circle cx="28" cy="75" r="2" fill="#FB7185" opacity={0.8} />
        </G>
      </Svg>
    </StampFrame>
  );
}

export function StampIllustration() {
  return (
    <View style={styles.container}>
      {/* Decorative Floating Sparkles */}
      <StarSparkle size={18} color="#FBBF24" style={styles.sparkleTopRight} />
      <StarSparkle size={14} color="#F59E0B" style={styles.sparkleCenter} />
      <StarSparkle size={16} color="#FCD34D" style={styles.sparkleBottomLeft} />

      {/* Paris Stamp (Tilted Left) */}
      <View style={[styles.stampWrapper, styles.leftStamp]}>
        <ParisStamp />
      </View>

      {/* Fuji Stamp (Tilted Right, Overlapping) */}
      <View style={[styles.stampWrapper, styles.rightStamp]}>
        <FujiStamp />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginVertical: 12,
  },
  stampWrapper: {
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  leftStamp: {
    transform: [{ rotate: "-13deg" }, { translateX: -42 }, { translateY: -10 }],
    zIndex: 1,
  },
  rightStamp: {
    transform: [{ rotate: "11deg" }, { translateX: 38 }, { translateY: 15 }],
    zIndex: 2,
  },
  stampContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  innerArtwork: {
    position: "absolute",
    borderRadius: 6,
    overflow: "hidden",
  },
  sparkleTopRight: {
    position: "absolute",
    top: 20,
    right: width * 0.2,
    zIndex: 10,
  },
  sparkleCenter: {
    position: "absolute",
    top: 100,
    left: width * 0.32,
    zIndex: 10,
  },
  sparkleBottomLeft: {
    position: "absolute",
    bottom: 25,
    left: width * 0.22,
    zIndex: 10,
  },
});
