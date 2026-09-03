# Assignment 2 - House Price

## Chạy backend

Mở PowerShell tại `D:\Assignment2`:

```powershell
python house_service.py
```

House API chạy tại `http://127.0.0.1:5002`.

## Chạy web ReactJS

Mở PowerShell khác:

```powershell
cd D:\Assignment2\web\house
npm.cmd install
npm.cmd run dev -- --port 5174
```

Mở `http://127.0.0.1:5174`.

## Chạy mobile React Native

```powershell
cd D:\Assignment2\mobile\house
npm.cmd install
npm.cmd start -- --port 8082
```

Quét QR bằng Expo Go hoặc nhấn `a` để chạy Android Emulator. Android Emulator gọi API qua `http://10.0.2.2:5002`.

## API

- `GET /api/health`: kiểm tra model và metrics.
- `GET /api/options`: tải danh sách thành phố và các lựa chọn.
- `POST /api/predict`: dự đoán giá từ thông tin căn nhà.

Model sử dụng `Random Forest` và artifact `models/house_price_pipeline.joblib`.
