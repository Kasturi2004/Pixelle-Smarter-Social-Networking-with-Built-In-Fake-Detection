# Pixelle

Pixelle is a simplified Instagram clone with a lightweight machine-learning style service that flags suspicious accounts.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- ML service: Python + FastAPI
- Service communication: REST API

## Features

- JWT-based registration and login
- Profile page with full name, bio, privacy flag, external URL, and profile picture
- Create image posts with captions
- Like and comment on posts
- Follow and unfollow users
- One-to-one direct messages with an inbox view
- Report suspicious accounts from profile and discover views
- Feed built from followed users
- Suspicious account badge powered by a Python scoring service

## Project structure

```text
Fake Profile Detector/
|-- backend/
|   |-- src/
|   |-- uploads/
|   `-- .env.example
|-- frontend/
|   |-- src/
|   `-- .env.example
|-- ml-service/
|   |-- model/
|   |   `-- fake_profile_model.pkl
|   `-- app/main.py
`-- README.md
```

## Run the backend

```bash
cd backend
npm install
npm run dev
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Backend defaults:

- API: `http://localhost:5000`
- MongoDB: `mongodb://127.0.0.1:27017/fake-profile-detector`

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Frontend default:

- App: `http://localhost:5173`

## Run the ML service

```bash
cd ml-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

ML default:

- API: `http://127.0.0.1:8000`
- Predict endpoint: `POST /predict`
- Model path: `ml-service/model/fake_profile_model.pkl`

## Evaluate the model

From the `ml-service` folder, run:

```bash
python evaluate_model.py
```

Optional arguments:

```bash
python evaluate_model.py --dataset data/Instagram_fake_profile_dataset.csv --model model/fake_profile_model.pkl --target fake
```

This prints:

- accuracy
- precision / recall / F1-score
- confusion matrix

## Example prediction payload

```json
{
  "profilePic": 1,
  "usernameDigitRatio": 0.2,
  "fullNameWords": 2,
  "fullNameDigitRatio": 0,
  "nameEqualsUsername": 0,
  "descriptionLength": 42,
  "externalUrl": 1,
  "isPrivate": 0,
  "numberOfPosts": 12,
  "followers": 120,
  "following": 80,
  "profileCompleteness": 1,
  "followerFollowingRatio": 1.5,
  "accountAgeDays": 180,
  "activityLevel": 0.45
}
```

Example response:

```json
{
  "riskScore": 0.76,
  "isFake": true
}
```

## Important notes

- Start MongoDB before the backend.
- Start the Python ML service before registering or updating profiles if you want live scoring from Python. If it is offline, the backend falls back to a built-in heuristic.
- Put your trained `.pkl` file at `ml-service/model/fake_profile_model.pkl`.
- The backend now collects richer dataset-style fields from the app: `fullName`, `bio`, `externalUrl`, `isPrivate`, `profilePic`, plus derived counts and ratios.
- The Python service supports both clean app feature names and dataset-like aliases such as `profile pic`, `external URL`, `#posts`, `#followers`, `#follows`, and `profile_completeness`.
- If your pickle does not include `feature_order`, the service defaults to the dataset-style order: `profile pic`, `nums/length username`, `fullname words`, `nums/length fullname`, `name==username`, `description length`, `external URL`, `private`, `#posts`, `#followers`, `#follows`, `profile_completeness`.
- If your pickle contains a dictionary such as `{ "model": ..., "scaler": ..., "feature_order": [...] }`, the service will use that automatically.
- Uploaded images are stored in `backend/uploads`.
- The suspicious badge is shown across feed, discover, and profile pages.
