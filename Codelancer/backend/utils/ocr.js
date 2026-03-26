const Tesseract = require('tesseract.js');

/**
 * Extracts key information from OCR text based on document type
 * @param {string} text - Raw OCR text
 * @param {string} documentType - Aadhaar, PAN, DL
 * @returns {object} { extractedData, isValid, remarks }
 */
function extractDataFromText(text, documentType) {
  const extractedData = {};
  let isValid = false;
  let remarks = [];
  
  // Clean text and make uppercase for easier matching
  const cleanText = text.replace(/\n+/g, ' ').toUpperCase();

  // Try to find a date in DD/MM/YYYY or DD-MM-YYYY format
  const dateResult = text.match(/\b(0[1-9]|[12][0-9]|3[01])[/-](0[1-9]|1[012])[/-](\d{4})\b/);
  if (dateResult) {
    extractedData.dob = dateResult[0];
  }

  // Very basic name heuristic: look for lines after "NAME" or just capture the first few words if we can't find it.
  // This is highly error-prone with OCR, so we do best effort
  const nameMatch = text.match(/Name[\s:]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/i);
  if (nameMatch) {
    extractedData.name = nameMatch[1];
  }

  if (documentType === 'Aadhaar') {
    // Aadhaar number format: 12 digits, often spaced as 4 4 4
    const aadhaarMatch = text.match(/\b(\d{4})\s?(\d{4})\s?(\d{4})\b/);
    if (aadhaarMatch) {
      extractedData.idNumber = `${aadhaarMatch[1]} ${aadhaarMatch[2]} ${aadhaarMatch[3]}`;
    }

    if (!extractedData.idNumber) {
      remarks.push('Could not detect 12-digit Aadhaar number.');
    }
    if (!extractedData.dob) {
      // Sometimes Aadhaar only has Year of Birth (YOB)
      const yobMatch = text.match(/Year of Birth[\s:-]+(\d{4})/i) || text.match(/YOB[\s:-]+(\d{4})/i);
      if (yobMatch) extractedData.dob = yobMatch[1];
      else remarks.push('Could not detect Date/Year of Birth.');
    }

    isValid = !!(extractedData.idNumber && (extractedData.dob || extractedData.name));

  } else if (documentType === 'PAN') {
    // PAN format: 5 Letters, 4 Digits, 1 Letter
    const panMatch = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/i);
    if (panMatch) {
      extractedData.idNumber = panMatch[1].toUpperCase();
    }

    if (!extractedData.idNumber) {
      remarks.push('Could not detect valid PAN format (ABCDE1234F).');
    }
    if (!extractedData.dob) {
      remarks.push('Could not detect Date of Birth.');
    }

    isValid = !!(extractedData.idNumber && extractedData.dob);

  } else if (documentType === 'DL') {
    // Driving License format varies wildly in India. Common regex:
    const dlMatch = text.match(/\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{4}[-\s]?[0-9]{7})\b/) || 
                    text.match(/\b([A-Z]{2}[-\s]?[0-9]{13})\b/);
    if (dlMatch) {
      extractedData.idNumber = dlMatch[1].replace(/\s/g, '');
    }

    if (!extractedData.idNumber) {
      remarks.push('Could not detect valid Driving License number.');
    }
    
    isValid = !!extractedData.idNumber;
  }

  if (isValid) {
    remarks = ['All required fields successfully validated.'];
  }

  return {
    extractedData,
    isValid,
    remarks: remarks.join(' ')
  };
}

/**
 * Process document image using Tesseract OCR
 * @param {string} imageUrl - URL of the image from Cloudinary
 * @param {string} documentType - Document type selected by user
 * @returns {object} Final result containing status, extractedData, confidenceScore, remarks
 */
async function processDocument(imageUrl, documentType) {
  try {
    const worker = await Tesseract.createWorker('eng');
    
    // Perform OCR
    const { data: { text, confidence } } = await worker.recognize(imageUrl);
    await worker.terminate();

    console.log(`[OCR success] Document Type: ${documentType}, Overall Confidence: ${confidence}`);
    console.log(`[OCR Text Segment]: \n${text.substring(0, 500)}...\n`);

    // Extract and validate standard fields
    const { extractedData, isValid, remarks } = extractDataFromText(text, documentType);

    // Calculate a naive confidence score
    let score = confidence;
    if (isValid && score < 50) score += 20; // boost score if we found valid data despite poor global confidence
    if (!isValid) score = score * 0.8;      // penalize if we couldn't find key info

    return {
      status: isValid ? 'VERIFIED' : 'REJECTED',
      extractedData,
      confidenceScore: Math.round(score),
      remarks
    };

  } catch (error) {
    console.error('OCR Error:', error);
    return {
      status: 'REJECTED',
      extractedData: {},
      confidenceScore: 0,
      remarks: 'Error processing document text. Please upload a clearer image.'
    };
  }
}

module.exports = {
  processDocument,
  extractDataFromText
};
