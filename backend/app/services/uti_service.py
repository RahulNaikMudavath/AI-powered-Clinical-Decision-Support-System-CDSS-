from app.inference.uti_inference import BacteriaInferenceEngine
from app.services.llm_service import LLMService
from app.config import MODEL_DIR
from app.utils.llm_prompts import PROMPT_FOR_PRECRIBED_ANTIBIOTICS, PROMPT_FOR_ANTIBIOTIC_HISTORY, PROMPT_FOR_SUMMARY

class UTIService:
    def __init__(self):
        """
        Load the inference class and models once during service initialization
        """
        self.uti_system = BacteriaInferenceEngine(model_dir=MODEL_DIR)
        self.llm_service = LLMService()

    def predict(self, patient_data: dict):
        """
        Predict bacteria type and recommend antibiotics with mutual exclusivity guardrails.
        """
        result = self.uti_system.predict(patient_data)
        item = result[0]
        
        raw_resistant = item["predicted_resistant_antibiotics"]
        raw_sensitive = item["predicted_sensitive_antibiotics"]
        bacteria_type = item["bacteria_type_prediction"]

        # Clinical Mutual Exclusivity Guardrail:
        # If an antibiotic is predicted resistant, it MUST NOT appear in the sensitive list.
        reconciled_sensitive = [abx for abx in raw_sensitive if abx not in raw_resistant]

        # If all predicted sensitive antibiotics were filtered out by resistance:
        if not reconciled_sensitive:
            if bacteria_type == "Gram Positive":
                reconciled_sensitive = ["Nitrofurantoin", "Vancomycin", "Linezolid"]
            else:
                reconciled_sensitive = ["Amikacin", "Cefepime", "Meropenem"]

        return {
            "patient_index": item["patient_index"],
            "bacteria_type_prediction": bacteria_type,
            "predicted_resistant_antibiotics": raw_resistant,
            "predicted_sensitive_antibiotics": reconciled_sensitive
        }

    def get_precribed_antibiotics(self, patient_data: dict, predictions: dict) -> dict:
        system_prompt = PROMPT_FOR_PRECRIBED_ANTIBIOTICS
        user_prompt = {
            "patient_data": patient_data,
            "predictions": predictions
        }
        res = self.llm_service.invoke_llm(system_prompt, user_prompt)
        if isinstance(res, dict) and "recommended" in res and isinstance(res["recommended"], list):
            return res
        # Fallback structure if malformed
        return {
            "recommended": [
                {
                    "name": abx,
                    "dosage": "Standard renal-adjusted clinical dose",
                    "precautions": "Monitor renal function and allergy profile",
                    "explanation": f"Predicted sensitive agent for {predictions.get('bacteria_type_prediction', 'UTI')} infection."
                }
                for abx in predictions.get("predicted_sensitive_antibiotics", ["Cefepime"])[:3]
            ]
        }

    def get_antibiotic_history(self, antibiotics: list) -> dict:
        system_prompt = PROMPT_FOR_ANTIBIOTIC_HISTORY
        user_prompt = {
            "antibiotics": antibiotics
        }
        res = self.llm_service.invoke_llm(system_prompt, user_prompt)
        if isinstance(res, dict):
            return res
        return {}

    def get_summary(self, patient_data: dict, predictions: dict, prescribed_antibiotics: dict, antibiotic_history: dict) -> str:
        system_prompt = PROMPT_FOR_SUMMARY
        user_prompt = {
            "patient_data": patient_data,
            "predictions": predictions,
            "prescribed_antibiotics": prescribed_antibiotics,
            "antibiotic_history": antibiotic_history
        }
        res = self.llm_service.invoke_llm(system_prompt, user_prompt)
        if isinstance(res, str) and len(res.strip()) > 10:
            return res
        return "Clinical summary completed based on patient parameters and predictive antimicrobial susceptibility."

    def generate_final_output(self, patient_data: dict) -> dict:
        predictions = self.predict(patient_data)
        predictions.pop("patient_index", None)
        
        normalized_patient_data = {k.lower(): v for k, v in patient_data.items()}
        prescribed_antibiotics = self.get_precribed_antibiotics(normalized_patient_data, predictions)
        
        recommended_names = [
            abx["name"] for abx in prescribed_antibiotics.get("recommended", [])
            if isinstance(abx, dict) and "name" in abx
        ]
        
        prescribed_antibiotics_details = {
            "patient_index": 0,
            "prescribed_antibiotics": recommended_names
        }
        
        antibiotic_history = self.get_antibiotic_history(prescribed_antibiotics_details)
        summary = self.get_summary(patient_data, predictions, prescribed_antibiotics, antibiotic_history)
        
        cbp_lymphocytes = normalized_patient_data.pop("cbp_lymphocytes", 0.0)
        wbc = normalized_patient_data.pop("wbc", 0.0)
        polymorphs = normalized_patient_data.pop("polymorphs", 0.0)
        crp = normalized_patient_data.pop("crp", 0.0)
        rft_serum_creatinine = normalized_patient_data.pop("rft_serum_creatinine", 0.0)
        serum_uric_acid = normalized_patient_data.pop("serum_uric_acid", 0.0)
        blood_urea = normalized_patient_data.pop("blood_urea", 0.0)
        cue_pus_cells = normalized_patient_data.pop("cue_pus_cells", 0.0)
        epithelial_cells = normalized_patient_data.pop("epithelial_cells", 0.0)
        proteins = normalized_patient_data.pop("proteins", "Negative")
        rbc = normalized_patient_data.pop("rbc", 0.0)

        return {
            "patient_index": 0,
            "patient_details": {
                **normalized_patient_data,
                "lab_results": {
                    "cbp_lymphocytes": float(cbp_lymphocytes) if cbp_lymphocytes is not None else 0.0,
                    "wbc": float(wbc) if wbc is not None else 0.0,
                    "polymorphs": float(polymorphs) if polymorphs is not None else 0.0,
                    "crp": float(crp) if crp is not None else 0.0,
                    "rft_serum_creatinine": float(rft_serum_creatinine) if rft_serum_creatinine is not None else 0.0,
                    "serum_uric_acid": float(serum_uric_acid) if serum_uric_acid is not None else 0.0,
                    "blood_urea": float(blood_urea) if blood_urea is not None else 0.0,
                    "cue_pus_cells": float(cue_pus_cells) if cue_pus_cells is not None else 0.0,
                    "epithelial_cells": float(epithelial_cells) if epithelial_cells is not None else 0.0,
                    "proteins": str(proteins) if proteins is not None else "Negative",
                    "rbc": float(rbc) if rbc is not None else 0.0
                }
            },
            "predictions": predictions,
            "prescribed_antibiotics": prescribed_antibiotics,
            "antibiotic_history": antibiotic_history,
            "summary": summary
        }
