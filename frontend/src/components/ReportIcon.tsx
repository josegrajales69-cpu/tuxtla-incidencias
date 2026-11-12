import React from 'react';
import { ReportCategory } from '../types/report';
import { reportSymbols } from '../utils/reportSymbols';
import { getCategoryColor } from './CustomMarkers';
export function ReportIcon({category,size=20}:{category:ReportCategory;size?:number}) {
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={getCategoryColor(category)} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{__html:reportSymbols[category]||''}}/>;
}
