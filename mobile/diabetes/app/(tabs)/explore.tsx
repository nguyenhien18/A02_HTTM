import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

export default function GuideScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>THÔNG TIN ỨNG DỤNG</Text>
        <Text style={styles.title}>Hướng dẫn sử dụng</Text>
        <Text style={styles.subtitle}>
          Một vài lưu ý để bạn nhập dữ liệu và đọc kết quả đúng cách.
        </Text>

        <GuideCard number="01" title="Nhập đủ ba chỉ số">
          <Text style={styles.cardText}>
            Điền tuổi, BMI và đường huyết. Các giá trị nên lấy từ thông tin hoặc kết quả đo gần nhất.
          </Text>
        </GuideCard>
        <GuideCard number="02" title="Đọc kết quả như thế nào">
          <Text style={styles.cardText}>
            Kết quả là sàng lọc tham khảo từ mô hình KNN, không phải kết luận bệnh lý.
          </Text>
        </GuideCard>
        <GuideCard number="03" title="Khi nào nên hỏi chuyên gia">
          <Text style={styles.cardText}>
            Nếu kết quả cho thấy nguy cơ cao hoặc bạn có triệu chứng bất thường, hãy trao đổi với cơ sở y tế.
          </Text>
        </GuideCard>

        <View style={styles.warning}>
          <Text style={styles.warningTitle}>Lưu ý quan trọng</Text>
          <Text style={styles.warningText}>
            Mô hình được xây dựng cho mục đích học tập và không thay thế chẩn đoán của bác sĩ.
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
  safeArea: { flex: 1, backgroundColor: '#f7f8fc' },
  container: { padding: 20, paddingTop: 26, paddingBottom: 42 },
  eyebrow: { color: '#7268e9', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { marginTop: 10, color: '#272267', fontSize: 30, fontWeight: '800' },
  subtitle: { marginTop: 9, color: '#777b91', fontSize: 14, lineHeight: 21 },
  card: {
    marginTop: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    shadowColor: '#29226f',
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
    backgroundColor: '#efedff',
  },
  numberText: { color: '#6258df', fontSize: 11, fontWeight: '800' },
  cardTitle: { flex: 1, color: '#303249', fontSize: 16, fontWeight: '800' },
  cardText: { marginTop: 13, color: '#686b80', fontSize: 13, lineHeight: 20 },
  warning: { marginTop: 16, padding: 17, borderRadius: 16, backgroundColor: '#fff3f6' },
  warningTitle: { color: '#b32e55', fontSize: 14, fontWeight: '800' },
  warningText: { marginTop: 7, color: '#9c4963', fontSize: 12, lineHeight: 18 },
});
