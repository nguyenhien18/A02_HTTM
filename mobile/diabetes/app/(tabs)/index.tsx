import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:5001/api/predict";

type FormState = Record<string, string>;
type PredictionResult = {
  prediction: number;
  label: string;
  model: string;
  probability_estimate?: number;
};
type MainField = {
  name: string;
  label: string;
  type: "number" | "choice";
  hint?: string;
  options?: string[];
  values?: number[];
};

const DEFAULT_FORM: FormState = {
  HighBP: "0",
  HighChol: "0",
  CholCheck: "1",
  BMI: "31",
  Smoker: "0",
  Stroke: "0",
  HeartDiseaseorAttack: "0",
  PhysActivity: "1",
  Fruits: "1",
  Veggies: "1",
  HvyAlcoholConsump: "0",
  AnyHealthcare: "1",
  NoDocbcCost: "0",
  GenHlth: "3",
  MentHlth: "5",
  PhysHlth: "10",
  DiffWalk: "0",
  Sex: "1",
  Age: "9",
  Education: "5",
  Income: "6",
};

const MAIN_FIELDS: MainField[] = [
  { name: "BMI", label: "BMI", type: "number", hint: "Khoảng giá trị: 1 - 100" },
  { name: "GenHlth", label: "Sức khỏe tổng quát", type: "choice", options: ["1 - Rất tốt", "2 - Tốt", "3 - Khá", "4 - Kém", "5 - Rất kém"] },
  { name: "Age", label: "Nhóm tuổi", type: "choice", options: Array.from({ length: 13 }, (_, index) => `Nhóm ${index + 1}`), hint: "Giá trị 1 - 13 theo dataset" },
  { name: "MentHlth", label: "Số ngày sức khỏe tâm thần kém", type: "number", hint: "0 - 30 ngày" },
  { name: "PhysHlth", label: "Số ngày sức khỏe thể chất kém", type: "number", hint: "0 - 30 ngày" },
  { name: "Education", label: "Học vấn", type: "choice", options: Array.from({ length: 6 }, (_, index) => `Mức ${index + 1}`), hint: "Giá trị 1 - 6 theo dataset" },
  { name: "Income", label: "Thu nhập", type: "choice", options: Array.from({ length: 8 }, (_, index) => `Mức ${index + 1}`), hint: "Giá trị 1 - 8 theo dataset" },
  { name: "Sex", label: "Giới tính", type: "choice", options: ["Nữ", "Nam"], values: [0, 1] },
];

const BINARY_FIELDS = [
  ["HighBP", "Cao huyết áp"],
  ["HighChol", "Cholesterol cao"],
  ["CholCheck", "Đã kiểm tra cholesterol"],
  ["Smoker", "Hút thuốc"],
  ["Stroke", "Từng bị đột quỵ"],
  ["HeartDiseaseorAttack", "Bệnh tim hoặc đau tim"],
  ["PhysActivity", "Có hoạt động thể chất"],
  ["Fruits", "Ăn trái cây thường xuyên"],
  ["Veggies", "Ăn rau thường xuyên"],
  ["HvyAlcoholConsump", "Uống nhiều rượu bia"],
  ["AnyHealthcare", "Có bảo hiểm y tế"],
  ["NoDocbcCost", "Từng không đi khám vì chi phí"],
  ["DiffWalk", "Khó đi lại hoặc lên cầu thang"],
] as const;

export default function HomeScreen() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (name: string, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const predict = async () => {
    setError("");
    setResult(null);
    const payload = Object.fromEntries(Object.entries(form).map(([name, value]) => [name, Number(value)]));

    if (Object.values(form).some((value) => value.trim() === "" || !Number.isFinite(Number(value)))) {
      setError("Vui lòng nhập đầy đủ và đúng định dạng 21 trường dữ liệu.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể nhận kết quả từ API.");
      setResult(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không kết nối được máy chủ Flask.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm(DEFAULT_FORM);
    setResult(null);
    setError("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>+</Text></View>
            <View><Text style={styles.brandName}>HealthCheck AI</Text><Text style={styles.brandCaption}>Sàng lọc sức khỏe</Text></View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>MOBILE SCREENING</Text>
            <Text style={styles.title}>Kiểm tra nguy cơ tiểu đường</Text>
            <Text style={styles.subtitle}>Nhập các chỉ số sức khỏe để nhận kết quả sàng lọc từ mô hình AI.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.stepBadge}><Text style={styles.stepText}>01</Text></View>
              <View style={styles.flex}><Text style={styles.cardTitle}>Thông tin sức khỏe</Text><Text style={styles.cardSubtitle}>Nhập các giá trị gần nhất</Text></View>
            </View>

            <Text style={styles.groupTitle}>Chỉ số và tình trạng</Text>
            {MAIN_FIELDS.map((field) => <Field key={field.name} field={field} value={form[field.name]} onChangeText={(value) => updateField(field.name, value)} />)}

            <View style={styles.groupDivider} />
            <Text style={styles.groupTitle}>Bệnh sử và hành vi</Text>
            {BINARY_FIELDS.map(([name, label]) => (
              <ChoiceField key={name} label={label} value={form[name]} options={["Không", "Có"]} onChange={(value) => updateField(name, value)} />
            ))}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.buttonRow}>
              <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={predict} disabled={loading}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <><Text style={styles.primaryButtonText}>Dự đoán</Text><Text style={styles.arrow}>→</Text></>}
              </Pressable>
              <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={reset}><Text style={styles.secondaryButtonText}>Đặt lại</Text></Pressable>
            </View>
          </View>

          <View style={styles.modelCard}>
            <View style={styles.modelHeader}>
              <View style={styles.modelIcon}><Text style={styles.modelIconText}>✦</Text></View>
              <View style={styles.flex}><Text style={styles.modelKicker}>MÔ HÌNH ĐANG SỬ DỤNG</Text><Text style={styles.modelTitle}>Logistic Regression</Text></View>
            </View>
            <Text style={styles.modelDescription}>Phân loại nguy cơ dựa trên 21 đặc trưng sức khỏe và thói quen.</Text>
            <View style={styles.metricGrid}><Metric label="Đầu vào" value="21 biến" /><Metric label="Đầu ra" value="0 hoặc 1" /></View>
          </View>

          {result ? <ResultCard result={result} /> : <View style={styles.waitingCard}><Text style={styles.waitingIcon}>✦</Text><Text style={styles.modelKicker}>KẾT QUẢ DỰ ĐOÁN</Text><Text style={styles.waitingTitle}>Chưa có kết quả</Text><Text style={styles.waitingText}>Gửi biểu mẫu để xem dự đoán.</Text></View>}
          <Text style={styles.disclaimer}>Kết quả chỉ mang tính tham khảo từ mô hình Machine Learning và không thay thế chẩn đoán của chuyên gia y tế.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ field, value, onChangeText }: { field: MainField; value: string; onChangeText: (value: string) => void }) {
  if (field.type === "choice") {
    return <ChoiceField label={field.label} value={value} options={field.options ?? []} values={field.values} hint={field.hint} onChange={onChangeText} />;
  }
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{field.label} <Text style={styles.required}>*</Text></Text>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} keyboardType="decimal-pad" placeholder="Nhập giá trị" placeholderTextColor="#afb1c2" />
      {field.hint ? <Text style={styles.hint}>{field.hint}</Text> : null}
    </View>
  );
}

function ChoiceField({ label, value, options, values, hint, onChange }: { label: string; value: string; options: string[]; values?: number[]; hint?: string; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false);
  const selectedIndex = Math.max(0, values ? values.indexOf(Number(value)) : Number(value) - 1);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label} <Text style={styles.required}>*</Text></Text>
      <Pressable style={styles.selectInput} onPress={() => setVisible(true)}><Text style={styles.selectText}>{options[selectedIndex] ?? options[0]}</Text><Text style={styles.selectArrow}>⌄</Text></Pressable>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{label}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option, index) => <Pressable key={option} style={[styles.option, index === selectedIndex && styles.selectedOption]} onPress={() => { onChange(String(values?.[index] ?? index + 1)); setVisible(false); }}><Text style={[styles.optionText, index === selectedIndex && styles.selectedOptionText]}>{option}</Text></Pressable>)}
            </ScrollView>
            <Pressable style={styles.modalClose} onPress={() => setVisible(false)}><Text style={styles.modalCloseText}>Đóng</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

function ResultCard({ result }: { result: PredictionResult }) {
  const positive = result.prediction === 1;
  return (
    <View style={[styles.resultCard, positive ? styles.resultDanger : styles.resultSafe]}>
      <View style={styles.resultHeader}><View style={[styles.resultIcon, positive ? styles.resultIconDanger : styles.resultIconSafe]}><Text style={[styles.resultIconText, positive && styles.resultIconDangerText]}>{positive ? "!" : "✓"}</Text></View><View style={styles.flex}><Text style={styles.resultKicker}>KẾT QUẢ SÀNG LỌC</Text><Text style={styles.resultTitle}>{result.label}</Text></View></View>
      <Text style={styles.resultText}>{positive ? "Cần theo dõi thêm. Mô hình nhận diện dấu hiệu có thể liên quan đến tiểu đường." : "Nguy cơ hiện tại ở mức thấp hơn theo dữ liệu đã nhập."}</Text>
      <View style={styles.resultDetails}><View style={styles.resultDetailBox}><Text style={styles.resultDetailLabel}>Điểm mô hình</Text><Text style={styles.resultDetailValue}>{result.probability_estimate !== undefined ? `${Math.round(result.probability_estimate * 100)}%` : "--"}</Text></View><View style={styles.resultDetailBox}><Text style={styles.resultDetailLabel}>Model</Text><Text style={styles.resultDetailValue}>{result.model}</Text></View></View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f6f4fb" },
  flex: { flex: 1 },
  screen: { backgroundColor: "#f6f4fb" },
  container: { padding: 20, paddingTop: 18, paddingBottom: 42 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 28 },
  brandMark: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: "#756bc2" },
  brandMarkText: { color: "#ffffff", fontSize: 23, fontWeight: "800" },
  brandName: { color: "#4b4570", fontSize: 15, fontWeight: "800" },
  brandCaption: { marginTop: 2, color: "#8b879e", fontSize: 11, fontWeight: "600" },
  hero: { alignItems: "center", marginBottom: 24 },
  eyebrow: { color: "#8881b4", fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  title: { marginTop: 10, color: "#4a4568", fontSize: 29, fontWeight: "800", lineHeight: 35, textAlign: "center" },
  subtitle: { marginTop: 9, color: "#777b91", fontSize: 14, lineHeight: 21, textAlign: "center" },
  card: { padding: 18, borderWidth: 1, borderColor: "#e7e3f0", borderRadius: 8, backgroundColor: "#ffffff" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 23 },
  stepBadge: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: "#eeecfa" },
  stepText: { color: "#6258df", fontSize: 12, fontWeight: "800" },
  cardTitle: { color: "#504a70", fontSize: 18, fontWeight: "800" },
  cardSubtitle: { marginTop: 3, color: "#8b8da1", fontSize: 12 },
  groupTitle: { marginBottom: 15, color: "#504a70", fontSize: 13, fontWeight: "800" },
  groupDivider: { height: 1, marginVertical: 7, backgroundColor: "#ebe7f3" },
  field: { marginBottom: 16 },
  label: { marginBottom: 8, color: "#68627c", fontSize: 13, fontWeight: "700", lineHeight: 18 },
  required: { color: "#c46e80" },
  input: { height: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: "#dedbe8", borderRadius: 6, color: "#25263a", backgroundColor: "#fbfaff", fontSize: 16 },
  selectInput: { minHeight: 50, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#dedbe8", borderRadius: 6, backgroundColor: "#fbfaff" },
  selectText: { flex: 1, color: "#4c4860", fontSize: 14 },
  selectArrow: { marginLeft: 10, color: "#756bc2", fontSize: 20 },
  hint: { marginTop: 6, color: "#9a96a7", fontSize: 11 },
  error: { marginTop: 3, padding: 11, borderRadius: 6, color: "#b32e55", backgroundColor: "#fff3f6", fontSize: 13, lineHeight: 18 },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: 7 },
  primaryButton: { minHeight: 50, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 6, backgroundColor: "#4338ca" },
  primaryButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  arrow: { color: "#ffffff", fontSize: 20, lineHeight: 20 },
  secondaryButton: { width: 84, minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: "#f0eff6" },
  secondaryButtonText: { color: "#746f89", fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.78 },
  modelCard: { marginTop: 16, padding: 20, borderWidth: 1, borderColor: "#ebe7f3", borderRadius: 8, backgroundColor: "#fbfaff" },
  modelHeader: { flexDirection: "row", alignItems: "flex-start", gap: 11 },
  modelIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: "#eeecfa" },
  modelIconText: { color: "#675eb0", fontSize: 21, fontWeight: "800" },
  modelKicker: { color: "#918aaa", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  modelTitle: { marginTop: 6, color: "#595373", fontSize: 19, fontWeight: "800" },
  modelDescription: { marginTop: 20, color: "#938fa3", fontSize: 13, lineHeight: 20 },
  metricGrid: { flexDirection: "row", gap: 9, marginTop: 17 },
  metric: { flex: 1, padding: 13, borderWidth: 1, borderColor: "#ebe7f3", borderRadius: 6, backgroundColor: "#ffffff" },
  metricLabel: { color: "#9b97a9", fontSize: 11 },
  metricValue: { marginTop: 6, color: "#57516f", fontSize: 17, fontWeight: "800" },
  waitingCard: { minHeight: 210, marginTop: 16, padding: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e7e3f0", borderRadius: 8, backgroundColor: "#ffffff" },
  waitingIcon: { width: 46, height: 46, marginBottom: 15, paddingTop: 9, borderRadius: 23, color: "#756bc2", backgroundColor: "#eeecfa", fontSize: 22, textAlign: "center" },
  waitingTitle: { marginTop: 7, color: "#504a70", fontSize: 20, fontWeight: "800" },
  waitingText: { marginTop: 8, color: "#938fa3", fontSize: 13 },
  resultCard: { marginTop: 16, padding: 20, borderLeftWidth: 5, borderWidth: 1, borderColor: "#e7e3ef", borderRadius: 8, backgroundColor: "#ffffff" },
  resultSafe: { borderLeftColor: "#24b47e" },
  resultDanger: { borderLeftColor: "#ec5c73" },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 11 },
  resultIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  resultIconSafe: { backgroundColor: "#e4f8ef" },
  resultIconDanger: { backgroundColor: "#ffebef" },
  resultIconText: { color: "#16865e", fontSize: 20, fontWeight: "800" },
  resultIconDangerText: { color: "#c33d5a" },
  resultKicker: { color: "#85889b", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  resultTitle: { marginTop: 5, color: "#292b42", fontSize: 18, fontWeight: "800" },
  resultText: { marginTop: 20, color: "#55586f", fontSize: 14, lineHeight: 21 },
  resultDetails: { flexDirection: "row", gap: 10, marginTop: 16 },
  resultDetailBox: { flex: 1, padding: 12, borderRadius: 6, backgroundColor: "#f7f5fc" },
  resultDetailLabel: { color: "#85889b", fontSize: 11 },
  resultDetailValue: { marginTop: 5, color: "#303249", fontSize: 13, fontWeight: "800" },
  disclaimer: { marginTop: 16, color: "#85889b", fontSize: 11, lineHeight: 17, textAlign: "center" },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: "rgba(39, 34, 103, 0.28)" },
  modalCard: { width: "100%", maxHeight: "78%", padding: 18, borderRadius: 8, backgroundColor: "#ffffff" },
  modalTitle: { marginBottom: 13, color: "#504a70", fontSize: 18, fontWeight: "800" },
  option: { padding: 13, borderRadius: 6 },
  selectedOption: { backgroundColor: "#eeecfa" },
  optionText: { color: "#4c4860", fontSize: 14 },
  selectedOptionText: { color: "#675eb0", fontWeight: "800" },
  modalClose: { marginTop: 12, padding: 12, alignItems: "center", borderRadius: 6, backgroundColor: "#f0eff6" },
  modalCloseText: { color: "#746f89", fontWeight: "700" },
});
