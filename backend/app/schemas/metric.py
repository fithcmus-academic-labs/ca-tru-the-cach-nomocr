from pydantic import BaseModel, ConfigDict

class MetricsSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    totalPages: int
    processedPages: int
    totalAlignedPairs: int
    totalSinoNomChars: int
    totalVietnameseWords: int
    validatedPairs: int
    mismatchedChars: int
    pendingReviews: int
    similarityScore: float
    isSimilarityPassed: bool
