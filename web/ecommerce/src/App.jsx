import { useEffect, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_ECOMMERCE_API_URL || "http://127.0.0.1:5003";

const EMPTY_FORM = {
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

const NUMERIC_FIELDS = [
  { name: "Age", label: "Tuổi", min: 15, max: 81, step: "1", hint: "15 - 81 tuổi" },
  { name: "AnnualIncome", label: "Thu nhập hằng năm", unit: "USD", min: 10000, max: 250000, step: "0.01", hint: "10.000 - 250.000 USD" },
  { name: "NumberOfPurchases", label: "Số lần mua hàng", min: 0, max: 50, step: "1", hint: "Tổng số đơn đã mua" },
  { name: "TimeSpentOnWebsite", label: "Thời gian trên website", unit: "phút", min: 0, max: 100, step: "0.01", hint: "Thời gian của phiên gần nhất" },
  { name: "CustomerTenureYears", label: "Thâm niên khách hàng", unit: "năm", min: 0, max: 20, step: "0.01", hint: "Số năm gắn bó" },
  { name: "LastPurchaseDaysAgo", label: "Lần mua gần nhất", unit: "ngày trước", min: 0, max: 250, step: "1", hint: "Số ngày từ lần mua gần nhất" },
  { name: "DiscountsAvailed", label: "Số ưu đãi đã dùng", min: 0, max: 10, step: "1", hint: "0 - 10 ưu đãi" },
  { name: "SessionCount", label: "Số phiên truy cập", min: 1, max: 20, step: "1", hint: "Số phiên truy cập website" },
  { name: "CustomerSatisfaction", label: "Mức độ hài lòng", unit: "/ 5", min: 1, max: 5, step: "1", hint: "1 - 5 điểm" },
];

const SELECT_FIELDS = [
  { name: "Gender", label: "Giới tính", optionKey: "Gender" },
  { name: "ProductCategory", label: "Danh mục sản phẩm", optionKey: "ProductCategory" },
  { name: "PreferredDevice", label: "Thiết bị ưa thích", optionKey: "PreferredDevice" },
  { name: "Region", label: "Khu vực", optionKey: "Region" },
  { name: "ReferralSource", label: "Nguồn giới thiệu", optionKey: "ReferralSource" },
  { name: "CustomerSegment", label: "Phân khúc khách hàng", optionKey: "CustomerSegment" },
];

function App() {
  const [options, setOptions] = useState({});
  const [metrics, setMetrics] = useState({});
  const [form, setForm] = useState(EMPTY_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOptions() {
      try {
        const response = await fetch(`${API_URL}/api/options`);
        const data = await response.json();
        if (!response.ok) throw new Error("Không thể tải các lựa chọn cho biểu mẫu.");
        setOptions(data.options || {});
        setMetrics(data.metrics || {});
        setForm((current) => Object.fromEntries(Object.entries({ ...current, ...data.defaults }).map(([key, value]) => [key, String(value)])));
      } catch (requestError) {
        setError(requestError instanceof TypeError ? "Không kết nối được Ecommerce API. Hãy chạy python ecommerce_service.py trong D:\\Assignment2 rồi tải lại trang." : requestError.message || "Không kết nối được Ecommerce API.");
      } finally {
        setOptionsLoading(false);
      }
    }

    loadOptions();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setResult(null);
    setError("");
  };

  const predictPurchase = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);

    const payload = { ...form };
    NUMERIC_FIELDS.forEach((field) => { payload[field.name] = Number(form[field.name]); });
    payload.LoyaltyProgram = Number(form.LoyaltyProgram);
    const invalidNumber = NUMERIC_FIELDS.some((field) => {
      const value = payload[field.name];
      return !Number.isFinite(value) || value < field.min || value > field.max;
    });

    if (invalidNumber || !payload.Gender || !payload.ProductCategory || !payload.PreferredDevice || !payload.Region || !payload.ReferralSource || !payload.CustomerSegment) {
      setError("Vui lòng nhập đủ thông tin và kiểm tra lại các giá trị trong phạm vi hợp lệ.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/predict`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể dự đoán hành vi mua hàng.");
      setResult(data);
    } catch (requestError) {
      setError(requestError instanceof TypeError ? "Không kết nối được Ecommerce API. Hãy chạy python ecommerce_service.py trong D:\\Assignment2 rồi thử lại." : requestError.message || "Không kết nối được Ecommerce API.");
    } finally {
      setLoading(false);
    }
  };

  const metricValue = (name, fallback, digits = 2) => metrics[name] === undefined ? fallback : `${(Number(metrics[name]) * 100).toFixed(digits)}%`;
  const ready = !optionsLoading && Object.keys(options).length > 0;

  return (
    <div className="page">
      <header className="navbar">
        <div className="logo"><span className="logo-icon">↗</span><div><strong>PurchaseCheck AI</strong><span>Phân tích hành vi mua sắm</span></div></div>
        <span className="header-badge">MACHINE LEARNING</span>
      </header>

      <main className="container">
        <section className="hero"><span className="eyebrow">E-COMMERCE PURCHASE PREDICTION</span><h1>Khách hàng có khả năng mua không?</h1><p>Nhập hồ sơ và hành vi truy cập để nhận dự đoán từ mô hình AI.</p></section>

        <section className="main-card">
          <form className="patient-card" onSubmit={predictPurchase}>
            <div className="section-title"><span className="icon icon-purple">01</span><div><h2>Hồ sơ khách hàng</h2><p>Thông tin nền tảng của khách hàng</p></div></div>
            <fieldset className="field-section"><legend>Thông tin cá nhân</legend><div className="field-grid">{NUMERIC_FIELDS.slice(0, 1).map((field) => <Field key={field.name} field={field} value={form[field.name]} onChange={handleChange} />)}{SELECT_FIELDS.filter((field) => ["Gender", "Region", "CustomerSegment"].includes(field.name)).map((field) => <Field key={field.name} label={field.label} name={field.name} value={form[field.name]} options={options[field.optionKey]} loading={optionsLoading} onChange={handleChange} />)}</div></fieldset>
            <fieldset className="field-section"><legend>Hành vi mua sắm</legend><div className="field-grid">{NUMERIC_FIELDS.slice(1).map((field) => <Field key={field.name} field={field} value={form[field.name]} onChange={handleChange} />)}<Field label="Tham gia chương trình khách hàng thân thiết" name="LoyaltyProgram" value={form.LoyaltyProgram} options={["Không", "Có"]} optionValues={["0", "1"]} onChange={handleChange} /></div></fieldset>
            <fieldset className="field-section"><legend>Bối cảnh phiên truy cập</legend><div className="field-grid">{SELECT_FIELDS.filter((field) => ["ProductCategory", "PreferredDevice", "ReferralSource"].includes(field.name)).map((field) => <Field key={field.name} label={field.label} name={field.name} value={form[field.name]} options={options[field.optionKey]} loading={optionsLoading} onChange={handleChange} />)}</div></fieldset>
            {error && <div className="error" role="alert">{error}</div>}
            <div className="buttons"><button className="predict-button" type="submit" disabled={loading || !ready}><span>{loading ? "Đang phân tích..." : "Dự đoán mua hàng"}</span>{!loading && <span className="button-arrow">→</span>}</button><button className="reset-button" type="button" onClick={reset}>Đặt lại</button></div>
            <p className="disclaimer">Kết quả hỗ trợ tham khảo cho phân tích kinh doanh, không phải cam kết khách hàng sẽ mua.</p>
          </form>

          <aside className="model-column">
            <section className="model-card"><div className="model-intro"><span className="model-icon">✦</span><div><span className="card-kicker">MÔ HÌNH ĐANG SỬ DỤNG</span><h2>Logistic Regression</h2></div></div><p className="model-description">Mô hình phân loại nhị phân dựa trên hồ sơ, hành vi và bối cảnh mua sắm của khách hàng.</p><div className="metric-grid"><Metric label="Accuracy" value={metricValue("Accuracy", "91.43%")} /><Metric label="Precision" value={metricValue("Precision", "86.40%")} /><Metric label="Recall" value={metricValue("Recall", "94.37%")} /><Metric label="F1-score" value={metricValue("F1", "90.21%")} /></div><div className="model-note"><span>i</span><p>Đầu ra `1` là có khả năng mua, `0` là chưa có khả năng mua theo dữ liệu mô hình.</p></div></section>
            {result ? <ResultCard result={result} /> : <section className="result-card result-placeholder"><span className="model-icon">✦</span><span className="card-kicker">KẾT QUẢ DỰ ĐOÁN</span><h2>Chưa có kết quả</h2><p>Hoàn thành biểu mẫu để xem dự đoán mua hoặc không mua.</p></section>}
          </aside>
        </section>
      </main>
    </div>
  );
}

function Field({ field, label = field?.label, name = field?.name, value, onChange, options = [], optionValues, loading = false }) {
  const numeric = field && !field.options;
  return <label className="field"><span>{label} <b>*</b></span>{numeric ? <input name={name} type="number" value={value} min={field.min} max={field.max} step={field.step} placeholder="Nhập giá trị" onChange={onChange} required /> : <select name={name} value={value} onChange={onChange} disabled={loading || options.length === 0} required>{loading ? <option value="">Đang tải...</option> : options.map((option, index) => <option key={option} value={optionValues?.[index] ?? option}>{option}</option>)}</select>}{field?.hint && <small>{field.hint}</small>}</label>;
}

function Metric({ label, value }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function ResultCard({ result }) {
  const positive = result.prediction === 1;
  const probability = result.purchase_probability === null ? null : Math.round(result.purchase_probability * 100);
  return <section className={`result-card ${positive ? "danger-result" : "safe-result"}`}><div className="result-heading"><span className="result-icon">{positive ? "!" : "✓"}</span><div><span className="card-kicker">KẾT QUẢ PHÂN LOẠI</span><h2>{result.label}</h2></div></div><p className="result-status">{positive ? "Có khả năng mua" : "Chưa có khả năng mua"}</p><div className="score-block"><div className="score-value">{probability === null ? "--" : `${probability}%`}</div><div className="score-caption">Xác suất mô hình dự đoán khách hàng mua</div></div><div className="result-details"><div><span>Độ tin cậy</span><strong>{result.confidence === null ? "--" : `${Math.round(result.confidence * 100)}%`}</strong></div><div><span>Model</span><strong>{result.model}</strong></div></div></section>;
}

export default App;
