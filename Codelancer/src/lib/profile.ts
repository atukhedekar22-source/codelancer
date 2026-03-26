/**
 * Calculates the profile completion score based on user profile data.
 * @param data UserProfile data object
 * @returns number from 0 to 100
 */
export const calculateCompletion = (data: any) => {
  let score = 0;

  // Personal Info (40%)
  if (data.fullName) score += 10;
  if (data.email) score += 10;
  if (data.phone) score += 10;
  if (data.address) score += 10;

  // Professional (30%)
  if (data.skills && data.skills.length > 0) score += 10;
  if (data.experience) score += 10;
  if (data.portfolioLinks && data.portfolioLinks.length > 0) score += 10;

  // Payment (15%)
  if (data.bankDetails?.bankName && data.bankDetails?.accountNumber) score += 15;

  // Verification (15%)
  if (data.governmentId?.verified) score += 15;

  return Math.min(score, 100);
};
