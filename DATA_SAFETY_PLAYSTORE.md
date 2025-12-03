# Hobbiz — Data Safety Form (Play Store / App Store)

---

## Pre-submission Checklist (Critical)
Before submitting, please verify:
1.  **Unused Packages**: The project contains `expo-location` in `package.json` but does not appear to use it in the code. **Action**: Run `npm uninstall expo-location` in the `mobile-app` folder. If you keep it, Google may detect the `ACCESS_FINE_LOCATION` permission and require you to declare that you collect location data (even if you don't use it).
2.  **Privacy Policy URL**: You must host a Privacy Policy on a public URL (e.g., on your website or a generated page). This document can serve as the basis for that policy.
3.  **Account Deletion**: The app **does** have an in-app deletion feature (Settings -> Delete Account). Make sure to answer "Yes" to "Do you provide a way for users to delete their account within the app?".

---

## 1) Developer & App
- **Developer / Data Controller**: Individual based in Romania
- **Contact email**: team.hobbiz@gmail.com
- **App**: Hobbiz (mobile app)
- **Platform**: iOS / Android (Expo / React Native)

## 2) Overview — High level
- Hobbiz is a free community platform administered by an individual. No payments are processed in-app.
- **Primary purposes for data processing**: provide core app functionality (accounts, listings, messaging, reviews, favorites), push notifications, analytics & crash reporting, image hosting and delivery.

## 3) Data types collected (detailed)
For each data type we indicate: **Collected?** (Yes/No) — **Is it linked to you?** (Yes/No) — **Purpose**

### Personal info
- **Name** (first/last): **Yes** — Linked: **Yes** — Purpose: Account profile, display on listings/reviews.
- **Email address**: **Yes** — Linked: **Yes** — Purpose: Account login, communication, account recovery.
- **Phone number**: **Optional** — Linked: **Yes** — Purpose: Optional contact method for listings.
- **Address / Location (User Input)**: **Yes** — Linked: **Yes** — Purpose: Users manually select their county/city for listings (e.g., "Localitate"). This is not GPS data.
- **User IDs**: **Yes** — Linked: **Yes** — Purpose: Account management (Firebase/MongoDB IDs).

### User content
- **Listings** (title, description, category, images): **Yes** — Linked: **Yes** — Purpose: Core platform functionality.
- **Messages / conversations**: **Yes** — Linked: **Yes** — Purpose: In-app messaging between users.
- **Reviews and ratings**: **Yes** — Linked: **Yes** — Purpose: Community feedback and trust.
- **Photos / Videos**: **Yes** — Linked: **Yes** — Purpose: Profile photos, cover images, listing images.

### App Activity
- **App interactions**: **Yes** — Linked: **Yes** — Purpose: Favorites (saved listings), search history, last seen status.
- **Installed Apps**: **No**.

### Identifiers
- **Device identifiers** (unique IDs, advertising ID): **Yes** — Linked: **Yes** — Purpose: Analytics, push notifications, fraud prevention.
- **Push notification tokens**: **Yes** — Linked: **Yes** — Purpose: Deliver push notifications via Firebase Cloud Messaging (FCM).

### Usage & diagnostics
- **Crash logs**: **Yes** — Linked: **Yes** (via device ID) — Purpose: Debugging & stability (Firebase Crashlytics).
- **Performance diagnostics**: **Yes** — Linked: **Yes** — Purpose: App performance monitoring.

### Location
- **Approximate location**: **Yes** — Linked: **No** (or Yes if linked to ID) — Purpose: Analytics (IP-based) and security.
- **Precise Location (GPS)**: **No** — The app does not currently request or use precise GPS coordinates. Location is manually selected by the user. *(Note: Ensure `expo-location` is uninstalled if not used)*.

### Financial info
- **No** — The platform is free; no payment processors are used.

### Sensitive personal data
- **No** — We do not intentionally collect health, religion, race, biometric data, etc.

## 4) Is the data collected linked to the user? (summary)
- **Yes**. Most data (profile, listings, messages, activity) is linked to the user's account to provide the service.
- Analytics data may be linked to device identifiers or user IDs to track user journeys and issues.

## 5) How data is collected
- **Directly from users**: Account creation, posting listings, sending messages, writing reviews, updating profile, adding favorites.
- **Automatically**: Device info, IP address, push tokens, crash logs, usage analytics.
- **Third-party integrations**: Google OAuth (sign-in), Cloudinary (images), Firebase (notifications/analytics).

## 6) Third parties and data sharing
We do not sell personal data. We share data with third-party service providers who process data on our behalf:
- **Firebase (Google)**:
  - *Firebase Cloud Messaging (FCM)*: Push notifications.
  - *Firebase Analytics / Crashlytics*: App analytics & crash reporting.
- **Cloudinary**: Image hosting, transformation, and delivery for user-uploaded images.
- **Render.com**: Backend hosting — processes and stores data.
- **Google (OAuth)**: Authentication data when users choose Google login.
- **MongoDB Atlas** (if applicable): Database hosting.

## 7) Data usage purposes (Play Console categories)
- **App functionality**: Account management, listings, messaging, reviews, favorites.
- **Analytics**: Improve app behavior, crash reporting, usage trends.
- **Developer Communications**: Notifications about account activity.

## 8) Data retention
- **Account data**: Retained while account is active. Deleted upon request (typically within 30 days).
- **Listings/Messages**: Deleted when account is deleted or manually removed by user.
- **Analytics**: Retained for a limited period (e.g., 14-26 months) in aggregated form.

## 9) Security practices
- **Encryption in transit**: Yes (HTTPS/TLS) for all API calls.
- **Encryption at rest**: Passwords hashed (bcrypt). Database and storage providers use standard encryption.
- **Authentication**: JWT (JSON Web Tokens) for session management.

## 10) User controls & opt-out
- **Account Deletion**: **Yes**. Users can delete their account directly within the app (Settings -> Delete Account).
- **Push Notifications**: Can be disabled in device settings.
- **Analytics**: Users can opt-out via device settings (Advertising ID) or by contacting support.

## 11) Children
- The app is not intended for children under 16.

## 12) Minimal entries for Google Play "Data Safety" form
(Use these as short answers while filling the Play Console)

- **Data types collected**:
  - **Name, Email, User IDs, Phone** (Optional).
  - **Address** (User-selected city/county).
  - **Photos/Videos** (Uploads).
  - **Messages** (In-app).
  - **App Activity** (Page views, favorites).
  - **Device or other IDs**.
  - **Crash logs, Diagnostics**.
- **Is data shared with third parties?** Yes (Service providers: Firebase, Cloudinary, Render).
- **Is data collected for ads?** No.
- **Is user data encrypted in transit?** Yes.
- **Can users request deletion?** Yes.

## 13) Recommended short summary for store listing
Hobbiz is a free community platform. We collect data you provide (profile, listings, messages, reviews) and device identifiers to enable app functionality and improve performance. We use third-party services like Firebase (for notifications and analytics) and Cloudinary (for images). We do not sell your personal data. You can request account deletion at any time directly from the app settings.

