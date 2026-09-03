import { useEffect, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_HOUSE_API_URL || "http://127.0.0.1:5002";

const EMPTY_FORM = {
  city_name: "",
  offer_type: "Private",
  floor: "2",
  area: "80",
  rooms: "3",
  offer_type_of_building: "Housing Block",
  market: "aftermarket",
  month: "March",
};

const NUMERIC_FIELDS = [
  { name: "area", label: "Diện tích", unit: "m²", placeholder: "Ví dụ: 80", min: 1, max: 399000, step: "0.01", hint: "Đơn vị: m²" },
  { name: "rooms", label: "Số phòng", placeholder: "Ví dụ: 3", min: 1, max: 20, step: "1", hint: "Số phòng trong căn nhà" },
  { name: "floor", label: "Tầng", placeholder: "Ví dụ: 2", min: -1, max: 20, step: "1", hint: "Có thể nhập -1 cho tầng hầm" },
];

const SELECT_FIELDS = [
  { name: "offer_type", label: "Loại người đăng", optionKey: "offer_types" },
  { name: "offer_type_of_building", label: "Loại tòa nhà", optionKey: "building_types" },
  { name: "market", label: "Thị trường", optionKey: "markets" },
  { name: "month", label: "Tháng đăng tin", optionKey: "months" },
];

function App() {
  const [options, setOptions] = useState({ cities: [], offer_types: [], building_types: [], markets: [], months: [], defaults: {} });
  const [form, setForm] = useState(EMPTY_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState("");
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    async function loadOptions() {
      try {
        const response = await fetch(`${API_URL}/api/options`);
        const data = await response.json();
        if (!response.ok) throw new Error("Không thể tải danh sách lựa chọn.");
        setOptions(data);
        setForm((current) => ({
          ...current,
          city_name: data.cities.includes("Warszawa") ? "Warszawa" : data.cities[0] || "",
          ...data.defaults,
        }));
      } catch (requestError) {
        setOptionsError(requestError.message || "Không tải được dữ liệu lựa chọn.");
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
    setForm((current) => ({ ...EMPTY_FORM, city_name: current.city_name }));
    setResult(null);
    setError("");
  };

  const predictPrice = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);

    const payload = {
      ...form,
      area: Number(form.area),
      rooms: Number(form.rooms),
      floor: Number(form.floor),
    };
    const validNumbers = Number.isFinite(payload.area) && payload.area >= 1 && payload.area <= 399000
      && Number.isFinite(payload.rooms) && payload.rooms >= 1 && payload.rooms <= 20
      && Number.isFinite(payload.floor) && payload.floor >= -1 && payload.floor <= 20;

    if (!payload.city_name || !validNumbers) {
      setError("Vui lòng chọn thành phố và nhập các thông số trong phạm vi hợp lệ.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể dự đoán giá nhà.");
      setResult(data);
    } catch (requestError) {
      setError(requestError.message || "Không kết nối được House API.");
    } finally {
      setLoading(false);
    }
  };

  const metrics = options.metrics || {};
  const canPredict = !optionsLoading && options.cities.length > 0;

  return (
    <div className="page">
      <main className="card">
        <header className="header">
          <div className="brand-row">
            <div className="brand-mark">⌂</div>
            <div><strong>HomeValue AI</strong><span>Ước tính bất động sản</span></div>
          </div>
          <span className="eyebrow">HOUSE PRICE PREDICTION</span>
          <h1>Ước tính giá ngôi nhà của bạn</h1>
          <p>Nhập thông tin cơ bản để nhận mức giá tham khảo từ mô hình Machine Learning.</p>
          <div className="quick-facts">
            <span><b>Model</b> Random Forest</span>
            <span><b>Dữ liệu</b> 62.818 tin đăng</span>
            <span><b>Đơn vị</b> PLN</span>
          </div>
        </header>

        {optionsError && <div className="notice error-notice" role="alert">{optionsError}</div>}

        <div className="content-grid">
          <form onSubmit={predictPrice}>
            <section className="form-section">
              <SectionHeading number="01" title="Vị trí bất động sản" subtitle="Chọn thành phố trong dữ liệu huấn luyện" />
              <Field label="Tỉnh / Thành phố" name="city_name" value={form.city_name} onChange={handleChange} options={options.cities} loading={optionsLoading} />
            </section>

            <section className="form-section property-section">
              <SectionHeading number="02" title="Thông tin căn nhà" subtitle="Nhập các thông số chính của tin đăng" />
              <div className="grid">
                {NUMERIC_FIELDS.map((field) => <Field key={field.name} {...field} value={form[field.name]} onChange={handleChange} />)}
                {SELECT_FIELDS.map((field) => <Field key={field.name} label={field.label} name={field.name} value={form[field.name]} onChange={handleChange} options={options[field.optionKey]} loading={optionsLoading} />)}
              </div>
            </section>

            {error && <div className="notice error-notice" role="alert">{error}</div>}
            <div className="actions">
              <button className="primary-button" type="submit" disabled={loading || !canPredict}>
                <span>{loading ? "Đang phân tích..." : "Dự đoán giá"}</span>{!loading && <span className="button-arrow">→</span>}
              </button>
              <button className="secondary-button" type="button" onClick={reset}>Đặt lại</button>
            </div>
            <p className="disclaimer">Kết quả chỉ mang tính tham khảo, không thay thế định giá chuyên môn.</p>
          </form>

          <section className={`result ${result ? "has-result" : ""}`} aria-live="polite">
            <div className="result-model">
              <div><span className="result-kicker">MÔ HÌNH ĐANG SỬ DỤNG</span><h2>Random Forest</h2></div>
              <span className="result-icon">✦</span>
            </div>
            <div className="model-metrics">
              <div><span>R² trên tập test</span><strong>{metrics.R2 ? Number(metrics.R2).toFixed(4) : "0.7868"}</strong></div>
              <div><span>RMSE</span><strong>{metrics.RMSE ? `${Math.round(metrics.RMSE).toLocaleString("vi-VN")} PLN` : "100.123 PLN"}</strong></div>
            </div>
            {result ? (
              <div className="price-result">
                <span className="result-kicker">KẾT QUẢ ƯỚC TÍNH</span>
                <p>Giá tham khảo tại {result.city_name}</p>
                <strong>{Number(result.price).toLocaleString("pl-PL", { maximumFractionDigits: 2 })} {result.unit}</strong>
                <div className="price-meta">
                  <span>Giá ước tính / m² <b>{Number(result.price_per_sqm).toLocaleString("pl-PL", { maximumFractionDigits: 2 })} PLN</b></span>
                  <span>Dữ liệu tham chiếu <b>{result.reference_count.toLocaleString("vi-VN")} tin</b></span>
                </div>
              </div>
            ) : (
              <div className="empty-result">
                <span className="empty-result-icon">⌁</span>
                <h2>Kết quả sẽ hiển thị tại đây</h2>
                <p>Hoàn thành thông tin bên trái và chọn “Dự đoán giá” để xem mức giá tham khảo.</p>
              </div>
            )}
            <p className="result-note">Giá thực tế có thể thay đổi theo pháp lý, nội thất, hướng nhà và thị trường.</p>
          </section>
        </div>
      </main>
    </div>
  );
}

function SectionHeading({ number, title, subtitle }) {
  return <div className="section-heading"><span className="section-number">{number}</span><div><h2>{title}</h2><p>{subtitle}</p></div></div>;
}

function Field({ label, unit, name, value, onChange, placeholder, min, max, step, hint, options = [], loading = false }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}{unit && <span> ({unit})</span>}</label>
      {options.length > 0 || loading ? (
        <select id={name} name={name} value={value} onChange={onChange} disabled={loading || options.length === 0}>
          {loading ? <option value="">Đang tải...</option> : options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <input id={name} type="number" name={name} value={value} onChange={onChange} placeholder={placeholder} min={min} max={max} step={step} inputMode="decimal" />
      )}
      {hint && <small>{hint}</small>}
    </div>
  );
}

export default App;
