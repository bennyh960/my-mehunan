export function AdminLogin({ adminPwInput, setAdminPwInput, settings, setAdminAuth, setScreen, goHome }) {
  return (
    <div className="container">
      <div className="card text-center" style={{maxWidth:360}}>
        <div style={{fontSize:44,marginBottom:10}}>🔐</div>
        <h2 className="text-light" style={{marginBottom:14}}>כניסת מנהל</h2>
        <input type="password" value={adminPwInput} onChange={e=>setAdminPwInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&adminPwInput===settings.adminPassword){setAdminAuth(true);setScreen("admin");setAdminPwInput("");}}}
          placeholder="סיסמה" className="input" style={{textAlign:"center",marginBottom:10}} />
        <div className="flex-row gap-8">
          <button onClick={goHome} className="secondary-btn flex-1">ביטול</button>
          <button onClick={()=>{if(adminPwInput===settings.adminPassword){setAdminAuth(true);setScreen("admin");setAdminPwInput("");}else alert("סיסמה שגויה");}}
            className="primary-btn flex-1">כניסה</button>
        </div>
      </div>
    </div>
  );
}
