import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Link as LinkIcon,
  Shield,
  Upload,
  Save,
  Camera,
  Star,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useReviews } from '@/hooks/useReviews';
import { formatDistanceToNow } from 'date-fns';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';

const Profile = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const { reviews, loading: reviewsLoading } = useReviews(userProfile?.uid);
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'verification' | 'payment' | 'reviews'>('personal');
  const [uploadState, setUploadState] = useState<'IDLE' | 'VALIDATING' | 'UPLOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form State
  const [personalInfo, setPersonalInfo] = useState({
    fullName: userProfile?.fullName || '',
    phone: userProfile?.phone || '',
    address: userProfile?.address || ''
  });

  const [professionalInfo, setProfessionalInfo] = useState({
    skills: userProfile?.skills?.join(', ') || '',
    experience: userProfile?.experience || '',
    portfolioLinks: userProfile?.portfolioLinks?.join('\n') || ''
  });

  const [paymentInfo, setPaymentInfo] = useState({
    bankName: userProfile?.bankDetails?.bankName || '',
    accountNumber: userProfile?.bankDetails?.accountNumber || '',
    ifscCode: userProfile?.bankDetails?.ifscCode || ''
  });

  // Update local state when userProfile loads
  useEffect(() => {
    if (userProfile) {
      setPersonalInfo({
        fullName: userProfile.fullName || '',
        phone: userProfile.phone || '',
        address: userProfile.address || ''
      });
      setProfessionalInfo({
        skills: userProfile.skills?.join(', ') || '',
        experience: userProfile.experience || '',
        portfolioLinks: userProfile.portfolioLinks?.join('\n') || ''
      });
      setPaymentInfo({
        bankName: userProfile.bankDetails?.bankName || '',
        accountNumber: userProfile.bankDetails?.accountNumber || '',
        ifscCode: userProfile.bankDetails?.ifscCode || ''
      });
    }
  }, [userProfile]);

  const calculateCompletion = (data: any) => {
    let score = 0;
    const totalWeight = 100;

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

  const saveProfile = async (sectionData: any, sectionName: string) => {
    if (!user) return false;
    setLoading(true);

    try {
      // Merge current profile with new section data to calculate new completion score
      // We need to construct a 'preview' of the full profile object for calculation
      const currentProfileData = userProfile || {} as any;

      const updatedData = {
        ...currentProfileData,
        ...sectionData
        // Note: nesting for bankDetails handles cleanly if we pass the full object key like 'bankDetails'
        // But for flat fields we merge directly.
        // We will handle the specific structure in the handlers below.
      };

      // Since the handlers pass structured data, we can just use the updatedData for calculation ??
      // Actually, let's reconstruct the object carefully for the calculator.

      const fullProfileForCalc = {
        ...currentProfileData,
        ...sectionData,
        // Ensure nested objects are merged if we are updating a partial nested object
        bankDetails: { ...currentProfileData.bankDetails, ...sectionData.bankDetails },
        governmentId: { ...currentProfileData.governmentId }
      };

      const newCompletion = calculateCompletion(fullProfileForCalc);

      await updateDoc(doc(db, 'users', user.uid), {
        ...sectionData,
        profileCompletion: newCompletion,
        updatedAt: new Date()
      });

      // await refreshUserProfile(); // Real-time update handles this

      toast({
        title: "Profile Updated",
        description: `${sectionName} information saved successfully.`
      });
      return true;

    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Save Failed",
        description: "Could not save changes. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSavePersonal = async () => {
    const success = await saveProfile({
      fullName: personalInfo.fullName,
      phone: personalInfo.phone,
      address: personalInfo.address
    }, "Personal");

    if (success) {
      setActiveTab('professional');
    }
  };

  const handleSaveProfessional = async () => {
    const skillsArray = professionalInfo.skills.split(',').map(s => s.trim()).filter(Boolean);
    const linksArray = professionalInfo.portfolioLinks.split('\n').map(l => l.trim()).filter(Boolean);

    const success = await saveProfile({
      skills: skillsArray,
      experience: professionalInfo.experience,
      portfolioLinks: linksArray
    }, "Professional");

    if (success) {
      setActiveTab('verification');
    }
  };

  const handleSavePayment = async () => {
    const success = await saveProfile({
      bankDetails: paymentInfo
    }, "Payment");

    if (success) {
      setActiveTab('reviews');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadState('VALIDATING');
    setUploadError(null);
    setUploadProgress(0);

    // Validate File Type (PDF)
    if (file.type !== 'application/pdf') {
      const errorMsg = "Invalid file type. Please upload a PDF document.";
      setUploadError(errorMsg);
      setUploadState('ERROR');
      toast({
        title: "Invalid File Type",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }

    // Validate File Size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      const errorMsg = "File too large. Document must be smaller than 10MB.";
      setUploadError(errorMsg);
      setUploadState('ERROR');
      toast({
        title: "File Too Large",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }

    setUploadState('UPLOADING');

    try {
      // Create storage reference
      // Format: verification_docs/{userId}/{timestamp}.pdf
      const fileName = `${Date.now()}.pdf`;
      const storageRef = ref(storage, `verification_docs/${user.uid}/${fileName}`);

      // Start Resumable Upload
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
          console.log('Upload is ' + progress + '% done');
          switch (snapshot.state) {
            case 'paused':
              console.log('Upload is paused');
              break;
            case 'running':
              console.log('Upload is running');
              break;
          }
        },
        (error) => {
          console.error("Upload error:", error);
          let errorMessage = "Upload failed. Please try again.";
          if (error.code === 'storage/unauthorized') {
            errorMessage = "Permission denied. Please try logging in again.";
          } else if (error.code === 'storage/canceled') {
            errorMessage = "Upload canceled.";
          } else if (error.code === 'storage/unknown') {
            errorMessage = "An unknown error occurred.";
          }

          setUploadError(errorMessage);
          setUploadState('ERROR');
          toast({
            title: "Upload Failed",
            description: errorMessage,
            variant: "destructive"
          });
        },
        async () => {
          // Upload completed successfully, now we can get the download URL
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('File available at', downloadURL);

            // 1. Delete previous file if exists
            // 1. Delete previous file if exists
            if (userProfile?.governmentId?.fileName) {
              const previousFileName = userProfile.governmentId.fileName;
              if (previousFileName !== fileName) {
                try {
                  const previousFileRef = ref(storage, `verification_docs/${user.uid}/${previousFileName}`);
                  await deleteObject(previousFileRef);
                  console.log("Previous verification document deleted successfully");
                } catch (deleteError) {
                  // Ignore errors (file not found/legacy name)
                  console.warn("Could not delete previous verification document:", deleteError);
                }
              }
            }

            // 2. Update Firestore
            const updateData = {
              governmentId: {
                verified: false,
                status: 'pending',
                documentUrl: downloadURL,
                fileName: fileName, // Store the distinct filename in storage
                originalName: file.name,
                type: 'PDF Document',
                uploadedAt: new Date()
              }
            };

            // Calculate new completion
            const currentProfileData = userProfile || {} as any;
            const fullProfileForCalc = { ...currentProfileData, ...updateData };
            const newCompletion = calculateCompletion(fullProfileForCalc);

            await updateDoc(doc(db, 'users', user.uid), {
              ...updateData,
              'governmentId.uploadedAt': serverTimestamp(),
              profileCompletion: newCompletion
            });

            setUploadState('SUCCESS');
            toast({
              title: "Upload Successful",
              description: "Your document has been submitted for verification."
            });

            // Navigate to next tab
            setTimeout(() => {
              setActiveTab('payment');
              setUploadState('IDLE'); // Reset for future interactions? Or keep as success?
              // Keeping as IDLE so they can upload again if needed, or maybe SUCCESS to show checkmark.
              // Let's reset to IDLE after navigation for clean state
            }, 1000);

          } catch (firestoreError: any) {
            console.error("Firestore update error:", firestoreError);
            setUploadError("File uploaded but failed to update profile. Please try again.");
            setUploadState('ERROR');
          }
        }
      );

    } catch (error: any) {
      console.error("Upload start error:", error);
      setUploadError(error.message || "Could not start upload.");
      setUploadState('ERROR');
    }
  };

  const triggerFileUpload = () => {
    document.getElementById('verification-upload')?.click();
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'verification', label: 'Verification', icon: Shield },
    { id: 'payment', label: 'Payment', icon: Mail },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">My Profile</h1>
            <p className="text-muted-foreground">Manage your profile information and settings</p>
          </motion.div>

          {/* Profile Completion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-border p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center text-primary-foreground text-2xl font-bold">
                    {userProfile?.fullName?.charAt(0) || 'U'}
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl font-bold text-foreground">{userProfile?.fullName || 'User'}</h2>
                    {userProfile?.governmentId?.verified && (
                      <span className="text-secondary" title="Verified User">
                        <Shield className="h-5 w-5 fill-current" />
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground capitalize">{userProfile?.role || 'Member'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="text-sm font-medium text-foreground">{userProfile?.rating || 0}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({userProfile?.reviewsCount || 0} reviews)</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-2">Profile Completion</p>
                <div className="flex items-center gap-3">
                  <Progress value={userProfile?.profileCompletion || 20} className="w-32" />
                  <span className="font-semibold text-foreground">{userProfile?.profileCompletion || 20}%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h3 className="font-display text-xl font-bold text-foreground">Personal Information</h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="Enter Your Name"
                        value={personalInfo.fullName}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        defaultValue={userProfile?.email}
                        className="pl-10"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91"
                        value={personalInfo.phone}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="address"
                        placeholder="City, State, Country"
                        value={personalInfo.address}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <Button variant="gradient" className="gap-2" onClick={handleSavePersonal} disabled={loading}>
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}

            {activeTab === 'professional' && (
              <div className="space-y-6">
                <h3 className="font-display text-xl font-bold text-foreground">Professional Details</h3>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="skills">Skills (comma separated)</Label>
                    <Input
                      id="skills"
                      placeholder="React, TypeScript, Node.js, Python"
                      value={professionalInfo.skills}
                      onChange={(e) => setProfessionalInfo({ ...professionalInfo, skills: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience</Label>
                    <Textarea
                      id="experience"
                      placeholder="Describe your professional experience..."
                      value={professionalInfo.experience}
                      onChange={(e) => setProfessionalInfo({ ...professionalInfo, experience: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Portfolio Links (one per line)</Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Textarea
                        id="portfolio"
                        placeholder="https://github.com/username&#10;https://linkedin.com/in/username"
                        value={professionalInfo.portfolioLinks}
                        onChange={(e) => setProfessionalInfo({ ...professionalInfo, portfolioLinks: e.target.value })}
                        className="pl-10"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <Button variant="gradient" className="gap-2" onClick={handleSaveProfessional} disabled={loading}>
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}

            {activeTab === 'verification' && (
              <div className="space-y-6">
                <h3 className="font-display text-xl font-bold text-foreground">Identity Verification</h3>

                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    {userProfile?.governmentId?.verified ? (
                      <>
                        <CheckCircle className="h-6 w-6 text-success" />
                        <span className="font-medium text-success">Verified</span>
                      </>
                    ) : userProfile?.governmentId?.status === 'pending' ? (
                      <>
                        <AlertCircle className="h-6 w-6 text-warning" />
                        <span className="font-medium text-warning">Pending Verification</span>
                      </>
                    ) : userProfile?.governmentId?.status === 'rejected' ? (
                      <>
                        <AlertCircle className="h-6 w-6 text-destructive" />
                        <span className="font-medium text-destructive">Verification Rejected</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-6 w-6 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">Not Verified</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a government-issued ID (Aadhaar, PAN, Passport) to verify your identity.
                  </p>

                  {userProfile?.governmentId?.documentUrl && (
                    <div className="mb-4 p-3 bg-secondary/10 rounded-lg flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        {userProfile.governmentId.fileName || "Uploaded Document"}
                      </span>
                      <a
                        href={userProfile.governmentId.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View
                      </a>
                    </div>
                  )}

                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center relative">
                    {uploadState === 'UPLOADING' || uploadState === 'VALIDATING' ? (
                      <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                          <Upload className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {uploadState === 'VALIDATING' ? 'Validating document...' : `Uploading... ${uploadProgress}%`}
                          </p>
                          <p className="text-sm text-muted-foreground">Please wait while we process your file.</p>
                        </div>
                        <Progress value={uploadProgress} className="h-2 w-full max-w-xs mx-auto" />
                      </div>
                    ) : uploadState === 'SUCCESS' ? (
                      <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                          <CheckCircle className="h-8 w-8 text-success" />
                        </div>
                        <p className="font-semibold text-foreground">Upload Successful!</p>
                        <p className="text-sm text-muted-foreground">Redirecting...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        {uploadState === 'ERROR' && (
                          <div className="mb-4 text-destructive bg-destructive/10 p-3 rounded-lg text-sm">
                            <p className="font-medium">Upload Failed</p>
                            <p>{uploadError}</p>
                          </div>
                        )}
                        <p className="text-muted-foreground mb-4">Drag & drop your ID document here, or click to browse</p>
                        <Button
                          variant={uploadState === 'ERROR' ? "destructive" : "outline"}
                          onClick={triggerFileUpload}
                          className="w-full relative overflow-hidden"
                        >
                          {uploadState === 'ERROR' ? "Retry Upload" : "Upload PDF (Max 10MB)"}
                        </Button>
                      </>
                    )}

                    <input
                      type="file"
                      id="verification-upload"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={uploadState === 'UPLOADING' || uploadState === 'VALIDATING'}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-6">
                <h3 className="font-display text-xl font-bold text-foreground">Payment Details</h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      placeholder="HDFC Bank"
                      value={paymentInfo.bankName}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, bankName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      placeholder="XXXX XXXX XXXX"
                      value={paymentInfo.accountNumber}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, accountNumber: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      placeholder="HDFC0001234"
                      value={paymentInfo.ifscCode}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, ifscCode: e.target.value })}
                    />
                  </div>
                </div>

                <Button variant="gradient" className="gap-2" onClick={handleSavePayment} disabled={loading}>
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Payment Details'}
                </Button>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <h3 className="font-display text-xl font-bold text-foreground">Client Reviews</h3>
                {reviewsLoading ? (
                  <p className="text-muted-foreground">Loading reviews...</p>
                ) : reviews.length === 0 ? (
                  <div className="text-center p-8 border border-dashed rounded-xl">
                    <p className="text-muted-foreground">No reviews yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <div key={review.id} className="p-4 rounded-xl bg-muted/30 border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{review.reviewerName || 'Anonymous'}</h4>
                          <span className="text-xs text-muted-foreground">
                            {review.createdAt?.toDate ? formatDistanceToNow(review.createdAt.toDate(), { addSuffix: true }) : 'Recently'}
                          </span>
                        </div>
                        <div className="flex items-center mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <p className="text-sm text-foreground">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main >

      <Footer />
    </div >
  );
};

export default Profile;
