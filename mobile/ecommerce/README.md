# E-commerce Purchase Prediction - Mobile

## Chay backend

Mo PowerShell tai `D:\Assignment2`:

```powershell
python ecommerce_service.py
```

API chay tai `http://127.0.0.1:5003`.

## Chay Android Emulator

Mo PowerShell khac:

```powershell
cd D:\Assignment2\mobile\ecommerce
npm.cmd install
npm.cmd start
```

Trong cua so Expo, bam `a` de mo app tren Android Emulator.

Android Emulator truy cap may tinh qua `http://10.0.2.2:5003`.

Neu dung dien thoai that, dat bien moi truong truoc khi chay:

```powershell
$env:EXPO_PUBLIC_API_URL = "http://DIA_CHI_IP_MAY_TINH:5003"
npm.cmd start
```

## Chuc nang

- Nhap 16 dac trung cua bo du lieu customerData.csv.
- Chon gia tri phan loai bang hop thoai tren mobile.
- Goi pipeline Logistic Regression va hien thi ket qua co kha nang mua/chua co kha nang mua.
- Hien thi xac suat mua, do tin cay va metrics cua mo hinh.
