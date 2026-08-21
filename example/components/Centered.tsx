import { Text, View } from 'react-native';

import { screenStyles } from './styles';

/** Centered placeholder text (e.g. while waiting for configuration). */
export function Centered({ text }: { text: string }) {
  return (
    <View style={[screenStyles.fill, screenStyles.centered]}>
      <Text>{text}</Text>
    </View>
  );
}
