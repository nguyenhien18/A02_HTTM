import { useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5001/api/predict";

const DEFAULT_FORM = {
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

const MAIN_FIELDS = [
  { name: "BMI", label: "BMI", type: "number", min: 1, max: 100, step: 0.1, hint: "1 - 100" },
  {
    name: "GenHlth",
    label: "Sức khỏe tổng quát",
    options: ["1 - Rất tốt", "2 - Tốt", "3 - Khá", "4 - Kém", "5 - Rất kém"],
  },
  {
    name: "Age",
    label: "Nhóm tuổi",
    options: Array.from({ length: 13 }, (_, index) => `Nhóm ${index + 1}`),
    hint: "Giá trị 1 - 13 theo dataset",
  },
  { name: "MentHlth", label: "Số ngày sức khỏe tâm thần kém", type: "number", min: 0, max: 30, hint: "0 - 30 ngày" },
  { name: "PhysHlth", label: "Số ngày sức khỏe thể chất kém", type: "number", min: 0, max: 30, hint: "0 - 30 ngày" },
  { name: "Education", label: "Học vấn", options: Array.from({ length: 6 }, (_, index) => `Mức ${index + 1}`), hint: "Giá trị 1 - 6 theo dataset" },
  { name: "Income", label: "Thu nhập", options: Array.from({ length: 8 }, (_, index) => `Mức ${index + 1}`), hint: "Giá trị 1 - 8 theo dataset" },
  { name: "Sex", label: "Giới tính", options: ["Nữ", "Nam"], values: [0, 1] },
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
];

function App() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);

    const payload = Object.fromEntries(
      Object.entries(form).map(([name, value]) => [name, Number(value)])
    );

    if (Object.values(form).some((value) => value === "" || !Number.isFinite(Number(value)))) {
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
      setError(requestError.message || "Không kết nối được máy chủ Flask.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(DEFAULT_FORM);
    setResult(null);
    setError("");
  };

  return (
    <div className="page">
      <header className="navbar">
        <div className="logo">
          <span className="logo-icon">+</span>
          <div>
            <strong>HealthCheck AI</strong>
            <span>Sàng lọc sức khỏe</span>
          </div>
        </div>
        <span className="header-badge">MACHINE LEARNING</span>
      </header>

      <main className="container">
        <section className="hero">
          <span className="eyebrow">DIABETES PREDICTION</span>
          <h1>Kiểm tra nguy cơ tiểu đường</h1>
          <p>Nhập các chỉ số sức khỏe để nhận kết quả sàng lọc từ mô hình AI.</p>
        </section>

        <section className="main-card">
          <form className="patient-card" onSubmit={handleSubmit}>
            <div className="section-title">
              <span className="icon icon-purple">01</span>
              <div>
                <h2>Thông tin sức khỏe</h2>
                <p>Nhập các giá trị gần nhất của người cần kiểm tra</p>
              </div>
            </div>

            <fieldset className="field-section">
              <legend>Chỉ số và tình trạng</legend>
              <div className="field-grid">
                {MAIN_FIELDS.map((field) => (
                  <Field key={field.name} field={field} value={form[field.name]} onChange={handleChange} />
                ))}
              </div>
            </fieldset>

            <fieldset className="field-section">
              <legend>Bệnh sử và hành vi</legend>
              <div className="toggle-grid">
                {BINARY_FIELDS.map(([name, label]) => (
                  <BinaryField key={name} name={name} label={label} value={form[name]} onChange={handleChange} />
                ))}
              </div>
            </fieldset>

            {error && <div className="error" role="alert">{error}</div>}

            <div className="buttons">
              <button className="predict-button" type="submit" disabled={loading}>
                <span>{loading ? "Đang phân tích..." : "Dự đoán"}</span>
                {!loading && <span className="button-arrow">→</span>}
              </button>
              <button className="reset-button" type="button" onClick={handleReset}>Đặt lại</button>
            </div>
            <p className="disclaimer">Kết quả chỉ mang tính tham khảo và không thay thế chẩn đoán của nhân viên y tế.</p>
          </form>

          <aside className="model-column">
            <section className="model-card">
              <div className="model-intro">
                <span className="model-icon">✦</span>
                <div>
                  <span className="card-kicker">MÔ HÌNH ĐANG SỬ DỤNG</span>
                  <h2>Logistic Regression</h2>
                </div>
              </div>
              <p className="model-description">Mô hình phân loại nguy cơ tiểu đường dựa trên 21 đặc trưng sức khỏe và thói quen.</p>
              <div className="metric-grid">
                <Metric label="Loại bài toán" value="Phân loại" />
                <Metric label="Đầu vào" value="21 biến" />
                <Metric label="Đầu ra" value="0 hoặc 1" />
                <Metric label="Pipeline" value="Sẵn sàng" />
              </div>
              <div className="model-note"><span>i</span><p>Model được nạp từ pipeline đã huấn luyện trong notebook Assignment 2.</p></div>
            </section>

            {result ? <ResultCard result={result} /> : (
              <section className="result-card result-placeholder">
                <span className="model-icon">✦</span>
                <span className="card-kicker">KẾT QUẢ DỰ ĐOÁN</span>
                <h2>Chưa có kết quả</h2>
                <p>Hoàn thành biểu mẫu để xem kết quả từ model.</p>
              </section>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}

function Field({ field, value, onChange }) {
  return (
    <label className="field">
      <span>{field.label} <b>*</b></span>
      {field.options ? (
        <select name={field.name} value={value} onChange={onChange} required>
          {field.options.map((label, index) => <option key={label} value={field.values?.[index] ?? index + 1}>{label}</option>)}
        </select>
      ) : (
        <input name={field.name} type={field.type} value={value} min={field.min} max={field.max} step={field.step || 1} onChange={onChange} required />
      )}
      {field.hint && <small>{field.hint}</small>}
    </label>
  );
}

function BinaryField({ name, label, value, onChange }) {
  return (
    <label className="toggle-field">
      <span>{label} <b>*</b></span>
      <select name={name} value={value} onChange={onChange} required>
        <option value="0">Không</option>
        <option value="1">Có</option>
      </select>
    </label>
  );
}

function Metric({ label, value }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function ResultCard({ result }) {
  const positive = result.prediction === 1;
  return (
    <section className={`result-card ${positive ? "danger-result" : "safe-result"}`}>
      <div className="result-heading">
        <span className="result-icon">{positive ? "!" : "✓"}</span>
        <div>
          <span className="card-kicker">KẾT QUẢ SÀNG LỌC</span>
          <h2>{result.label}</h2>
        </div>
      </div>
      <p className="result-status">{positive ? "Cần theo dõi thêm" : "Nguy cơ hiện tại ở mức thấp hơn"}</p>
      <div className="result-details">
        <div><span>Điểm mô hình</span><strong>{result.probability_estimate !== undefined ? `${Math.round(result.probability_estimate * 100)}%` : "--"}</strong></div>
        <div><span>Model</span><strong>{result.model}</strong></div>
      </div>
      <p className="result-disclaimer">Điểm mô hình không phải xác suất y khoa đã được hiệu chỉnh. Hãy trao đổi với bác sĩ để có đánh giá chính xác.</p>
    </section>
  );
}

export default App;
