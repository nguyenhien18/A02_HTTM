# Assignment 2 - E-commerce Purchase Prediction

## Chay backend

Mo PowerShell tai `D:\Assignment2`:

```powershell
python ecommerce_service.py
```

E-commerce API chay tai `http://127.0.0.1:5003`.

## Chay web ReactJS

Mo PowerShell khac:

```powershell
cd D:\Assignment2\web\ecommerce
npm.cmd install
npm.cmd run dev -- --port 5175
```

Mo `http://127.0.0.1:5175`.

## Chuc nang

- Nhap 16 dac trung dung voi pipeline da train tu `models/ecommerce_purchase_pipeline.joblib`.
- Chon cac gia tri phan loai tu danh sach do API cung cap.
- Du doan khach hang co kha nang mua hay chua co kha nang mua.
- Hien thi xac suat mua, do tin cay va cac metrics cua mo hinh.

## API

- `GET /api/health`: kiem tra API, model va metrics.
- `GET /api/options`: lay danh sach lua chon, gia tri mac dinh va metrics.
- `POST /api/predict`: du doan voi 16 truong dau vao.

Model hien tai la `Logistic Regression`, duoc train tren du lieu `data/ecommerce/customerData.csv`.
