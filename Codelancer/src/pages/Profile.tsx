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
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';

const Profile = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const { reviews, loading: reviewsLoading } = useReviews(userProfile?.uid);
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'verification' | 'payment' | 'reviews'>('personal');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);

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
    if (!user) return;
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

    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Save Failed",
        description: "Could not save changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePersonal = () => {
    saveProfile({
      fullName: personalInfo.fullName,
      phone: personalInfo.phone,
      address: personalInfo.address
    }, "Personal");
  };

  const handleSaveProfessional = () => {
    const skillsArray = professionalInfo.skills.split(',').map(s => s.trim()).filter(Boolean);
    const linksArray = professionalInfo.portfolioLinks.split('\n').map(l => l.trim()).filter(Boolean);

    saveProfile({
      skills: skillsArray,
      experience: professionalInfo.experience,
      portfolioLinks: linksArray
    }, "Professional");
  };

  const handleSavePayment = () => {
    saveProfile({
      bankDetails: paymentInfo
    }, "Payment");
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate File Type (PDF)
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF document.",
        variant: "destructive"
      });
      return;
    }

    // Validate File Size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Document must be smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0); // Reset progress

    try {
      // Create storage reference
      const storageRef = ref(storage, `verification_docs/${user.uid}/${Date.now()}_${file.name}`);

      // Upload file with progress monitoring
      // Upload file directly (quicker for small files) with timeout
      console.log("Starting upload for file:", file.name);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Upload timed out. Check your internet connection or try a smaller file.')), 30000)
      );

      const snapshot = await Promise.race([
        uploadBytes(storageRef, file),
        timeoutPromise
      ]) as any;

      console.log("Upload successful, fetching download URL...");
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log("Download URL fetched:", downloadURL);

      const updateData = {
        governmentId: {
          verified: false,
          status: 'pending',
          documentUrl: downloadURL,
          fileName: file.name,
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

      toast({
        title: "Document Uploaded",
        description: "Your identity verification request has been submitted."
      });
      setUploading(false);
      // Reset input
      event.target.value = '';

    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "There was an error uploading your document.",
        variant: "destructive"
      });
      setUploading(false);
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

                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                    <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">Drag & drop your ID document here, or click to browse</p>
                    <Button variant="outline" onClick={triggerFileUpload} disabled={uploading} className="w-full relative overflow-hidden">
                      {uploading ? (
                        <span className="relative z-10 flex items-center gap-2">
                          Uploading...
                        </span>
                      ) : "Upload PDF (Max 10MB)"}
                    </Button>
                    <input
                      type="file"
                      id="verification-upload"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
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
