import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  DEFAULT_BORDER_RADIUS,
  IBoneProps,
  ICustomViewStyle,
  IDirection
} from './Constants';

const { memo, useMemo } = React;

const styles = StyleSheet.create({
  absoluteGradient: {
    height: '100%',
    position: 'absolute',
    width: '100%'
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  gradientChild: {
    flex: 1
  }
});

const interpolate = (value: number, outputRange: number[]) =>
  outputRange[0] * (1 - value) + outputRange[1] * value;

const BoneComponent: React.FC<IBoneProps> = ({
  layoutStyle,
  componentSize,
  animationType,
  boneColor,
  highlightColor,
  animationValue,
  animationDirection
}) => {
  const boneWidth = useMemo(
    () =>
      (typeof layoutStyle.width === 'string'
        ? componentSize.width
        : layoutStyle.width) || 0,
    [componentSize.width, layoutStyle.width]
  );
  const boneHeight = useMemo(
    () =>
      (typeof layoutStyle.height === 'string'
        ? componentSize.height
        : layoutStyle.height) || 0,
    [componentSize.height, layoutStyle.height]
  );

  const gradientEndDirection = useMemo<IDirection>(() => {
    let direction = { x: 0, y: 0 };
    if (animationType === 'shiver') {
      if (
        animationDirection === 'horizontalLeft' ||
        animationDirection === 'horizontalRight'
      ) {
        direction = { x: 1, y: 0 };
      } else if (
        animationDirection === 'verticalTop' ||
        animationDirection === 'verticalDown'
      ) {
        direction = { x: 0, y: 1 };
      } else if (
        animationDirection === 'diagonalTopRight' ||
        animationDirection === 'diagonalDownRight' ||
        animationDirection === 'diagonalDownLeft' ||
        animationDirection === 'diagonalTopLeft'
      ) {
        if (boneWidth && boneHeight && boneWidth > boneHeight)
          return { x: 0, y: 1 };
        return { x: 1, y: 0 };
      }
    }
    return direction;
  }, [animationDirection, animationType, boneHeight, boneWidth]);

  const gradientSizeStyle = useMemo(() => {
    const gradientStyle: ICustomViewStyle = {};
    if (
      animationDirection === 'diagonalDownRight' ||
      animationDirection === 'diagonalDownLeft' ||
      animationDirection === 'diagonalTopRight' ||
      animationDirection === 'diagonalTopLeft'
    ) {
      gradientStyle.width = boneWidth;
      gradientStyle.height = boneHeight;
      if (boneHeight >= boneWidth) gradientStyle.height *= 1.5;
      else gradientStyle.width *= 1.5;
    }
    return gradientStyle;
  }, [animationDirection, boneHeight, boneWidth]);

  const boneStyles = useMemo(() => {
    const { backgroundColor, borderRadius } = layoutStyle;

    const boneStyle: ICustomViewStyle = {
      width: boneWidth,
      height: boneHeight,
      borderRadius: borderRadius || DEFAULT_BORDER_RADIUS,
      ...layoutStyle
    };
    if (animationType !== 'pulse') {
      boneStyle.overflow = 'hidden';
      boneStyle.backgroundColor = backgroundColor || boneColor;
    }
    if (
      animationDirection === 'diagonalDownRight' ||
      animationDirection === 'diagonalDownLeft' ||
      animationDirection === 'diagonalTopRight' ||
      animationDirection === 'diagonalTopLeft'
    ) {
      boneStyle.justifyContent = 'center';
      boneStyle.alignItems = 'center';
    }
    return boneStyle;
  }, [
    animationDirection,
    animationType,
    boneColor,
    boneHeight,
    boneWidth,
    layoutStyle
  ]);

  const positionRange = useMemo<number[]>(() => {
    const outputRange: number[] = [];
    // use layout dimensions for percentages (string type)

    if (animationDirection === 'horizontalRight') {
      outputRange.push(-boneWidth, +boneWidth);
    } else if (animationDirection === 'horizontalLeft') {
      outputRange.push(+boneWidth, -boneWidth);
    } else if (animationDirection === 'verticalDown') {
      outputRange.push(-boneHeight, +boneHeight);
    } else if (animationDirection === 'verticalTop') {
      outputRange.push(+boneHeight, -boneHeight);
    }
    return outputRange;
  }, [animationDirection, boneHeight, boneWidth]);

  const staticBoneStyles = useAnimatedStyle(() => {
    if (animationType === 'none') {
      return {};
    }
    return {
      backgroundColor: interpolateColor(
        animationValue.value,
        [0, 1],
        [boneColor!, highlightColor!]
      )
    };
  }, [animationType]);

  const gradientTransformStyle = useAnimatedStyle(() => {
    if (
      animationDirection === 'verticalTop' ||
      animationDirection === 'verticalDown' ||
      animationDirection === 'horizontalLeft' ||
      animationDirection === 'horizontalRight'
    ) {
      const interpolatedPosition = interpolate(
        animationValue.value,
        positionRange
      );
      if (
        animationDirection === 'verticalTop' ||
        animationDirection === 'verticalDown'
      ) {
        return { transform: [{ translateY: interpolatedPosition }] };
      }
      return { transform: [{ translateX: interpolatedPosition }] };
    }
    if (
      animationDirection === 'diagonalDownRight' ||
      animationDirection === 'diagonalTopRight' ||
      animationDirection === 'diagonalDownLeft' ||
      animationDirection === 'diagonalTopLeft'
    ) {
      const diagonal = Math.sqrt(
        boneHeight * boneHeight + boneWidth * boneWidth
      );
      const mainDimension = Math.max(boneHeight, boneWidth);
      const oppositeDimension =
        mainDimension === boneWidth ? boneHeight : boneWidth;
      const diagonalAngle = Math.acos(mainDimension / diagonal);
      let rotateAngle =
        animationDirection === 'diagonalDownRight' ||
        animationDirection === 'diagonalTopLeft'
          ? Math.PI / 2 - diagonalAngle
          : Math.PI / 2 + diagonalAngle;
      const additionalRotate =
        animationDirection === 'diagonalDownRight' ||
        animationDirection === 'diagonalTopLeft'
          ? 2 * diagonalAngle
          : -2 * diagonalAngle;
      const distanceFactor = (diagonal + oppositeDimension) / 2;
      if (mainDimension === boneWidth && boneWidth !== boneHeight)
        rotateAngle += additionalRotate;
      const sinComponent = Math.sin(diagonalAngle) * distanceFactor;
      const cosComponent = Math.cos(diagonalAngle) * distanceFactor;
      let xOutputRange = [0, 0];
      let yOutputRange = [0, 0];
      if (
        animationDirection === 'diagonalDownRight' ||
        animationDirection === 'diagonalTopLeft'
      ) {
        xOutputRange =
          animationDirection === 'diagonalDownRight'
            ? [-sinComponent, sinComponent]
            : [sinComponent, -sinComponent];
        yOutputRange =
          animationDirection === 'diagonalDownRight'
            ? [-cosComponent, cosComponent]
            : [cosComponent, -cosComponent];
      } else {
        xOutputRange =
          animationDirection === 'diagonalDownLeft'
            ? [-sinComponent, sinComponent]
            : [sinComponent, -sinComponent];
        yOutputRange =
          animationDirection === 'diagonalDownLeft'
            ? [cosComponent, -cosComponent]
            : [-cosComponent, cosComponent];
        if (mainDimension === boneHeight && boneWidth !== boneHeight) {
          xOutputRange.reverse();
          yOutputRange.reverse();
        }
      }
      let translateX = interpolate(animationValue.value, xOutputRange);
      let translateY = interpolate(animationValue.value, yOutputRange);
      // swapping the translates if width is the main dim
      if (mainDimension === boneWidth)
        [translateX, translateY] = [translateY, translateX];
      const rotate = `${rotateAngle}rad`;
      return { transform: [{ translateX, translateY, rotate }] };
    }
    return {};
  }, []);

  if (animationType === 'pulse' || animationType === 'none') {
    return <Animated.View style={[boneStyles, staticBoneStyles]} />;
  }
  return (
    <View style={boneStyles}>
      <Animated.View
        style={[
          styles.absoluteGradient,
          gradientSizeStyle,
          gradientTransformStyle
        ]}
      >
        <LinearGradient
          colors={[boneColor!, highlightColor!, boneColor!]}
          start={{ x: 0, y: 0 }}
          end={gradientEndDirection}
          style={styles.gradientChild}
        />
      </Animated.View>
    </View>
  );
};

export default memo(BoneComponent);
