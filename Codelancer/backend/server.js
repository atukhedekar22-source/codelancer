const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const dotenv = require('dotenv');
const { processDocument } = require('./utils/ocr');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'), false);
    }
  }
});

app.post('/api/verify-document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided.' });
    }

    const fileBuffer = req.file.buffer;
    const documentType = req.body.documentType; // Expected: Aadhaar, PAN, DL

    if (!documentType || !['Aadhaar', 'PAN', 'DL'].includes(documentType)) {
      return res.status(400).json({ error: 'Invalid or missing documentType.' });
    }

    // Wrap Cloudinary upload stream in a promise
    const cloudinaryUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'verification_docs', resource_type: 'auto' },
          (error, result) => {
            if (error) {
              console.error('Cloudinary Upload Error:', error);
              return reject(error);
            }
            resolve(result);
          }
        );
        stream.end(buffer);
      });
    };

    console.log(`Starting Cloudinary upload for ${documentType}...`);
    const uploadResult = await cloudinaryUpload(fileBuffer);
    console.log('Upload successful:', uploadResult.secure_url);

    let imageUrlForOcr = uploadResult.secure_url;
    // If it's a PDF, we can tell Cloudinary to convert the first page to a jpg for OCR
    if (uploadResult.format === 'pdf') {
      imageUrlForOcr = uploadResult.secure_url.replace('.pdf', '.jpg');
      console.log('Converted PDF URL to JPG for OCR:', imageUrlForOcr);
    }

    // Process OCR and validation
    console.log('Starting OCR processing...');
    const result = await processDocument(imageUrlForOcr, documentType);

    if (result.status === 'REJECTED') {
      console.log('Document validation failed. Deleting from Cloudinary: ' + uploadResult.public_id);
      await cloudinary.uploader.destroy(uploadResult.public_id);
      
      return res.json({
        documentType: documentType,
        status: result.status,
        extractedData: result.extractedData,
        confidenceScore: result.confidenceScore,
        remarks: result.remarks,
        documentUrl: null, // File was deleted
        format: null
      });
    }

    // Return the combined result
    res.json({
      documentType: documentType,
      status: result.status,
      extractedData: result.extractedData,
      confidenceScore: result.confidenceScore,
      remarks: result.remarks,
      documentUrl: uploadResult.secure_url, // Only returned if valid
      format: uploadResult.format
    });

  } catch (error) {
    console.error('Error in /api/verify-document:', error);
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Verification backend running on port ${PORT}`);
});
