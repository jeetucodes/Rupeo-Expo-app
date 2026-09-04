# Privacy Policy for Rupeo

**Effective Date:** September 4, 2026  
**Application Name:** Rupeo  
**Package Name:** `com.innovatexlabs.paisewaise`  
**Publisher / Developer:** Innovatex Labs  
**Contact Email:** support@innovatexlabs.com  

---

## 1. Introduction
Innovatex Labs ("we", "us", or "our") develops and operates the **Rupeo** mobile application. This Privacy Policy outlines our principles and practices regarding the collection, use, storage, and protection of personal and financial information when you use Rupeo on Android or iOS devices.

By installing, registering, or using Rupeo, you consent to the collection and use of information in accordance with this policy.

---

## 2. Information We Collect

### A. Account & Profile Information
When you create an account or sign in to Rupeo:
- **Email & Display Name:** To identify your account, send transaction summaries, and sync preferences.
- **Profile Photo URL:** If signing in via Google Sign-In, to personalize your in-app profile.
- **Firebase Authentication UID:** A unique anonymized identifier assigned to your account.

### B. Financial & Bookkeeping Data
Rupeo is a personal financial ledger where you may manually input:
- **Transaction Records:** Income and expense amounts, transaction timestamps, payment modes (UPI, Cash, Debit/Credit Card, Net Banking).
- **Categories:** Custom or predefined tags (e.g. Food, Groceries, Shopping, Bills, Fuel, Health, Salary, Freelance).
- **Descriptions & Memos:** Custom notes attached to transactions.

### C. Receipt & Bill Images
- **Physical Bills & Receipts:** Photos you capture using your device camera or select from your gallery.
- **Storage:** Images are compressed and stored securely via Cloudinary CDN, linked strictly to your account.

### D. Recurring Bill Reminders
- **Utility & Subscription Reminders:** Service provider names (e.g. Jio, Airtel, Vi, BSNL, Rent, Tiffin/Mess, Milk Delivery, Maid Salary, Electricity, Water, WiFi, EMI), cycle days, amount due, and due dates.

### E. Device & Diagnostic Data
- **Device Model & OS Version:** To optimize UI performance and maintain platform compatibility.
- **Push Notification Tokens:** Managed through Expo Notifications to deliver scheduled bill alerts.
- **Crash Reports & Telemetry:** Aggregated and anonymized data to diagnose bugs and improve app stability.

---

## 3. What We DO NOT Collect
To protect your financial security:
- **No Bank Login Credentials:** Rupeo never asks for or stores your net-banking passwords, ATM PINs, UPI MPINs, or card CVVs.
- **No Direct Fund Custody:** Rupeo is not a payment gateway or wallet. It does not hold, transfer, or process actual money.
- **No Unauthorized SMS Scraping:** Rupeo does not read non-consented personal SMS messages.

---

## 4. Device Permissions & Justification

| Permission | Technical Name | Purpose |
| :--- | :--- | :--- |
| **Camera** | `android.permission.CAMERA` | Allows you to photograph physical bill receipts, invoices, or payment confirmations. |
| **Media / Photos** | `READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE` | Allows you to choose receipt photos from your gallery and save exported receipts/PDFs. |
| **Notifications** | `android.permission.POST_NOTIFICATIONS` | Delivers timely bill due date alerts, recharge expiration warnings, and budget notices. |

---

## 5. How We Use Your Information
We use your information exclusively to provide and improve the Rupeo service:
1. Synchronizing transactions and bill reminders across your registered devices.
2. Generating analytics: cash flow trends, spending waves, and category breakdowns.
3. Rendering authentic scannable ISO/IEC 16388 Code 39 barcode receipts for personal records.
4. Delivering AI-powered spending summaries and smart budget advice.
5. Managing optional VIP / Pro subscription features.

**We do NOT sell, rent, monetize, or trade your personal or financial records to data brokers or third-party advertisers.**

---

## 6. Third-Party Service Providers
We partner with certified third-party providers who process data strictly on our behalf:
- **Google Firebase (Google LLC):** Authentication, Cloud Firestore encrypted database, and backend infrastructure.
- **Google Mobile Ads (AdMob):** Displays banner and interstitial advertisements for free-tier users in compliance with Google Play Developer policies.
- **Cloudinary:** High-speed cloud image optimization and encrypted storage for bill receipts.
- **Google Play In-App Billing (`react-native-iap`):** Processes VIP/Pro subscription transactions securely without Rupeo ever handling credit card numbers.

---

## 7. Data Security & Storage
- **Encryption in Transit:** All network communication uses TLS 1.3 / HTTPS encryption.
- **User-Level Access Isolation:** Cloud Firestore security rules ensure that only your authenticated account can access or modify your records.
- **Local Sandbox Storage:** Offline cached data is stored securely in sandboxed application storage (`AsyncStorage`).

---

## 8. Data Ownership, Export & Deletion Rights
- **Data Ownership:** You own 100% of your financial information.
- **Data Export:** You can export your data at any time in CSV, PDF, or JSON backup formats via Settings.
- **Right to Erasure (Account Deletion):** You have the right to permanently erase your account at any time. Simply go to **Settings > Delete My Account**. This action permanently purges your profile, all transactions, recurring bills, notifications, and uploaded photos from our active servers.

---

## 9. Children's Privacy
Rupeo is intended for users aged 13 and older. We do not knowingly collect personal information from children under 13.

---

## 10. Changes to This Privacy Policy
We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Effective Date" at the top of this document and publishing the updated policy inside the app.

---

## 11. Contact Us
If you have any questions, concerns, or requests regarding this Privacy Policy, please contact our support team at:
- **Email:** support@innovatexlabs.com  
- **Publisher:** Innovatex Labs  
