"use client";

import {useAuth} from "@/lib/auth";
import {Header} from "@/components/header";
import {HeroLoggedOut} from "@/components/hero-logged-out";
import {HowItWorks,CTAStrip,Footer} from "@/components/sections";

export default function HomePage(){
 const{user}=useAuth();
 const signIn=()=>{window.location.href="/login"};
 const signUp=()=>{window.location.href="/login?signup=1"};
 async function signOut(){await fetch("/api/auth/logout",{method:"POST",credentials:"include"});window.location.reload()}
 return <div className="refresh-home">
  <Header loggedIn={!!user} username={user?.display_name||user?.username} handle={user?.handle} avatar={user?.avatar} onSignIn={signIn} onSignUp={signUp} onSignOut={signOut}/>
  <main><HeroLoggedOut onSignIn={user?()=>{window.location.href="/write"}:signUp}/><HowItWorks/><CTAStrip onSignIn={user?()=>{window.location.href="/write"}:signUp}/></main>
  <Footer/>
 </div>
}
