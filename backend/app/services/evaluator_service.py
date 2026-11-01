import sys
import os
from pathlib import Path
from typing import Dict, Any, List, Tuple

# Ensure root is in sys.path
root_path = Path(__file__).resolve().parent.parent.parent.parent
if str(root_path) not in sys.path:
    sys.path.insert(0, str(root_path))

from core.evaluator import AlignmentEvaluator
from core.dictionary import HanNomDictionary

class EvaluatorService:
    def __init__(self):
        self.evaluator = AlignmentEvaluator()
        self.dictionary = HanNomDictionary()

    def evaluate_pair(self, sino_nom: str, chu_qn: str) -> Dict[str, Any]:
        """
        Evaluate a single sentence pair and return character-level statuses.
        """
        res = self.evaluator.evaluate_record({
            "SinoNom_Char": sino_nom,
            "ChuQN_txt": chu_qn
        })
        
        char_statuses = []
        for item in res.get("char_statuses", []):
            ch, is_m = item[0], item[1]
            reason = item[2] if len(item) > 2 else ("matched" if is_m else "not_in_dict")
            char_statuses.append({
                "char": ch,
                "isMatched": is_m,
                "color": "BLACK" if is_m else "RED",
                "reason": reason
            })

        is_matched = res["mismatched_chars"] == 0
        return {
            "isMatched": is_matched,
            "color": "BLACK" if is_matched else "RED",
            "charStatuses": char_statuses,
            "mismatchedChars": res["mismatched_chars"],
            "totalChars": res["total_chars"]
        }

    def compute_similarity(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Compute similarity score strictly: (1 - N_mismatch / N_total) * 100
        Must be >= 95.0% to pass.
        """
        total_chars = sum(len(r.get("SinoNom_Char", "")) for r in records)
        mismatched_chars = 0
        for r in records:
            statuses = r.get("charStatuses", [])
            mismatched_chars += sum(1 for cs in statuses if not cs.get("isMatched", True))

        if total_chars == 0:
            score = 100.0
        else:
            score = (1.0 - (mismatched_chars / total_chars)) * 100.0

        rounded_score = round(score, 2)
        return {
            "totalChars": total_chars,
            "mismatchedChars": mismatched_chars,
            "similarityScore": rounded_score,
            "isSimilarityPassed": rounded_score >= 95.0
        }

evaluator_service = EvaluatorService()
