import { Fonts } from '@/constants/Fonts';
import Ionicons from '@expo/vector-icons/Ionicons'
import React from 'react'
import { Text, View } from 'react-native'

export function SectionHeader({ title, linkText }: { title: string, linkText?: string }) {
    return (
        <View style={{
            flexDirection: 'row',
            marginTop: 10,
            marginBottom: 5,
            marginHorizontal: 20,
            alignItems: 'center',
            justifyContent: 'space-between',
        }}>
            <Text style={{
                fontSize: 24,
                fontFamily: Fonts.semiBold,
            }}>
                {title}
            </Text>
            {linkText && (
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Text style={{
                        fontSize: 16,
                        fontFamily: Fonts.light,
                    }}>
                        {linkText}
                    </Text>
                        <Ionicons name="chevron-forward" size={16} />
                </View>

            )}
        </View>
    );
}

export default SectionHeader;