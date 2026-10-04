import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier, GradientBoostingClassifier, VotingClassifier

def run_evaluation():
    df = pd.read_csv('app/data/cleaned_clinical_uti_data.csv')
    df['TYPE_OF_BACTERIA_CLEAN'] = df['TYPE_OF_BACTERIA'].astype(str).str.strip().str.lower()
    df['TARGET_M1'] = df['TYPE_OF_BACTERIA_CLEAN'].map({'gram negative': 0, 'gram positive': 1})
    df = df[df['TARGET_M1'].notna()].copy()

    # Biomarkers
    df['NLR'] = df['POLYMORPHS'].fillna(70) / (df['CBP_LYMPHOCYTES'].fillna(20) + 0.1)
    df['ANC'] = df['WBC'].fillna(8000) * df['POLYMORPHS'].fillna(70) / 100.0
    df['ALC'] = df['WBC'].fillna(8000) * df['CBP_LYMPHOCYTES'].fillna(20) / 100.0
    df['PYURIA_RATIO'] = df['CUE_PUS_CELLS'].fillna(10) / (df['EPITHELIAL_CELLS'].fillna(5) + 0.1)
    df['UREA_CREAT_RATIO'] = df['BLOOD_UREA'].fillna(30) / (df['RFT_SERUM_CREATININE'].fillna(1.0) + 0.01)
    df['SII'] = df['WBC'].fillna(8000) * df['CRP'].fillna(10) / 1000.0
    df['IS_SEVERE'] = ((df['WBC'] > 12000) & (df['CRP'] > 20)).astype(int)
    df['IS_RENAL_IMP'] = (df['RFT_SERUM_CREATININE'] > 1.3).astype(int)

    gender_is_female = df['GENDER'].astype(str).str.lower().str.startswith('f')
    weights = np.where(gender_is_female, 60.0, 70.0)
    sex_factor = np.where(gender_is_female, 0.85, 1.0)
    age_clean = df['AGE'].fillna(50)
    creat_clean = df['RFT_SERUM_CREATININE'].fillna(1.0).clip(lower=0.2)
    crcl = ((140.0 - age_clean) * weights * sex_factor) / (72.0 * creat_clean)
    df['ESTIMATED_CRCL'] = np.clip(crcl, 5.0, 200.0)

    # Interaction terms
    df['PYURIA_X_NLR'] = df['PYURIA_RATIO'] * df['NLR']
    df['UREA_X_SII'] = df['UREA_CREAT_RATIO'] * df['SII']
    df['AGE_X_CRCL'] = df['AGE'].fillna(50) * df['ESTIMATED_CRCL']

    num_cols = [
        'AGE', 'CBP_LYMPHOCYTES', 'WBC', 'POLYMORPHS', 'CRP', 
        'RFT_SERUM_CREATININE', 'SERUM_URIC_ACID', 'BLOOD_UREA', 
        'CUE_PUS_CELLS', 'EPITHELIAL_CELLS', 'RBC',
        'NLR', 'ANC', 'ALC', 'PYURIA_RATIO', 'UREA_CREAT_RATIO', 
        'SII', 'IS_SEVERE', 'IS_RENAL_IMP', 'ESTIMATED_CRCL',
        'PYURIA_X_NLR', 'UREA_X_SII', 'AGE_X_CRCL'
    ]
    cat_cols = ['GENDER', 'DEPARTMENT', 'CLASSIFICATION_OF_UTI', 'TYPE_OF_UTI', 'SITE_OF_INFECTION', 'TYPE_OF_SAMPLE', 'PROTEINS']
    text_cols = ['CHIEF_COMPLAINTS', 'COMORBIDITIES', 'RISKFACTORS', 'SURGICAL_HISTORY', 'SOCIAL_HISTORY', 'DIAGNOSIS']

    transformers = [
        ('num', Pipeline([('imp', SimpleImputer(strategy='median')), ('scl', StandardScaler())]), num_cols),
        ('cat', Pipeline([('imp', SimpleImputer(strategy='most_frequent')), ('ohe', OneHotEncoder(handle_unknown='ignore'))]), cat_cols)
    ]
    for c in text_cols:
        transformers.append((c, Pipeline([('imp', SimpleImputer(strategy='constant', fill_value='')), ('ohe', OneHotEncoder(handle_unknown='ignore'))]), [c]))

    preprocessor = ColumnTransformer(transformers=transformers, remainder='drop')
    X = preprocessor.fit_transform(df)
    y = df['TARGET_M1'].values

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    rf = RandomForestClassifier(n_estimators=300, max_depth=14, min_samples_split=3, class_weight='balanced_subsample', random_state=42)
    et = ExtraTreesClassifier(n_estimators=300, max_depth=16, min_samples_split=3, class_weight='balanced', random_state=42)
    gb = GradientBoostingClassifier(n_estimators=200, learning_rate=0.06, max_depth=4, random_state=42)

    ensemble = VotingClassifier(
        estimators=[('rf', rf), ('et', et), ('gb', gb)],
        voting='soft',
        weights=[2, 1, 2]
    )

    oof_probs = np.zeros(len(y))
    for train_idx, test_idx in cv.split(X, y):
        ensemble.fit(X[train_idx], y[train_idx])
        oof_probs[test_idx] = ensemble.predict_proba(X[test_idx])[:, 1]

    oof_preds = (oof_probs >= 0.5).astype(int)
    overall_acc = accuracy_score(y, oof_preds)
    f1 = f1_score(y, oof_preds, average='weighted')
    roc = roc_auc_score(y, oof_probs)
    print(f"Ensemble Overall OOF 5-Fold Accuracy: {overall_acc*100:.2f}% | F1: {f1:.4f} | ROC-AUC: {roc:.4f}")

    print("\n--- CONFIDENCE-GATED SELECTIVE CLASSIFICATION ---")
    results_gating = []
    for thresh in [0.10, 0.15, 0.20, 0.22, 0.25, 0.30]:
        # High confidence means either very low (< thresh, i.e. Gram-Negative >= 1 - thresh)
        # or very high (> 1 - thresh, i.e. Gram-Positive >= 1 - thresh)
        conf_level = (1.0 - thresh) * 100
        mask = (oof_probs < thresh) | (oof_probs > (1.0 - thresh))
        n_eligible = mask.sum()
        pct_cohort = (n_eligible / len(y)) * 100
        acc_gated = accuracy_score(y[mask], (oof_probs[mask] >= 0.5).astype(int))
        f1_gated = f1_score(y[mask], (oof_probs[mask] >= 0.5).astype(int), average='weighted')
        print(f"Confidence >= {conf_level:.0f}%: {n_eligible}/{len(y)} patients ({pct_cohort:.1f}% of cohort) -> ACCURACY = {acc_gated*100:.2f}% | F1 = {f1_gated:.4f}")
        results_gating.append({
            'confidence_threshold': conf_level,
            'eligible_patients': int(n_eligible),
            'cohort_percentage': round(pct_cohort, 1),
            'selective_accuracy': round(acc_gated * 100, 2),
            'selective_f1': round(f1_gated, 4)
        })

if __name__ == '__main__':
    run_evaluation()
