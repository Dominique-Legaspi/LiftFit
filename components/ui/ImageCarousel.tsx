import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useRef, useState } from "react";
import { Dimensions, FlatList, Image, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ImageProps = {
    images: string[];
    height?: number;
};

export function ImageCarousel({ images, height = 300 }: ImageProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList<string>>(null);

    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setActiveIndex(idx);
    };

    const goPrev = () => {
        if (activeIndex > 0) {
            flatListRef.current?.scrollToIndex({ index: activeIndex - 1, animated: true });
        }
    };

    const goNext = () => {
        if (activeIndex < images.length - 1) {
            flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
        }
    };

    // only show carousel if at least one image
    if (!images || images.length === 0) return null;

    return (
        <View style={{ width: '100%' }}>

            {/* image list */}
            <FlatList
                ref={flatListRef}
                data={images}
                horizontal
                pagingEnabled
                keyExtractor={(_, i) => i.toString()}
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
                renderItem={({ item }) => (
                    <View style={[styles.imageFrame, { width: SCREEN_WIDTH, height }]}>
                        <Image
                            source={{ uri: item }}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    </View>
                )}
            />

            {/* left/right navigators */}
            {images.length > 1 && (
                <>
                    {/* left */}
                    <Pressable
                        onPress={goPrev}
                        style={[styles.chevron, styles.chevronLeft]}
                        android_ripple={{ color: Colors.light.darkgray }}
                        hitSlop={10}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={32}
                            color={Colors.light.darkgray}
                            style={{ opacity: activeIndex === 0 ? 0.3 : 1 }}
                        />
                    </Pressable>

                    {/* right */}
                    <Pressable
                        onPress={goNext}
                        style={[styles.chevron, styles.chevronRight]}
                        android_ripple={{ color: Colors.light.darkgray }}
                        hitSlop={10}
                    >
                        <Ionicons
                            name="chevron-forward"
                            size={32}
                            color={Colors.light.darkgray}
                            style={{ opacity: activeIndex === images.length - 1 ? 0.3 : 1 }}
                        />
                    </Pressable>
                </>
            )}

            {/* dot indicator */}
            {images.length > 1 && (
                <View style={styles.dotsContainer}>
                    {images.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                i === activeIndex ? styles.dotActive : styles.dotInactive,
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    )
};

const styles = StyleSheet.create({
    imageFrame: {
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    chevron: {
        position: 'absolute',
        top: '50%',
        padding: 8,
        backgroundColor: '#ffffff66',
        borderRadius: 50,
        transform: [{ translateY: -16 }],
        zIndex: 999,
    },
    chevronLeft: {
        left: 2,
    },
    chevronRight: {
        right: 2,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    dotActive: {
        backgroundColor: Colors.light.blue,
    },
    dotInactive: {
        backgroundColor: Colors.light.gray,
    },
})
