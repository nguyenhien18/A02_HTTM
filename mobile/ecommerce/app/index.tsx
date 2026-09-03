import React, { useEffect, useState } from "react";
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

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? (
  Platform.OS === "android" ? "http://10.0.2.2:5003" : "http://127.0.0.1:5003"
);

type FormState = Record<string, string>;

type NumericFieldConfig = {
  name: string;
  label: string;
  min: number;
  max: number;
  unit?: string;
  hint: string;
};

type SelectFieldConfig = {
  name: string;
  label: string;
  optionKey: string;
};

type ApiResult = {
  prediction: number;
  label: string;
  purchase_probability: number | null;
  confidence: number | null;
  model: string;
};

type ApiResponse = {
  options?: Record<string, (string | number)[]>;
  defaults?: Record<string, string | number>;
  metrics?: Record<string, string | number>;
};

const DEFAULT_FORM: FormState = {
  Age: "35",
  AnnualIncome: "65000",
  NumberOfPurchases: "8",
  TimeSpentOnWebsite: "24",
  CustomerTenureYears: "3",
  LastPurchaseDaysAgo: "18",
  Gender: "Female",
  ProductCategory: "Electronics",
  PreferredDevice: "Mobile",
  Region: "South",
  ReferralSource: "Organic",
  CustomerSegment: "Regular",
  LoyaltyProgram: "1",
  DiscountsAvailed: "2",
  SessionCount: "5",
  CustomerSatisfaction: "4",
};

const DEFAULT_OPTIONS: Record<string, string[]> = {
  Gender: ["Female", "Male"],
  ProductCategory: ["Electronics", "Fashion", "Furniture", "Groceries", "Kitchen"],
  PreferredDevice: ["Desktop", "Mobile", "Tablet"],
  Region: ["East", "North", "South", "West"],
  ReferralSource: ["Email", "Organic", "Paid Ads", "Referral", "Social"],
  CustomerSegment: ["Premium", "Regular", "VIP"],
};

const NUMERIC_FIELDS: NumericFieldConfig[] = [
  { name: "Age", label: "Tuổi", min: 15, max: 81, hint: "15 - 81 tuổi" },
  { name: "AnnualIncome", label: "Thu nhập hàng năm", unit: "USD", min: 10000, max: 250000, hint: "10.000 - 250.000 USD" },
  { name: "NumberOfPurchases", label: "Số lần mua hàng", min: 0, max: 50, hint: "Tổng số đơn đã mua" },
  { name: "TimeSpentOnWebsite", label: "Thời gian trên website", unit: "phút", min: 0, max: 100, hint: "Thời gian của phiên gần nhất" },
  { name: "CustomerTenureYears", label: "Thâm niên khách hàng", unit: "năm", min: 0, max: 20, hint: "Số năm gắn bó" },
  { name: "LastPurchaseDaysAgo", label: "Lần mua gần nhất", unit: "ngày trước", min: 0, max: 250, hint: "Số ngày từ lần mua gần nhất" },
  { name: "DiscountsAvailed", label: "Số ưu đãi đã dùng", min: 0, max: 10, hint: "0 - 10 ưu đãi" },
  { name: "SessionCount", label: "Số phiên truy cập", min: 1, max: 20, hint: "Số phiên truy cập website" },
  { name: "CustomerSatisfaction", label: "Mức độ hài lòng", unit: "/ 5", min: 1, max: 5, hint: "1 - 5 điểm" },
];

const SELECT_FIELDS: SelectFieldConfig[] = [
  { name: "Gender", label: "Giới tính", optionKey: "Gender" },
  { name: "Region", label: "Khu vực", optionKey: "Region" },
  { name: "CustomerSegment", label: "Phân khúc khách hàng", optionKey: "CustomerSegment" },
  { name: "ProductCategory", label: "Danh mục sản phẩm", optionKey: "ProductCategory" },
  { name: "PreferredDevice", label: "Thiết bị ưa thích", optionKey: "PreferredDevice" },
  { name: "ReferralSource", label: "Nguồn giới thiệu", optionKey: "ReferralSource" },
];

export default function HomeScreen() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [metrics, setMetrics] = useState<Record<string, string | number>>({});
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOptions() {
      try {
        const response = await fetch(`${API_URL}/api/options`);
        const data: ApiResponse = await response.json();
        if (!response.ok) throw new Error("Không thể tải danh sách lựa chọn.");
        const apiOptions = Object.fromEntries(
          Object.entries(data.options ?? {}).map(([key, values]) => [key, values.map(String)])
        );
        setOptions((current) => ({ ...current, ...apiOptions }));
        setMetrics(data.metrics ?? {});
        const defaults = data.defaults;
        if (defaults) {
          setForm((current) => ({
            ...current,
            ...Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, String(value)])),
          }));
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Không kết nối được Ecommerce API.");
      } finally {
        setOptionsLoading(false);
      }
    }

    loadOptions();
  }, []);

  const updateField = (name: string, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const predict = async () => {
    setError("");
    setResult(null);

    const payload: Record<string, string | number> = { ...form };
    const invalid = NUMERIC_FIELDS.some((field) => {
      const value = Number(form[field.name]);
      payload[field.name] = value;
      return !Number.isFinite(value) || value < field.min || value > field.max;
    });
    payload.LoyaltyProgram = Number(form.LoyaltyProgram);

    if (invalid || !form.Gender || !form.ProductCategory || !form.PreferredDevice || !form.Region || !form.ReferralSource || !form.CustomerSegment) {
      setError("Vui lòng nhập đủ thông tin và kiểm tra các giá trị trong phạm vi hợp lệ.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: ApiResult & { error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể dự đoán hành vi mua hàng.");
      setResult(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không kết nối được Ecommerce API.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm(DEFAULT_FORM);
    setResult(null);
    setError("");
  };

  const metricPercent = (name: string, fallback: string) => {
    const value = metrics[name];
    return value === undefined ? fallback : `${(Number(value) * 100).toFixed(2)}%`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>↗</Text></View>
            <View><Text style={styles.brandName}>PurchaseCheck AI</Text><Text style={styles.brandCaption}>Phân tích hành vi mua sắm</Text></View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>E-COMMERCE PURCHASE PREDICTION</Text>
            <Text style={styles.title}>Khách hàng có khả năng mua không?</Text>
            <Text style={styles.subtitle}>Nhập hồ sơ và hành vi truy cập để nhận dự đoán từ mô hình AI.</Text>
          </View>

          <View style={styles.card}>
            <SectionHeader number="01" title="Hồ sơ khách hàng" subtitle="Thông tin nền tảng của khách hàng" />
            <Text style={styles.groupTitle}>Thông tin cá nhân</Text>
            <NumericField field={NUMERIC_FIELDS[0]} value={form.Age} onChangeText={(value) => updateField("Age", value)} />
            {SELECT_FIELDS.filter((field) => ["Gender", "Region", "CustomerSegment"].includes(field.name)).map((field) => (
              <ChoiceField key={field.name} label={field.label} value={form[field.name]} options={options[field.optionKey] ?? []} loading={optionsLoading} onChange={(value) => updateField(field.name, value)} />
            ))}

            <View style={styles.divider} />
            <Text style={styles.groupTitle}>Hành vi mua sắm</Text>
            {NUMERIC_FIELDS.slice(1).map((field) => (
              <NumericField key={field.name} field={field} value={form[field.name]} onChangeText={(value) => updateField(field.name, value)} />
            ))}
            <ChoiceField label="Tham gia chương trình khách hàng thân thiết" value={form.LoyaltyProgram} options={["Không", "Có"]} optionValues={["0", "1"]} onChange={(value) => updateField("LoyaltyProgram", value)} />

            <View style={styles.divider} />
            <Text style={styles.groupTitle}>Bối cảnh phiên truy cập</Text>
            {SELECT_FIELDS.filter((field) => ["ProductCategory", "PreferredDevice", "ReferralSource"].includes(field.name)).map((field) => (
              <ChoiceField key={field.name} label={field.label} value={form[field.name]} options={options[field.optionKey] ?? []} loading={optionsLoading} onChange={(value) => updateField(field.name, value)} />
            ))}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.buttonRow}>
              <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={predict} disabled={loading || optionsLoading}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <><Text style={styles.primaryButtonText}>Dự đoán mua hàng</Text><Text style={styles.arrow}>→</Text></>}
              </Pressable>
              <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={reset}><Text style={styles.secondaryButtonText}>Đặt lại</Text></Pressable>
            </View>
          </View>

          <View style={styles.modelCard}>
            <View style={styles.modelHeader}>
              <View style={styles.modelIcon}><Text style={styles.modelIconText}>✦</Text></View>
              <View style={styles.flex}><Text style={styles.modelKicker}>MÔ HÌNH ĐANG SỬ DỤNG</Text><Text style={styles.modelTitle}>Logistic Regression</Text></View>
            </View>
            <Text style={styles.modelDescription}>Mô hình phân loại nhị phân dựa trên hồ sơ, hành vi và bối cảnh mua sắm của khách hàng.</Text>
            <View style={styles.metricGrid}>
              <Metric label="Accuracy" value={metricPercent("Accuracy", "91.43%")} />
              <Metric label="Precision" value={metricPercent("Precision", "86.40%")} />
              <Metric label="Recall" value={metricPercent("Recall", "94.37%")} />
              <Metric label="F1-score" value={metricPercent("F1", "90.21%")} />
            </View>
          </View>

          {result ? <ResultCard result={result} /> : <View style={styles.waitingCard}><Text style={styles.waitingIcon}>✦</Text><Text style={styles.modelKicker}>KẾT QUẢ DỰ ĐOÁN</Text><Text style={styles.waitingTitle}>Chưa có kết quả</Text><Text style={styles.waitingText}>Gửi biểu mẫu để xem dự đoán mua hoặc không mua.</Text></View>}
          <Text style={styles.disclaimer}>Kết quả hỗ trợ tham khảo cho phân tích kinh doanh, không phải cam kết khách hàng sẽ mua.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionHeader({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return <View style={styles.sectionHeader}><View style={styles.stepBadge}><Text style={styles.stepText}>{number}</Text></View><View style={styles.flex}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardSubtitle}>{subtitle}</Text></View></View>;
}

function NumericField({ field, value, onChangeText }: { field: NumericFieldConfig; value: string; onChangeText: (value: string) => void }) {
  return <View style={styles.field}><Text style={styles.label}>{field.label}{field.unit ? ` (${field.unit})` : ""} <Text style={styles.required}>*</Text></Text><TextInput style={styles.input} value={value} onChangeText={onChangeText} keyboardType="decimal-pad" placeholder="Nhập giá trị" placeholderTextColor="#afb1c2"/><Text style={styles.hint}>{field.hint}</Text></View>;
}

function ChoiceField({ label, value, options, optionValues, loading = false, onChange }: { label: string; value: string; options: string[]; optionValues?: string[]; loading?: boolean; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false);
  const selectedIndex = Math.max(0, optionValues ? optionValues.indexOf(value) : options.indexOf(value));
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label} <Text style={styles.required}>*</Text></Text>
      <Pressable style={styles.selectInput} onPress={() => setVisible(true)} disabled={loading || options.length === 0}>
        <Text style={styles.selectText}>{loading ? "Đang tải..." : options[selectedIndex] ?? "Chọn giá trị"}</Text><Text style={styles.selectArrow}>⌄</Text>
      </Pressable>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}><Text style={styles.modalTitle}>{label}</Text><ScrollView showsVerticalScrollIndicator={false}>{options.map((option, index) => <Pressable key={option} style={[styles.option, index === selectedIndex && styles.selectedOption]} onPress={() => { onChange(optionValues?.[index] ?? option); setVisible(false); }}><Text style={[styles.optionText, index === selectedIndex && styles.selectedOptionText]}>{option}</Text></Pressable>)}</ScrollView><Pressable style={styles.modalClose} onPress={() => setVisible(false)}><Text style={styles.modalCloseText}>Đóng</Text></Pressable></View></View>
      </Modal>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

function ResultCard({ result }: { result: ApiResult }) {
  const positive = result.prediction === 1;
  const probability = result.purchase_probability === null ? null : Math.round(result.purchase_probability * 100);
  const confidence = result.confidence === null ? null : Math.round(result.confidence * 100);
  return <View style={[styles.resultCard, positive ? styles.resultDanger : styles.resultSafe]}><View style={styles.resultHeader}><View style={[styles.resultIcon, positive ? styles.resultIconDanger : styles.resultIconSafe]}><Text style={[styles.resultIconText, positive && styles.resultIconDangerText]}>{positive ? "!" : "✓"}</Text></View><View style={styles.flex}><Text style={styles.resultKicker}>KẾT QUẢ PHÂN LOẠI</Text><Text style={styles.resultTitle}>{result.label}</Text></View></View><Text style={styles.resultStatus}>{positive ? "Có khả năng mua" : "Chưa có khả năng mua"}</Text><View style={styles.scoreBlock}><Text style={styles.scoreValue}>{probability === null ? "--" : `${probability}%`}</Text><Text style={styles.scoreCaption}>Xác suất mô hình dự đoán khách hàng mua</Text></View><View style={styles.resultDetails}><View style={styles.resultDetailBox}><Text style={styles.resultDetailLabel}>Độ tin cậy</Text><Text style={styles.resultDetailValue}>{confidence === null ? "--" : `${confidence}%`}</Text></View><View style={styles.resultDetailBox}><Text style={styles.resultDetailLabel}>Model</Text><Text style={styles.resultDetailValue}>{result.model}</Text></View></View></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f6f4fb" },
  flex: { flex: 1 },
  screen: { backgroundColor: "#f6f4fb" },
  container: { padding: 20, paddingTop: 16, paddingBottom: 42 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 26 },
  brandMark: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: "#756bc2" },
  brandMarkText: { color: "#ffffff", fontSize: 22, fontWeight: "800" },
  brandName: { color: "#4b4570", fontSize: 15, fontWeight: "800" },
  brandCaption: { marginTop: 2, color: "#8b879e", fontSize: 11, fontWeight: "600" },
  hero: { alignItems: "center", marginBottom: 23 },
  eyebrow: { color: "#8881b4", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  title: { marginTop: 10, color: "#4a4568", fontSize: 28, fontWeight: "800", lineHeight: 35, textAlign: "center" },
  subtitle: { marginTop: 9, color: "#777b91", fontSize: 14, lineHeight: 21, textAlign: "center" },
  card: { marginBottom: 16, padding: 18, borderWidth: 1, borderColor: "#e7e3f0", borderRadius: 8, backgroundColor: "#ffffff" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 23 },
  stepBadge: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: "#eeecfa" },
  stepText: { color: "#6258df", fontSize: 12, fontWeight: "800" },
  cardTitle: { color: "#504a70", fontSize: 18, fontWeight: "800" },
  cardSubtitle: { marginTop: 3, color: "#8b8da1", fontSize: 12 },
  groupTitle: { marginBottom: 15, color: "#504a70", fontSize: 13, fontWeight: "800" },
  divider: { height: 1, marginVertical: 8, backgroundColor: "#ebe7f3" },
  field: { marginBottom: 16 },
  label: { marginBottom: 8, color: "#68627c", fontSize: 13, fontWeight: "700", lineHeight: 18 },
  required: { color: "#c46e80" },
  input: { height: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: "#dedbe8", borderRadius: 6, color: "#25263a", backgroundColor: "#fbfaff", fontSize: 16 },
  selectInput: { minHeight: 50, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#dedbe8", borderRadius: 6, backgroundColor: "#fbfaff" },
  selectText: { flex: 1, color: "#4c4860", fontSize: 14 },
  selectArrow: { marginLeft: 10, color: "#756bc2", fontSize: 21 },
  hint: { marginTop: 6, color: "#9a96a7", fontSize: 11 },
  error: { marginBottom: 14, padding: 11, borderRadius: 6, color: "#b32e55", backgroundColor: "#fff3f6", fontSize: 13, lineHeight: 18 },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  primaryButton: { minHeight: 50, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 6, backgroundColor: "#4338ca" },
  primaryButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  arrow: { color: "#ffffff", fontSize: 20, lineHeight: 20 },
  secondaryButton: { width: 84, minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: "#f0eff6" },
  secondaryButtonText: { color: "#746f89", fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.78 },
  modelCard: { marginBottom: 16, padding: 20, borderWidth: 1, borderColor: "#ebe7f3", borderRadius: 8, backgroundColor: "#fbfaff" },
  modelHeader: { flexDirection: "row", alignItems: "flex-start", gap: 11 },
  modelIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: "#eeecfa" },
  modelIconText: { color: "#675eb0", fontSize: 21, fontWeight: "800" },
  modelKicker: { color: "#918aaa", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  modelTitle: { marginTop: 6, color: "#595373", fontSize: 19, fontWeight: "800" },
  modelDescription: { marginTop: 20, color: "#938fa3", fontSize: 13, lineHeight: 20 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 17 },
  metric: { width: "48%", padding: 13, borderWidth: 1, borderColor: "#ebe7f3", borderRadius: 6, backgroundColor: "#ffffff" },
  metricLabel: { color: "#9b97a9", fontSize: 11 },
  metricValue: { marginTop: 6, color: "#57516f", fontSize: 17, fontWeight: "800" },
  waitingCard: { minHeight: 210, padding: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e7e3f0", borderRadius: 8, backgroundColor: "#ffffff" },
  waitingIcon: { marginBottom: 14, color: "#756bc2", fontSize: 30 },
  waitingTitle: { marginTop: 7, color: "#504a70", fontSize: 20, fontWeight: "800" },
  waitingText: { marginTop: 8, color: "#938fa3", fontSize: 13, textAlign: "center" },
  resultCard: { padding: 20, borderLeftWidth: 5, borderWidth: 1, borderColor: "#e7e3ef", borderRadius: 8, backgroundColor: "#ffffff" },
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
  resultStatus: { marginTop: 20, color: "#55586f", fontSize: 14, lineHeight: 21 },
  scoreBlock: { marginTop: 17, padding: 14, borderRadius: 6, backgroundColor: "#f7f5fc" },
  scoreValue: { color: "#4f4a6b", fontSize: 32, fontWeight: "800" },
  scoreCaption: { marginTop: 4, color: "#85889b", fontSize: 11, lineHeight: 17 },
  resultDetails: { flexDirection: "row", gap: 10, marginTop: 16 },
  resultDetailBox: { flex: 1, padding: 12, borderRadius: 6, backgroundColor: "#f7f5fc" },
  resultDetailLabel: { color: "#85889b", fontSize: 11 },
  resultDetailValue: { marginTop: 5, color: "#303249", fontSize: 13, fontWeight: "800" },
  disclaimer: { marginTop: 16, paddingHorizontal: 5, color: "#85889b", fontSize: 11, lineHeight: 17, textAlign: "center" },
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
