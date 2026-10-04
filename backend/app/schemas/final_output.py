from pydantic import BaseModel
from typing import List, Dict, Optional

# --------------------------
# Nested Models
# --------------------------

class LabResults(BaseModel):
    cbp_lymphocytes: float
    wbc: float
    polymorphs: float
    crp: float
    rft_serum_creatinine: float
    serum_uric_acid: float
    blood_urea: float
    cue_pus_cells: float
    epithelial_cells: float
    proteins: Optional[str] = None  # note: kept "proteins" to match your JSON
    rbc: float

class PatientDetails(BaseModel):
    age: float
    gender: str
    department: str
    chief_complaints: str
    comorbidities: Optional[str] = None
    riskfactors: Optional[str] = None   # lowercase as in JSON
    surgical_history: Optional[str] = None
    social_history: Optional[str] = None
    diagnosis: str
    classification_of_uti: str
    type_of_uti: str
    site_of_infection: str
    type_of_sample: str
    previous_antibiotic_used: Optional[str] = None
    lab_results: LabResults

class ExplainabilityFactor(BaseModel):
    feature: str
    value: str
    impact: str
    clinical_rationale: str

class Predictions(BaseModel):
    bacteria_type_prediction: str
    confidence_score: Optional[float] = None
    gram_negative_probability: Optional[float] = None
    gram_positive_probability: Optional[float] = None
    predicted_resistant_antibiotics: List[str]
    predicted_sensitive_antibiotics: List[str]
    resistant_probabilities: Optional[Dict[str, float]] = None
    sensitive_probabilities: Optional[Dict[str, float]] = None
    explainability_factors: Optional[List[ExplainabilityFactor]] = None
    estimated_crcl: Optional[float] = None
    ckd_stage: Optional[str] = None
    sirs_sepsis_risk: Optional[str] = None
    nlr_ratio: Optional[float] = None
    pyuria_index: Optional[float] = None
    confidence_tier: Optional[str] = None
    accuracy_guarantee: Optional[str] = None
    selective_action: Optional[str] = None

class AntibioticRecommendation(BaseModel):
    name: str
    dosage: str
    precautions: str
    explanation: str
    guideline_badge: Optional[str] = None
    renal_dose_status: Optional[str] = None
    safety_tier: Optional[str] = None

class PrescribedAntibiotics(BaseModel):
    recommended: List[AntibioticRecommendation]

class AntibioticHistoryDetails(BaseModel):
    background: str
    common_usage: str
    historical_success: str
    mechanism_of_action: str
    side_effects: str
    resistance_notes: str

class FinalResult(BaseModel):
    patient_index: int
    patient_details: PatientDetails
    predictions: Predictions
    prescribed_antibiotics: PrescribedAntibiotics
    antibiotic_history: Dict[str, AntibioticHistoryDetails]
    summary: str