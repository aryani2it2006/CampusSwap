import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData, SKILL_LIST } from '../context/DataContext';
import Logo from '../components/Logo';

const COLLEGE_LIST = ["IIT Bombay", "IIT Delhi", "IIT Madras", "IIT Kharagpur", "IIT Roorkee", "IIT Kanpur", "IIT Guwahati", "IIT Hyderabad", "IIT Indore", "IIT Jodhpur", "IIT Patna", "IIT Bhubaneswar", "IIT Mandi", "IIT Tirupati", "IIT Palakkad", "IIT Dhanbad (ISM)", "NIT Trichy", "NIT Warangal", "NIT Surathkal", "NIT Calicut", "NIT Rourkela", "NIT Allahabad", "NIT Jaipur", "NIT Bhopal", "NIT Surat", "NIT Pune", "BITS Pilani", "BITS Goa", "BITS Hyderabad", "VIT Vellore", "VIT Chennai", "VIT Pune", "VIT Bhopal", "COEP Pune", "MIT Pune", "Symbiosis Institute of Technology Pune", "Savitribai Phule Pune University", "Mumbai University", "Delhi University", "Anna University Chennai", "Jadavpur University Kolkata", "Osmania University Hyderabad", "Amity University Noida", "SRM University Chennai", "Manipal Institute of Technology", "Thapar University Patiala", "PES University Bangalore", "RV College of Engineering Bangalore", "BMS College of Engineering Bangalore", "MS Ramaiah Institute of Technology Bangalore", "Christ University Bangalore", "Fergusson College Pune", "Jai Hind College Mumbai", "St. Xavier's College Mumbai", "Hindu College Delhi", "Miranda House Delhi", "Kirori Mal College Delhi", "Lady Shri Ram College Delhi", "Hansraj College Delhi", "Ramjas College Delhi", "Sri Venkateswara College Delhi", "Gargi College Delhi"];

export default function Login() {
  const { loginWithGoogle, completeSetup } = useAuth();
  const { users, sessions } = useData();
  const [step, setStep] = useState(1);
  const [tempUser, setTempUser] = useState(null);
  
  // Profile form state
  const [name, setName] = useState('New Student');
  const [college, setCollege] = useState('');
  const [showCollegeSuggestions, setShowCollegeSuggestions] = useState(false);
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [teaches, setTeaches] = useState([]);
  const [wants, setWants] = useState([]);
  const [customTeach, setCustomTeach] = useState('');
  const [customWant, setCustomWant] = useState('');
  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle();
    if (result && result.isNewUser) {
      setTempUser(result.user);
      setName(result.user.displayName || 'New Student');
      setStep(2);
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

  const allTeachOptions = Array.from(new Set([...SKILL_LIST, ...teaches]));
  const allWantOptions = Array.from(new Set([...SKILL_LIST, ...wants]));

  const handleComplete = () => {
    completeSetup(tempUser, {
      name,
      college,
      branch,
      year,
      teaches,
      wants
    });
  };

  const totalStudents = users?.length || 0;
  
  const uniqueSkills = new Set();
  users?.forEach(user => {
    user.teaches?.forEach(skill => uniqueSkills.add(skill));
    user.wants?.forEach(skill => uniqueSkills.add(skill));
  });
  const totalSkills = uniqueSkills.size || 0;

  const completedSessions = sessions?.filter(s => s.status === 'completed')?.length || 0;

  let totalRating = 0;
  let ratedUsersCount = 0;
  users?.forEach(user => {
    if (user.rating && user.rating > 0) {
      totalRating += user.rating;
      ratedUsersCount++;
    }
  });
  const avgRating = ratedUsersCount > 0 ? (totalRating / ratedUsersCount).toFixed(1) : "0.0";

  if (step === 2) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0d0d14', color: 'white', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '600px', width: '100%' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <div style={{ background: 'rgba(124, 58, 237, 0.15)', border: '1px solid rgba(124, 58, 237, 0.3)', color: '#a78bfa', padding: '8px 20px', borderRadius: 'var(--radius-full)', fontSize: '0.95rem', fontWeight: '600' }}>
              Step 2 of 2 — Choose your skills
            </div>
          </div>

          <div className="card" style={{ padding: '40px 30px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '32px', fontFamily: 'Outfit, sans-serif' }}>Complete Your Profile</h2>
          
          <div className="input-group" style={{ textAlign: 'left', position: 'relative' }}>
            <label className="input-label">College Name</label>
            <input 
              className="input-field" 
              value={college} 
              onChange={e => {
                setCollege(e.target.value);
                setShowCollegeSuggestions(true);
              }} 
              onFocus={() => setShowCollegeSuggestions(true)}
              onBlur={() => setTimeout(() => setShowCollegeSuggestions(false), 200)}
              placeholder="e.g. IIT Bombay" 
            />
            {showCollegeSuggestions && college && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--card-bg)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-md)', zIndex: 100, maxHeight: '250px', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
                {COLLEGE_LIST.filter(c => c.toLowerCase().includes(college.toLowerCase())).map(c => (
                  <div key={c} style={{ padding: '12px 16px', cursor: 'pointer', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.05)' }} 
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
          
          <div className="flex-between" style={{ gap: '16px' }}>
            <div className="input-group" style={{ textAlign: 'left', flex: 1 }}>
              <label className="input-label">Branch</label>
              <input className="input-field" value={branch} onChange={e => setBranch(e.target.value)} placeholder="e.g. CS" />
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

          <div style={{ textAlign: 'left', marginTop: '30px' }}>
            <h3 style={{ color: 'white', fontWeight: 'bold', marginBottom: '16px', fontSize: '1.25rem' }}>What can you teach? 🎓</h3>
            <div className="tags-container">
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
            </div>
            <form onSubmit={handleAddCustomTeach} style={{ width: '100%', marginTop: '16px' }}>
              <input className="input-field" style={{ padding: '12px 16px', width: '100%' }} placeholder="Type a custom skill and press Enter..." value={customTeach} onChange={e => setCustomTeach(e.target.value)} />
            </form>
          </div>

          <div style={{ textAlign: 'left', marginTop: '30px', marginBottom: '40px' }}>
            <h3 style={{ color: 'white', fontWeight: 'bold', marginBottom: '16px', fontSize: '1.25rem' }}>What do you want to learn? 📚</h3>
            <div className="tags-container">
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
            </div>
            <form onSubmit={handleAddCustomWant} style={{ width: '100%', marginTop: '16px' }}>
              <input className="input-field" style={{ padding: '12px 16px', width: '100%' }} placeholder="Type a custom skill and press Enter..." value={customWant} onChange={e => setCustomWant(e.target.value)} />
            </form>
          </div>

          <button className="btn btn-primary" onClick={handleComplete}>
            Let's Go!
          </button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'hidden', backgroundColor: 'var(--bg-color)', fontFamily: 'Inter, sans-serif' }}>
      {/* Hero Section */}
      <div className="auth-split-container" style={{ width: '100%', overflow: 'visible', backgroundColor: 'var(--bg-color)' }}>
        <div className="auth-split-left" style={{ overflow: 'hidden' }}>
          <div className="auth-brand">
            <Logo size={40} showText={true} />
          </div>
          
          <div className="auth-hero-text">
            <h1 style={{ color: 'white' }}>
              Learn from your campus,<br/>
              <span style={{ color: '#7C3AED' }}>teach</span> what you know.
            </h1>
            <p style={{ color: 'white' }}>Join the largest peer-to-peer skill exchange network. Connect with students, share your expertise, and learn something new today.</p>
          </div>
          
          <div className="floating-tags">
            <div className="float-tag python">Python</div>
            <div className="float-tag guitar">Guitar</div>
            <div className="float-tag design">Design</div>
            <div className="float-tag math">Calculus</div>
            <div className="float-tag" style={{ top: '40%', right: '5%', animationDelay: '3.5s', fontSize: '1.2rem' }}>Fitness</div>
            <div className="float-tag" style={{ top: '30%', left: '40%', animationDelay: '1.8s', fontSize: '1.1rem' }}>Drawing</div>
            <div className="float-tag" style={{ top: '10%', right: '35%', animationDelay: '4.2s', fontSize: '1.3rem' }}>DSA</div>
            <div className="float-tag" style={{ bottom: '10%', left: '40%', animationDelay: '2.1s', fontSize: '1.15rem' }}>Photography</div>
          </div>
        </div>

        <div className="auth-split-right">
          <div className="auth-form-container" style={{ background: 'var(--card-bg)', color: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: '0 0 40px rgba(124,58,237,0.15)' }}>
            <div className="auth-form-header">
              <h2 style={{ color: 'white', fontFamily: 'Outfit, sans-serif' }}>Welcome to CampusSwap</h2>
              <p style={{ color: 'var(--text-muted)' }}>Sign in to start swapping skills</p>
            </div>
            
            <button 
              onClick={handleGoogleLogin} 
              className="btn-google-large"
              style={{ background: 'var(--primary)', color: 'white', border: 'none', width: '100%', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '1.05rem', fontWeight: '600', cursor: 'pointer', marginBottom: '30px', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-dark)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'var(--primary)'}
            >
              <div style={{ background: 'white', color: 'var(--primary)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>G</div>
              Continue with Google
            </button>
            
            <div style={{ textAlign: 'center' }}>
              <button 
                onClick={() => {
                  document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' });
                }}
                style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onMouseOver={(e) => e.target.style.color = 'var(--text-main)'}
                onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
              >
                See How It Works &darr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" style={{ padding: '100px 20px', background: 'var(--bg-color)', borderTop: '1px solid rgba(124, 58, 237, 0.2)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '16px', color: 'white', fontFamily: 'Outfit, sans-serif' }}>How It Works</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>Three simple steps to start exchanging skills with your peers.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', marginBottom: '100px' }}>
            {/* Step 1 */}
            <div className="card" style={{ textAlign: 'center', padding: '50px 30px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
              <div style={{ position: 'absolute', top: '-10px', left: '-10px', fontSize: '8rem', fontWeight: '900', color: 'rgba(124, 58, 237, 0.25)', lineHeight: '1', fontFamily: 'Outfit, sans-serif' }}>1</div>
              <div style={{ fontSize: '4rem', marginBottom: '24px', position: 'relative', zIndex: 1 }}>🎯</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'white', position: 'relative', zIndex: 1 }}>Create your profile</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.6', position: 'relative', zIndex: 1 }}>Add the skills you already know and list the ones you want to learn.</p>
            </div>

            {/* Step 2 */}
            <div className="card" style={{ textAlign: 'center', padding: '50px 30px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
              <div style={{ position: 'absolute', top: '-10px', left: '-10px', fontSize: '8rem', fontWeight: '900', color: 'rgba(124, 58, 237, 0.25)', lineHeight: '1', fontFamily: 'Outfit, sans-serif' }}>2</div>
              <div style={{ fontSize: '4rem', marginBottom: '24px', position: 'relative', zIndex: 1 }}>🤝</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'white', position: 'relative', zIndex: 1 }}>Get matched</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.6', position: 'relative', zIndex: 1 }}>Our algorithm automatically finds your perfect skill swap partner on campus.</p>
            </div>

            {/* Step 3 */}
            <div className="card" style={{ textAlign: 'center', padding: '50px 30px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
              <div style={{ position: 'absolute', top: '-10px', left: '-10px', fontSize: '8rem', fontWeight: '900', color: 'rgba(124, 58, 237, 0.25)', lineHeight: '1', fontFamily: 'Outfit, sans-serif' }}>3</div>
              <div style={{ fontSize: '4rem', marginBottom: '24px', position: 'relative', zIndex: 1 }}>🚀</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'white', position: 'relative', zIndex: 1 }}>Start swapping</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.6', position: 'relative', zIndex: 1 }}>Teach what you know, learn what you need, earn credits and grow together.</p>
            </div>
          </div>

          {/* Real Stats Section */}
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '30px', borderTop: '1px solid rgba(124, 58, 237, 0.2)', paddingTop: '60px', paddingBottom: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: '700', color: 'white', fontFamily: 'Outfit, sans-serif' }}>{totalStudents}</div>
              <div style={{ fontSize: '1.1rem', color: '#94a3b8', fontWeight: '500' }}>Total Students</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: '700', color: 'white', fontFamily: 'Outfit, sans-serif' }}>{totalSkills}</div>
              <div style={{ fontSize: '1.1rem', color: '#94a3b8', fontWeight: '500' }}>Skills Listed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: '700', color: 'white', fontFamily: 'Outfit, sans-serif' }}>{completedSessions}</div>
              <div style={{ fontSize: '1.1rem', color: '#94a3b8', fontWeight: '500' }}>Sessions Done</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: '700', color: 'white', fontFamily: 'Outfit, sans-serif' }}>{avgRating}</div>
              <div style={{ fontSize: '1.1rem', color: '#94a3b8', fontWeight: '500' }}>Avg Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
