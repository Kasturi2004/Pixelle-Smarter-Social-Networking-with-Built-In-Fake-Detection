import math
import pickle
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="Pixelle Fake Profile Detector")

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "model"
MODEL_PATH = MODEL_DIR / "fake_profile_model.pkl"
DEFAULT_FEATURE_ORDER = [
    "profile pic",
    "nums/length username",
    "fullname words",
    "nums/length fullname",
    "name==username",
    "description length",
    "external URL",
    "private",
    "#posts",
    "#followers",
    "#follows",
    "profile_completeness",
]


class UserFeatures(BaseModel):
    profilePic: int = Field(default=0, ge=0, le=1)
    usernameDigitRatio: float = Field(default=0, ge=0)
    fullNameWords: int = Field(default=0, ge=0)
    fullNameDigitRatio: float = Field(default=0, ge=0)
    nameEqualsUsername: int = Field(default=0, ge=0, le=1)
    descriptionLength: int = Field(default=0, ge=0)
    externalUrl: int = Field(default=0, ge=0, le=1)
    isPrivate: int = Field(default=0, ge=0, le=1)
    numberOfPosts: int = Field(default=0, ge=0)
    followers: int = Field(default=0, ge=0)
    following: int = Field(default=0, ge=0)
    profileCompleteness: float = Field(default=0, ge=0, le=1)
    followerFollowingRatio: float = Field(default=0, ge=0)
    accountAgeDays: int = Field(default=0, ge=0)
    activityLevel: float = Field(default=0, ge=0, le=1)


class ModelArtifacts:
    def __init__(self, raw_object: Any):
        self.raw_object = raw_object
        self.model = raw_object
        self.scaler = None
        self.feature_order = DEFAULT_FEATURE_ORDER

        if isinstance(raw_object, dict):
            self.model = (
                raw_object.get("model")
                or raw_object.get("estimator")
                or raw_object.get("classifier")
                or raw_object
            )
            self.scaler = raw_object.get("scaler")
            self.feature_order = raw_object.get("feature_order", DEFAULT_FEATURE_ORDER)


def sigmoid(value: float) -> float:
    return 1 / (1 + math.exp(-value))


def calculate_rule_based_risk(features: UserFeatures) -> float:
    score = 0.18

    if features.profilePic == 0:
        score += 0.12

    if features.numberOfPosts == 0:
        score += 0.24
    elif features.numberOfPosts < 3:
        score += 0.14
    elif features.numberOfPosts > 15:
        score -= 0.08

    if features.followerFollowingRatio < 0.1:
        score += 0.26
    elif features.followerFollowingRatio < 0.4:
        score += 0.12
    elif features.followerFollowingRatio > 1.2:
        score -= 0.07

    if features.accountAgeDays < 7:
        score += 0.22
    elif features.accountAgeDays < 30:
        score += 0.1
    elif features.accountAgeDays > 180:
        score -= 0.08

    if features.externalUrl == 1:
        score += 0.06

    if features.profileCompleteness > 0.75:
        score -= 0.05

    score += (1 - features.activityLevel) * 0.18

    return round(max(0.0, min(score, 1.0)), 2)


def load_model() -> tuple[ModelArtifacts | None, str | None]:
    if not MODEL_PATH.exists():
        return None, f"Model file not found at {MODEL_PATH}"

    try:
        with MODEL_PATH.open("rb") as model_file:
            loaded_object = pickle.load(model_file)
        return ModelArtifacts(loaded_object), None
    except Exception as exc:  # pragma: no cover
        return None, str(exc)


MODEL_ARTIFACTS, MODEL_LOAD_ERROR = load_model()


def build_feature_row(features: UserFeatures, feature_order: list[str]) -> list[list[float]]:
    feature_map = build_feature_map(features)
    return [[feature_map[name] for name in feature_order]]


def build_feature_map(features: UserFeatures) -> dict[str, float]:
    feature_map = {
        "profilePic": float(features.profilePic),
        "usernameDigitRatio": float(features.usernameDigitRatio),
        "fullNameWords": float(features.fullNameWords),
        "fullNameDigitRatio": float(features.fullNameDigitRatio),
        "nameEqualsUsername": float(features.nameEqualsUsername),
        "descriptionLength": float(features.descriptionLength),
        "externalUrl": float(features.externalUrl),
        "isPrivate": float(features.isPrivate),
        "numberOfPosts": float(features.numberOfPosts),
        "followers": float(features.followers),
        "following": float(features.following),
        "profileCompleteness": float(features.profileCompleteness),
        "followerFollowingRatio": float(features.followerFollowingRatio),
        "accountAgeDays": float(features.accountAgeDays),
        "activityLevel": float(features.activityLevel),
        "profile pic": float(features.profilePic),
        "nums/length username": float(features.usernameDigitRatio),
        "fullname words": float(features.fullNameWords),
        "nums/length fullname": float(features.fullNameDigitRatio),
        "name==username": float(features.nameEqualsUsername),
        "description length": float(features.descriptionLength),
        "external URL": float(features.externalUrl),
        "private": float(features.isPrivate),
        "#posts": float(features.numberOfPosts),
        "#followers": float(features.followers),
        "#follows": float(features.following),
        "profile_completeness": float(features.profileCompleteness),
    }
    return feature_map


def extract_risk_from_model_prediction(model: Any, transformed_features: Any) -> float:
    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(transformed_features)[0]
        classes = list(getattr(model, "classes_", []))

        if classes and 1 in classes:
            positive_index = classes.index(1)
        elif classes and True in classes:
            positive_index = classes.index(True)
        else:
            positive_index = len(probabilities) - 1

        return float(probabilities[positive_index])

    if hasattr(model, "decision_function"):
        decision_score = model.decision_function(transformed_features)
        if hasattr(decision_score, "__len__"):
            decision_score = decision_score[0]
        return float(sigmoid(float(decision_score)))

    if hasattr(model, "predict"):
        prediction = model.predict(transformed_features)
        if hasattr(prediction, "__len__"):
            prediction = prediction[0]
        return float(prediction)

    raise ValueError("Loaded object does not support predict, predict_proba, or decision_function")


def predict_with_loaded_model(features: UserFeatures) -> float:
    if MODEL_ARTIFACTS is None:
        return calculate_rule_based_risk(features)

    feature_row = build_feature_row(features, MODEL_ARTIFACTS.feature_order)
    transformed_features = feature_row

    if MODEL_ARTIFACTS.scaler is not None:
        transformed_features = MODEL_ARTIFACTS.scaler.transform(feature_row)

    risk_score = extract_risk_from_model_prediction(MODEL_ARTIFACTS.model, transformed_features)
    return round(max(0.0, min(float(risk_score), 1.0)), 2)


@app.get("/")
def root():
    return {
        "message": "Pixelle ML service is running",
        "modelPath": str(MODEL_PATH),
        "modelLoaded": MODEL_ARTIFACTS is not None,
        "fallbackReason": MODEL_LOAD_ERROR,
    }


@app.post("/predict")
def predict(features: UserFeatures):
    try:
        risk_score = predict_with_loaded_model(features)
    except Exception:
        risk_score = calculate_rule_based_risk(features)

    return {
        "riskScore": risk_score,
        "isFake": risk_score >= 0.62,
    }
