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

const API_URL = process.env.EXPO_PUBLIC_HOUSE_API_URL ?? "http://10.0.2.2:5002";

type FormState = Record<string, string>;
type Options = {
  cities: string[];
  offer_types: string[];
  building_types: string[];
  markets: string[];
  months: string[];
  defaults?: FormState;
};
type PredictionResult = {
  price: number;
  price_per_sqm: number;
  unit: string;
  model: string;
  city_name: string;
  reference_count: number;
};

const EMPTY_FORM: FormState = {
  city_name: "",
  offer_type: "Private",
  floor: "2",
  area: "80",
  rooms: "3",
  offer_type_of_building: "Housing Block",
  market: "aftermarket",
  month: "March",
};

export default function HomeScreen() {
  const [options, setOptions] = useState<Options>({ cities: [], offer_types: [], building_types: [], markets: [], months: [] });
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState("");
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    async function loadOptions() {
      try {
        const response = await fetch(`${API_URL}/api/options`);
        const data: Options = await response.json();
        if (!response.ok) throw new Error("Không thể tải danh sách lựa chọn.");
        setOptions(data);
        setForm((current) => ({
          ...current,
          city_name: data.cities.includes("Warszawa") ? "Warszawa" : data.cities[0] ?? "",
          ...data.defaults,
        }));
      } catch (requestError) {
        setOptionsError(requestError instanceof Error ? requestError.message : "Không tải được dữ liệu lựa chọn.");
      } finally {
        setOptionsLoading(false);
      }
    }

    loadOptions();
  }, []);

  const updateField = (name: string, value: string) => setForm((current) => ({ ...current, [name]: value }));

  const predict = async () => {
    setError("");
    setResult(null);
    const floor = Number(form.floor);
    const area = Number(form.area);
    const rooms = Number(form.rooms);
    const payload: Record<string, string | number> = { ...form, floor, area, rooms };
    const valid = Boolean(payload.city_name) && Number.isFinite(floor) && floor >= -1 && floor <= 20
      && Number.isFinite(area) && area >= 1 && area <= 399000
      && Number.isFinite(rooms) && rooms >= 1 && rooms <= 20;
    if (!valid) {
      setError("Vui lòng chọn thành phố và nhập các thông số trong phạm vi hợp lệ.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/predict`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể dự đoán giá nhà.");
      setResult(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không kết nối được House API.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm((current) => ({ ...EMPTY_FORM, city_name: current.city_name }));
    setResult(null);
    setError("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.brandRow}><View style={styles.brandMark}><Text style={styles.brandMarkText}>⌂</Text></View><View><Text style={styles.brandName}>HomeValue AI</Text><Text style={styles.brandCaption}>Ước tính bất động sản</Text></View></View>

          <View style={styles.hero}><Text style={styles.eyebrow}>HOUSE PRICE PREDICTION</Text><Text style={styles.title}>Ước tính giá ngôi nhà</Text><Text style={styles.subtitle}>Nhập thông tin cơ bản để nhận mức giá tham khảo từ mô hình AI.</Text></View>

          {optionsError ? <Text style={styles.error}>{optionsError}</Text> : null}

          <View style={styles.card}>
            <SectionHeader number="01" title="Vị trí bất động sản" subtitle="Chọn thành phố trong dữ liệu" />
            <SelectField label="Tỉnh / Thành phố" value={form.city_name} options={options.cities} loading={optionsLoading} onChange={(value) => updateField("city_name", value)} />
          </View>

          <View style={styles.card}>
            <SectionHeader number="02" title="Thông tin căn nhà" subtitle="Nhập các thông số chính" />
            <Field label="Diện tích" unit="m²" value={form.area} onChangeText={(value) => updateField("area", value)} placeholder="Ví dụ: 80" hint="Đơn vị: m²" />
            <Field label="Số phòng" value={form.rooms} onChangeText={(value) => updateField("rooms", value)} placeholder="Ví dụ: 3" keyboardType="numeric" />
            <Field label="Tầng" value={form.floor} onChangeText={(value) => updateField("floor", value)} placeholder="Ví dụ: 2" keyboardType="numeric" hint="Có thể nhập -1 cho tầng hầm" />
            <SelectField label="Loại người đăng" value={form.offer_type} options={options.offer_types} loading={optionsLoading} onChange={(value) => updateField("offer_type", value)} />
            <SelectField label="Loại tòa nhà" value={form.offer_type_of_building} options={options.building_types} loading={optionsLoading} onChange={(value) => updateField("offer_type_of_building", value)} />
            <SelectField label="Thị trường" value={form.market} options={options.markets} loading={optionsLoading} onChange={(value) => updateField("market", value)} />
            <SelectField label="Tháng đăng tin" value={form.month} options={options.months} loading={optionsLoading} onChange={(value) => updateField("month", value)} />

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.buttonRow}><Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={predict} disabled={loading || optionsLoading || !form.city_name}>{loading ? <ActivityIndicator color="#ffffff" /> : <><Text style={styles.primaryButtonText}>Dự đoán giá</Text><Text style={styles.arrow}>→</Text></>}</Pressable><Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={reset}><Text style={styles.secondaryButtonText}>Đặt lại</Text></Pressable></View>
          </View>

          <View style={styles.modelCard}><View style={styles.modelHeader}><View style={styles.modelIcon}><Text style={styles.modelIconText}>✦</Text></View><View style={styles.flex}><Text style={styles.modelKicker}>MÔ HÌNH ĐANG SỬ DỤNG</Text><Text style={styles.modelTitle}>Random Forest</Text></View></View><Text style={styles.modelDescription}>Mô hình hồi quy dự đoán giá dựa trên đặc trưng của tin đăng và vị trí.</Text><View style={styles.metricGrid}><Metric label="R² test" value="0.7868" /><Metric label="Dữ liệu" value="62.818 tin" /></View></View>

          {result ? <ResultCard result={result} /> : <View style={styles.waitingCard}><Text style={styles.waitingIcon}>⌁</Text><Text style={styles.modelKicker}>KẾT QUẢ ƯỚC TÍNH</Text><Text style={styles.waitingTitle}>Chưa có kết quả</Text><Text style={styles.waitingText}>Gửi biểu mẫu để xem giá tham khảo.</Text></View>}
          <Text style={styles.disclaimer}>Giá dự đoán chỉ mang tính tham khảo, không thay thế định giá chuyên môn.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionHeader({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return <View style={styles.sectionHeader}><View style={styles.stepBadge}><Text style={styles.stepText}>{number}</Text></View><View style={styles.flex}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardSubtitle}>{subtitle}</Text></View></View>;
}

function Field({ label, unit, value, onChangeText, placeholder, keyboardType = "decimal-pad", hint }: { label: string; unit?: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: "numeric" | "decimal-pad"; hint?: string }) {
  return <View style={styles.field}><Text style={styles.label}>{label}{unit ? ` (${unit})` : ""}</Text><TextInput style={styles.input} value={value} onChangeText={onChangeText} keyboardType={keyboardType} placeholder={placeholder} placeholderTextColor="#afb1c2" />{hint ? <Text style={styles.hint}>{hint}</Text> : null}</View>;
}

function SelectField({ label, value, options, loading, onChange }: { label: string; value: string; options: string[]; loading: boolean; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false);
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><Pressable style={styles.selectInput} onPress={() => setVisible(true)} disabled={loading || options.length === 0}><Text style={styles.selectText}>{loading ? "Đang tải..." : value || "Chọn giá trị"}</Text><Text style={styles.selectArrow}>⌄</Text></Pressable><Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}><View style={styles.modalBackdrop}><View style={styles.modalCard}><Text style={styles.modalTitle}>{label}</Text><ScrollView showsVerticalScrollIndicator={false}>{options.map((option) => <Pressable key={option} style={[styles.option, option === value && styles.selectedOption]} onPress={() => { onChange(option); setVisible(false); }}><Text style={[styles.optionText, option === value && styles.selectedOptionText]}>{option}</Text></Pressable>)}</ScrollView><Pressable style={styles.modalClose} onPress={() => setVisible(false)}><Text style={styles.modalCloseText}>Đóng</Text></Pressable></View></View></Modal></View>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

function ResultCard({ result }: { result: PredictionResult }) {
  return <View style={styles.resultCard}><View style={styles.resultHeader}><View style={styles.resultIcon}><Text style={styles.resultIconText}>✓</Text></View><View style={styles.flex}><Text style={styles.resultKicker}>KẾT QUẢ ƯỚC TÍNH</Text><Text style={styles.resultTitle}>Giá tham khảo</Text></View></View><Text style={styles.resultLocation}>{result.city_name}</Text><Text style={styles.resultValue}>{Number(result.price).toLocaleString("pl-PL", { maximumFractionDigits: 2 })} {result.unit}</Text><View style={styles.resultDetails}><View style={styles.resultDetailBox}><Text style={styles.resultDetailLabel}>Giá / m²</Text><Text style={styles.resultDetailValue}>{Number(result.price_per_sqm).toLocaleString("pl-PL", { maximumFractionDigits: 2 })} PLN</Text></View><View style={styles.resultDetailBox}><Text style={styles.resultDetailLabel}>Tin tham chiếu</Text><Text style={styles.resultDetailValue}>{result.reference_count.toLocaleString("vi-VN")}</Text></View></View><Text style={styles.resultNote}>Giá thực tế có thể thay đổi theo pháp lý, nội thất, hướng nhà và thị trường.</Text></View>;
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
  card: { marginBottom: 16, padding: 18, borderWidth: 1, borderColor: "#e7e3f0", borderRadius: 8, backgroundColor: "#ffffff" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 22 },
  stepBadge: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: "#eeecfa" },
  stepText: { color: "#6258df", fontSize: 12, fontWeight: "800" },
  cardTitle: { color: "#504a70", fontSize: 18, fontWeight: "800" },
  cardSubtitle: { marginTop: 3, color: "#8b8da1", fontSize: 12 },
  field: { marginBottom: 16 },
  label: { marginBottom: 8, color: "#68627c", fontSize: 13, fontWeight: "700", lineHeight: 18 },
  input: { height: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: "#dedbe8", borderRadius: 6, color: "#25263a", backgroundColor: "#fbfaff", fontSize: 16 },
  selectInput: { minHeight: 50, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#dedbe8", borderRadius: 6, backgroundColor: "#fbfaff" },
  selectText: { flex: 1, color: "#4c4860", fontSize: 14 },
  selectArrow: { marginLeft: 10, color: "#756bc2", fontSize: 20 },
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
  metricGrid: { flexDirection: "row", gap: 9, marginTop: 17 },
  metric: { flex: 1, padding: 13, borderWidth: 1, borderColor: "#ebe7f3", borderRadius: 6, backgroundColor: "#ffffff" },
  metricLabel: { color: "#9b97a9", fontSize: 11 },
  metricValue: { marginTop: 6, color: "#57516f", fontSize: 16, fontWeight: "800" },
  waitingCard: { minHeight: 210, padding: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e7e3f0", borderRadius: 8, backgroundColor: "#ffffff" },
  waitingIcon: { marginBottom: 14, color: "#756bc2", fontSize: 30 },
  waitingTitle: { marginTop: 7, color: "#504a70", fontSize: 20, fontWeight: "800" },
  waitingText: { marginTop: 8, color: "#938fa3", fontSize: 13 },
  resultCard: { padding: 20, borderLeftWidth: 5, borderWidth: 1, borderColor: "#e7e3ef", borderLeftColor: "#756bc2", borderRadius: 8, backgroundColor: "#ffffff" },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 11 },
  resultIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: "#eeecfa" },
  resultIconText: { color: "#675eb0", fontSize: 20, fontWeight: "800" },
  resultKicker: { color: "#85889b", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  resultTitle: { marginTop: 5, color: "#292b42", fontSize: 18, fontWeight: "800" },
  resultLocation: { marginTop: 18, color: "#9994a5", fontSize: 13 },
  resultValue: { marginTop: 8, color: "#4f4a6b", fontSize: 31, fontWeight: "800" },
  resultDetails: { flexDirection: "row", gap: 10, marginTop: 17 },
  resultDetailBox: { flex: 1, padding: 12, borderRadius: 6, backgroundColor: "#f7f5fc" },
  resultDetailLabel: { color: "#85889b", fontSize: 11 },
  resultDetailValue: { marginTop: 5, color: "#303249", fontSize: 13, fontWeight: "800" },
  resultNote: { marginTop: 17, color: "#9a96a7", fontSize: 11, lineHeight: 17 },
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
