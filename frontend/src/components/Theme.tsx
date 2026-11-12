import React, {createContext,useContext,useEffect,useState} from 'react';
import {Sun,Moon} from 'lucide-react';
type Theme='light'|'dark';
const ThemeContext=createContext<{theme:Theme;toggle:()=>void}>({theme:'light',toggle:()=>{}});
export function ThemeProvider({children}:{children:React.ReactNode}) {
 const [theme,setTheme]=useState<Theme>(()=>{
  const saved=localStorage.getItem('tuxtla_theme');
  return saved==='light'||saved==='dark'?saved:window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
 });
 useEffect(()=>{localStorage.setItem('tuxtla_theme',theme);document.documentElement.style.colorScheme=theme;},[theme]);
 return <ThemeContext.Provider value={{theme,toggle:()=>setTheme(t=>t==='dark'?'light':'dark')}}>{children}</ThemeContext.Provider>;
}
export const useTheme=()=>useContext(ThemeContext);
export function ThemeToggle(){
 const {theme,toggle}=useTheme();
 const label=theme==='dark'?'Cambiar a modo claro':'Cambiar a modo oscuro';
 return <button type="button" className="theme-toggle" onClick={toggle} title={label} aria-label={label}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}<span>{theme==='dark'?'Claro':'Oscuro'}</span></button>;
}
