import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

export default function GuideScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>THÔNG TIN ỨNG DỤNG</Text>
        <Text style={styles.title}>Cách sử dụng</Text>
        <Text style={styles.subtitle}>
          Nhập dữ liệu càng sát thực tế, mức giá tham khảo càng có ý nghĩa.
        </Text>

        <GuideCard number="01" title="Chọn đúng vị trí">
          <Text style={styles.cardText}>
            Chọn tỉnh/thành của căn nhà trong danh sách có sẵn.
          </Text>
        </GuideCard>
        <GuideCard number="02" title="Mô tả căn nhà">
          <Text style={styles.cardText}>
            Nhập diện tích, mặt tiền, đường vào, số tầng, phòng ngủ và phòng tắm.
          </Text>
        </GuideCard>
        <GuideCard number="03" title="Đọc mức giá tham khảo">
          <Text style={styles.cardText}>
            Kết quả được tính bằng mô hình Random Forest và hiển thị theo tỷ VNĐ.
          </Text>
        </GuideCard>

        <View style={styles.warning}>
          <Text style={styles.warningTitle}>Lưu ý</Text>
          <Text style={styles.warningText}>
            Giá thực tế còn phụ thuộc pháp lý, nội thất, hướng nhà, vị trí cụ thể và thị trường.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function GuideCard({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.number}>
          <Text style={styles.numberText}>{number}</Text>
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f7fb' },
  container: { padding: 20, paddingTop: 26, paddingBottom: 42 },
  eyebrow: { color: '#3270dc', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { marginTop: 10, color: '#172b4d', fontSize: 30, fontWeight: '800' },
  subtitle: { marginTop: 9, color: '#748095', fontSize: 14, lineHeight: 21 },
  card: {
    marginTop: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    shadowColor: '#1f385c',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  number: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#eaf2ff',
  },
  numberText: { color: '#2563eb', fontSize: 11, fontWeight: '800' },
  cardTitle: { flex: 1, color: '#273650', fontSize: 16, fontWeight: '800' },
  cardText: { marginTop: 13, color: '#69778d', fontSize: 13, lineHeight: 20 },
  warning: { marginTop: 16, padding: 17, borderRadius: 16, backgroundColor: '#fff7e6' },
  warningTitle: { color: '#a96812', fontSize: 14, fontWeight: '800' },
  warningText: { marginTop: 7, color: '#96703d', fontSize: 12, lineHeight: 18 },
});
