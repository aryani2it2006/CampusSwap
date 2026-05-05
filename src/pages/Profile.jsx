import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData, SKILL_LIST } from '../context/DataContext';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { Edit2, Save, Star, Coins, Award, Clock, Calendar as CalendarIcon, MapPin, Video, CheckCircle, ArrowLeft } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const COLLEGE_LIST = ["IIT Bombay", "IIT Delhi", "IIT Madras", "IIT Kharagpur", "IIT Roorkee", "IIT Kanpur", "IIT Guwahati", "IIT Hyderabad", "IIT Indore", "IIT Jodhpur", "IIT Patna", "IIT Bhubaneswar", "IIT Mandi", "IIT Tirupati", "IIT Palakkad", "IIT Dhanbad (ISM)", "NIT Trichy", "NIT Warangal", "NIT Surathkal", "NIT Calicut", "NIT Rourkela", "NIT Allahabad", "NIT Jaipur", "NIT Bhopal", "NIT Surat", "NIT Pune", "BITS Pilani", "BITS Goa", "BITS Hyderabad", "VIT Vellore", "VIT Chennai", "VIT Pune", "VIT Bhopal", "COEP Pune", "MIT Pune", "Symbiosis Institute of Technology Pune", "Savitribai Phule Pune University", "Mumbai University", "Delhi University", "Anna University Chennai", "Jadavpur University Kolkata", "Osmania University Hyderabad", "Amity University Noida", "SRM University Chennai", "Manipal Institute of Technology", "Thapar University Patiala", "PES University Bangalore", "RV College of Engineering Bangalore", "BMS College of Engineering Bangalore", "MS Ramaiah Institute of Technology Bangalore", "Christ University Bangalore", "Fergusson College Pune", "Jai Hind College Mumbai", "St. Xavier's College Mumbai", "Hindu College Delhi", "Miranda House Delhi", "Kirori Mal College Delhi", "Lady Shri Ram College Delhi", "Hansraj College Delhi", "Ramjas College Delhi", "Sri Venkateswara College Delhi", "Gargi College Delhi"];

export default function Profile() {
  const { currentUser, updateProfile } = useAuth();
  const { sessions, users } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  
  const [name, setName] = useState(currentUser?.name || '');
  const [age, setAge] = useState(currentUser?.age || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [college, setCollege] = useState(currentUser?.college || '');
  const [branch, setBranch] = useState(currentUser?.branch || '');
  const [year, setYear] = useState(currentUser?.year || '');
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || '');
  const [showCollegeSuggestions, setShowCollegeSuggestions] = useState(false);
  
  const [teaches, setTeaches] = useState(currentUser?.teaches || []);
  const [wants, setWants] = useState(currentUser?.wants || []);
  const [customTeach, setCustomTeach] = useState('');
  const [customWant, setCustomWant] = useState('');

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    let fileToUpload = file;
    if (file.size > 2 * 1024 * 1024) {
      try {
        setToastMessage('Compressing image...');
        const options = { maxSizeMB: 2, maxWidthOrHeight: 1024, useWebWorker: true };
        fileToUpload = await imageCompression(file, options);
      } catch (error) {
        console.error("Compression error:", error);
        setToastMessage('Error compressing image');
        setTimeout(() => setToastMessage(''), 3000);
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);
    const oldPhotoURL = photoURL;
    
    const localPreview = URL.createObjectURL(fileToUpload);
    setPhotoURL(localPreview);

    try {
      // TODO: Replace these with your actual Cloudinary credentials
      const CLOUD_NAME = 'davmtmukd'; 
      const UPLOAD_PRESET = 'campus swap';

      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('upload_preset', UPLOAD_PRESET);

      // We can't track progress with simple fetch, so we'll just show "Uploading..."
      // and skip the percentage update.
      setUploadProgress(''); 

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Cloudinary upload failed');
      }

      const data = await response.json();
      const url = data.secure_url;

      setPhotoURL(url);
      updateProfile({ photoURL: url });
      setIsUploading(false);
      setToastMessage('Profile photo updated!');
      setTimeout(() => setToastMessage(''), 3000);
      
    } catch (err) {
      console.error("Cloudinary Error:", err);
      setIsUploading(false);
      setPhotoURL(oldPhotoURL);
      setToastMessage(`Upload failed: ${err.message}`);
      setTimeout(() => setToastMessage(''), 5000);
    }
  };

  const toggleSkill = (skill, list, setList) => {
    if (list.includes(skill)) {
      setList(list.filter(s => s !== skill));
    } else {
      setList([...list, skill]);
    }
  };

  const handleAddCustomTeach = (e) => {
    e.preventDefault();
    if (customTeach.trim() && !teaches.includes(customTeach.trim())) {
      setTeaches([...teaches, customTeach.trim()]);
      setCustomTeach('');
    }
  };

  const handleAddCustomWant = (e) => {
    e.preventDefault();
    if (customWant.trim() && !wants.includes(customWant.trim())) {
      setWants([...wants, customWant.trim()]);
      setCustomWant('');
    }
  };

  const handleSave = () => {
    updateProfile({ name, age, bio, college, branch, year, teaches, wants, photoURL });
    setIsEditing(false);
  };

  const hasUnsavedChanges = 
    name !== (currentUser?.name || '') ||
    age !== (currentUser?.age || '') ||
    bio !== (currentUser?.bio || '') ||
    college !== (currentUser?.college || '') ||
    branch !== (currentUser?.branch || '') ||
    year !== (currentUser?.year || '') ||
    photoURL !== (currentUser?.photoURL || '') ||
    JSON.stringify(teaches) !== JSON.stringify(currentUser?.teaches || []) ||
    JSON.stringify(wants) !== JSON.stringify(currentUser?.wants || []);

  const handleBackToProfile = () => {
    if (hasUnsavedChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
        // Revert state
        setName(currentUser?.name || '');
        setAge(currentUser?.age || '');
        setBio(currentUser?.bio || '');
        setCollege(currentUser?.college || '');
        setBranch(currentUser?.branch || '');
        setYear(currentUser?.year || '');
        setPhotoURL(currentUser?.photoURL || '');
        setTeaches(currentUser?.teaches || []);
        setWants(currentUser?.wants || []);
        setIsEditing(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const allTeachOptions = Array.from(new Set([...SKILL_LIST, ...teaches]));
  const allWantOptions = Array.from(new Set([...SKILL_LIST, ...wants]));

  const filteredTeaches = teaches.filter(s => !['Toast', 'test', 'Test', 'Testing', 'toast'].includes(s));
  const filteredWants = wants.filter(s => !['Toast', 'test', 'Test', 'Testing', 'toast'].includes(s));
  return (
    <div>
      {toastMessage && (
        <div className="toast-notification">
          {toastMessage}
        </div>
      )}
      
      {isEditing && (
        <button className="btn btn-outline" style={{ width: 'auto', marginBottom: '16px', padding: '6px 12px' }} onClick={handleBackToProfile}>
          <ArrowLeft size={16} /> Back to Profile
        </button>
      )}

      <div className="card" style={{ textAlign: 'center', paddingTop: '30px' }}>
        {isEditing ? (
          <div style={{ marginBottom: '16px' }}>
            <img src={photoURL} className="avatar" style={{ width: '80px', height: '80px', margin: '0 auto 8px auto' }} />
            <div>
              <label className="btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-full)', cursor: 'pointer', display: 'inline-block' }}>
                {isUploading ? (uploadProgress ? `Uploading... ${uploadProgress}%` : 'Uploading...') : 'Change Photo'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} disabled={isUploading} />
              </label>
            </div>
            <div className="input-group" style={{ textAlign: 'left', marginTop: '16px' }}>
              <label className="input-label">Full Name</label>
              <input className="input-field" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="flex-between" style={{ gap: '16px' }}>
              <div className="input-group" style={{ textAlign: 'left', flex: 1 }}>
                <label className="input-label">Age</label>
                <input type="number" min="17" max="30" className="input-field" value={age} onChange={e => setAge(e.target.value)} />
              </div>
              <div className="input-group" style={{ textAlign: 'left', flex: 2, position: 'relative' }}>
                <label className="input-label">College Name</label>
                <input 
                  className="input-field" 
                  value={college} 
                  onChange={e => { setCollege(e.target.value); setShowCollegeSuggestions(true); }} 
                  onFocus={() => setShowCollegeSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCollegeSuggestions(false), 200)}
                />
                {showCollegeSuggestions && college && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--card-bg)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-md)', zIndex: 100, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
                    {COLLEGE_LIST.filter(c => c.toLowerCase().includes(college.toLowerCase())).map(c => (
                      <div key={c} style={{ padding: '10px 12px', cursor: 'pointer', color: 'white', fontSize: '0.9rem', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }} 
                           onMouseDown={() => { setCollege(c); setShowCollegeSuggestions(false); }}
                           onMouseOver={e => e.target.style.background = 'var(--accent-blue-bg)'}
                           onMouseOut={e => e.target.style.background = 'transparent'}
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-between" style={{ gap: '16px' }}>
              <div className="input-group" style={{ textAlign: 'left', flex: 1 }}>
                <label className="input-label">Branch</label>
                <input className="input-field" value={branch} onChange={e => setBranch(e.target.value)} />
              </div>
              <div className="input-group" style={{ textAlign: 'left', flex: 1 }}>
                <label className="input-label">Year</label>
                <select className="input-field" value={year} onChange={e => setYear(e.target.value)}>
                  <option value="">Select</option>
                  <option value="1st year">1st year</option>
                  <option value="2nd year">2nd year</option>
                  <option value="3rd year">3rd year</option>
                  <option value="4th year">4th year</option>
                </select>
              </div>
            </div>
            <div className="input-group" style={{ textAlign: 'left' }}>
              <label className="input-label">Bio</label>
              <textarea className="input-field" maxLength={150} rows={2} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell others about yourself..."></textarea>
            </div>
          </div>
        ) : (
          <>
            <img 
              src={currentUser?.photoURL} 
              alt={currentUser?.name} 
              className="avatar" 
              style={{ width: '80px', height: '80px', margin: '0 auto 16px auto' }} 
            />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {currentUser?.name} {currentUser?.age ? `, ${currentUser.age}` : ''}
              {currentUser?.rating >= 4.5 && currentUser?.reviews >= 5 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#D97706', padding: '4px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: '700', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <Star size={14} fill="#F59E0B" color="#F59E0B" /> Top Mentor
                </div>
              )}
            </h2>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '600' }}>
              <Star size={16} fill="#F59E0B" color="#F59E0B" />
              <span>{currentUser?.rating?.toFixed(1) || '0.0'}</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: '400', marginLeft: '4px' }}>({currentUser?.reviews || 0} reviews)</span>
            </div>

            <p className="user-meta" style={{ fontSize: '1rem', marginBottom: '8px', color: 'var(--text-main)', fontWeight: '500' }}>
              {currentUser?.college}
            </p>

            <p className="user-meta" style={{ fontSize: '0.95rem', marginBottom: '16px' }}>
              {currentUser?.branch} • {currentUser?.year}
            </p>
            
            {currentUser?.bio && (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 20px auto', fontStyle: 'italic', lineHeight: '1.4' }}>
                "{currentUser.bio}"
              </p>
            )}
            
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(124, 58, 237, 0.15)', padding: '8px 16px', borderRadius: 'var(--radius-full)', color: '#a78bfa', fontWeight: '600', border: '1px solid #7C3AED' }}>
              <Coins size={20} />
              {currentUser?.credits} Credits Available
            </div>
          </>
        )}
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem' }}>My Skills</h3>
          {isEditing ? (
            <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }} onClick={handleSave}>
              <Save size={14} style={{ marginRight: '4px' }} /> Save
            </button>
          ) : (
            <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }} onClick={() => setIsEditing(true)}>
              <Edit2 size={14} style={{ marginRight: '4px' }} /> Edit
            </button>
          )}
        </div>

        <div className="tags-section">
          <div className="tags-title">I can teach</div>
          <div className="tags-container">
            {isEditing ? (
              <>
                {allTeachOptions.map(skill => (
                  <button 
                    key={skill} 
                    type="button"
                    onClick={() => toggleSkill(skill, teaches, setTeaches)}
                    className={`tag ${teaches.includes(skill) ? 'tag-teach' : ''}`}
                  >
                    {skill}
                  </button>
                ))}
                <form onSubmit={handleAddCustomTeach} style={{ width: '100%', marginTop: '12px' }}>
                  <input className="input-field" style={{ padding: '10px 12px', width: '100%' }} placeholder="Type a custom skill and press Enter..." value={customTeach} onChange={e => setCustomTeach(e.target.value)} />
                </form>
              </>
            ) : (
              filteredTeaches.length > 0 ? filteredTeaches.map(skill => (
                <span key={skill} className="tag tag-teach">{skill}</span>
              )) : <span className="text-muted" style={{ fontSize: '0.9rem' }}>None added yet</span>
            )}
          </div>
        </div>

        <div className="tags-section" style={{ marginTop: '24px' }}>
          <div className="tags-title">I want to learn</div>
          <div className="tags-container">
            {isEditing ? (
              <>
                {allWantOptions.map(skill => (
                  <button 
                    key={skill} 
                    type="button"
                    onClick={() => toggleSkill(skill, wants, setWants)}
                    className={`tag ${wants.includes(skill) ? 'tag-learn' : ''}`}
                  >
                    {skill}
                  </button>
                ))}
                <form onSubmit={handleAddCustomWant} style={{ width: '100%', marginTop: '12px' }}>
                  <input className="input-field" style={{ padding: '10px 12px', width: '100%' }} placeholder="Type a custom skill and press Enter..." value={customWant} onChange={e => setCustomWant(e.target.value)} />
                </form>
              </>
            ) : (
              filteredWants.length > 0 ? filteredWants.map(skill => (
                <span key={skill} className="tag tag-learn">{skill}</span>
              )) : <span className="text-muted" style={{ fontSize: '0.9rem' }}>None added yet</span>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}
