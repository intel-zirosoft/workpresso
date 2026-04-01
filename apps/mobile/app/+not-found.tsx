import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '화면을 찾을 수 없습니다' }} />
      <View style={styles.container}>
        <Text style={styles.title}>요청한 화면을 찾을 수 없습니다.</Text>
        <Link href="/" style={styles.link}>
          홈으로 이동
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  link: {
    fontSize: 15,
    color: '#2563eb',
  },
});
