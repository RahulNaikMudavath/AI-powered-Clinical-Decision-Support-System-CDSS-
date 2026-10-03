import os
import sys
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import (
    OneHotEncoder,
    StandardScaler,
    MultiLabelBinarizer,
    FunctionTransformer
)
from sklearn.impute import SimpleImputer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.metrics import classification_report, roc_auc_score

# Add backend to path so imports work cleanly
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(backend_dir))
import __main__
from app.utils.preprocessing import squeeze_column
__main__.squeeze_column = squeeze_column

data_dir = os.path.dirname(os.path.abspath(__file__))
model_dir = os.path.join(backend_dir, "models")
os.makedirs(model_dir, exist_ok=True)

csv_path = os.path.join(data_dir, "generated_data.csv")
print(f"Loading data from: {csv_path}")
df = pd.read_csv(csv_path).drop_duplicates()
df.columns = df.columns.str.strip().str.upper()
df.replace(r'^\s*$', np.nan, regex=True, inplace=True)
print(f"Dataset shape: {df.shape}")

numeric_features = [
    'AGE', 'CBP_LYMPHOCYTES', 'WBC', 'POLYMORPHS',
    'CRP', 'RFT_SERUM_CREATININE', 'SERUM_URIC_ACID',
    'BLOOD_UREA', 'CUE_PUS_CELLS', 'EPITHELIAL_CELLS', 'RBC'
]

for col in numeric_features:
    df[col] = pd.to_numeric(df[col], errors='coerce')

categorical_features = [
    'GENDER', 'DEPARTMENT',
    'CLASSIFICATION_OF_UTI', 'TYPE_OF_UTI',
    'SITE_OF_INFECTION', 'TYPE_OF_SAMPLE',
    'PROTEINS'
]

text_features = [
    'CHIEF_COMPLAINTS', 'COMORBIDITIES',
    'RISKFACTORS', 'SURGICAL_HISTORY',
    'SOCIAL_HISTORY', 'DIAGNOSIS'
]

numeric_pipeline = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

categorical_pipeline = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('encoder', OneHotEncoder(handle_unknown='ignore'))
])

text_transformers = []
for col in text_features:
    text_pipeline = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='')),
        ('to_string', FunctionTransformer(squeeze_column, validate=False)),
        ('tfidf', TfidfVectorizer(
            lowercase=True,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=2,
            max_df=0.9
        ))
    ])
    text_transformers.append((col, text_pipeline, [col]))

# ==========================================
# MODEL 1: Bacteria Type Prediction
# ==========================================
print("\n--- Training Model 1 (Bacteria Type) ---")
df['TYPE_OF_BACTERIA'] = df['TYPE_OF_BACTERIA'].str.strip().str.lower()
df['TARGET_M1'] = df['TYPE_OF_BACTERIA'].map({
    'gram negative': 0,
    'gram positive': 1
})

preprocessor_m1 = ColumnTransformer(
    transformers=[
        ('num', numeric_pipeline, numeric_features),
        ('cat', categorical_pipeline, categorical_features),
        *text_transformers
    ],
    remainder='drop'
)

model_1_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor_m1),
    ('classifier', RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        random_state=42
    ))
])

feature_columns_m1 = numeric_features + categorical_features + text_features
X_m1 = df[feature_columns_m1]
y_m1 = df['TARGET_M1']

X_train_m1, X_test_m1, y_train_m1, y_test_m1 = train_test_split(
    X_m1, y_m1, test_size=0.2, stratify=y_m1, random_state=42
)

model_1_pipeline.fit(X_train_m1, y_train_m1)
acc_m1 = model_1_pipeline.score(X_test_m1, y_test_m1)
print(f"Model 1 Test Accuracy: {acc_m1:.4f}")

# Train on full dataset for maximum deployment performance
model_1_pipeline.fit(X_m1, y_m1)
joblib.dump(model_1_pipeline, os.path.join(model_dir, "model_1_bacteria.pkl"))
print("Saved model_1_bacteria.pkl")

# ==========================================
# PREV ANTIBIOTICS ENCODING
# ==========================================
df['PREVIOUS_ANTIBIOTIC_USED'] = df['PREVIOUS_ANTIBIOTIC_USED'].fillna('')
df['PREV_ABX_LIST'] = df['PREVIOUS_ANTIBIOTIC_USED'].apply(
    lambda x: [i.strip() for i in str(x).split(';') if i.strip() != '']
)
prev_abx_mlb = MultiLabelBinarizer()
prev_abx_encoded = prev_abx_mlb.fit_transform(df['PREV_ABX_LIST'])
prev_abx_feature_cols = [f"PREV_ABX_{c}" for c in prev_abx_mlb.classes_]
prev_abx_df = pd.DataFrame(
    prev_abx_encoded,
    columns=prev_abx_feature_cols,
    index=df.index
)
df_with_abx = pd.concat([df, prev_abx_df], axis=1)
df_with_abx['TYPE_OF_BACTERIA_ENC'] = df['TARGET_M1']

joblib.dump(prev_abx_mlb, os.path.join(model_dir, "prev_abx_mlb.pkl"))
print("Saved prev_abx_mlb.pkl")

# ==========================================
# MODEL 2: Resistance Prediction
# ==========================================
print("\n--- Training Model 2 (Resistance) ---")
df_with_abx['RESISTANT'] = df_with_abx['RESISTANT'].fillna('')
df_with_abx['RESISTANT_LIST'] = df_with_abx['RESISTANT'].apply(
    lambda x: [i.strip() for i in str(x).split(';') if i.strip() != '']
)

mlb_m2 = MultiLabelBinarizer()
Y_m2 = mlb_m2.fit_transform(df_with_abx['RESISTANT_LIST'])
print(f"Resistant classes ({len(mlb_m2.classes_)}): {mlb_m2.classes_}")

preprocessor_m2 = ColumnTransformer(
    transformers=[
        ('num', numeric_pipeline, numeric_features),
        ('cat', categorical_pipeline, categorical_features),
        ('bacteria', 'passthrough', ['TYPE_OF_BACTERIA_ENC']),
        ('prev_abx', 'passthrough', prev_abx_feature_cols),
        *text_transformers
    ],
    remainder='drop'
)

model_2_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor_m2),
    ('classifier', MultiOutputClassifier(
        RandomForestClassifier(
            n_estimators=300,
            random_state=42,
            n_jobs=-1
        )
    ))
])

feature_columns_m2 = (
    numeric_features +
    categorical_features +
    ['TYPE_OF_BACTERIA_ENC'] +
    prev_abx_feature_cols +
    text_features
)
X_m2 = df_with_abx[feature_columns_m2]

model_2_pipeline.fit(X_m2, Y_m2)
joblib.dump(model_2_pipeline, os.path.join(model_dir, "model_2_resistance.pkl"))
joblib.dump(mlb_m2, os.path.join(model_dir, "model_2_resistance_mlb.pkl"))
print("Saved model_2_resistance.pkl and model_2_resistance_mlb.pkl")

# ==========================================
# MODEL 3: Sensitivity Prediction
# ==========================================
print("\n--- Training Model 3 (Sensitivity) ---")
df_with_abx['SENSITIVE'] = df_with_abx['SENSITIVE'].fillna('')
df_with_abx['SENSITIVE_LIST'] = df_with_abx['SENSITIVE'].apply(
    lambda x: [i.strip() for i in str(x).split(';') if i.strip() != '']
)

mlb_m3 = MultiLabelBinarizer()
Y_m3 = mlb_m3.fit_transform(df_with_abx['SENSITIVE_LIST'])
print(f"Sensitive classes ({len(mlb_m3.classes_)}): {mlb_m3.classes_}")

preprocessor_m3 = ColumnTransformer(
    transformers=[
        ('num', numeric_pipeline, numeric_features),
        ('cat', categorical_pipeline, categorical_features),
        ('bacteria', 'passthrough', ['TYPE_OF_BACTERIA_ENC']),
        ('prev_abx', 'passthrough', prev_abx_feature_cols),
        *text_transformers
    ],
    remainder='drop'
)

model_3_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor_m3),
    ('classifier', MultiOutputClassifier(
        RandomForestClassifier(
            n_estimators=300,
            random_state=42,
            n_jobs=-1
        )
    ))
])

feature_columns_m3 = (
    numeric_features +
    categorical_features +
    ['TYPE_OF_BACTERIA_ENC'] +
    prev_abx_feature_cols +
    text_features
)
X_m3 = df_with_abx[feature_columns_m3]

model_3_pipeline.fit(X_m3, Y_m3)
joblib.dump(model_3_pipeline, os.path.join(model_dir, "model_3_sensitivity.pkl"))
joblib.dump(mlb_m3, os.path.join(model_dir, "model_3_sensitive_mlb.pkl"))
print("Saved model_3_sensitivity.pkl and model_3_sensitive_mlb.pkl")
print("\nAll models trained and exported successfully!")
