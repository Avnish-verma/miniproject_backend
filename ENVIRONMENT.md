# Environment Configuration Guide: NOVA

---

## Configuration Keys Dictionary

| Variable Name | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `5000` | Port on which the HTTP server listens. |
| `NODE_ENV` | No | `development` | Runtime environment (`development` or `production`). |
| `MONGO_URI` / `URI` | **Yes** | `mongodb://localhost:27017/nova` | MongoDB connection string. |
| `JWT_ACCESS_SECRET` / `SECRET` | **Yes** | Min 32 character string | Secret used to sign short-lived access tokens. |
| `JWT_REFRESH_SECRET` | **Yes** | Min 32 character string | Secret used to sign 7-day session refresh tokens. |
| `JWT_FORGOT_SECRET` / `SECRET_FOR_FORGOT` | **Yes** | Min 32 character string | Secret used to sign 10-minute password reset tokens. |
| `CLIENT_URL` | No | `http://localhost:5173` | Trusted frontend origin for CORS and password reset emails. |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud identifier | Cloud name for client signed media uploads. |
| `CLOUDINARY_API_KEY` | No | Cloudinary key | API key for signed upload signatures. |
| `CLOUDINARY_API_SECRET` | No | Cloudinary secret | API secret used to generate HMAC-SHA256 signatures. |
| `EMAIL` | No | Gmail address | SMTP email address for OTP delivery. |
| `PASS` | No | App-specific password | SMTP application password. |
| `SMTP_HOST` | No | `smtp.gmail.com` | SMTP host server. |
| `SMTP_PORT` | No | `587` | SMTP port (587 for TLS, 465 for SSL). |
| `STUN_SERVER` | No | `stun:stun.l.google.com:19302` | STUN server for WebRTC ICE discovery. |
| `TURN_SERVER` | No | `turn:...` | TURN relay server for WebRTC symmetric NAT traversal. |
| `TURN_USERNAME` | No | TURN user | TURN credentials. |
| `TURN_PASSWORD` | No | TURN password | TURN credentials. |
