# Assignment 2 - Diabetes

## 1. Chạy backend API

Mở PowerShell tại `D:\Assignment2`:

```powershell
pip install -r requirements.txt
python diabetes_service.py
```

Backend chạy tại `http://127.0.0.1:5001`.

## 2. Chạy web ReactJS

Mở PowerShell khác:

```powershell
cd D:\Assignment2\web\diabetes
npm.cmd install
npm.cmd run dev
```

Mở `http://127.0.0.1:5173`.

## 3. Chạy mobile React Native

```powershell
cd D:\Assignment2\mobile\diabetes
npm.cmd install
npm.cmd start
```

Quét QR bằng Expo Go hoặc chạy trên Android emulator. Android emulator dùng API mặc định `http://10.0.2.2:5001/api/predict`; thiết bị thật cần đặt biến `EXPO_PUBLIC_API_URL` trỏ tới IP máy chạy Flask.

## 4. API

- `GET /api/health`: kiểm tra model.
- `POST /api/predict`: nhận đủ 21 đặc trưng theo schema notebook Diabetes.

Kết quả chỉ mang tính tham khảo, không thay thế chẩn đoán y tế.
