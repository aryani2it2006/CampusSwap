import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarIcon, Clock, MapPin, Video, CheckCircle, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, setDoc, doc, increment } from 'firebase/firestore';

const CalendarPicker = ({ selectedDate, onSelectDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
    const isPast = date < today;
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
    const isToday = date.toDateString() === today.toDateString();
    
    let bg = 'transparent';
    let color = 'white';
    let border = '1px solid transparent';

    if (isPast) {
      color = 'var(--text-muted)';
    } else if (isSelected) {
      bg = '#7C3AED';
      color = 'white';
    } else if (isToday) {
      border = '1px solid #7C3AED';
      color = '#7C3AED';
    }

    days.push(
      <div 
        key={`day-${i}`} 
        onClick={(e) => {
          e.preventDefault();
          if (!isPast) onSelectDate(date);
        }}
        style={{
          textAlign: 'center',
          cursor: isPast ? 'not-allowed' : 'pointer',
          color: color,
          opacity: isPast ? 0.3 : 1,
          backgroundColor: bg,
          border: border,
          borderRadius: '50%',
          fontWeight: isSelected || isToday ? 'bold' : 'normal',
          transition: 'all 0.2s',
          fontSize: '13px',
          aspectRatio: '1/1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          if (!isPast && !isSelected) {
            e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isPast && !isSelected) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {i}
      </div>
    );
  }

  const isCurrentMonthOrPast = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1) <= new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div style={{ maxWidth: '380px', margin: '0 auto', width: '100%', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', backgroundColor: 'var(--card-bg)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button 
          onClick={prevMonth} 
          type="button" 
          disabled={isCurrentMonthOrPast}
          style={{ 
            padding: '8px', 
            background: 'var(--bg-secondary)', 
            border: 'none', 
            borderRadius: '8px',
            cursor: isCurrentMonthOrPast ? 'not-allowed' : 'pointer', 
            opacity: isCurrentMonthOrPast ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div style={{ fontWeight: '600', fontSize: '1rem', color: 'white' }}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</div>
        <button 
          onClick={nextMonth} 
          type="button" 
          style={{ 
            padding: '8px', 
            background: 'var(--bg-secondary)', 
            border: 'none', 
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {dayNames.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>{d}</div>)}
        {days}
      </div>
    </div>
  );
};

const TimePicker = ({ time, onTimeChange }) => {
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = ['00', '15', '30', '45'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flex: 1, gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <select 
              className="input-field" 
              style={{ width: '100%', padding: '12px', appearance: 'none', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', margin: 0, color: 'white' }}
              value={time.hour}
              onChange={e => onTimeChange({ ...time, hour: e.target.value })}
            >
              {hours.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
          
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-muted)' }}>:</span>
          
          <div style={{ position: 'relative', flex: 1 }}>
            <select 
              className="input-field" 
              style={{ width: '100%', padding: '12px', appearance: 'none', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', margin: 0, color: 'white' }}
              value={time.minute}
              onChange={e => onTimeChange({ ...time, minute: e.target.value })}
            >
              {minutes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', padding: '4px' }}>
          <button 
            type="button"
            style={{ 
              padding: '8px 16px', 
              border: 'none', 
              background: time.ampm === 'AM' ? '#7C3AED' : 'transparent',
              color: time.ampm === 'AM' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: '600',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
            onClick={(e) => { e.preventDefault(); onTimeChange({ ...time, ampm: 'AM' }); }}
          >
            AM
          </button>
          <button 
            type="button"
            style={{ 
              padding: '8px 16px', 
              border: 'none', 
              background: time.ampm === 'PM' ? '#7C3AED' : 'transparent',
              color: time.ampm === 'PM' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: '600',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
            onClick={(e) => { e.preventDefault(); onTimeChange({ ...time, ampm: 'PM' }); }}
          >
            PM
          </button>
        </div>
      </div>
      <div style={{ textAlign: 'center', color: '#7C3AED', fontWeight: '600', fontSize: '0.9rem', padding: '8px', backgroundColor: 'rgba(124, 58, 237, 0.1)', borderRadius: '8px' }}>
        Selected Time: {time.hour}:{time.minute} {time.ampm}
      </div>
    </div>
  );
};

export default function Schedule() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { users, addSession } = useData();
  const { currentUser } = useAuth();
  
  const [date, setDate] = useState(null);
  const [timeObj, setTimeObj] = useState({ hour: '12', minute: '00', ampm: 'PM' });
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [skill, setSkill] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (window.confirm('Are you sure you want to cancel scheduling?')) {
          navigate(-1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  const chatPartner = users.find(u => u.id === userId);

  if (!chatPartner) return <div>User not found</div>;

  const teachOptions = currentUser?.teaches.filter(s => chatPartner.wants.includes(s)) || [];
  const learnOptions = currentUser?.wants.filter(s => chatPartner.teaches.includes(s)) || [];

  const handleSchedule = async () => {
    if (!date || !skill) return;
    
    const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric'});
    
    let h = parseInt(timeObj.hour);
    if (timeObj.ampm === 'PM' && h !== 12) h += 12;
    if (timeObj.ampm === 'AM' && h === 12) h = 0;
    const formattedTime = `${h.toString().padStart(2, '0')}:${timeObj.minute}`;

    const sessionDate = new Date(date);
    let hNum = parseInt(timeObj.hour);
    if (timeObj.ampm === 'PM' && hNum !== 12) hNum += 12;
    if (timeObj.ampm === 'AM' && hNum === 12) hNum = 0;
    sessionDate.setHours(hNum, parseInt(timeObj.minute), 0, 0);

    const sessionId = await addSession({
      date: `${formattedDate} at ${formattedTime}`,
      timestamp: sessionDate.getTime(),
      skill: skill,
      mode: isOnline ? 'Online' : location,
      teacherId: teachOptions.includes(skill) ? currentUser.uid : chatPartner.id,
      studentId: teachOptions.includes(skill) ? chatPartner.id : currentUser.uid,
      teacherName: teachOptions.includes(skill) ? currentUser.name : chatPartner.name,
      studentName: teachOptions.includes(skill) ? chatPartner.name : currentUser.name,
      meetingLink: isOnline ? meetingLink : null,
      requestedBy: currentUser.uid,
      requestedTo: chatPartner.id,
    });
    
    if (sessionId) {
      // Send chat message representing the request
      const chatId = [currentUser.uid, chatPartner.id].sort().join('_');
      const chatRef = doc(db, 'chats', chatId);
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const textMsg = `${currentUser.name} wants to schedule a session with you! 📅 Topic: ${skill} • Date: ${formattedDate} • Time: ${formattedTime}. Accept, Reject, or Propose New Time`;
      
      await addDoc(messagesRef, {
        type: 'session_request',
        sessionId: sessionId,
        text: textMsg,
        topic: skill,
        date: formattedDate,
        time: formattedTime,
        mode: isOnline ? 'Online' : location,
        senderId: currentUser.uid,
        senderName: currentUser.name,
        createdAt: serverTimestamp()
      });

      await setDoc(chatRef, {
        participants: [currentUser.uid, chatPartner.id],
        lastMessage: textMsg,
        updatedAt: serverTimestamp(),
        [`unread_${chatPartner.id}`]: increment(1)
      }, { merge: true });
    }

    setIsSuccess(true);
    setTimeout(() => {
      navigate('/chat/' + chatPartner.id);
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="card text-center" style={{ margin: '40px 20px', padding: '40px 20px' }}>
        <CheckCircle size={64} style={{ color: 'var(--accent-green)', margin: '0 auto 20px auto' }} />
        <h2 style={{ marginBottom: '10px' }}>Session Scheduled!</h2>
        <p style={{ color: 'var(--text-muted)' }}>We've notified {chatPartner.name.split(' ')[0]}</p>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-outline" style={{ width: 'auto', marginBottom: '16px', padding: '6px 12px' }} onClick={handleBack}>
        <ArrowLeft size={16} /> Back
      </button>
      <h2 className="page-title">Schedule Session</h2>
      
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <img src={chatPartner.photoURL} alt={chatPartner.name} className="avatar" />
          <div>
            <div style={{ fontWeight: '600' }}>With {chatPartner.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{chatPartner.branch}</div>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">What are you swapping?</label>
          <select className="input-field" value={skill} onChange={e => setSkill(e.target.value)}>
            <option value="">Select a skill</option>
            {teachOptions.length > 0 && <optgroup label="I will teach">
              {teachOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </optgroup>}
            {learnOptions.length > 0 && <optgroup label="I want to learn">
              {learnOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </optgroup>}
            <optgroup label="Other">
              {chatPartner.teaches.map(s => <option key={s} value={s}>{s}</option>)}
            </optgroup>
          </select>
        </div>

        <div className="input-group" style={{ marginTop: '20px' }}>
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CalendarIcon size={16} /> Select Date
          </label>
          <CalendarPicker selectedDate={date} onSelectDate={setDate} />
        </div>

        <div className="input-group" style={{ marginTop: '20px' }}>
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} /> Select Time
          </label>
          <TimePicker time={timeObj} onTimeChange={setTimeObj} />
        </div>

        <div className="input-group" style={{ marginTop: '20px' }}>
          <label className="input-label">Location Mode</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className={`btn ${isOnline ? 'btn-primary' : 'btn-outline'}`} 
              style={{ flex: 1 }}
              onClick={() => setIsOnline(true)}
            >
              <Video size={18} /> Online
            </button>
            <button 
              className={`btn ${!isOnline ? 'btn-primary' : 'btn-outline'}`} 
              style={{ flex: 1 }}
              onClick={() => setIsOnline(false)}
            >
              <MapPin size={18} /> In-person
            </button>
          </div>
        </div>

        {!isOnline ? (
          <div className="input-group" style={{ marginTop: '16px' }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={16} /> Meeting Spot on Campus
            </label>
            <input 
              className="input-field" 
              placeholder="e.g. Library 2nd floor, Cafe..." 
              value={location} 
              onChange={e => setLocation(e.target.value)} 
            />
          </div>
        ) : (
          <div className="input-group" style={{ marginTop: '16px' }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LinkIcon size={16} /> Meeting Link
            </label>
            <input 
              className="input-field" 
              placeholder="e.g. meet.google.com/abc-defg-hij..." 
              value={meetingLink} 
              onChange={e => setMeetingLink(e.target.value)} 
            />
          </div>
        )}

        <button 
          className="btn btn-primary" 
          style={{ marginTop: '30px', width: '100%' }} 
          onClick={handleSchedule}
          disabled={!date || !skill || (isOnline ? !meetingLink : !location)}
        >
          Confirm Session
        </button>
      </div>
    </div>
  );
}
