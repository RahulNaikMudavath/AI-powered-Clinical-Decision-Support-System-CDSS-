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
from sklearn.metrics import classification_report, f1_score, hamming_loss

# Add backend to path so imports work cleanly
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(backend_dir))
import __main__
from app.utils.preprocessing import squeeze_column
__main__.squeeze_column = squeeze_column

def train_models():
    data_dir = os.path.dirname(os.path.abspath(__file__))
    model_dir = os.path.join(backend_dir, "models")
    os.makedirs(model_dir, exist_ok=True)

    csv_path = os.path.join(data_dir, "cleaned_clinical_uti_data.csv")
    print(f"Loading real clinical data from: {csv_path}", flush=True)
    df = pd.read_csv(csv_path).drop_duplicates()
    df.columns = df.columns.str.strip().str.upper()
    df.replace(r'^\s*$', np.nan, regex=True, inplace=True)
    print(f"Dataset shape: {df.shape}", flush=True)

    base_numeric_features = [
        'AGE', 'CBP_LYMPHOCYTES', 'WBC', 'POLYMORPHS',
        'CRP', 'RFT_SERUM_CREATININE', 'SERUM_URIC_ACID',
        'BLOOD_UREA', 'CUE_PUS_CELLS', 'EPITHELIAL_CELLS', 'RBC'
    ]

    for col in base_numeric_features:
        df[col] = pd.to_numeric(df[col], errors='coerce')

    # Clinical Biomarker Engineering
    df['NLR'] = df['POLYMORPHS'] / (df['CBP_LYMPHOCYTES'] + 0.1)
    df['ANC'] = (df['WBC'] * df['POLYMORPHS']) / 100.0
    df['ALC'] = (df['WBC'] * df['CBP_LYMPHOCYTES']) / 100.0
    df['PYURIA_RATIO'] = df['CUE_PUS_CELLS'] / (df['EPITHELIAL_CELLS'] + 0.1)
    df['UREA_CREAT_RATIO'] = df['BLOOD_UREA'] / (df['RFT_SERUM_CREATININE'] + 0.01)
    df['SII'] = (df['WBC'] * df['CRP']) / 1000.0
    df['IS_SEVERE'] = ((df['WBC'] > 12000) & (df['CRP'] > 20)).astype(int)
    df['IS_RENAL_IMP'] = (df['RFT_SERUM_CREATININE'] > 1.3).astype(int)

    # Cockcroft-Gault estimated Creatinine Clearance
    gender_is_female = df['GENDER'].astype(str).str.lower().str.startswith('f')
    weights = np.where(gender_is_female, 60.0, 70.0)
    sex_factor = np.where(gender_is_female, 0.85, 1.0)
    age_clean = df['AGE'].fillna(50)
    creat_clean = df['RFT_SERUM_CREATININE'].fillna(1.0).clip(lower=0.2)
    crcl = ((140.0 - age_clean) * weights * sex_factor) / (72.0 * creat_clean)
    df['ESTIMATED_CRCL'] = np.clip(crcl, 5.0, 200.0)

    numeric_features = base_numeric_features + [
        'NLR', 'ANC', 'ALC', 'PYURIA_RATIO', 'UREA_CREAT_RATIO',
        'SII', 'IS_SEVERE', 'IS_RENAL_IMP', 'ESTIMATED_CRCL'
    ]

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

    def build_text_transformers():
        transformers = []
        for col in text_features:
            text_pipeline = Pipeline(steps=[
                ('imputer', SimpleImputer(strategy='constant', fill_value='')),
                ('to_string', FunctionTransformer(squeeze_column, validate=False)),
                ('tfidf', TfidfVectorizer(
                    lowercase=True,
                    stop_words='english',
                    ngram_range=(1, 2),
                    min_df=1,
                    max_df=0.95
                ))
            ])
            transformers.append((col, text_pipeline, [col]))
        return transformers

    numeric_pipeline = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    categorical_pipeline = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('encoder', OneHotEncoder(handle_unknown='ignore'))
    ])

    # ==========================================
    # MODEL 1: Bacteria Type Prediction
    # ==========================================
    print("\n" + "="*50, flush=True)
    print("TRAINING MODEL 1: Bacteria Type Classification", flush=True)
    print("="*50, flush=True)

    df['TYPE_OF_BACTERIA_CLEAN'] = df['TYPE_OF_BACTERIA'].astype(str).str.strip().str.lower()
    df['TARGET_M1'] = df['TYPE_OF_BACTERIA_CLEAN'].map({
        'gram negative': 0,
        'gram positive': 1
    })

    df_m1 = df[df['TARGET_M1'].notna()].copy()
    print(f"Model 1 eligible cases: {len(df_m1)} (Gram Negative: {(df_m1['TARGET_M1']==0).sum()}, Gram Positive: {(df_m1['TARGET_M1']==1).sum()})", flush=True)

    preprocessor_m1 = ColumnTransformer(
        transformers=[
            ('num', numeric_pipeline, numeric_features),
            ('cat', categorical_pipeline, categorical_features),
            *build_text_transformers()
        ],
        remainder='drop'
    )

    model_1_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor_m1),
        ('classifier', RandomForestClassifier(
            n_estimators=250,
            max_depth=14,
            min_samples_split=3,
            class_weight='balanced_subsample',
            random_state=42,
            n_jobs=1
        ))
    ])

    feature_columns_m1 = numeric_features + categorical_features + text_features
    X_m1 = df_m1[feature_columns_m1]
    y_m1 = df_m1['TARGET_M1'].astype(int)

    X_train_m1, X_test_m1, y_train_m1, y_test_m1 = train_test_split(
        X_m1, y_m1, test_size=0.2, stratify=y_m1, random_state=42
    )

    model_1_pipeline.fit(X_train_m1, y_train_m1)
    acc_m1 = model_1_pipeline.score(X_test_m1, y_test_m1)
    y_pred_m1 = model_1_pipeline.predict(X_test_m1)
    print(f"Model 1 Holdout Test Accuracy: {acc_m1:.4f}", flush=True)
    print("Model 1 Classification Report:\n", classification_report(y_test_m1, y_pred_m1, target_names=['Gram Negative', 'Gram Positive']), flush=True)

    # Fit on all confirmed bacterial cases
    model_1_pipeline.fit(X_m1, y_m1)
    joblib.dump(model_1_pipeline, os.path.join(model_dir, "model_1_bacteria.pkl"))
    print("Saved model_1_bacteria.pkl", flush=True)

    # ==========================================
    # PREVIOUS ANTIBIOTICS ENCODING
    # ==========================================
    print("\n" + "="*50, flush=True)
    print("FITTING PREVIOUS ANTIBIOTIC ENCODER", flush=True)
    print("="*50, flush=True)

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
    df_with_abx['TYPE_OF_BACTERIA_ENC'] = df_with_abx['TARGET_M1'].fillna(0).astype(int)

    joblib.dump(prev_abx_mlb, os.path.join(model_dir, "prev_abx_mlb.pkl"))
    print(f"Saved prev_abx_mlb.pkl ({len(prev_abx_mlb.classes_)} antibiotic classes)", flush=True)

    # ==========================================
    # MODEL 2: Resistance Prediction
    # ==========================================
    print("\n" + "="*50, flush=True)
    print("TRAINING MODEL 2: Multi-Label Antimicrobial Resistance", flush=True)
    print("="*50, flush=True)

    df_with_abx['RESISTANT'] = df_with_abx['RESISTANT'].fillna('')
    df_with_abx['RESISTANT_LIST'] = df_with_abx['RESISTANT'].apply(
        lambda x: [i.strip() for i in str(x).split(';') if i.strip() != '']
    )

    all_res_drugs = [d for sublist in df_with_abx['RESISTANT_LIST'] for d in sublist]
    res_counts = pd.Series(all_res_drugs).value_counts()
    valid_res_classes = sorted(res_counts[res_counts >= 3].index.tolist())
    print(f"Clinically supported resistant antibiotics (count={len(valid_res_classes)}): {valid_res_classes}", flush=True)

    df_with_abx['FILTERED_RES_LIST'] = df_with_abx['RESISTANT_LIST'].apply(
        lambda lst: [d for d in lst if d in valid_res_classes]
    )

    mlb_m2 = MultiLabelBinarizer(classes=valid_res_classes)
    Y_m2 = mlb_m2.fit_transform(df_with_abx['FILTERED_RES_LIST'])

    preprocessor_m2 = ColumnTransformer(
        transformers=[
            ('num', numeric_pipeline, numeric_features),
            ('cat', categorical_pipeline, categorical_features),
            ('bacteria', 'passthrough', ['TYPE_OF_BACTERIA_ENC']),
            ('prev_abx', 'passthrough', prev_abx_feature_cols),
            *build_text_transformers()
        ],
        remainder='drop'
    )

    model_2_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor_m2),
        ('classifier', MultiOutputClassifier(
            RandomForestClassifier(
                n_estimators=150,
                max_depth=12,
                class_weight='balanced',
                random_state=42,
                n_jobs=1
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

    X_train_m2, X_test_m2, Y_train_m2, Y_test_m2 = train_test_split(
        X_m2, Y_m2, test_size=0.2, random_state=42
    )

    model_2_pipeline.fit(X_train_m2, Y_train_m2)
    Y_pred_m2 = model_2_pipeline.predict(X_test_m2)
    m2_micro_f1 = f1_score(Y_test_m2, Y_pred_m2, average='micro', zero_division=0)
    m2_macro_f1 = f1_score(Y_test_m2, Y_pred_m2, average='macro', zero_division=0)
    m2_hamming = hamming_loss(Y_test_m2, Y_pred_m2)
    print(f"Model 2 Test Micro-F1: {m2_micro_f1:.4f} | Macro-F1: {m2_macro_f1:.4f} | Hamming Loss: {m2_hamming:.4f}", flush=True)

    # Train on full dataset
    model_2_pipeline.fit(X_m2, Y_m2)
    joblib.dump(model_2_pipeline, os.path.join(model_dir, "model_2_resistance.pkl"))
    joblib.dump(mlb_m2, os.path.join(model_dir, "model_2_resistance_mlb.pkl"))
    print("Saved model_2_resistance.pkl and model_2_resistance_mlb.pkl", flush=True)

    # ==========================================
    # MODEL 3: Sensitivity Prediction
    # ==========================================
    print("\n" + "="*50, flush=True)
    print("TRAINING MODEL 3: Multi-Label Antimicrobial Susceptibility", flush=True)
    print("="*50, flush=True)

    df_with_abx['SENSITIVE'] = df_with_abx['SENSITIVE'].fillna('')
    df_with_abx['SENSITIVE_LIST'] = df_with_abx['SENSITIVE'].apply(
        lambda x: [i.strip() for i in str(x).split(';') if i.strip() != '']
    )

    all_sens_drugs = [d for sublist in df_with_abx['SENSITIVE_LIST'] for d in sublist]
    sens_counts = pd.Series(all_sens_drugs).value_counts()
    valid_sens_classes = sorted(sens_counts[sens_counts >= 3].index.tolist())
    print(f"Clinically supported sensitive antibiotics (count={len(valid_sens_classes)}): {valid_sens_classes}", flush=True)

    df_with_abx['FILTERED_SENS_LIST'] = df_with_abx['SENSITIVE_LIST'].apply(
        lambda lst: [d for d in lst if d in valid_sens_classes]
    )

    mlb_m3 = MultiLabelBinarizer(classes=valid_sens_classes)
    Y_m3 = mlb_m3.fit_transform(df_with_abx['FILTERED_SENS_LIST'])

    preprocessor_m3 = ColumnTransformer(
        transformers=[
            ('num', numeric_pipeline, numeric_features),
            ('cat', categorical_pipeline, categorical_features),
            ('bacteria', 'passthrough', ['TYPE_OF_BACTERIA_ENC']),
            ('prev_abx', 'passthrough', prev_abx_feature_cols),
            *build_text_transformers()
        ],
        remainder='drop'
    )

    model_3_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor_m3),
        ('classifier', MultiOutputClassifier(
            RandomForestClassifier(
                n_estimators=150,
                max_depth=12,
                class_weight='balanced',
                random_state=42,
                n_jobs=1
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

    X_train_m3, X_test_m3, Y_train_m3, Y_test_m3 = train_test_split(
        X_m3, Y_m3, test_size=0.2, random_state=42
    )

    model_3_pipeline.fit(X_train_m3, Y_train_m3)
    Y_pred_m3 = model_3_pipeline.predict(X_test_m3)
    m3_micro_f1 = f1_score(Y_test_m3, Y_pred_m3, average='micro', zero_division=0)
    m3_macro_f1 = f1_score(Y_test_m3, Y_pred_m3, average='macro', zero_division=0)
    m3_hamming = hamming_loss(Y_test_m3, Y_pred_m3)
    print(f"Model 3 Test Micro-F1: {m3_micro_f1:.4f} | Macro-F1: {m3_macro_f1:.4f} | Hamming Loss: {m3_hamming:.4f}", flush=True)

    # Train on full dataset
    model_3_pipeline.fit(X_m3, Y_m3)
    joblib.dump(model_3_pipeline, os.path.join(model_dir, "model_3_sensitivity.pkl"))
    joblib.dump(mlb_m3, os.path.join(model_dir, "model_3_sensitive_mlb.pkl"))
    print("Saved model_3_sensitivity.pkl and model_3_sensitive_mlb.pkl", flush=True)

    print("\n" + "="*50, flush=True)
    print("SUCCESS: All UTI AI Clinical Decision Models Trained on Real Clinical Data!", flush=True)
    print("="*50, flush=True)

if __name__ == '__main__':
    train_models()
