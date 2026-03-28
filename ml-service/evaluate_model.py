import argparse
import csv
import pickle
from pathlib import Path
from typing import Any

from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_MODEL_PATH = BASE_DIR / "model" / "fake_profile_model.pkl"
DEFAULT_DATASET_PATH = BASE_DIR / "data" / "Instagram_fake_profile_dataset.csv"
DEFAULT_TARGET = "fake"
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


class ModelArtifacts:
    def __init__(self, raw_object: Any):
        self.raw_object = raw_object
        self.model = raw_object
        self.scaler = None
        self.feature_order = None

        if isinstance(raw_object, dict):
            self.model = (
                raw_object.get("model")
                or raw_object.get("estimator")
                or raw_object.get("classifier")
                or raw_object
            )
            self.scaler = raw_object.get("scaler")
            self.feature_order = raw_object.get("feature_order")


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Evaluate the Pixelle fake-profile model against a labeled CSV dataset."
    )
    parser.add_argument(
        "--dataset",
        default=str(DEFAULT_DATASET_PATH),
        help="Path to the labeled CSV dataset."
    )
    parser.add_argument(
        "--model",
        default=str(DEFAULT_MODEL_PATH),
        help="Path to the pickled model file."
    )
    parser.add_argument(
        "--target",
        default=DEFAULT_TARGET,
        help="Target column name in the CSV."
    )
    return parser.parse_args()


def load_model(model_path: Path) -> ModelArtifacts:
    with model_path.open("rb") as model_file:
        raw_object = pickle.load(model_file)
    return ModelArtifacts(raw_object)


def parse_numeric(value: str) -> float:
    if value is None:
        return 0.0

    normalized = value.strip()

    if normalized == "":
        return 0.0

    if normalized.lower() in {"true", "false"}:
        return 1.0 if normalized.lower() == "true" else 0.0

    return float(normalized)


def load_dataset(dataset_path: Path, target_column: str) -> tuple[list[dict[str, float]], list[int], list[str]]:
    with dataset_path.open("r", encoding="utf-8-sig", newline="") as dataset_file:
        reader = csv.DictReader(dataset_file)
        fieldnames = reader.fieldnames or []

        if target_column not in fieldnames:
            raise ValueError(f"Target column '{target_column}' was not found in the dataset.")

        feature_names = [column for column in fieldnames if column != target_column]
        rows = []
        targets = []

        for row in reader:
            rows.append({column: parse_numeric(row[column]) for column in feature_names})
            targets.append(int(parse_numeric(row[target_column])))

    return rows, targets, feature_names


def determine_feature_order(artifacts: ModelArtifacts, dataset_columns: list[str]) -> list[str]:
    if artifacts.feature_order:
        return artifacts.feature_order

    if all(feature_name in dataset_columns for feature_name in DEFAULT_FEATURE_ORDER):
        return DEFAULT_FEATURE_ORDER

    return dataset_columns


def build_feature_matrix(
    rows: list[dict[str, float]],
    feature_order: list[str]
) -> list[list[float]]:
    missing_columns = [
        feature_name for feature_name in feature_order if not all(feature_name in row for row in rows)
    ]

    if missing_columns:
        raise ValueError(
            "The dataset is missing one or more model features: "
            + ", ".join(sorted(set(missing_columns)))
        )

    return [[row[feature_name] for feature_name in feature_order] for row in rows]


def main() -> None:
    args = parse_arguments()
    dataset_path = Path(args.dataset)
    model_path = Path(args.model)

    artifacts = load_model(model_path)
    rows, targets, dataset_columns = load_dataset(dataset_path, args.target)
    feature_order = determine_feature_order(artifacts, dataset_columns)
    feature_matrix = build_feature_matrix(rows, feature_order)

    transformed_features = feature_matrix
    if artifacts.scaler is not None:
        transformed_features = artifacts.scaler.transform(feature_matrix)

    predictions = artifacts.model.predict(transformed_features)

    print("")
    print("Pixelle Model Evaluation")
    print(f"Dataset: {dataset_path}")
    print(f"Model: {model_path}")
    print(f"Rows evaluated: {len(targets)}")
    print(f"Features used: {', '.join(feature_order)}")
    print("")
    print(f"Accuracy: {accuracy_score(targets, predictions):.4f}")
    print("")
    print("Classification Report:")
    print(classification_report(targets, predictions, digits=4))
    print("Confusion Matrix:")
    print(confusion_matrix(targets, predictions))
    print("")
    print(
        "Note: if this CSV is the same data used for training, these numbers will look better "
        "than real-world performance."
    )


if __name__ == "__main__":
    main()
