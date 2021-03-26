import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import Bone from './Bone';
import {
  ICustomViewStyle,
  DEFAULT_ANIMATION_DIRECTION,
  DEFAULT_ANIMATION_TYPE,
  DEFAULT_BONE_COLOR,
  DEFAULT_EASING,
  DEFAULT_DURATION,
  DEFAULT_HIGHLIGHT_COLOR,
  DEFAULT_LOADING,
  ISkeletonContentProps
} from './Constants';

const { useState, useCallback, useEffect } = React;

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

const useLayout = () => {
  const [size, setSize] = useState<any>({ width: 0, height: 0 });

  const onLayout = useCallback(event => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  }, []);

  return [size, onLayout];
};

const SkeletonContent: React.FunctionComponent<ISkeletonContentProps> = ({
  containerStyle = styles.container,
  easing = DEFAULT_EASING,
  duration = DEFAULT_DURATION,
  layout = [],
  animationType = DEFAULT_ANIMATION_TYPE,
  animationDirection = DEFAULT_ANIMATION_DIRECTION,
  isLoading = DEFAULT_LOADING,
  boneColor = DEFAULT_BONE_COLOR,
  highlightColor = DEFAULT_HIGHLIGHT_COLOR,
  children
}) => {
  const animationValue = useSharedValue(0);

  const [componentSize, onLayout] = useLayout();

  useEffect(() => {
    if (isLoading) {
      if (animationType === 'shiver') {
        animationValue.value = withRepeat(
          withTiming(1, { duration, easing }),
          -1
        );
      } else {
        animationValue.value = withRepeat(
          withTiming(1, { duration: duration! / 2, easing }),
          -1,
          true
        );
      }
    }
  }, [animationType, animationValue.value, duration, easing, isLoading]);

  const getBoneContainer = (
    layoutStyle: ICustomViewStyle,
    childrenBones: JSX.Element[],
    key: number | string
  ) => (
    <View key={layoutStyle.key || key} style={layoutStyle}>
      {childrenBones}
    </View>
  );

  const getBones = (
    bonesLayout: ICustomViewStyle[] | undefined,
    childrenItems: any,
    prefix: string | number = ''
  ): JSX.Element[] => {
    if (bonesLayout && bonesLayout.length > 0) {
      const iterator: number[] = new Array(bonesLayout.length).fill(0);
      return iterator.map((_, i) => {
        // has a nested layout
        if (bonesLayout[i].children && bonesLayout[i].children!.length > 0) {
          const containerPrefix = bonesLayout[i].key || `bone_container_${i}`;
          const { children: childBones, ...layoutStyle } = bonesLayout[i];
          return getBoneContainer(
            layoutStyle,
            getBones(childBones, [], containerPrefix),
            containerPrefix
          );
        }
        return (
          <Bone
            key={prefix ? `${prefix}_${i}` : i}
            animationType={animationType}
            boneColor={boneColor}
            highlightColor={highlightColor}
            animationDirection={animationDirection}
            layoutStyle={bonesLayout[i]}
            animationValue={animationValue}
            componentSize={componentSize}
          />
        );
      });
      // no layout, matching children's layout
    }
    return React.Children.map(childrenItems, (child, i) => {
      return (
        <Bone
          key={prefix ? `${prefix}_${i}` : i}
          animationType={animationType}
          boneColor={boneColor}
          highlightColor={highlightColor}
          animationDirection={animationDirection}
          layoutStyle={child.props.style || {}}
          animationValue={animationValue}
          componentSize={componentSize}
        />
      );
    });
  };

  return (
    <View style={containerStyle} onLayout={onLayout}>
      {isLoading ? getBones(layout!, children) : children}
    </View>
  );
};

export default React.memo(SkeletonContent);
